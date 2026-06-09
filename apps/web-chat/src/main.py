import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

import asyncpg
import nats
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from nats.errors import TimeoutError as NatsTimeoutError
from nats.js.api import ConsumerConfig, DeliverPolicy, RetentionPolicy, StorageType, StreamConfig

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("aipm/web-chat")

NATS_HOST = os.getenv("NATS_HOST", "localhost")
NATS_PORT = int(os.getenv("NATS_PORT", "4222"))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/aipm")
DEMO_CHAT_ID = 42
DEMO_USER_ID = 1
DEMO_USERNAME = "web_user"

RAW_MESSAGE_SUBJECT = "raw-data.messages"
NOTIFICATION_SUBJECT = "notifications.telegram.message"
RAW_DATA_STREAM = "RAW_DATA"
NOTIFICATIONS_STREAM = "NOTIFICATIONS"
WEB_CONSUMER = "web-chat-notify"

_nc = None
_js = None
_db = None
_connected_ws: set[WebSocket] = set()


async def ensure_streams(jsm) -> None:
    for cfg in [
        StreamConfig(name=RAW_DATA_STREAM, subjects=["raw-data.messages"], storage=StorageType.MEMORY, retention=RetentionPolicy.LIMITS),
        StreamConfig(name=NOTIFICATIONS_STREAM, subjects=["notifications.telegram.message"], storage=StorageType.MEMORY, retention=RetentionPolicy.LIMITS),
    ]:
        try:
            await jsm.add_stream(cfg)
            log.info("stream created: %s", cfg.name)
        except Exception:
            log.debug("stream exists: %s", cfg.name)


async def broadcast(data: dict) -> None:
    dead: set[WebSocket] = set()
    for ws in _connected_ws:
        try:
            await ws.send_json(data)
        except Exception:
            dead.add(ws)
    _connected_ws.difference_update(dead)


async def notification_consumer_loop() -> None:
    jsm = _nc.jsm()
    try:
        await jsm.delete_consumer(NOTIFICATIONS_STREAM, WEB_CONSUMER)
    except Exception:
        pass

    psub = await _js.pull_subscribe(
        NOTIFICATION_SUBJECT,
        WEB_CONSUMER,
        stream=NOTIFICATIONS_STREAM,
        config=ConsumerConfig(deliver_policy=DeliverPolicy.NEW),
    )
    log.info("notification consumer started")

    while True:
        try:
            msgs = await psub.fetch(batch=10, timeout=2.0)
            for msg in msgs:
                try:
                    payload = json.loads(msg.data)
                    text = payload.get("message", "")
                    await broadcast({"type": "bot", "text": text})
                    log.info("bot → ws: %r", text[:80])
                except Exception as e:
                    log.error("parse error: %s", e)
                finally:
                    await msg.ack()
        except NatsTimeoutError:
            pass
        except Exception as e:
            log.error("consumer error: %s", e)
            await asyncio.sleep(1)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _nc, _js, _db

    _db = await asyncpg.create_pool(DATABASE_URL)
    log.info("connected to postgres")

    _nc = await nats.connect(f"nats://{NATS_HOST}:{NATS_PORT}")
    _js = _nc.jetstream()
    log.info("connected to NATS at %s:%s", NATS_HOST, NATS_PORT)

    jsm = _nc.jsm()
    await ensure_streams(jsm)

    task = asyncio.create_task(notification_consumer_loop())

    yield

    task.cancel()
    await _nc.drain()
    await _db.close()
    log.info("shutdown")


app = FastAPI(lifespan=lifespan)
_html_path = Path(__file__).parent / "static" / "index.html"


@app.get("/", response_class=HTMLResponse)
async def index() -> HTMLResponse:
    return HTMLResponse(_html_path.read_text(encoding="utf-8"))


@app.get("/api/members")
async def get_members() -> list:
    try:
        rows = await _db.fetch(
            "SELECT username, display_name FROM chat_members WHERE chat_id = $1",
            str(DEMO_CHAT_ID),
        )
        return [dict(r) for r in rows]
    except Exception:
        return []


@app.post("/api/members")
async def set_member(body: dict) -> dict:
    username = body.get("username", "").strip().lstrip("@")
    display_name = body.get("display_name", "").strip() or None
    if not username:
        return {"error": "username required"}
    await _db.execute(
        """
        INSERT INTO chat_members (chat_id, username, display_name)
        VALUES ($1, $2, $3)
        ON CONFLICT (chat_id, username) DO UPDATE SET display_name = EXCLUDED.display_name
        """,
        str(DEMO_CHAT_ID), username, display_name,
    )
    return {"ok": True, "username": username, "display_name": display_name}


@app.get("/api/tasks")
async def get_tasks() -> list:
    try:
        rows = await _db.fetch(
            "SELECT id::text, title, description, assignee, reporter, deadline, status, "
            "created_at::text, updated_at::text FROM tasks WHERE chat_id = $1 ORDER BY created_at DESC",
            str(DEMO_CHAT_ID),
        )
        return [dict(r) for r in rows]
    except Exception:
        return []


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    _connected_ws.add(websocket)
    log.info("ws connected (total: %d)", len(_connected_ws))
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "message":
                text = data["text"]
                event = {
                    "userId": DEMO_USER_ID,
                    "chatId": DEMO_CHAT_ID,
                    "message": text,
                    "messageAt": datetime.now(timezone.utc).isoformat(),
                    "messageId": None,
                    "username": DEMO_USERNAME,
                }
                await _js.publish(RAW_MESSAGE_SUBJECT, json.dumps(event).encode())
                log.info("published: %r", text[:80])
    except WebSocketDisconnect:
        pass
    except Exception as e:
        log.error("ws error: %s", e)
    finally:
        _connected_ws.discard(websocket)
        log.info("ws disconnected (total: %d)", len(_connected_ws))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)

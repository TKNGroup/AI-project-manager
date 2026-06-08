import asyncio
import json
import logging
import uuid
from typing import Optional

import nats
from nats.aio.client import Client as NatsClient
from nats.errors import TimeoutError as NatsTimeoutError
from nats.js.api import RetentionPolicy, StorageType, StreamConfig
from pydantic import BaseModel, ValidationError

import config
from agent import run_agent
from context import ChatContext
from db import connect as db_connect
from llm import make_llm_adapter

logging.basicConfig(
    level=config.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("aipm/text-data-worker")

RAW_MESSAGE_SUBJECT = "raw-data.messages"
TELEGRAM_MESSAGE_SUBJECT = "notifications.telegram.message"
RAW_DATA_STREAM = "RAW_DATA"
TEXT_WORKER_RAW_CONSUMER = "text-data-worker-raw"


class TelegramMessageEvent(BaseModel):
    userId: int
    chatId: int
    message: str
    messageAt: str
    messageId: Optional[int] = None
    username: Optional[str] = None


class TelegramMessageRequest(BaseModel):
    chatId: str
    message: str


async def ensure_streams(nc: NatsClient) -> None:
    jsm = nc.jsm()
    streams = [
        StreamConfig(
            name="RAW_DATA",
            subjects=["raw-data.messages"],
            storage=StorageType.MEMORY,
            retention=RetentionPolicy.LIMITS,
        ),
        StreamConfig(
            name="NOTIFICATIONS",
            subjects=["notifications.telegram.message"],
            storage=StorageType.MEMORY,
            retention=RetentionPolicy.LIMITS,
        ),
    ]
    for cfg in streams:
        try:
            await jsm.add_stream(cfg)
            log.info("stream created: %s", cfg.name)
        except Exception:
            log.debug("stream already exists: %s", cfg.name)


async def main() -> None:
    log.info("starting")

    db = await db_connect(config.DATABASE_URL)
    log.info("connected to postgres")

    llm = make_llm_adapter(
        config.LLM_PROVIDER,
        deepseek_api_key=config.DEEPSEEK_API_KEY,
        deepseek_base_url=config.DEEPSEEK_BASE_URL,
        deepseek_model=config.DEEPSEEK_MODEL,
        openai_api_key=config.OPENAI_API_KEY,
        openai_base_url=config.OPENAI_BASE_URL,
        openai_model=config.OPENAI_MODEL,
        ollama_base_url=config.OLLAMA_BASE_URL,
        ollama_model=config.OLLAMA_MODEL,
    )
    log.info("llm adapter ready: provider=%s", config.LLM_PROVIDER)

    ctx = ChatContext(config.CONTEXT_FILE_PATH, config.CONTEXT_MAX_MESSAGES)

    nc = await nats.connect(f"nats://{config.NATS_HOST}:{config.NATS_PORT}")
    js = nc.jetstream()
    log.info("connected to NATS at %s:%s", config.NATS_HOST, config.NATS_PORT)

    await ensure_streams(nc)

    async def send_telegram_message(chat_id: str, message: str) -> None:
        payload = TelegramMessageRequest(chatId=chat_id, message=message)
        await js.publish(TELEGRAM_MESSAGE_SUBJECT, payload.model_dump_json().encode())

    async def handle_raw_message(msg) -> None:
        logger = log.getChild(f"raw.{uuid.uuid4().hex[:8]}")
        try:
            event = TelegramMessageEvent.model_validate(json.loads(msg.data))
            logger.debug("chatId=%s userId=%s text=%r", event.chatId, event.userId, event.message)

            await run_agent(
                chat_id=str(event.chatId),
                new_message=event.message,
                username=event.username,
                llm=llm,
                db=db,
                ctx=ctx,
                publish_to_telegram=send_telegram_message,
            )

            await msg.ack()
        except ValidationError as e:
            logger.error("invalid format: %s", e)
            await msg.term()
        except Exception as e:
            logger.error("unexpected error: %s", e)
            await msg.nak()

    async def consume_loop() -> None:
        psub = await js.pull_subscribe(RAW_MESSAGE_SUBJECT, TEXT_WORKER_RAW_CONSUMER, stream=RAW_DATA_STREAM)
        log.info("consumer started | subject=%s", RAW_MESSAGE_SUBJECT)
        while True:
            try:
                msgs = await psub.fetch(batch=10, timeout=5.0)
                for msg in msgs:
                    await handle_raw_message(msg)
            except NatsTimeoutError:
                pass
            except Exception as e:
                log.error("consumer error: %s", e)
                await asyncio.sleep(1)

    try:
        await consume_loop()
    except (KeyboardInterrupt, asyncio.CancelledError):
        pass
    finally:
        await nc.drain()
        await db.close()
        log.info("shutdown")


if __name__ == "__main__":
    asyncio.run(main())

import asyncpg
from typing import Optional


CREATE_TASKS_TABLE = """
CREATE TABLE IF NOT EXISTS tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id     TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    assignee    TEXT,
    reporter    TEXT,
    deadline    TEXT,
    status      TEXT NOT NULL DEFAULT 'open',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
"""

# username → display_name per chat, чтобы агент знал реальные имена участников
CREATE_MEMBERS_TABLE = """
CREATE TABLE IF NOT EXISTS chat_members (
    chat_id      TEXT NOT NULL,
    username     TEXT NOT NULL,
    display_name TEXT,
    PRIMARY KEY (chat_id, username)
);
"""


async def connect(database_url: str) -> asyncpg.Connection:
    conn = await asyncpg.connect(database_url)
    await conn.execute(CREATE_TASKS_TABLE)
    await conn.execute(CREATE_MEMBERS_TABLE)
    return conn


async def upsert_member(conn: asyncpg.Connection, chat_id: str, username: str, display_name: Optional[str]) -> None:
    await conn.execute(
        """
        INSERT INTO chat_members (chat_id, username, display_name)
        VALUES ($1, $2, $3)
        ON CONFLICT (chat_id, username) DO UPDATE SET display_name = EXCLUDED.display_name
        """,
        chat_id, username, display_name,
    )


async def get_members(conn: asyncpg.Connection, chat_id: str) -> list[dict]:
    rows = await conn.fetch(
        "SELECT username, display_name FROM chat_members WHERE chat_id = $1",
        chat_id,
    )
    return [dict(r) for r in rows]


async def create_task(
    conn: asyncpg.Connection,
    chat_id: str,
    title: str,
    description: Optional[str] = None,
    assignee: Optional[str] = None,
    reporter: Optional[str] = None,
    deadline: Optional[str] = None,
) -> dict:
    row = await conn.fetchrow(
        """
        INSERT INTO tasks (chat_id, title, description, assignee, reporter, deadline)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        """,
        chat_id, title, description, assignee, reporter, deadline,
    )
    return dict(row)


async def update_task(
    conn: asyncpg.Connection,
    task_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    assignee: Optional[str] = None,
    reporter: Optional[str] = None,
    deadline: Optional[str] = None,
    status: Optional[str] = None,
) -> Optional[dict]:
    fields = {"title": title, "description": description, "assignee": assignee,
              "reporter": reporter, "deadline": deadline, "status": status}
    updates = {k: v for k, v in fields.items() if v is not None}

    if not updates:
        return None

    set_clause = ", ".join(f"{k} = ${i + 2}" for i, k in enumerate(updates))
    values = [task_id] + list(updates.values())

    row = await conn.fetchrow(
        f"UPDATE tasks SET {set_clause}, updated_at = now() WHERE id = $1 RETURNING *",
        *values,
    )
    return dict(row) if row else None


async def delete_task(conn: asyncpg.Connection, task_id: str) -> Optional[dict]:
    row = await conn.fetchrow(
        "DELETE FROM tasks WHERE id = $1 RETURNING *",
        task_id,
    )
    return dict(row) if row else None


async def get_tasks_by_chat(conn: asyncpg.Connection, chat_id: str) -> list[dict]:
    rows = await conn.fetch(
        "SELECT * FROM tasks WHERE chat_id = $1 ORDER BY created_at DESC",
        chat_id,
    )
    return [dict(r) for r in rows]

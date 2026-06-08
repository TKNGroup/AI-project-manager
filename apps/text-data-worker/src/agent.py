import json
import logging
from typing import Any, Optional

import asyncpg

from context import ChatContext
from db import create_task, update_task, delete_task, get_tasks_by_chat, upsert_member, get_members
from llm import LLMAdapter

log = logging.getLogger("aipm/text-data-worker.agent")

SYSTEM_PROMPT = """Ты — AI-ассистент для управления задачами в команде. Ты читаешь живой рабочий чат.

РЕЖИМ РАБОТЫ — пассивный наблюдатель:
Ты молча читаешь диалог. Люди общаются, детали появляются постепенно.
НЕ прерывай разговор вопросами пока явно не зафиксирована задача.
Большинство сообщений нужно просто пропустить (не вызывать инструменты).

КОГДА ДЕЙСТВОВАТЬ — только при явном сигнале фиксации:
Слова и фразы: «зафиксируем», «запишем», «поставь задачу», «создай задачу», «сделай задачу»,
«возьми в работу», «запиши», «добавь в задачи», «ок фиксируем», явное обращение к боту.
Без такого сигнала — молчи, даже если слышишь про работу и сроки.

КОГДА СОЗДАЁШЬ ЗАДАЧУ:
- Бери всё что накопилось в диалоге: название, исполнителя, дедлайн, репортера.
- Пустые поля НЕ блокируют создание — их обновят позже.
- ask_clarification используй ТОЛЬКО если предмет задачи настолько размыт, что название вообще не вывести.
  Не спрашивай про исполнителя, дедлайн, описание — это необязательно.

КОГДА ОБНОВЛЯЕШЬ/УДАЛЯЕШЬ — идентификация задачи критична:
- Список задач с ID, датами и деталями дан ниже.
- Определи task_id точно по контексту (исполнитель, название, дата, репортер).
- Если похожих задач несколько и непонятно о какой речь — уточни через ask_clarification. Не угадывай.

РАЗЛИЧАЙ автора и субъект:
- "@username:" в начале — КТО НАПИСАЛ, не обязательно о ком речь.
- «Сергей не сделал» → assignee = Сергей, автор просто сообщает.
- reporter — обычно автор сообщения.
- Реестр участников (username → имя) дан ниже.

Правила:
- Один вопрос за раз.
- Язык вопросов = язык чата.
- deadline — любой формат, сохраняй как есть."""

TOOLS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "ask_clarification",
            "description": "Задать уточняющий вопрос в чат когда данных недостаточно",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {"type": "string", "description": "Вопрос для уточнения деталей задачи"},
                },
                "required": ["question"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Создать новую задачу когда есть достаточно данных",
            "parameters": {
                "type": "object",
                "properties": {
                    "title":       {"type": "string", "description": "Краткое название задачи"},
                    "description": {"type": "string", "description": "Подробное описание"},
                    "assignee":    {"type": "string", "description": "Кто выполняет"},
                    "reporter":    {"type": "string", "description": "Кто поставил задачу"},
                    "deadline":    {"type": "string", "description": "Срок выполнения"},
                },
                "required": ["title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Обновить существующую задачу",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id":     {"type": "string", "description": "ID задачи из списка"},
                    "title":       {"type": "string"},
                    "description": {"type": "string"},
                    "assignee":    {"type": "string"},
                    "reporter":    {"type": "string"},
                    "deadline":    {"type": "string"},
                    "status":      {"type": "string", "enum": ["open", "in_progress", "done"]},
                },
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "Удалить задачу. Использовать только если явно сказано удалить/отменить/убрать задачу.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "string", "description": "ID задачи из списка"},
                },
                "required": ["task_id"],
            },
        },
    },
]


async def run_agent(
    chat_id: str,
    new_message: str,
    username: Optional[str],
    llm: LLMAdapter,
    db: asyncpg.Connection,
    ctx: ChatContext,
    publish_to_telegram,
) -> None:
    logger = log.getChild(chat_id)

    sender = f"@{username}" if username else "пользователь"

    # Регистрируем участника при каждом сообщении
    if username:
        await upsert_member(db, chat_id, username, display_name=None)

    ctx.add_message(chat_id, "user", f"{sender}: {new_message}")

    existing_tasks, members = await get_tasks_by_chat(db, chat_id), await get_members(db, chat_id)

    members_context = ""
    if members:
        lines = [f"- @{m['username']}" + (f" = {m['display_name']}" if m['display_name'] else "") for m in members]
        members_context = "\nУчастники чата:\n" + "\n".join(lines)

    tasks_context = ""
    if existing_tasks:
        tasks_lines = []
        for t in existing_tasks:
            created = str(t['created_at'])[:10]
            parts = [
                f"  id: {t['id']}",
                f"  название: {t['title']}",
                f"  статус: {t['status']}",
                f"  исполнитель: {t.get('assignee') or '—'}",
                f"  поставил: {t.get('reporter') or '—'}",
                f"  дедлайн: {t.get('deadline') or '—'}",
                f"  создана: {created}",
            ]
            if t.get('description'):
                parts.append(f"  описание: {t['description']}")
            tasks_lines.append("\n".join(parts))
        tasks_context = "\nТекущие задачи чата:\n" + "\n\n".join(tasks_lines)

    system = SYSTEM_PROMPT + members_context + tasks_context

    messages = [{"role": "system", "content": system}] + ctx.get_messages(chat_id)

    try:
        response = await llm.chat(messages, TOOLS)
    except Exception as e:
        logger.error("llm error: %s", e)
        return

    tool_calls = response.get("tool_calls") or []

    if not tool_calls:
        logger.debug("no tool call — message skipped")
        return

    for tc in tool_calls:
        name = tc["function"]["name"]
        try:
            args = json.loads(tc["function"]["arguments"])
        except json.JSONDecodeError:
            logger.error("failed to parse tool args: %s", tc["function"]["arguments"])
            continue

        if name == "ask_clarification":
            question = args["question"]
            await publish_to_telegram(str(chat_id), question)
            ctx.add_message(chat_id, "assistant", question)
            logger.info("asked clarification: %r", question)

        elif name == "create_task":
            task = await create_task(db, str(chat_id), **args)
            confirm = f"Задача создана: «{task['title']}» (id: {task['id']})"
            await publish_to_telegram(str(chat_id), confirm)
            ctx.add_message(chat_id, "assistant", confirm)
            logger.info("task created: %s", task["id"])

        elif name == "update_task":
            task_id = args.pop("task_id")
            task = await update_task(db, task_id, **args)
            if task:
                confirm = f"Задача обновлена: «{task['title']}»"
                await publish_to_telegram(str(chat_id), confirm)
                ctx.add_message(chat_id, "assistant", confirm)
                logger.info("task updated: %s", task_id)
            else:
                logger.warning("task not found: %s", task_id)

        elif name == "delete_task":
            task_id = args["task_id"]
            task = await delete_task(db, task_id)
            if task:
                confirm = f"Задача удалена: «{task['title']}»"
                await publish_to_telegram(str(chat_id), confirm)
                ctx.add_message(chat_id, "assistant", confirm)
                logger.info("task deleted: %s", task_id)
            else:
                logger.warning("task not found for delete: %s", task_id)

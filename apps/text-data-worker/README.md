# text-data-worker + web-chat

LLM-агент, который читает сообщения из чата и ведёт задачи в PostgreSQL через свободный язык.  
`web-chat` — браузерный интерфейс для разработки и демо (замена реального Telegram).

## Быстрый старт

```bash
cp apps/text-data-worker/.env.example apps/text-data-worker/.env
# вставь API ключ нужного провайдера в .env
docker compose up -d --build
```

Открой **http://localhost:8080** и пиши боту на живом языке.

---

## Архитектура

```
[web-chat / Telegram-агент]
        │
        │  NATS subject: raw-data.messages  (stream: RAW_DATA)
        ▼
[text-data-worker]  ←──→  LLM (DeepSeek / OpenAI / Ollama)
        │                       tool calling
        ├──→  PostgreSQL (таблица tasks, таблица chat_members)
        │
        └──→  NATS subject: notifications.telegram.message  (stream: NOTIFICATIONS)
                        │
                        ▼
             [web-chat / Telegram-агент]
```

---

## NATS — форматы сообщений

### Входящее сообщение (→ агенту)

**Subject:** `raw-data.messages`  **Stream:** `RAW_DATA`

```json
{
  "userId": 123,
  "chatId": 456,
  "message": "зафиксируем задачу для Ивана — дизайн до пятницы",
  "messageAt": "2026-06-09T10:00:00Z",
  "messageId": 789,
  "username": "manager_username"
}
```

| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `userId` | int | да | ID пользователя |
| `chatId` | int | да | ID чата (используется как ключ контекста) |
| `message` | string | да | Текст сообщения |
| `messageAt` | string (ISO 8601) | да | Время сообщения |
| `messageId` | int | нет | ID сообщения |
| `username` | string | нет | @username отправителя |

### Исходящее уведомление (← от агента)

**Subject:** `notifications.telegram.message`  **Stream:** `NOTIFICATIONS`

```json
{
  "chatId": "456",
  "message": "Задача создана: «Дизайн лендинга» (id: abc-123)"
}
```

Агент публикует сюда: уточняющие вопросы, подтверждения создания/обновления/удаления задач.

---

## Поведение агента

Агент работает как **пассивный наблюдатель**. Он молча читает диалог и не прерывает разговор.

**Действует только при явном сигнале фиксации:**
> «зафиксируем», «запишем», «поставь задачу», «создай задачу», «возьми в работу», «добавь в задачи»

Без такого сигнала — молчит, даже если слышит про работу и сроки.

**При создании задачи** берёт всё что накопилось в контексте диалога. Пустые поля (исполнитель, дедлайн, описание) не блокируют создание — их можно обновить позже.

**Уточняющий вопрос** задаёт только если предмет задачи настолько размыт, что название вообще не вывести. Не спрашивает про дедлайн, исполнителя и другие детали.

**Инструменты агента:**
| Инструмент | Когда |
|---|---|
| `create_task` | Явный сигнал фиксации новой задачи |
| `update_task` | Обсуждают существующую задачу и что-то меняется |
| `delete_task` | Явно сказано удалить / отменить / убрать задачу |
| `ask_clarification` | Предмет задачи непонятен; или неясно о какой из существующих задач речь |

---

## Переменные окружения

| Переменная | По умолчанию | Описание |
|---|---|---|
| `LLM_PROVIDER` | `deepseek` | `deepseek` / `openai` / `ollama` |
| `DEEPSEEK_API_KEY` | — | Ключ DeepSeek API |
| `DEEPSEEK_MODEL` | `deepseek-chat` | Модель DeepSeek |
| `OPENAI_API_KEY` | — | Ключ OpenAI API |
| `OPENAI_MODEL` | `gpt-4o-mini` | Модель OpenAI |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Любой OpenAI-совместимый эндпоинт |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434/v1` | Ollama на хосте из Docker |
| `OLLAMA_MODEL` | `qwen2.5` | Модель Ollama |
| `DATABASE_URL` | `postgresql://postgres:password@aipm-pg:5432/aipm` | PostgreSQL |
| `NATS_HOST` | `aipm-nats` | Хост NATS |
| `CONTEXT_MAX_MESSAGES` | `30` | Размер окна истории диалога на чат |

---

## Локальные модели (Ollama)

Критичная способность — tool calling на русском в многоходовом диалоге.

| Модель | Результат |
|---|---|
| `qwen2.5:32b` | Хорошо |
| `qwen2.5:14b` | Нормально (минимум) |
| `qwen2.5:7b` и ниже | Ненадёжно |

---

## База данных

Агент автоматически создаёт две таблицы при старте:

**`tasks`** — задачи чата  
**`chat_members`** — реестр участников (`username` → `display_name`)

Реестр участников используется агентом чтобы сопоставить имена из текста («Сергей сделает») с реальными @username. Заполняется через веб-интерфейс (панель «Участники» справа) или напрямую в БД.

---

## Интеграция с реальным Telegram

Агент не знает откуда пришло сообщение. Чтобы подключить Telegram:

1. Убери `aipm-web-chat` из `docker-compose.yml`
2. Добавь `aipm-telegram-agent` — он публикует входящие сообщения в `raw-data.messages` и подписывается на `notifications.telegram.message`
3. Укажи `BOT_TOKEN` в `apps/telegram-agent/.env`

Либо реализуй собственный коннектор к любому мессенджеру — достаточно соблюдать формат NATS-сообщений выше.

---

## Масштабирование

Несколько инстансов `text-data-worker` с одним durable consumer — NATS JetStream автоматически балансирует нагрузку. Узкое место при масштабе — rate limit LLM API.

При нескольких инстансах контекст диалога (сейчас JSON-файл) нужно вынести в Redis или PostgreSQL.

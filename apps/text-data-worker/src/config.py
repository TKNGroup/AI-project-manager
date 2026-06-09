import os

NATS_HOST = os.getenv("NATS_HOST", "localhost")
NATS_PORT = int(os.getenv("NATS_PORT", "4222"))

LOG_LEVEL = os.getenv("LOGGER_LEVEL", "INFO").upper()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/aipm")

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "deepseek")  # deepseek | openai | ollama

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434/v1")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5")

CONTEXT_FILE_PATH = os.getenv("CONTEXT_FILE_PATH", "/data/context.json")
CONTEXT_MAX_MESSAGES = int(os.getenv("CONTEXT_MAX_MESSAGES", "30"))

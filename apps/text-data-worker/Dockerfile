FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./
COPY apps/text-data-worker/pyproject.toml apps/text-data-worker/pyproject.toml
COPY apps/text-data-worker/src/ apps/text-data-worker/src/
COPY apps/voice-data-worker/pyproject.toml apps/voice-data-worker/pyproject.toml

RUN uv sync --package aipm-text-data-worker --no-dev

CMD ["uv", "run", "--package", "aipm-text-data-worker", "python", "apps/text-data-worker/src/main.py"]

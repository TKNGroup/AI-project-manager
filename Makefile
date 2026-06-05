# docker
up:
	docker compose up -d --build --remove-orphans

down:
	docker compose down -v

# workspace
install:
	bun install & uv sync

clean:
	bun build-tools clean

reset:
	bun build-tools reset

# apps
## core
core_build:
	bun build-tools build --package @aipm/core --task build

core_start:
	cd apps/core && bun run dist

## plain agent
plain_agent_build:
	bun build-tools build --package @aipm/plain-agent --task build

plain_agent_start:
	cd apps/plain-agent && bun run dist

## telegram agent
telegram_agent_build:
	bun build-tools build --package @aipm/telegram-agent --task build

telegram_agent_start:
	cd apps/telegram-agent && bun run dist

## yandex telemost agent
yandex_telemost_agent_build:
	bun build-tools build --package @aipm/yandex-telemost-agent --task build

yandex_telemost_agent_start:
	cd apps/yandex-telemost-agent && bun run dist

## text data worker
text_data_worker_start:
	cd apps/text-data-worker && uv run src/main.py

## voice data worker
voice_data_worker_start:
	cd apps/text-data-worker && uv run src/main.py

BUN ?= bun

# docker
up:
	docker compose up -d --build --remove-orphans

down:
	docker compose down -v

nats_migration:
	cd tooling/nats-tools && cp -n .env.example .env 2>/dev/null || true && bun run migration:up

# workspace
install:
	$(BUN) install & uv sync


install_js:
	bun install --ignore-scripts

telegram_deps_build:
	cd packages/shared && bun tsc --project tsconfig.build.json
	cd packages/cqrs && bun tsc --project tsconfig.build.json
	cd packages/logger && bun tsc --project tsconfig.build.json

telegram_agent_build_local: telegram_deps_build
	cd apps/telegram-agent && bun tsc --project tsconfig.build.json

clean:
	$(BUN) build-tools clean

reset:
	$(BUN) build-tools reset

# apps
## core
core_build:
	$(BUN) build-tools build --package @aipm/core --task build

core_start:
	cd apps/core && $(BUN) run dist

## plane agent
plane_agent_build:
	$(BUN) build-tools build --package @aipm/plane-agent --task build

plane_agent_start:
	cd apps/plane-agent && $(BUN) run dist

## telegram agent
telegram_agent_build:
	$(BUN) build-tools build --package @aipm/telegram-agent --task build

telegram_agent_start:
	cd apps/telegram-agent && $(BUN) run dist

## yandex telemost agent
yandex_telemost_agent_build:
	$(BUN) build-tools build --package @aipm/yandex-telemost-agent --task build

yandex_telemost_agent_start:
	cd apps/yandex-telemost-agent && $(BUN) run dist

## text data worker
text_data_worker_start:
	cd apps/text-data-worker && uv run src/main.py

## voice data worker
voice_data_worker_start:
	cd apps/text-data-worker && uv run src/main.py

## plane (official docker)
plane_docker_up:
	docker compose -f docker/plane/docker-compose.yml --env-file docker/plane/plane.env up -d

plane_docker_down:
	docker compose -f docker/plane/docker-compose.yml --env-file docker/plane/plane.env down -v

## plane (self-hosted, makeplane/* images from Docker Hub)
plane_env:
	@test -f docker/plane/plane.env || cp docker/plane/plane.env.example docker/plane/plane.env

plane_up: plane_env
	cd docker/plane && docker compose --env-file plane.env up -d

plane_down:
	cd docker/plane && docker compose --env-file plane.env down

plane_logs:
	cd docker/plane && docker compose --env-file plane.env logs -f

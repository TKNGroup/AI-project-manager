# AI-PROJECT-MANAGER

## Описание
```
├───apps            # Проекты
├───packages        # Внутренние библиотеки
└───tooling         # Инструменты разработки (инструменты сборки, миграции, итд)
```

Курсовая включает два проекта
1. @aipm/core
2. @aipm/telegram-agent
3. @aipm/plane-agent
4. @aipm/yandex-telemost-agent
5. @aipm/text-data-worker
6. @aipm/voice-data-worker

## Установка и запуск

### 1. Предварительные требования
Убедитесь, что у вас установлены следующие инструменты:
* [**git**](https://git-scm.com/)
* [**Bun**](https://bun.sh/) v1.3.0 или выше
* [**Docker**](https://www.docker.com/)
* [**Make**](https://www.gnu.org/software/make/)
* [**uv**](https://docs.astral.sh/uv/#installation)

### 2. локальные env-файлы
Заменить `.env.example` на `.env`

### 3. Создать контейнер Docker
#### Общие сервисы
```bash
make up
```

#### Plane
```bash
make plane_up
```

UI будет доступен на http://localhost:8090 (первый вход: `captain@plane.so` / `password123`).

После настройки workspace и проекта:
1. Создайте API key в Profile → Personal Access Tokens
2. Скопируйте workspace slug из URL (`/{slug}/...`)
3. Скопируйте project ID из настроек проекта
4. Заполните `apps/plane-agent/.env` (см. `.env.example`)

### 4. Установить зависимости
```bash
make install
```

### 5. Запуск
Смотреть Makefile

#### @aipm/core
```bash
make core_build
```

```bash
make core_start
```

#### @aipm/telegram-agent
```bash
make telegram_agent_build
```

```bash
make telegram_agent_start
```

#### @aipm/plane-agent
```bash
make plane_agent_build
```

```bash
make plane_agent_start
```

#### @aipm/yandex-telemost-agent
```bash
make yandex_telemost_agent_build
```

```bash
make yandex_telemost_agent_start
```

#### @aipm/text-data-worker
```bash
make text_data_worker_start
```

#### @aipm/voice-data-worker
```bash
make voice_data_worker_start
```


## Ветки
1. **main** - ветка продакшен сервера, пуш *основного кода* по согласованию
2. **dev** - ветка дев сервера, пуш *основного кода* по согласованию
3. **sandbox** - ветка для разработки, сюда сливать все PR; здесь готовим версию готовую к dev-серверу
4. **остальные** - локальные ветки; **миграции не комитить**

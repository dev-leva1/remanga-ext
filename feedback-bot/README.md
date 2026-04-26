# Remanga Feedback Bot

Telegram бот для обратной связи по расширению Remanga Enhanced.

## Быстрый старт

```bash
npm install
cp .env.example .env
# Отредактировать .env
```

## Запуск

```bash
npm start
```

## Разработка

```bash
npm run dev
```

## Переменные окружения

### Обязательные

| Переменная | Описание |
|---|---|
| `BOT_TOKEN` | Токен Telegram-бота от `@BotFather`. Без него бот не запускается. |
| `ADMIN_IDS` | Список Telegram user ID администраторов через запятую (например: `123456789,987654321`). |
| `DB_HOST` | Хост PostgreSQL. |
| `DB_PORT` | Порт PostgreSQL (обычно `5432`). |
| `DB_NAME` | Имя базы данных для обращений. |
| `DB_USER` | Пользователь PostgreSQL. |
| `DB_PASSWORD` | Пароль пользователя PostgreSQL. |

### Опциональные

| Переменная | По умолчанию | Описание |
|---|---|---|
| `NODE_ENV` | `development` (локально) / `production` (в compose) | Режим запуска приложения. |

> Примечание: в текущей реализации строгая проверка при старте есть только для `BOT_TOKEN` и `ADMIN_IDS`, но без DB-переменных соединение с PostgreSQL всё равно не будет работать корректно.

## Запуск через Docker Compose

1. Убедитесь, что рядом с `docker-compose.yml` создан `.env` с нужными переменными.
2. Запустите контейнер:

```bash
docker-compose up -d
```

3. Посмотреть логи:

```bash
docker-compose logs -f bot
```

4. Остановить:

```bash
docker-compose down
```

## Инициализация БД и миграций

Схема БД хранится в миграции:

- `src/database/migrations/001_initial.sql`

Что создаётся:

- таблица `feedbacks` для обращений (тип, текст, статус, техконтекст, заметки админа),
- индексы для быстрого поиска/фильтрации,
- таблица `users` (резерв для сценариев авторизации/активации),
- триггер автообновления `updated_at` на `feedbacks`.

Пример применения миграции вручную:

```bash
psql "postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME" \
  -f src/database/migrations/001_initial.sql
```

Проверка, что таблицы созданы:

```bash
psql "postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME" -c "\dt"
```

## Роли и флоу обработчиков

### `UserHandler` (`src/handlers/UserHandler.js`)

Роль: обрабатывает пользовательский сценарий отправки обращения.

Флоу:

1. `/start` (или `/feedback`) открывает выбор типа обращения.
2. Если бот открыт по deep link (из расширения), контекст (версия, браузер, URL) декодируется автоматически.
3. Пользователь либо добавляет техконтекст вручную, либо пропускает шаг.
4. Пользователь отправляет текст обращения.
5. Обращение валидируется и сохраняется в БД через `FeedbackService`.
6. Пользователь получает подтверждение с ID обращения.
7. Администраторы получают уведомление о новом обращении через `NotificationService`.

### `AdminHandler` (`src/handlers/AdminHandler.js`)

Роль: админская панель и обработка жизненного цикла обращений.

Флоу:

1. `/admin` доступна только `ADMIN_IDS`.
2. Показывается статистика по статусам (`new`, `in_progress`, `resolved`, `closed`).
3. Админ открывает список обращений по статусу.
4. Админ открывает карточку обращения с деталями.
5. Админ меняет статус обращения прямо из inline-кнопок.
6. Обновлённый статус сохраняется в БД через `FeedbackService`.

## Интеграция с основным расширением

Бот интегрирован с UI расширения через кнопку «Открыть бот обратной связи» в настройках расширения.

Ключевые точки:

- Значение имени бота задаётся в `Config.defaults` как `feedbackBotUsername` (файл расширения: `src/core/Config.js`).
- UI-кнопка запускается со страницы настроек (`src/ui/SettingsPage.js`), затем открывает модалку обратной связи.
- Deep link формируется в `src/ui/FeedbackButton.js` и передаёт контекст (`версия`, `браузер`, `страница`) в payload команды `/start`.

Если меняете username бота:

1. Обновите `feedbackBotUsername` в `Config.defaults`.
2. Убедитесь, что `FeedbackButton` использует это значение при формировании ссылки `https://t.me/<bot_username>?start=...`.
3. Проверьте открытие бота из UI и корректную обработку deep link в `UserHandler`.

## Troubleshooting

### Ошибки подключения к БД

- `ECONNREFUSED` / `connect ECONNREFUSED <host>:5432`  
  Проверьте, что PostgreSQL запущен, `DB_HOST/DB_PORT` корректны и порт доступен из контейнера/хоста.

- `password authentication failed for user ...`  
  Неверные `DB_USER`/`DB_PASSWORD` или у пользователя нет доступа к `DB_NAME`.

- `database "<name>" does not exist`  
  Создайте БД заранее или измените `DB_NAME` на существующую.

- `relation "feedbacks" does not exist`  
  Не применена миграция `001_initial.sql`.

### Ошибки Telegram API

- `401 Unauthorized` / `invalid token`  
  Неверный `BOT_TOKEN` — перевыпустите токен через `@BotFather`.

- `403 Forbidden: bot was blocked by the user`  
  Пользователь (или админ) заблокировал бота. Бот не сможет отправлять сообщения, пока его не разблокируют.

- `400 Bad Request: chat not found`  
  Указан неправильный ID в `ADMIN_IDS` или бот ни разу не начинал чат с этим админом.

- Бот запускается, но `/admin` недоступна  
  Проверьте, что ваш Telegram user ID точно добавлен в `ADMIN_IDS` и перечислен без лишних символов.

# Прагматичная архитектура Tampermonkey-расширения для remanga.org

## 1. Актуальная структура проекта

> Ниже — фактическая структура `src/` на текущий момент.

```text
src/
├── core/
│   ├── ApiClient.js
│   ├── Config.js
│   ├── NavigationCoordinator.js
│   ├── Statistics.js
│   └── UpdateChecker.js
├── features/
│   ├── AutoCommenter.js
│   ├── AutoLiker.js
│   ├── ChapterManager.js
│   ├── GuildHighlighter.js
│   ├── HeaderCustomizer.js
│   ├── ProfileCustomizer.js
│   ├── RandomTitleNavigator.js
│   ├── TitleCoverPreview.js
│   └── UserTooltip.js
├── ui/
│   ├── FeedbackButton.js
│   ├── Notifications.js
│   ├── SettingsPage.js
│   ├── SettingsPageController.js
│   ├── SettingsPanel.js
│   ├── TooltipRenderer.js
│   └── styles.js
├── utils/
│   ├── changelog-parser.js
│   ├── dom.js
│   ├── logger.js
│   └── validators.js
└── main.js

feedback-bot/
├── src/
│   ├── config/
│   │   └── AppConfig.js
│   ├── database/
│   │   ├── db.js
│   │   ├── MigrationRunner.js
│   │   └── migrations/
│   ├── handlers/
│   │   ├── AdminHandler.js
│   │   └── UserHandler.js
│   ├── services/
│   │   ├── FeedbackService.js
│   │   └── NotificationService.js
│   └── utils/
│       ├── logger.js
│       └── validators.js
└── package.json
```

---

## 2. Core-компоненты

### 2.1 Config

Централизованный singleton-менеджер настроек:
- хранит `defaults` и текущие `settings`;
- загружает/сохраняет настройки через `GM.getValue` / `GM.setValue`;
- санитизирует входные данные через `validators.sanitizeSettings`;
- поддерживает `get`, `set`, `reset`, `export`, `import`.

### 2.2 ApiClient

Клиент для API remanga:
- извлекает и валидирует токен из cookie;
- инициализируется методом `init()`;
- выполняет запросы через `GM.xmlHttpRequest`;
- имеет встроенный rate limiting;
- предоставляет доменные методы: чтение, лайк и комментирование глав, загрузка глав, пользователя и случайного тайтла.

### 2.3 Statistics

Singleton-менеджер статистики:
- хранит `chaptersRead`, `chaptersLiked`, `chaptersCommented`, `installDate`;
- загружает/сохраняет статистику в userscript-хранилище;
- обеспечивает последовательное сохранение через очередь `saveQueue`;
- поддерживает инкременты и сброс статистики.

### 2.4 UpdateChecker

Проверка обновлений userscript:
- учитывает настройку `autoUpdateEnabled`;
- проверяет обновления с интервалом (`checkInterval`);
- получает собранный userscript через GitHub Raw из `main`; URL централизован в `build.js` и подставляется в метаданные и runtime;
- сравнивает локальную и удалённую версии через `changelog-parser`;
- показывает модальное окно с changelog;
- запускает обновление переходом на URL скрипта.

### 2.5 NavigationCoordinator

Координатор SPA-навигации:
- изолирует перехват `history.pushState` / `history.replaceState`;
- восстанавливает оригинальные методы при cleanup;
- защищает runtime от повторного patching при повторной инициализации userscript.

---

## 3. Features-модуль

Актуальные feature-классы:

- **ChapterManager** — операции с главами (поиск/обработка, пакетные действия, интеграция с API и статистикой).
- **AutoLiker** — автоматизация лайков глав в поддерживаемых контекстах.
- **AutoCommenter** — автоматизация комментария главы после дочитывания до конца с дедупликацией и лимитом 4 комментария в минуту.
- **HeaderCustomizer** — настройки и модификации элементов header.
- **ProfileCustomizer** — кастомизация блоков профиля пользователя.
- **GuildHighlighter** — подсветка гильдий на релевантных страницах.
- **UserTooltip** — tooltip по пользователю с данными из API и рендерером.
- **RandomTitleNavigator** — переход к случайному тайтлу на страницах `/catalog` и `/manga`.
- **TitleCoverPreview** — полноэкранный просмотр обложки тайтла.

---

## 3.1 Feedback-bot runtime

`feedback-bot` — отдельный Node.js runtime для Telegram-обратной связи:
- `AppConfig` валидирует `BOT_TOKEN`, `ADMIN_IDS` и PostgreSQL-переменные на старте;
- `Database` получает уже проверенный config, не читает `process.env` напрямую;
- `MigrationRunner` выполняет SQL-миграции после проверки подключения к PostgreSQL и перед запуском Telegram-бота;
- `UserHandler` ведет пользовательский flow и чистит stale sessions по TTL;
- `AdminHandler` проверяет права по typed `adminIds`;
- `NotificationService` возвращает delivery summary и бросает ошибку, если уведомления не доставлены ни одному админу.

---

## 4. Конфигурация (`Config.defaults`)

Реальные ключи defaults в `src/core/Config.js`:

```js
{
  autoLike: false,
  autoCommentEnabled: false,
  autoCommentText: '',
  notificationsEnabled: true,
  notificationDuration: 3,
  batchSize: 10,
  skipProcessed: true,
  autoUpdateEnabled: true,
  blockCustomThemes: false,
  hideChatIndicator: false,
  hideProfileBlocks: {
    statistics: false,
    badges: false,
    achievements: false,
    favoriteCards: false,
    publishers: false,
    guilds: false,
    friends: false,
    followers: false,
    comments: false
  },
  highlightGuilds: true,
  feedbackBotUsername: 'remanga_extension_bot',
  userTooltipEnabled: true,
  randomTitleButtonEnabled: true,
  titleCoverPreviewEnabled: true
}
```

Кратко по группам:
- Автоматизация: `autoLike`, `autoCommentEnabled`, `autoCommentText`, `batchSize`, `skipProcessed`.
- Уведомления: `notificationsEnabled`, `notificationDuration`.
- Обновления: `autoUpdateEnabled`.
- UI/кастомизация: `blockCustomThemes`, `hideChatIndicator`, `hideProfileBlocks`.
- Социальные/навигационные фичи: `highlightGuilds`, `userTooltipEnabled`, `randomTitleButtonEnabled`, `titleCoverPreviewEnabled`.
- Обратная связь: `feedbackBotUsername`.

---

## 5. Исторические фрагменты и устаревшие API

Все примеры кода с устаревшими сущностями (`Storage.js`, `AutoReader.js`, старые параметры вроде `autoRead`/`autoReadDelay`) удалены из этого документа.

Если нужны ретроспективные примеры, их следует хранить отдельно как **исторические** и явно помечать версией/датой, чтобы не смешивать с актуальной архитектурой.

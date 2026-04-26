# Прагматичная архитектура Tampermonkey-расширения для remanga.org

## 1. Актуальная структура проекта

> Ниже — фактическая структура `src/` на текущий момент.

```text
src/
├── core/
│   ├── ApiClient.js
│   ├── Config.js
│   ├── Statistics.js
│   └── UpdateChecker.js
├── features/
│   ├── AutoLiker.js
│   ├── ChapterManager.js
│   ├── GuildHighlighter.js
│   ├── HeaderCustomizer.js
│   ├── ProfileCustomizer.js
│   ├── RandomTitleNavigator.js
│   └── UserTooltip.js
├── ui/
│   ├── FeedbackButton.js
│   ├── Notifications.js
│   ├── SettingsPage.js
│   ├── SettingsPanel.js
│   ├── TooltipRenderer.js
│   └── styles.js
├── utils/
│   ├── changelog-parser.js
│   ├── dom.js
│   ├── logger.js
│   └── validators.js
└── main.js
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
- предоставляет доменные методы: чтение/лайк глав, загрузка глав, пользователя и случайного тайтла.

### 2.3 Statistics

Singleton-менеджер статистики:
- хранит `chaptersRead`, `chaptersLiked`, `installDate`;
- загружает/сохраняет статистику в userscript-хранилище;
- обеспечивает последовательное сохранение через очередь `saveQueue`;
- поддерживает инкременты и сброс статистики.

### 2.4 UpdateChecker

Проверка обновлений userscript:
- учитывает настройку `autoUpdateEnabled`;
- проверяет обновления с интервалом (`checkInterval`);
- сравнивает локальную и удалённую версии через `changelog-parser`;
- показывает модальное окно с changelog;
- запускает обновление переходом на URL скрипта.

---

## 3. Features-модуль

Актуальные feature-классы:

- **ChapterManager** — операции с главами (поиск/обработка, пакетные действия, интеграция с API и статистикой).
- **AutoLiker** — автоматизация лайков глав в поддерживаемых контекстах.
- **HeaderCustomizer** — настройки и модификации элементов header.
- **ProfileCustomizer** — кастомизация блоков профиля пользователя.
- **GuildHighlighter** — подсветка гильдий на релевантных страницах.
- **UserTooltip** — tooltip по пользователю с данными из API и рендерером.
- **RandomTitleNavigator** — кнопка/действие перехода к случайному тайтлу.

---

## 4. Конфигурация (`Config.defaults`)

Реальные ключи defaults в `src/core/Config.js`:

```js
{
  autoLike: false,
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
  randomTitleButtonEnabled: true
}
```

Кратко по группам:
- Автоматизация: `autoLike`, `batchSize`, `skipProcessed`.
- Уведомления: `notificationsEnabled`, `notificationDuration`.
- Обновления: `autoUpdateEnabled`.
- UI/кастомизация: `blockCustomThemes`, `hideChatIndicator`, `hideProfileBlocks`.
- Социальные/навигационные фичи: `highlightGuilds`, `userTooltipEnabled`, `randomTitleButtonEnabled`.
- Обратная связь: `feedbackBotUsername`.

---

## 5. Исторические фрагменты и устаревшие API

Все примеры кода с устаревшими сущностями (`Storage.js`, `AutoReader.js`, старые параметры вроде `autoRead`/`autoReadDelay`) удалены из этого документа.

Если нужны ретроспективные примеры, их следует хранить отдельно как **исторические** и явно помечать версией/датой, чтобы не смешивать с актуальной архитектурой.

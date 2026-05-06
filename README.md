# Remanga Enhanced - Расширение для remanga.org

Tampermonkey расширение для автоматизации действий на сайте remanga.org.

## Документация

Актуальные документы проекта:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/ROADMAP.md](docs/ROADMAP.md)
- [docs/API_LIKES_ENDPOINT.md](docs/API_LIKES_ENDPOINT.md)
- [docs/README.md](docs/README.md)

## Возможности

### ✅ Реализовано

- **ChapterManager** — отметка глав как прочитанных, массовые операции, расчёт ETA и обновление кнопок в DOM
- **AutoLiker** — автолайк текущей главы при открытии ридера
- **AutoCommenter** — автокомментарий главы после дочитывания до конца с настраиваемым текстом и лимитом 4 комментария в минуту
- **SettingsPanel + SettingsPage** — кнопка настроек в header и полноценная страница настроек с вкладками, логотипом и названием расширения
- **Notifications** — toast-уведомления и очередь уведомлений
- **HeaderCustomizer** — скрытие индикатора непрочитанных сообщений в чате
- **ProfileCustomizer** — блокировка кастомных тем и скрытие блоков в профиле
- **GuildHighlighter** — подсветка гильдий на страницах `/forum` и `/guild/top`
- **UserTooltip + TooltipRenderer** — расширенный тултип пользователя при наведении
- **RandomTitleNavigator** — кнопка случайного тайтла на странице каталога `/manga`
- **TitleCoverPreview** — полноэкранный просмотр обложки тайтла по клику или тапу
- **FeedbackButton** — модальное окно с быстрым переходом к боту обратной связи
- **UpdateChecker / Statistics / Config** — автообновление, статистика и управление настройками

## Установка

### 1. Установите Tampermonkey

- **Chrome/Edge**: [Tampermonkey в Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Tampermonkey в Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/)
- **Safari**: [Tampermonkey в App Store](https://apps.apple.com/app/tampermonkey/id1482490089)

### 2. Установите расширение

1. Откройте файл `dist/remanga-extension.user.js`
2. Скопируйте содержимое файла
3. Откройте Tampermonkey Dashboard
4. Нажмите "+" (создать новый скрипт)
5. Вставьте скопированный код
6. Сохраните (Ctrl+S)

### 3. Готово!

Откройте [remanga.org](https://remanga.org) и авторизуйтесь. Расширение начнет работать автоматически.

## Использование

### Настройки

1. Нажмите кнопку `#remanga-ext-settings-btn` в `header` (иконка молнии).
2. Откроется `SettingsPage` в виде полноэкранного модального окна с карточкой бренда, логотипом и текущей версией.
3. Выберите нужную вкладку:
   - **automation** — автолайк, автокомментарий главы, пропуск уже обработанных глав, размер batch для массовых операций;
   - **interface** — блокировка кастомных тем, скрытие индикатора чата, подсветка гильдий, тултип пользователя, кнопка случайного тайтла, полноэкранный просмотр обложки;
   - **general** — обратная связь, уведомления и их длительность, автообновление, статистика и ручная проверка обновлений.
4. Нажмите «Сохранить изменения» (применение происходит с перезагрузкой страницы).

### Страница списка глав

На странице `/manga/{название}/chapters` доступны две кнопки:

- **✓ Прочитать все главы** - массово отметить все главы на странице как прочитанные
- **❤️ Лайкнуть все главы** - массово лайкнуть все главы на странице

При нажатии появится индикатор прогресса с информацией о количестве обработанных глав.
Если включён параметр `skipProcessed`, уже прочитанные/лайкнутые главы будут пропущены.

### Страница чтения

При открытии главы (если включено в настройках):
- Автоматически ставится лайк
- Автоматически отмечается как прочитанная
- После дочитывания до конца автоматически отправляется настроенный комментарий с лимитом 4 комментария в минуту

### Страница тайтла

На странице `/manga/{название}` или `/manga/{название}/main` можно кликнуть или тапнуть по обложке тайтла.
Откроется полноэкранный overlay без перехода на отдельную страницу.
Функцию можно выключить в настройках интерфейса.

## Технические детали

### Архитектура

Расширение построено на прагматичной ООП архитектуре:

```
src/
├── core/           # Ядро (Config, ApiClient)
├── features/       # Функционал (ChapterManager, AutoLiker, AutoCommenter)
├── ui/             # UI компоненты (SettingsPanel, Notifications)
└── utils/          # Утилиты (validators, logger, dom)
```

#### Модули по назначению

- `src/core/`: `Config`, `ApiClient`, `Statistics`, `UpdateChecker`
- `src/features/`: `ChapterManager`, `AutoLiker`, `AutoCommenter`, `HeaderCustomizer`, `ProfileCustomizer`, `GuildHighlighter`, `UserTooltip`, `RandomTitleNavigator`
- `src/ui/`: `SettingsPanel`, `SettingsPage`, `Notifications`, `TooltipRenderer`, `FeedbackButton`
- `src/main.js`: оркестрация и инициализация модулей в зависимости от типа страницы

### Безопасность

- ✅ Валидация всех входных данных
- ✅ Санитизация пользовательского ввода
- ✅ Rate limiting для API запросов (защита от бана)
- ✅ Обработка ошибок и таймаутов
- ✅ Безопасная работа с токенами авторизации

### Производительность

- ✅ Batch обработка для массовых операций (размер batch настраивается в `SettingsPage`)
- ✅ Задержки между запросами (300-500мс)
- ✅ Минимальные манипуляции с DOM
- ✅ Ленивая инициализация компонентов

## Разработка

Подробное руководство для разработчиков: [`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md).

### Требования

- Node.js (для сборки)
- Node.js для `feedback-bot`
- PostgreSQL для локального запуска `feedback-bot`

### Сборка

```bash
npm run build
```

Результат: `dist/remanga-extension.user.js`

Отдельные команды:

```bash
npm run build:userscript
npm run sync:landing
```

### Структура проекта

```
remanga-ext/
├── CHANGELOG.md                 # Единый changelog для userscript header и лендинга
├── src/
│   ├── core/
│   │   ├── Config.js           # Управление настройками
│   │   └── ApiClient.js        # HTTP клиент для API
│   ├── features/
│   │   ├── ChapterManager.js   # Логика работы с главами
│   │   ├── AutoLiker.js        # Автоматические лайки
│   │   └── AutoCommenter.js    # Автоматические комментарии глав
│   ├── ui/
│   │   ├── SettingsPanel.js    # Панель настроек
│   │   └── Notifications.js    # Уведомления
│   ├── utils/
│   │   ├── dom.js              # Утилиты для работы с DOM
│   │   ├── validators.js       # Валидация данных
│   │   └── logger.js           # Логирование
│   └── main.js                 # Точка входа
├── feedback-bot/
│   ├── src/
│   │   ├── config/             # Валидация переменных окружения
│   │   ├── database/           # PostgreSQL connection и миграции
│   │   ├── handlers/           # Telegram handlers
│   │   ├── services/           # Бизнес-логика обращений и уведомлений
│   │   └── utils/              # Валидация и логирование
│   └── package.json
├── dist/
│   ├── remanga-extension.user.js  # Собранный скрипт
│   └── index.html                 # Лендинг
├── build.js                    # Сборщик
└── package.json
```

### API Endpoints

Расширение использует следующие API endpoints remanga.org:

- `POST /api/activity/views/` - отметка главы как прочитанной
- `POST /api/activity/votes/` - лайк глав (поддерживает массивы)
- `POST /api/v2/activity/comments/` - комментарий к главе
- `GET /api/v2/titles/chapters/` - получение информации о главах

## Отладка

Для включения режима отладки:

```javascript
localStorage.setItem('remanga_ext_debug', 'true');
```

После этого в консоли браузера будут отображаться детальные логи работы расширения.

## Ограничения и особенности поведения

- **SPA-навигация**: расширение отслеживает изменения URL через перехват `history.pushState`, `history.replaceState` и `popstate`, закрывает временные тултипы/overlay UI и переинициализирует функциональность под новую страницу.
- **Закрытие/сохранение настроек**: `SettingsPage` закрывается без перезагрузки, а сохранение/сброс настроек применяет изменения через явные collaborators расширения.
- **Массовые операции**:
  - отметка прочитанного выполняется последовательно по одной главе;
  - лайки выполняются батчами (`batchSize`);
  - при включённом `skipProcessed` уже обработанные главы пропускаются и учитываются как `skipped` в итоговой статистике.

## Лицензия

MIT

## Автор

dev-leva1

## Поддержка

Если вы нашли баг или хотите предложить новую функцию, создайте issue в репозитории проекта.

---

**Внимание**: Расширение использует официальное API remanga.org и соблюдает rate limiting для предотвращения блокировки аккаунта. Не модифицируйте задержки между запросами без необходимости.

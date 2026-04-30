# Аудит технического долга — remanga-ext
Сгенерировано: 2026-04-30

## Executive summary
- Наибольшая концентрация долга сидит в `src/main.js`, `src/ui/SettingsPage.js` и `build.js`: большие, часто меняемые файлы, где смешаны orchestration, рендеринг, wiring событий и release-механика.
- `Config.load()` доверяет сохраненным настройкам при чтении и не прогоняет их повторно через санитизацию, хотя docs утверждают обратное (`src/core/Config.js:50-59`, `docs/ARCHITECTURE.md:44-46`). Это самый явный пробой trust boundary в userscript.
- `build.js` — хрупкий самописный bundler/minifier. Он удаляет block comments, indentation и повторяющиеся пробелы глобально, включая template literals и SVG/CSS/HTML payloads (`build.js:208-218`). История git уже показывает, что он раньше ломал `dist`.
- Управление UI state глобально связано через `window.remangaExtension` и hard reload. `SettingsPage` лезет в глобальный singleton-state и обновляет всю страницу для close/save/reset вместо нормального обновления component state (`src/ui/SettingsPage.js:76`, `src/ui/SettingsPage.js:589-618`, `src/ui/SettingsPage.js:675-678`).
- В tooltip renderer до сих пор есть race: fade-out cleanup завязан на timer и использует изменяемый `this.tooltip`, поэтому удаление старого tooltip может снести новый (`src/ui/TooltipRenderer.js:14-25`, `src/ui/TooltipRenderer.js:194-203`).
- Startup feedback-bot валидирует только `BOT_TOKEN` и `ADMIN_IDS`; DB config используется позже без startup-валидации, из-за чего ошибочная конфигурация превращается в runtime failure (`feedback-bot/src/index.js:16-24`, `feedback-bot/src/database/db.js:18-27`, `feedback-bot/README.md:44`).
- Документация репозитория моделирует только userscript-архитектуру и плохо покрывает `feedback-bot`, хотя в репозитории уже два независимых runtime-system (`README.md:141-164`, `docs/README.md:4-13`, `docs/ARCHITECTURE.md:7-33`).
- Позитивный сигнал: `madge` не нашел циклических зависимостей, и `npm audit` в root и bot был чистым. Архитектурный долг тут в основном про coupling, хрупкий build/release flow и contract drift, а не про dependency sprawl.

## Architectural mental model
Этот репозиторий уже не один проект. Это две production-system плюс generated/release artifacts в одном дереве. Первая system: Tampermonkey userscript с рукописным псевдо-слоением (`core`, `features`, `ui`, `utils`) и монолитным bootstrapper в `src/main.js`, который держит lifecycle, SPA navigation hooks, page detection и route cleanup. Вторая system: Telegram feedback bot в `feedback-bot/` с Telegraf handlers, PostgreSQL access layer и небольшими service-классами.

Заявленная архитектура чище, чем реальная. На практике границы дырявые: UI-компоненты лезут в `window.remangaExtension`, build/release логика живет в regex-based concatenator, а config/release metadata дублируется между `Config`, `FeedbackButton`, `build.js`, `dist` и docs. Репозиторий также хранит generated `dist/*` и лендинг рядом с исходниками, поэтому churn концентрируется и в build outputs/release plumbing, и в feature-коде.

## Findings table

| ID | Категория | Файл:Строка | Severity | Effort | Описание | Рекомендация |
|----|----------|-------------|----------|--------|----------|--------------|
| F001 | Архитектурная деградация | `src/main.js:31-98`<br>`src/main.js:107-174`<br>`src/main.js:176-232` | High | L | `RemangaExtension` — god object: bootstrap, page routing, SPA patching, route cleanup, modal cleanup, управление observers и orchestration фич живут в одном классе. Это также один из самых больших и часто меняемых source-файлов. | Вынести navigation/lifecycle в отдельный coordinator, а setup/cleanup по страницам — в page-specific controllers. |
| F002 | Архитектурная деградация | `src/ui/SettingsPage.js:27-69`<br>`src/ui/SettingsPage.js:82-121`<br>`src/ui/SettingsPage.js:535-684`<br>`src/ui/SettingsPage.js:720-739` | High | L | `SettingsPage` — второй god class: генерация markup, branding, tabs, event binding, persistence, проверка обновлений, запуск feedback и CSS injection смешаны в одном файле на 874 строки. | Разбить на view rendering, actions/controller и settings serialization modules. Начать с event wiring и tab rendering. |
| F003 | Архитектурная деградация | `build.js:208-218` | High | M | Build step мутирует source text глобальными regex: удаляет block comments, срезает leading indentation и схлопывает повторяющиеся пробелы. Это задевает template literals, SVG, CSS и HTML strings тоже. Подход хрупкий и уже ломал generated script раньше. | Перестать «минифицировать» source regex-ами. Либо конкатенировать модули без семантической перезаписи, либо перейти на минимальный реальный bundler. |
| F004 | Consistency rot | `build.js:7-31` | Medium | S | Build manifest — вручную поддерживаемый ordered array файлов. Любой новый source-файл требует ручной правки builder, что легко забыть и словить release-only failure. | Генерировать module order из явных imports или хотя бы централизовать валидацию manifest, чтобы missing files падали до релиза. |
| F005 | Consistency rot | `build.js:50-121`<br>`package.json:2` | Medium | S | Release metadata дублируется вручную в userscript header changelog и отдельно в `package.json`. Версия и changelog content поддерживаются руками внутри текста build script. | Сделать один source of truth для changelog/version и выводить из него header/landing data. |
| F006 | Type & contract debt | `src/core/Config.js:50-59`<br>`docs/ARCHITECTURE.md:44-46` | High | M | `Config.load()` парсит сохраненные настройки и shallow-merge'ит их напрямую в runtime config без `validators.sanitizeSettings()`, хотя docs утверждают load-time sanitization. GM storage здесь — trust boundary. | Санитизировать загруженные настройки перед merge, а не только при save. Docs обновлять только после того, как код совпадает с реальностью. |
| F007 | Documentation drift | `src/core/Config.js:119-125` | Medium | S | Export настроек хардкодит `version: '1.2.0'`, сильно позади текущей версии `1.6.10` из package. Metadata экспорта уже устарела. | Заменить хардкод export version на build-time placeholder или `__VERSION__`. |
| F008 | Dead code / contract drift | `src/utils/validators.js:103-105` | Low | S | `sanitizeSettings()` все еще принимает `autoMarkAsRead`, но `Config.defaults` и UI уже не экспонируют такую настройку. Это stale contract surface. | Удалить мертвую ветку настройки или вернуть ее осознанно со сквозной поддержкой. |
| F009 | Consistency rot | `src/core/Config.js:35`<br>`src/ui/FeedbackButton.js:6-10` | Medium | S | Username бота существует дважды: configurable в `Config.defaults.feedbackBotUsername`, но `FeedbackButton` игнорирует config и отдельно хардкодит ту же строку. | Читать username бота из config везде и удалить дублирующий literal. |
| F010 | Архитектурная деградация | `src/ui/SettingsPage.js:589-618`<br>`src/ui/SettingsPage.js:693-694`<br>`src/main.js:68` | Medium | M | `SettingsPage` лезет sideways в `window.remangaExtension`, чтобы запускать update checks, feedback modal и читать время последней проверки. Это обходит constructor boundaries и делает UI page зависимой от ambient global state. | Передавать явные collaborators (`updateChecker`, `feedbackButton`) в `SettingsPage`, а не резолвить их глобально. |
| F011 | Архитектурная деградация | `src/ui/SettingsPage.js:632-634` | Medium | S | `updateContent()` ищет content root через `querySelector('div[style*="flex: 1"]')`. Это brittle selector, завязанный на inline CSS text, а не на структуру. | Дать content container стабильный ID/class и искать по нему. |
| F012 | Consistency rot | `src/ui/SettingsPage.js:74-77`<br>`src/ui/SettingsPage.js:562-578`<br>`src/ui/SettingsPage.js:675-678` | Medium | M | Close/save/reset flows настроек все перезагружают страницу целиком. Это прячет проблемы state-management вместо решения и делает UI controller зависимым от полного document refresh. | Применять настройки инкрементально, где возможно; reload оставить только для кейсов, где реально нужен полный re-init userscript. |
| F013 | Архитектурная деградация | `src/main.js:119-130`<br>`src/main.js:209-232` | High | M | SPA navigation реализована через monkey-patching `history.pushState` и `history.replaceState`, но cleanup не восстанавливает originals. Повторный init или дублирование script будут накапливать поведение. | Хранить originals в instance и восстанавливать их в `cleanup()`, либо глобально защищаться от double patching. |
| F014 | Error handling & observability | `src/main.js:31-33`<br>`src/main.js:99-101` | Medium | S | Top-level init ловит и логирует errors, но не чистит partially initialized state. Ошибка в середине init может оставить listeners/styles/components в полусобранном состоянии. | На fatal init failure вызывать cleanup уже созданных компонентов или этапно строить initialization, чтобы side effects появлялись после прохождения критичных setup-шагов. |
| F015 | Consistency rot | `src/core/UpdateChecker.js:233-237`<br>`src/core/UpdateChecker.js:260-266` | Low | S | В `UpdateChecker` две HTML escaping helper-функции (`escapeHtml` и `escapeHTML`) с одной и той же задачей. | Оставить один escaping helper и использовать его консистентно. |
| F016 | Type & contract debt | `src/core/ApiClient.js:80-90` | Medium | M | Success contract нестабилен: успешные non-JSON responses молча возвращаются как raw strings. Callers `request()` получают `object | string | null` без явного контракта. | Сделать response type явным на уровне endpoint'ов или требовать от caller явно выбирать text vs JSON. |
| F017 | Error handling & observability | `src/core/ApiClient.js:92-99` | Medium | S | Non-2xx API failures схлопываются до `new Error('API ошибка: <status>')` и теряют response body. Дебажить server-side validation failures будет труднее, чем нужно. | Включать sanitized response body или structured error payload в reject path. |
| F018 | Performance & resource hygiene | `src/main.js:147-170` | Medium | S | SPA re-init использует повторяющиеся фиксированные `300ms` timers для каждого page type и для reinjection random-title button. Это timing-based coupling к React render latency, а не event/state-based readiness. | Централизовать один route-settled scheduler или ждать реальные DOM readiness conditions для каждой фичи. |
| F019 | Performance & resource hygiene | `src/features/ChapterManager.js:211-224`<br>`src/features/ChapterManager.js:240-252` | Medium | M | Infinite-scroll loader держится на magic constants (`maxScrollAttempts = 100`, stable count 3, fixed 500ms delay) и никак не сверяет загруженное число глав с metadata тайтла. Он может недогрузить главы молча на slow pages. | Проверять against expected chapter count, когда он доступен, и показывать partial-load state вместо предположения, что стабильность = завершение. |
| F020 | Security hygiene | `src/ui/TooltipRenderer.js:14-25`<br>`src/ui/TooltipRenderer.js:194-203` | High | M | Tooltip removal завязан на timer и асинхронно мутирует `this.tooltip`. Если новый tooltip создается до того, как старый fade-out timeout отработает, cleanup старого может удалить новый tooltip. Это state corruption через shared mutable reference. | Захватывать node reference в closure `remove()` и чистить только этот node. |
| F021 | Performance & resource hygiene | `src/features/UserTooltip.js:10`<br>`src/features/UserTooltip.js:156-165`<br>`src/features/UserTooltip.js:185-188` | Medium | S | Cache user tooltip имеет TTL-on-read, но не имеет size bound. Наведение на большое число пользователей в одной сессии будет растить `Map` без давления на eviction. | Добавить max-size eviction или периодическую cleanup. |
| F022 | Error handling & observability | `src/features/UserTooltip.js:137-149`<br>`src/features/UserTooltip.js:192-195` | Low | S | Ошибки fetch tooltip только логируются и тихо возвращают `null`, так что повторяющиеся user-facing failures не дают ни видимого feedback, ни агрегированной telemetry. | Отслеживать consecutive failures или добавить debug-only UI indicator для повторяющихся API fetch failures. |
| F023 | Архитектурная деградация | `feedback-bot/src/handlers/UserHandler.js:15`<br>`feedback-bot/src/handlers/UserHandler.js:31-38`<br>`feedback-bot/src/handlers/UserHandler.js:75-78`<br>`feedback-bot/src/handlers/UserHandler.js:253` | Medium | M | Session state пользователя живет в in-memory `Map` без TTL, sweep и persistence. Брошенные диалоги накапливаются до рестарта процесса. | Добавить TTL-based cleanup для stale sessions; persistence опциональна, cleanup — нет. |
| F024 | Type & contract debt | `feedback-bot/src/handlers/UserHandler.js:214-225` | Medium | S | Ручной ввод контекста парсится ad hoc regex-ами прямо в handler. Валидация происходит позже при записи, поэтому malformed user input сначала проходит глубоко в session state. | Вынести context parser в validators module и нормализовать/валидировать его сразу на input. |
| F025 | Dependency & config debt | `feedback-bot/src/index.js:16-24`<br>`feedback-bot/src/database/db.js:18-27`<br>`feedback-bot/README.md:44` | High | S | Startup bot валидирует только `BOT_TOKEN` и `ADMIN_IDS`, но DB variables потребляются без валидации. Docs уже признают этот mismatch. Из-за этого очевидная boot-time misconfig превращается в later runtime failure. | Валидировать все обязательные DB env vars на startup и падать fast с одним понятным error report. |
| F026 | Dependency & config debt | `feedback-bot/src/database/db.js:18-27` | Medium | S | `DB_PORT` парсится через `parseInt(process.env.DB_PORT)` и никогда не проверяется на `NaN`. | Явно валидировать диапазон port перед созданием pool. |
| F027 | Consistency rot | `feedback-bot/src/index.js:21-24`<br>`feedback-bot/src/handlers/AdminHandler.js:15`<br>`feedback-bot/src/services/NotificationService.js:11` | Medium | S | Парсинг `ADMIN_IDS` дублируется между startup, admin handler и notification service. Одно config rule реализовано три раза. | Парсить env один раз в config module и инжектить typed admin IDs везде дальше. |
| F028 | Error handling & observability | `feedback-bot/src/services/NotificationService.js:21-42` | Medium | S | Fan-out уведомлений админам глотает per-admin send failures и все равно возвращает overall success. Failures логируются, но не поднимаются до caller, поэтому missed alerts на workflow-уровне silent. | Возвращать delivery summary или бросать ошибку, если все sends failed; минимум — пробрасывать stats частичных failure. |
| F029 | Documentation drift | `docs/README.md:4-13`<br>`docs/ARCHITECTURE.md:7-33` | Medium | S | Центральный docs index и architecture doc описывают только userscript modules. `feedback-bot` — часть реальности репозитория, но отсутствует в root architectural model. | Добавить repo-level architecture section, документирующую оба runtime и их integration boundary. |
| F030 | Documentation drift | `README.md:141-164`<br>`feedback-bot/README.md:1-4` | Medium | S | Root README structure устарела: она показывает репозиторий так, будто в нем только userscript source, `dist`, `build.js` и `package.json`, полностью опуская bot. | Обновить root README structure и dev-инструкции, чтобы отражать layout репозитория с двумя проектами. |
| F031 | Consistency rot | `docs/ROADMAP.md:19` | Low | S | Нумерация ROADMAP сломана (`29.` после `18.`). Мелочь, но показывает, что hand-edited planning docs уже дрейфуют без базовой поддержки. | Перенумеровать roadmap и держать item IDs стабильными, если на них предполагается ссылаться. |
| F032 | Архитектурная деградация | `build.js:161-187`<br>`build.js:225-231` | Medium | M | Build script редактирует landing page assets в `dist/` как часть userscript build. Один script теперь владеет bundling, changelog extraction, version sync и мутацией сайта. | Разделить userscript build и landing-page sync или хотя бы сделать landing sync явной subcommand. |
| F033 | Consistency rot | `src/ui/FeedbackButton.js:154-166`<br>`feedback-bot/src/handlers/UserHandler.js:27-38` | Medium | S | Deep-link contract неявный и размазан по двум runtime. Userscript конструирует base64url payload ad hoc, bot декодирует и интерпретирует его тоже ad hoc. Общей schema/versioning нет. | Определить маленькую версионируемую payload schema и централизовать field names в docs/tests. |
| F034 | Error handling & observability | `feedback-bot/src/handlers/AdminHandler.js:179-199`<br>`feedback-bot/src/services/NotificationService.js:71-89` | Low | S | Telegram HTML formatting собирается string-concatenation в нескольких местах. Некоторые поля санитизируются, некоторые полагаются на upstream constraints. Это скорее хрупкость, чем немедленная exploitability. | Стандартизовать один Telegram-safe formatting helper и использовать его для всех user-originated fields. |
| F035 | Security hygiene | `src/ui/FeedbackButton.js:181-191`<br>`feedback-bot/src/handlers/UserHandler.js:271-288` | Medium | M | У deep-link payload нет schema version и нет integrity marker. Он валидируется достаточно, чтобы избежать очевидной инъекции, но contract хрупкий и легко ломается между релизами случайно. | Добавить поле версии payload и явно reject/handle unknown versions. |

## Top 5 "если ничего больше не чинить — чинить это"

1. **F003 — Заменить regex-based build rewriting в `build.js`.**
   - Конкатенацию файлов можно оставить, но надо перестать мутировать исходники через:
     - `replace(/\/\*\*[\s\S]*?\*\//g, '')`
     - `replace(/^[ \t]+/gm, '')`
     - `replace(/ {2,}/g, ' ')`
   - Минимально безопасное направление:
     - сохранять source text как есть, кроме import/export removal и замены `__VERSION__`;
     - вынести changelog/landing sync в отдельные функции/subcommands;
     - добавить smoke check, что built script все еще содержит balanced braces и ожидаемые class names.

2. **F006 — Санитизировать persisted config при загрузке.**
   - Текущий load path слишком доверяет `GM.getValue('settings')`.
   - Пример diff:
     ```js
     const parsed = JSON.parse(stored);
     const sanitized = validators.sanitizeSettings(parsed);
     this.settings = {
       ...this.defaults,
       ...sanitized,
       hideProfileBlocks: {
         ...this.defaults.hideProfileBlocks,
         ...(sanitized.hideProfileBlocks || {})
       }
     };
     ```
   - Потом удалить stale support для `autoMarkAsRead`, если настройка реально мертвая.

3. **F001 + F002 — Разбить `main.js` и `SettingsPage.js` по ответственности.**
   - Не переписывать все сразу.
   - Первый проход только такой:
     - вынести SPA navigation patching/restore в `NavigationCoordinator`;
     - вынести settings actions (`save/reset/update-check/feedback`) в `SettingsPageController`;
     - markup methods пока можно временно оставить.
   - Цель: перестать раздувать два самых больших файла перед добавлением новых фич.

4. **F020 — Починить race fade-out в `TooltipRenderer.remove()`.**
   - Баг subtle, stateful и user-visible.
   - Пример diff:
     ```js
     remove() {
       const tooltip = this.tooltip;
       if (!tooltip || !tooltip.parentNode) {
         this.tooltip = null;
         this.currentTarget = null;
         return;
       }
       tooltip.style.animation = 'remanga-tooltip-fade-out 0.15s ease';
       setTimeout(() => {
         if (tooltip.parentNode) {
           tooltip.parentNode.removeChild(tooltip);
         }
         if (this.tooltip === tooltip) {
           this.tooltip = null;
           this.currentTarget = null;
         }
       }, 150);
     }
     ```

5. **F025 + F027 — Централизовать startup config validation в feedback-bot.**
   - Создать один config module, который парсит и валидирует:
     - `BOT_TOKEN`
     - `ADMIN_IDS`
     - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - Инжектить typed config в `Database`, `AdminHandler` и `NotificationService` вместо повторного парсинга env в каждом месте.

## Quick wins
- [ ] F007 — Заменить хардкод exported settings version `1.2.0` на `__VERSION__` в `src/core/Config.js:121`.
- [ ] F008 — Удалить stale branch для `autoMarkAsRead` из `src/utils/validators.js:103-105`.
- [ ] F009 — Читать username бота из config в `src/ui/FeedbackButton.js:6-10`.
- [ ] F011 — Заменить selector `div[style*="flex: 1"]` в `src/ui/SettingsPage.js:632-634` на стабильный ID.
- [ ] F015 — Убрать дублирование `escapeHtml` / `escapeHTML` в `src/core/UpdateChecker.js:233-266`.
- [ ] F026 — Валидировать `DB_PORT` в `feedback-bot/src/database/db.js:18-27`.
- [ ] F031 — Починить сломанную нумерацию в `docs/ROADMAP.md:19`.
- [ ] F027 — Парсить `ADMIN_IDS` один раз, а не в трех модулях.

## Things that look bad but are actually fine
- **Raw SQL в feedback-bot — не проблема.** Query parameterized через `$1`, `$2` и т.д., а не string-concatenated SQL (`feedback-bot/src/services/FeedbackService.js:28-47`, `feedback-bot/src/services/FeedbackService.js:64-65`, `feedback-bot/src/services/FeedbackService.js:136-143`). Это трогать не надо.
- **Использование `innerHTML` в userscript не является автоматическим багом здесь.** Несколько рискованных путей уже были усилены через escaping helpers, особенно update modal и tooltip rendering (`src/core/UpdateChecker.js:132-137`, `src/core/UpdateChecker.js:233-266`, `src/ui/TooltipRenderer.js:39-45`, `src/ui/TooltipRenderer.js:70`, `src/ui/TooltipRenderer.js:124`). Долг тут в дублировании и хрупкости, а не в очевидной живой DOM XSS именно в этих местах.
- **Циклических зависимостей нет.** `madge` по `src/` и `feedback-bot/src/` ничего не нашел. Слои дырявые, но не циклические.
- **Dependency sprawl сейчас не выглядит большой проблемой.** `npm audit --omit=dev` был чистым и в root, и в bot, а `depcheck` не нашел unused deps. Главные проблемы — самописный build logic и runtime coupling, а не package bloat.
- **Экспорт `window.remangaExtension` уродливый, но понятный для userscript.** Один глобальный debug/control handle (`src/main.js:68`) сам по себе не катастрофа. Проблема начинается, когда обычная коммуникация компонентов начинает на него опираться (`src/ui/SettingsPage.js:589-618`).

## Open questions for the maintainer
- Коммит generated `dist/*` в git — осознанная часть release/distribution flow или просто удобство? Сейчас build outputs доминируют в churn и review noise.
- `feedback-bot` должен остаться в этом repo надолго или был colocated только ради быстрого старта? Текущие docs все еще описывают repo как один userscript-проект.
- Full page reload после изменения настроек — это hard requirement, потому что remanga SPA плохо переносит incremental re-init, или просто самый быстрый текущий implementation?
- `feedbackBotUsername` реально должен быть user-configurable или это должен быть один internal constant вместо жизни в `Config.defaults`?
- Есть ли реальные кейсы, где update checks возвращают non-JSON success body, который callers специально потребляют как string, или `ApiClient.request()` переобобщен без причины?
- Нужен ли userscript build'у ownership над mutation landing page (`dist/index.html`, `dist/script.js`), или эти deploy/release concerns можно разделить? |

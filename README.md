<div align="center">
  <img src="dist/logo.svg" alt="Remanga Enhanced" width="96" height="96">
  <h1>Remanga Enhanced</h1>
  <p><strong>Больше возможностей на ReManga — прямо в браузере.</strong></p>
  <p>Userscript для автоматизации привычных действий, настройки интерфейса и удобной навигации на remanga.org.</p>
  <p>
    <a href="https://github.com/dev-leva1/remanga-ext/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/dev-leva1/remanga-ext?style=flat-square&color=2563eb"></a>
    <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/github/license/dev-leva1/remanga-ext?style=flat-square"></a>
    <a href="https://github.com/dev-leva1/remanga-ext/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/dev-leva1/remanga-ext?style=flat-square"></a>
    <a href="https://github.com/dev-leva1/remanga-ext/issues"><img alt="Open issues" src="https://img.shields.io/github/issues/dev-leva1/remanga-ext?style=flat-square"></a>
  </p>
  <p>
    <a href="https://raw.githubusercontent.com/dev-leva1/remanga-ext/main/dist/remanga-extension.user.js"><strong>Установить userscript</strong></a> ·
    <a href="https://github.com/dev-leva1/remanga-ext/releases">Релизы</a> ·
    <a href="docs/README.md">Документация</a> ·
    <a href="README.en.md">English</a>
  </p>
</div>

## Возможности

| Автоматизация | Интерфейс и навигация |
| --- | --- |
| Массовая отметка глав как прочитанных | Настройка видимости блоков профиля |
| Массовый лайк глав с индикатором прогресса | Скрытие индикатора непрочитанного чата |
| Автолайк при открытии главы | Подсветка гильдий и тултипы пользователей |
| Опциональный автокомментарий с пользовательским текстом | Случайный тайтл и полноэкранный просмотр обложки |

Все настройки доступны из кнопки расширения в шапке ReManga. Автолайк и автокомментарии выключены по умолчанию. Настройки и счётчики действий хранятся в хранилище userscript.

## Установка

1. Установите менеджер userscript для своего браузера.

   | Браузер | Менеджер |
   | --- | --- |
   | Chrome | [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
   | Edge | [Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) |
   | Firefox | [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/) |
   | Safari | [Stay](https://apps.apple.com/us/app/stay-for-safari/id1591620171) |

2. Откройте [файл установки](https://raw.githubusercontent.com/dev-leva1/remanga-ext/main/dist/remanga-extension.user.js) и подтвердите установку в менеджере.
3. Перейдите на [remanga.org](https://remanga.org/), авторизуйтесь и откройте настройки расширения.

Если установка не открылась автоматически, см. [руководство пользователя](docs/USER_GUIDE.md). Исторические версии доступны в [GitHub Releases](https://github.com/dev-leva1/remanga-ext/releases). Установка и проверка обновлений используют один и тот же собранный файл из ветки `main` через GitHub Raw. Пользователям версий до v1.8.1 нужно один раз открыть новую ссылку установки и подтвердить обновление в менеджере userscript. Не удаляйте старый скрипт заранее: проверьте, что менеджер обновляет существующую установку.

## Документация

| Раздел | Что внутри |
| --- | --- |
| [Руководство пользователя](docs/USER_GUIDE.md) | Настройки, использование, устранение проблем |
| [Данные и разрешения](docs/PRIVACY.md) | Хранилище, API, авторизация и обратная связь |
| [Разработка](docs/DEVELOPER_GUIDE.md) | Локальная сборка и проверки |
| [Архитектура](docs/ARCHITECTURE.md) | Структура userscript и feedback-bot |
| [Feedback-bot](feedback-bot/README.md) | Настройка Telegram-бота и PostgreSQL |
| [Выпуск версий](docs/RELEASE.md) | Версионирование и GitHub Releases |
| [Changelog](CHANGELOG.md) / [Roadmap](docs/ROADMAP.md) | История изменений и планы |

## Разработка

```bash
git clone https://github.com/dev-leva1/remanga-ext.git
cd remanga-ext
npm ci
npm run lint
npm run build
node --check dist/remanga-extension.user.js
```

Сборка создаёт `dist/remanga-extension.user.js` с актуальными метаданными и changelog. Telegram-бот — отдельный сервис; для сборки userscript он не нужен.

Подробности: [Developer Guide](docs/DEVELOPER_GUIDE.md) · [Contributing](CONTRIBUTING.md).

## Обратная связь

- [Сообщить об ошибке или предложить улучшение](https://github.com/dev-leva1/remanga-ext/issues/new/choose).
- [Telegram-бот обратной связи](https://t.me/remanga_extension_bot) — также доступен из настроек расширения.
- Уязвимости: [SECURITY.md](SECURITY.md). Не публикуйте токены, cookies и персональные данные в Issues.

## Лицензия и ограничения

Код проекта распространяется по [MIT](LICENSE); сторонние компоненты — по их собственным [лицензиям](THIRD_PARTY_NOTICES.md).

Remanga Enhanced — независимый userscript, не официальный продукт ReManga. Соблюдайте правила сайта и не используйте автоматизацию для спама. Ограничение частоты запросов не гарантирует отсутствие санкций со стороны платформы. Совместимость зависит от изменений интерфейса и API ReManga.

Поддержка проекта: [dev-leva1](https://github.com/dev-leva1).

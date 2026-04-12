# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Проект

Tampermonkey расширение для автоматизации действий на remanga.org (автолайк глав, массовая отметка прочитанных).

## Сборка и разработка

```bash
# Сборка расширения
npm run build

# Разработка (сборка + инструкция)
npm run dev
```

Результат сборки: `dist/remanga-extension.user.js` - готовый userscript для установки в Tampermonkey.

## Архитектура

Проект построен на прагматичной ООП архитектуре с четким разделением ответственности:

### Структура компонентов

```
src/
├── core/           # Ядро системы
│   ├── Config.js       # Singleton для управления настройками (GM.getValue/setValue)
│   └── ApiClient.js    # HTTP клиент с rate limiting (300ms между запросами)
├── features/       # Бизнес-логика
│   ├── ChapterManager.js  # Операции с главами (отметка, лайки, batch обработка)
│   └── AutoLiker.js       # Автоматический лайк при открытии главы
├── ui/             # UI компоненты
│   ├── SettingsPanel.js   # Панель настроек (интеграция в dropdown меню)
│   └── Notifications.js   # Toast уведомления
└── utils/          # Утилиты
    ├── validators.js      # Валидация и санитизация входных данных
    ├── logger.js          # Логирование (включается через localStorage)
    └── dom.js             # Работа с DOM (поиск элементов, извлечение ID)
```

### Поток данных

```
main.js (точка входа)
  ├─> Config (загрузка настроек)
  ├─> ApiClient (инициализация с токеном из cookie)
  ├─> ChapterManager (бизнес-логика)
  │     ├─> AutoLiker (автоматические действия)
  │     └─> API запросы через ApiClient
  └─> UI компоненты (SettingsPanel, Notifications)
```

### Ключевые особенности

**Config (Singleton):**
- Хранение настроек через GM.getValue/GM.setValue
- Валидация через validators.sanitizeSettings()
- Значения по умолчанию в this.defaults

**ApiClient:**
- Rate limiting: минимум 300ms между запросами
- Автоматическая подстановка токена из cookie (token=...)
- Использует GM.xmlHttpRequest для обхода CORS
- Timeout: 15 секунд

**ChapterManager:**
- Batch обработка лайков: по 10 глав за раз
- Задержки между операциями: 300-500ms
- Метод loadAllChaptersByScroll() для загрузки всех глав через скролл страницы
- Обновление UI кнопок после операций

**main.js:**
- Определение типа страницы: 'chapters' | 'reader' | 'other'
- SPA навигация: перехват history.pushState/replaceState
- MutationObserver для отслеживания изменений DOM
- Двухэтапные операции: 1) загрузка глав через скролл, 2) обработка

## API Endpoints

Расширение использует официальное API remanga.org:

- `POST /api/activity/views/` - отметка главы как прочитанной
  - Body: `{ chapter: chapterId }`
  
- `POST /api/activity/votes/` - лайк глав (поддерживает массивы)
  - Body: `{ chapter_ids: [id1, id2, ...] }`
  
- `GET /api/v2/titles/chapters/` - получение информации о главах
  - Params: `branch_id`, `user_data=1`, `ordering=-index`, `page`

## Безопасность

**КРИТИЧНО:** Проект следует строгим правилам безопасности:

- Все входные данные проходят валидацию через validators.js
- ID глав санитизируются: validators.sanitizeChapterId() / sanitizeChapterIds()
- Токен извлекается из cookie и валидируется: validators.isValidToken()
- Rate limiting защищает от бана (300ms между запросами)
- Timeout для всех API запросов: 15 секунд
- Обработка всех ошибок через try/catch с логированием

## Сборка (build.js)

Простой сборщик без зависимостей:
- Читает файлы в определенном порядке (utils → core → features → ui → main)
- Удаляет import/export, комментарии, пустые строки
- Добавляет Tampermonkey header с версией из package.json
- Оборачивает в IIFE: `(function(){ 'use strict'; ... })()`
- Результат: один файл dist/remanga-extension.user.js

## Отладка

Включить debug режим:
```javascript
localStorage.setItem('remanga_ext_debug', 'true');
```

После этого в консоли браузера будут детальные логи работы расширения.

## Типы страниц

Расширение определяет тип страницы по URL:

- **'chapters'**: `/manga/{название}/chapters` - страница списка глав
  - Добавляются кнопки "Прочитать все" и "Лайкнуть все"
  - MutationObserver отслеживает изменения DOM
  
- **'reader'**: `/manga/{название}/{chapterId}` - страница чтения
  - Автолайк при открытии (если включено в настройках)
  - Автоотметка как прочитанной
  
- **'other'**: остальные страницы
  - Расширение неактивно

## Важные детали реализации

**SPA навигация:**
- Remanga.org использует React Router
- Перехватываем history.pushState/replaceState для отслеживания переходов
- Даем 300ms на рендеринг React перед инициализацией компонентов

**Массовые операции:**
- Двухэтапный процесс с модальным окном прогресса
- Этап 1: Загрузка всех глав через скролл (индикатор загрузки)
- Этап 2: Обработка глав (прогресс-бар с процентами)

**UI интеграция:**
- Настройки встроены в нативное dropdown меню пользователя
- Кнопки используют классы сайта: 'cs-button'
- Toast уведомления с анимацией появления/исчезновения

## Принципы разработки

- **ООП и SOLID**: каждый класс имеет одну ответственность
- **Безопасность**: валидация всех входных данных, никогда не доверять пользовательскому вводу
- **Производительность**: batch операции, rate limiting, минимальные манипуляции с DOM
- **Отказоустойчивость**: обработка всех ошибок, graceful degradation

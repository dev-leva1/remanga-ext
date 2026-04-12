# Архитектура реализации задач из ROADMAP

## Дата: 2026-04-12

## Выбранный подход: Минимальный с прагматичными улучшениями

### Обоснование
- Быстрая реализация (6-7 часов)
- Минимум новых файлов (3 новых класса)
- Переиспользование существующей архитектуры
- Соответствие SOLID принципам

---

## Новые компоненты

### 1. ProfileCustomizer (src/features/ProfileCustomizer.js)
**Ответственность:**
- Блокировка кастомных тем в профилях (Задача #1)
- Скрытие блоков профиля (Задача #2)

**Зависимости:** Config

**Методы:**
```javascript
class ProfileCustomizer {
  constructor(config)
  init() // Запуск MutationObserver
  blockCustomThemes() // Удаление кастомных <style> и inline стилей
  hideProfileBlocks() // Инъекция CSS для скрытия блоков
  getBlockSelectors() // Маппинг настроек → CSS селекторы
  cleanup() // Отключение observer
}
```

### 2. HeaderCustomizer (src/features/HeaderCustomizer.js)
**Ответственность:**
- Скрытие индикатора непрочитанных сообщений (Задача #3)
- Добавление подложки под кнопку настроек (Задача #5)

**Зависимости:** Config

**Методы:**
```javascript
class HeaderCustomizer {
  constructor(config)
  init() // Инъекция CSS стилей
  injectStyles() // Добавление <style> тега
  cleanup() // Удаление стилей
}
```

### 3. SettingsPage (src/ui/SettingsPage.js)
**Ответственность:**
- Создание страницы `/extension-settings` (Задача #4)
- Рендеринг UI настроек
- Сохранение настроек

**Зависимости:** Config, Notifications, Statistics

**Методы:**
```javascript
class SettingsPage {
  constructor(config, notifications, statistics)
  init() // Перехват роутинга
  render() // Создание DOM структуры
  createSidebar() // Боковое меню
  createContent() // Основной контент
  attachEventListeners() // Обработчики событий
  saveSettings() // Сохранение через Config
  cleanup() // Удаление страницы
}
```

---

## Изменения в существующих файлах

### Config.js - Новые настройки
```javascript
this.defaults = {
  // Существующие...
  
  // НОВЫЕ
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
  }
};
```

### styles.js - Подложка кнопки
```javascript
// Строка 92
icon: `
  background: rgba(255, 255, 255, 0.05); // БЫЛО: transparent
  // ...
`
```

### SettingsPanel.js - Замена на ссылку
- Удалить модальное окно (методы show, createPanel, etc.)
- Заменить button на <a href="/extension-settings">
- Добавить перехват клика для SPA навигации

### main.js - Интеграция
- Добавить инициализацию новых компонентов
- Добавить обработку типов страниц 'settings' и 'profile'
- Добавить cleanup для новых компонентов

---

## Итоговый список файлов

### Создать (3 файла):
1. `src/features/ProfileCustomizer.js` (~150 строк)
2. `src/features/HeaderCustomizer.js` (~80 строк)
3. `src/ui/SettingsPage.js` (~400 строк)

### Изменить (5 файлов):
1. `src/core/Config.js` (+15 строк)
2. `src/ui/styles.js` (1 строка)
3. `src/ui/SettingsPanel.js` (-500 строк, +50 строк)
4. `src/main.js` (+40 строк)
5. `package.json` (версия 1.5.0 → 1.6.0)

**Всего:** 8 файлов

---

## План реализации (поэтапно)

### Этап 1: Простые задачи (30 мин)
1. Задача #5: Изменить styles.js (фон кнопки)
2. Задача #3: Создать HeaderCustomizer (скрытие индикатора)
3. Обновить Config.js (новые настройки)

### Этап 2: Средние задачи (2.5 часа)
4. Задача #1: Создать ProfileCustomizer (блокировка тем)
5. Задача #2: Расширить ProfileCustomizer (скрытие блоков)
6. Изменить SettingsPanel.js (заменить на ссылку)

### Этап 3: Сложная задача (3-4 часа)
7. Задача #4: Создать SettingsPage (полная страница)
8. Интегрировать в main.js
9. Тестирование и отладка

**Общее время:** 6-7 часов

---

## Оценка сложности

| Задача | Сложность | Время |
|--------|-----------|-------|
| #5 Подложка кнопки | 1/5 | 5 мин |
| #3 Индикатор чата | 1/5 | 15 мин |
| #1 Блокировка тем | 3/5 | 1 час |
| #2 Скрытие блоков | 3/5 | 1.5 часа |
| #4 Страница настроек | 5/5 | 3-4 часа |

**Общая сложность:** 3.5/5

---

## Потенциальные проблемы

1. **Селекторы блоков профиля** - требуется инспекция реальной страницы
2. **Роутинг для /extension-settings** - может конфликтовать с React Router
3. **Кастомные темы** - неизвестен точный механизм применения
4. **Сохранение состояния** - React может перерендерить страницу
5. **Производительность MutationObserver** - постоянное отслеживание DOM

---

## Преимущества подхода

✅ Минимум новых файлов (3 класса)  
✅ Соответствие существующей архитектуре  
✅ Четкое разделение ответственности  
✅ Легко тестировать и отлаживать  
✅ Быстрая реализация (6-7 часов)  
✅ Расширяемость для будущих фич  
✅ Соблюдение SOLID принципов

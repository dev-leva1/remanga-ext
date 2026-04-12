# Прагматичная архитектура Tampermonkey расширения для remanga.org

## 1. Структура проекта

```
remanga-ext/
├── src/
│   ├── core/
│   │   ├── Config.js           # Управление настройками
│   │   ├── ApiClient.js        # HTTP клиент для API
│   │   └── Storage.js          # Работа с GM_storage
│   ├── features/
│   │   ├── ChapterManager.js   # Логика работы с главами
│   │   ├── AutoLiker.js        # Автоматические лайки
│   │   └── AutoReader.js       # Автопереход между главами
│   ├── ui/
│   │   ├── SettingsPanel.js    # Панель настроек
│   │   └── Notifications.js    # Уведомления пользователю
│   ├── utils/
│   │   ├── dom.js              # Утилиты для работы с DOM
│   │   ├── validators.js       # Валидация данных
│   │   └── logger.js           # Логирование
│   └── main.js                 # Точка входа
├── dist/
│   └── remanga-extension.user.js  # Собранный скрипт
├── build.js                    # Простой сборщик
└── package.json
```

**Объем:** ~800-1200 строк кода

---

## 2. Основные компоненты и их взаимодействие

### 2.1 Диаграмма взаимодействия

```
┌─────────────┐
│   main.js   │ ◄─── Точка входа, инициализация
└──────┬──────┘
       │
       ├──► ┌──────────────┐
       │    │   Config     │ ◄─── Настройки (singleton)
       │    └──────────────┘
       │
       ├──► ┌──────────────┐
       │    │  ApiClient   │ ◄─── HTTP запросы к API
       │    └──────────────┘
       │
       ├──► ┌──────────────────┐
       │    │ ChapterManager   │ ◄─── Бизнес-логика глав
       │    └──────────────────┘
       │           │
       │           ├──► AutoLiker
       │           └──► AutoReader
       │
       └──► ┌──────────────────┐
            │  SettingsPanel   │ ◄─── UI настроек
            └──────────────────┘
```

---

## 3. Ключевые компоненты с примерами

### 3.1 Core: Config (Singleton)

**Назначение:** Централизованное управление настройками

```javascript
class Config {
  static instance = null;
  
  constructor() {
    if (Config.instance) return Config.instance;
    
    this.defaults = {
      autoLike: false,
      autoRead: false,
      autoReadDelay: 3000,
      likeOnRead: false,
      notifications: true
    };
    
    this.settings = null;
    Config.instance = this;
  }
  
  async load() {
    const stored = await GM.getValue('settings', null);
    this.settings = stored ? JSON.parse(stored) : { ...this.defaults };
    return this.settings;
  }
  
  async save(newSettings) {
    if (!this.validate(newSettings)) {
      throw new Error('Invalid settings');
    }
    this.settings = { ...this.settings, ...newSettings };
    await GM.setValue('settings', JSON.stringify(this.settings));
  }
  
  get(key) {
    return this.settings?.[key] ?? this.defaults[key];
  }
  
  validate(settings) {
    if (settings.autoReadDelay && settings.autoReadDelay < 1000) return false;
    return true;
  }
}
```

**Плюсы:**
- Единая точка доступа к настройкам
- Валидация при сохранении
- Значения по умолчанию

---

### 3.2 Core: ApiClient

**Назначение:** Обертка над fetch для работы с API remanga.org

```javascript
class ApiClient {
  constructor() {
    this.baseURL = 'https://api.remanga.org';
    this.token = this.extractToken();
  }
  
  extractToken() {
    const match = document.cookie.match(/token=([^;]+)/);
    if (!match) throw new Error('User not authenticated');
    return match[1];
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers
    };
    
    try {
      const response = await GM.xmlHttpRequest({
        method: options.method || 'GET',
        url,
        headers,
        data: options.body ? JSON.stringify(options.body) : undefined,
        timeout: 10000
      });
      
      if (response.status >= 400) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return response.status === 204 ? null : JSON.parse(response.responseText);
    } catch (error) {
      console.error('[ApiClient]', error);
      throw error;
    }
  }
  
  // Специфичные методы
  async likeChapters(chapterIds) {
    return this.request('/api/activity/votes/', {
      method: 'POST',
      body: { chapter_ids: chapterIds }
    });
  }
  
  async markAsRead(chapterId) {
    return this.request('/api/activity/views/', {
      method: 'POST',
      body: { chapter: chapterId }
    });
  }
  
  async getChapters(branchId, page = 1) {
    return this.request(
      `/api/v2/titles/chapters/?branch_id=${branchId}&user_data=1&page=${page}`
    );
  }
}
```

**Плюсы:**
- Централизованная обработка ошибок
- Автоматическая подстановка токена
- Использование GM.xmlHttpRequest для обхода CORS

---

### 3.3 Features: ChapterManager

**Назначение:** Бизнес-логика работы с главами

```javascript
class ChapterManager {
  constructor(apiClient, config) {
    this.api = apiClient;
    this.config = config;
  }
  
  extractChapterIdFromUrl() {
    const match = window.location.pathname.match(/\/manga\/[^/]+\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }
  
  extractChapterIdsFromPage() {
    const elements = document.querySelectorAll('[data-testid^="chapter_"]');
    return Array.from(elements).map(el => {
      const match = el.dataset.testid.match(/chapter_(\d+)/);
      return match ? parseInt(match[1]) : null;
    }).filter(Boolean);
  }
  
  async likeChapter(chapterId) {
    try {
      await this.api.likeChapters([chapterId]);
      this.updateLikeButton(chapterId);
      return true;
    } catch (error) {
      console.error('[ChapterManager] Like failed:', error);
      return false;
    }
  }
  
  async likeMultiple(chapterIds) {
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < chapterIds.length; i += batchSize) {
      const batch = chapterIds.slice(i, i + batchSize);
      try {
        await this.api.likeChapters(batch);
        results.push(...batch);
        await this.delay(500); // Rate limiting
      } catch (error) {
        console.error('[ChapterManager] Batch like failed:', error);
      }
    }
    
    return results;
  }
  
  updateLikeButton(chapterId) {
    const button = document.querySelector(`[data-testid="like_btn_${chapterId}"]`);
    if (button) {
      button.classList.toggle('liked');
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Плюсы:**
- Инкапсуляция логики работы с главами
- Batch обработка для массовых операций
- Rate limiting для защиты от бана

---

### 3.4 Features: AutoReader

**Назначение:** Автоматический переход к следующей главе

```javascript
class AutoReader {
  constructor(config) {
    this.config = config;
    this.observer = null;
  }
  
  init() {
    if (!this.config.get('autoRead')) return;
    
    this.observeScrollPosition();
  }
  
  observeScrollPosition() {
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      // Проверяем, достигли ли конца страницы
      if (scrollTop + clientHeight >= scrollHeight - 100 && scrollTop > lastScrollTop) {
        this.handleEndOfChapter();
      }
      
      lastScrollTop = scrollTop;
    });
  }
  
  handleEndOfChapter() {
    const nextChapterLink = this.findNextChapterLink();
    if (!nextChapterLink) return;
    
    const delay = this.config.get('autoReadDelay');
    
    setTimeout(() => {
      window.location.href = nextChapterLink.href;
    }, delay);
  }
  
  findNextChapterLink() {
    // Ищем кнопку "Следующая глава" в header
    const links = document.querySelectorAll('header a[href*="/manga/"]');
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href && href.match(/\/manga\/[^/]+\/\d+$/)) {
        return link;
      }
    }
    return null;
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
```

**Плюсы:**
- Простая логика определения конца главы
- Настраиваемая задержка
- Легко отключить

---

### 3.5 UI: SettingsPanel

**Назначение:** Интерфейс настроек расширения

```javascript
class SettingsPanel {
  constructor(config) {
    this.config = config;
    this.panel = null;
  }
  
  inject() {
    // Добавляем пункт в dropdown меню пользователя
    const menu = document.querySelector('menu[orientation="vertical"]');
    if (!menu) return;
    
    const menuItem = this.createMenuItem();
    menu.insertBefore(menuItem, menu.children[2]); // После "История чтения"
  }
  
  createMenuItem() {
    const item = document.createElement('menuitem');
    item.innerHTML = `
      <button class="cs-button w-full justify-start">
        ⚙️ Настройки расширения
      </button>
    `;
    item.addEventListener('click', () => this.show());
    return item;
  }
  
  show() {
    if (this.panel) {
      this.panel.style.display = 'block';
      return;
    }
    
    this.panel = this.createPanel();
    document.body.appendChild(this.panel);
  }
  
  createPanel() {
    const panel = document.createElement('div');
    panel.className = 'remanga-ext-settings';
    panel.innerHTML = `
      <div class="overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999;">
        <div class="modal" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
             background: white; padding: 24px; border-radius: 8px; min-width: 400px;">
          <h2>Настройки расширения</h2>
          
          <label>
            <input type="checkbox" id="autoLike" ${this.config.get('autoLike') ? 'checked' : ''}>
            Автоматически ставить лайки
          </label>
          
          <label>
            <input type="checkbox" id="autoRead" ${this.config.get('autoRead') ? 'checked' : ''}>
            Автопереход к следующей главе
          </label>
          
          <label>
            Задержка перехода (мс):
            <input type="number" id="autoReadDelay" value="${this.config.get('autoReadDelay')}" min="1000">
          </label>
          
          <button id="save">Сохранить</button>
          <button id="close">Закрыть</button>
        </div>
      </div>
    `;
    
    this.attachEventListeners(panel);
    return panel;
  }
  
  attachEventListeners(panel) {
    panel.querySelector('#save').addEventListener('click', async () => {
      const settings = {
        autoLike: panel.querySelector('#autoLike').checked,
        autoRead: panel.querySelector('#autoRead').checked,
        autoReadDelay: parseInt(panel.querySelector('#autoReadDelay').value)
      };
      
      try {
        await this.config.save(settings);
        alert('Настройки сохранены');
        this.hide();
      } catch (error) {
        alert('Ошибка сохранения: ' + error.message);
      }
    });
    
    panel.querySelector('#close').addEventListener('click', () => this.hide());
  }
  
  hide() {
    if (this.panel) {
      this.panel.style.display = 'none';
    }
  }
}
```

**Плюсы:**
- Интеграция в нативный UI сайта
- Простая форма настроек
- Валидация через Config

---

### 3.6 Utils: Validators

**Назначение:** Валидация пользовательского ввода

```javascript
const validators = {
  isChapterId(value) {
    return Number.isInteger(value) && value > 0;
  },
  
  isChapterIds(values) {
    return Array.isArray(values) && values.every(this.isChapterId);
  },
  
  isDelay(value) {
    return Number.isInteger(value) && value >= 1000 && value <= 60000;
  },
  
  sanitizeChapterId(value) {
    const num = parseInt(value);
    if (!this.isChapterId(num)) {
      throw new Error(`Invalid chapter ID: ${value}`);
    }
    return num;
  },
  
  sanitizeChapterIds(values) {
    if (!Array.isArray(values)) {
      throw new Error('Chapter IDs must be an array');
    }
    return values.map(v => this.sanitizeChapterId(v));
  }
};

export default validators;
```

**Плюсы:**
- Защита от некорректных данных
- Централизованная валидация
- Явные ошибки

---

### 3.7 Main.js (Точка входа)

**Назначение:** Инициализация и координация компонентов

```javascript
import Config from './core/Config.js';
import ApiClient from './core/ApiClient.js';
import ChapterManager from './features/ChapterManager.js';
import AutoReader from './features/AutoReader.js';
import SettingsPanel from './ui/SettingsPanel.js';

class RemangaExtension {
  constructor() {
    this.config = new Config();
    this.api = null;
    this.chapterManager = null;
    this.autoReader = null;
    this.settingsPanel = null;
  }
  
  async init() {
    try {
      // Загружаем настройки
      await this.config.load();
      
      // Проверяем авторизацию
      if (!this.isUserLoggedIn()) {
        console.log('[RemangaExt] User not logged in');
        return;
      }
      
      // Инициализируем компоненты
      this.api = new ApiClient();
      this.chapterManager = new ChapterManager(this.api, this.config);
      this.settingsPanel = new SettingsPanel(this.config);
      
      // Определяем страницу и запускаем соответствующие фичи
      const pageType = this.detectPageType();
      
      if (pageType === 'chapters') {
        this.initChaptersPage();
      } else if (pageType === 'reader') {
        this.initReaderPage();
      }
      
      // Инжектим UI настроек
      this.settingsPanel.inject();
      
      console.log('[RemangaExt] Initialized successfully');
    } catch (error) {
      console.error('[RemangaExt] Initialization failed:', error);
    }
  }
  
  isUserLoggedIn() {
    return document.cookie.includes('token=');
  }
  
  detectPageType() {
    const path = window.location.pathname;
    if (path.includes('/chapters')) return 'chapters';
    if (path.match(/\/manga\/[^/]+\/\d+/)) return 'reader';
    return 'other';
  }
  
  initChaptersPage() {
    // Добавляем кнопку массового лайка
    this.addBulkLikeButton();
  }
  
  initReaderPage() {
    // Запускаем автопереход
    this.autoReader = new AutoReader(this.config);
    this.autoReader.init();
    
    // Лайк при прочтении
    if (this.config.get('likeOnRead')) {
      const chapterId = this.chapterManager.extractChapterIdFromUrl();
      if (chapterId) {
        this.chapterManager.likeChapter(chapterId);
      }
    }
  }
  
  addBulkLikeButton() {
    const container = document.querySelector('.relative.flex.flex-col.gap-2');
    if (!container) return;
    
    const button = document.createElement('button');
    button.className = 'cs-button';
    button.textContent = '❤️ Лайкнуть все главы';
    button.addEventListener('click', async () => {
      const chapterIds = this.chapterManager.extractChapterIdsFromPage();
      button.disabled = true;
      button.textContent = 'Обработка...';
      
      await this.chapterManager.likeMultiple(chapterIds);
      
      button.textContent = '✓ Готово';
      setTimeout(() => {
        button.disabled = false;
        button.textContent = '❤️ Лайкнуть все главы';
      }, 3000);
    });
    
    container.insertBefore(button, container.firstChild);
  }
}

// Запуск
(function() {
  'use strict';
  
  const extension = new RemangaExtension();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => extension.init());
  } else {
    extension.init();
  }
})();
```

---

## 4. Плюсы и минусы подхода

### ✅ Плюсы

1. **Баланс простоты и качества**
   - Не перегружен абстракциями
   - Достаточно структурирован для поддержки
   - Легко понять новому разработчику

2. **Модульность**
   - Каждый компонент отвечает за свою область
   - Легко добавлять новые фичи
   - Можно тестировать по отдельности

3. **Безопасность**
   - Валидация всех входных данных
   - Централизованная обработка ошибок
   - Rate limiting для API запросов

4. **Производительность**
   - Batch обработка для массовых операций
   - Минимальные манипуляции с DOM
   - Ленивая инициализация компонентов

5. **Расширяемость**
   - Легко добавить новые фичи в `features/`
   - Простая интеграция новых API endpoints
   - Гибкая система настроек

### ❌ Минусы

1. **Нет реактивности**
   - Изменения настроек требуют перезагрузки
   - Ручное обновление UI после операций

2. **Нет TypeScript**
   - Отсутствие статической типизации
   - Возможны runtime ошибки

3. **Простая обработка ошибок**
   - Нет retry механизма
   - Нет детального логирования

4. **Нет тестов**
   - Сложнее гарантировать качество
   - Рефакторинг более рискованный

---

## 5. Примерный объем кода

| Компонент | Строк кода |
|-----------|------------|
| Config.js | ~80 |
| ApiClient.js | ~100 |
| Storage.js | ~50 |
| ChapterManager.js | ~150 |
| AutoLiker.js | ~80 |
| AutoReader.js | ~100 |
| SettingsPanel.js | ~200 |
| Notifications.js | ~60 |
| utils/dom.js | ~50 |
| utils/validators.js | ~60 |
| utils/logger.js | ~40 |
| main.js | ~150 |
| **ИТОГО** | **~1120 строк** |

---

## 6. Почему это оптимальный выбор

### 🎯 Для данной задачи это идеально, потому что:

1. **Размер проекта средний**
   - Не настолько мал, чтобы писать все в одном файле
   - Не настолько велик, чтобы нужны были фреймворки

2. **Требования понятны и стабильны**
   - API remanga.org не меняется часто
   - Функционал четко определен
   - Не нужна сложная архитектура "на вырост"

3. **Один разработчик**
   - Не нужны сложные паттерны для командной работы
   - Можно держать всю архитектуру в голове
   - Быстрая итерация

4. **Tampermonkey ограничения**
   - Нет сборщика из коробки (нужен простой build.js)
   - Нет npm модулей в runtime
   - Все должно работать в одном файле

5. **Баланс скорости разработки и качества**
   - Можно написать за 2-3 дня
   - Легко поддерживать и расширять
   - Достаточно надежно для production

---

## 7. Альтернативные подходы (отвергнуты)

### ❌ Слишком просто (один файл ~500 строк)
- **Проблема:** Превратится в спагетти-код
- **Когда:** Через 3-4 новые фичи станет нечитаемым

### ❌ Слишком сложно (Clean Architecture, DI, Repository)
- **Проблема:** Overengineering для такого проекта
- **Когда:** 3000+ строк кода, 80% - абстракции

### ✅ Выбранный подход (прагматичный ООП)
- **Баланс:** Структура есть, но не избыточная
- **Результат:** 1100 строк читаемого кода
- **Поддержка:** Легко понять и изменить

---

## 8. План реализации

### Фаза 1: Core (1 день)
1. Config.js
2. ApiClient.js
3. Storage.js
4. Validators

### Фаза 2: Features (1 день)
1. ChapterManager.js
2. AutoReader.js
3. AutoLiker.js

### Фаза 3: UI (0.5 дня)
1. SettingsPanel.js
2. Notifications.js

### Фаза 4: Integration (0.5 дня)
1. main.js
2. build.js
3. Тестирование

**Итого:** 3 дня разработки

---

## 9. Технические детали

### 9.1 Сборка (build.js)

```javascript
const fs = require('fs');
const path = require('path');

const files = [
  'src/utils/validators.js',
  'src/utils/logger.js',
  'src/core/Config.js',
  'src/core/ApiClient.js',
  'src/features/ChapterManager.js',
  'src/features/AutoReader.js',
  'src/ui/SettingsPanel.js',
  'src/main.js'
];

const header = `
// ==UserScript==
// @name         Remanga Extension
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Auto-like and auto-read chapters on remanga.org
// @author       You
// @match        https://remanga.org/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @connect      api.remanga.org
// ==/UserScript==
`;

let output = header + '\n(function() {\n"use strict";\n\n';

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Убираем import/export
  const cleaned = content
    .replace(/^import .+$/gm, '')
    .replace(/^export .+$/gm, '');
  output += cleaned + '\n\n';
});

output += '})();';

fs.writeFileSync('dist/remanga-extension.user.js', output);
console.log('Build complete!');
```

### 9.2 Запуск сборки

```bash
node build.js
```

---

## 10. Заключение

Эта архитектура представляет собой **золотую середину** между простотой и качеством:

- ✅ Достаточно проста для быстрой разработки
- ✅ Достаточно структурирована для поддержки
- ✅ Легко расширяется новыми фичами
- ✅ Соблюдает принципы SOLID (в разумных пределах)
- ✅ Безопасна (валидация, обработка ошибок)
- ✅ Производительна (batch операции, rate limiting)

**Это оптимальный выбор для Tampermonkey расширения среднего размера.**

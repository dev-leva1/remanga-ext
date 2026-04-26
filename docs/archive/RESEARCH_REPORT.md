# Исследование сайта remanga.org

## 1. Структура страниц

### 1.1 URL-паттерны

#### Страница тайтла (список глав):
- **Паттерн**: `https://remanga.org/manga/{slug}/chapters`
- **Пример**: `https://remanga.org/manga/the-a-disasterlevel-hero-has-returned/chapters`
- **Альтернативный URL**: `https://remanga.org/manga/{slug}/main` (главная страница тайтла)

#### Страница чтения главы:
- **Паттерн**: `https://remanga.org/manga/{slug}/{chapter_id}`
- **Пример**: `https://remanga.org/manga/the-a-disasterlevel-hero-has-returned/578598`
- **С параметром страницы**: `https://remanga.org/manga/{slug}/{chapter_id}?page={page_number}`

### 1.2 Структура HTML на странице списка глав

#### Контейнер списка глав:
```html
<div class="relative flex flex-col gap-2">
  <!-- Элементы глав -->
</div>
```

#### Элемент главы:
```html
<a class="relative" 
   data-testid="chapter_{chapter_id}" 
   href="/manga/{slug}/{chapter_id}">
  <div class="hover-card bg-secondary/50 flex cursor-pointer items-center justify-between overflow-hidden !px-4 !py-2">
    <div class="flex items-center gap-4">
      <!-- Кнопка "прочитано" (иконка глаза) -->
      <button class="cs-button ... hover:bg-accent hover:text-accent-foreground !px-1"
              data-testid="update_view_{chapter_id}">
        <svg><!-- Иконка глаза --></svg>
      </button>
      
      <!-- Информация о главе -->
      <div class="flex items-center gap-4">
        <p class="cs-text text-lg leading-lg font-bold text-muted-foreground">3</p>
        <div class="flex flex-col gap-2">
          <span class="cs-text text-md leading-md font-normal text-foreground">Глава 168</span>
          <div class="flex gap-2">
            <p class="cs-text text-xs leading-xs font-normal text-muted-foreground">Litres MS</p>
            <p class="cs-text text-xs leading-xs font-normal text-muted-foreground">28.03.2026</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Правая часть с иконкой монеты и кнопкой лайка -->
    <div class="flex items-center gap-2">
      <button class="">
        <svg><!-- Иконка монеты --></svg>
      </button>
      
      <!-- Кнопка лайка -->
      <button class="cs-button ... hover:bg-accent hover:text-accent-foreground w-[80px]"
              data-testid="like_btn_{chapter_id}">
        <span class="flex items-center mr-2">
          <svg><!-- Иконка сердца --></svg>
        </span>
        136 <!-- Количество лайков -->
      </button>
    </div>
  </div>
</a>
```

**Ключевые селекторы:**
- Элемент главы: `a[data-testid^="chapter_"]`
- Кнопка "прочитано": `button[data-testid^="update_view_"]`
- Кнопка лайка: `button[data-testid^="like_btn_"]`

### 1.3 Структура HTML на странице чтения главы

#### Header (навигация):
```html
<header class="fixed top-0 right-0 left-0 z-[1000] w-screen transition-transform">
  <div class="no-wrap flex min-h-[var(--bottom-bar-height)] w-full items-center bg-background border-border/50 border-b">
    <!-- Логотип -->
    <a href="/">
      <button class="cs-button ...">Логотип сайта</button>
    </a>
    
    <!-- Название тайтла -->
    <a href="/manga/{slug}/main">
      <button class="cs-button ...">Возвращение героя катастрофы</button>
    </a>
    
    <!-- Кнопка предыдущей главы -->
    <a href="/manga/{slug}/{prev_chapter_id}">
      <button class="cs-button ..."></button>
    </a>
    
    <!-- Селектор главы -->
    <button class="cs-button ...">3 - 168</button>
    
    <!-- Кнопка следующей главы -->
    <a href="/manga/{slug}/{next_chapter_id}">
      <button class="cs-button ..."></button>
    </a>
    
    <!-- Кнопка "В закладки" -->
    <button class="cs-button ..." aria-haspopup="menu">В закладки</button>
    
    <!-- Кнопка закладок -->
    <a href="/user/bookmarks">
      <button class="cs-button ..."></button>
    </a>
    
    <!-- Уведомления -->
    <a href="/user/notifications/0">
      <button class="cs-button ...">1</button>
    </a>
    
    <!-- Кнопка пользователя -->
    <button class="cs-button ... bg-primary text-primary-foreground hover:bg-primary/90"
            aria-haspopup="menu">
      teru1 Рамка teru1
    </button>
  </div>
</header>
```

#### Main (изображения страниц):
```html
<main>
  <img src="https://img3.reimg2.org/images/{path}/{chapter_id}/{hash}.jpeg"
       alt="Возвращение героя катастрофы 1 глава том 1 страница 0.1 онлайн на русском языке">
  <!-- Остальные изображения страниц -->
</main>
```

**Навигация между главами:**
- Предыдущая глава: `a[href*="/manga/"][href*="/{prev_chapter_id}"]` в header
- Следующая глава: `a[href*="/manga/"][href*="/{next_chapter_id}"]` в header

## 2. Dropdown меню пользователя

### 2.1 Расположение в DOM
```html
<button class="cs-button ... bg-primary text-primary-foreground hover:bg-primary/90 max-w-24 overflow-hidden text-ellipsis"
        aria-haspopup="menu">
  teru1 Рамка teru1
</button>

<!-- При клике открывается меню -->
<menu class="..." orientation="vertical">
  <a href="/user/{user_id}/about">
    <link>teru1 Рамка teru1 ID: 2676440</link>
  </a>
  
  <menuitem>
    <button>1 монет Пополнить</button>
  </menuitem>
  
  <menuitem>
    <button>0 269</button>
  </menuitem>
  
  <button expandable>Мой состав</button>
  
  <a href="/user/subscription">
    <link>Мой Premium Больше возможностей с подпиской</link>
  </a>
  
  <menuitem>Re: Pass</menuitem>
  <menuitem>История чтения</menuitem>
  <menuitem>Мои заявки</menuitem>
  <menuitem aria-haspopup="menu">Добавить контент</menuitem>
  <menuitem>Магазин</menuitem>
  <menuitem>Транзакции</menuitem>
  
  <button expandable>Другое</button>
  
  <menuitem>Выйти</menuitem>
</menu>
```

**Селекторы:**
- Кнопка меню: `button[aria-haspopup="menu"]` (с текстом имени пользователя)
- Dropdown меню: `menu[orientation="vertical"]`

**Для интеграции настроек:**
Можно добавить новый `<menuitem>` в dropdown меню после элемента "История чтения" или в раздел "Другое".

## 3. API и взаимодействие

### 3.1 Базовый URL API
```
https://api.remanga.org
```

### 3.2 Аутентификация

**Метод:** Bearer Token в заголовке `Authorization`

**Получение токена:**
- Токен хранится в cookie: `token={token_value}`
- Пример токена: `RoLzcbrFcpmLFRRgSLGJ5wHyhfJ5sj`

**Заголовки для авторизованных запросов:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

### 3.3 API Endpoints

#### 3.3.1 Отметка главы как прочитанной

**Endpoint:** `POST /api/activity/views/`

**Request:**
```http
POST https://api.remanga.org/api/activity/views/
Authorization: Bearer {token}
Content-Type: application/json

{
  "chapter": 578598
}
```

**Response:** `204 No Content`

**Примечание:** Этот endpoint отмечает всю главу как прочитанную.

#### 3.3.2 Отметка просмотра страницы

**Endpoint:** `POST /api/v2/activity/view-page/`

**Request:**
```http
POST https://api.remanga.org/api/v2/activity/view-page/
Authorization: Bearer {token}
Content-Type: application/json

{
  "chapter_id": 578598,
  "page": 1
}
```

**Response:** `204 No Content`

**Примечание:** Этот endpoint вызывается при просмотре каждой страницы главы.

#### 3.3.3 Лайк на главу

**Endpoint:** Требуется дополнительное исследование

**Примечание:** При клике на кнопку лайка (`data-testid="like_btn_{chapter_id}"`) должен отправляться запрос на API. Необходимо перехватить этот запрос для получения точного endpoint и формата данных.

**Предполагаемый формат:**
```http
POST https://api.remanga.org/api/activity/likes/
Authorization: Bearer {token}
Content-Type: application/json

{
  "chapter": 1926137
}
```

#### 3.3.4 Получение информации о текущем пользователе

**Endpoint:** `GET /api/v2/users/current/`

**Request:**
```http
GET https://api.remanga.org/api/v2/users/current/
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "id": 2676440,
  "username": "teru1",
  "email": "...",
  "is_premium": true
}
```

#### 3.3.5 Получение закладок пользователя

**Endpoint:** `GET /api/v2/users/{user_id}/user_bookmarks/`

**Request:**
```http
GET https://api.remanga.org/api/v2/users/2676440/user_bookmarks/
Authorization: Bearer {token}
```

**Response:** `200 OK`

### 3.4 Определение авторизации пользователя

**Метод 1: Проверка cookie**
```javascript
const isLoggedIn = document.cookie.includes('token=');
const token = document.cookie.match(/token=([^;]+)/)?.[1];
```

**Метод 2: Проверка наличия данных пользователя**
```javascript
const userCookie = document.cookie.match(/user=([^;]+)/)?.[1];
const isLoggedIn = !!userCookie;
```

**Метод 3: API запрос**
```javascript
const response = await fetch('https://api.remanga.org/api/v2/users/current/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const isLoggedIn = response.ok;
```

## 4. Дополнительная информация

### 4.1 Классы CSS (Tailwind-based)
Сайт использует кастомную систему дизайна на основе Tailwind CSS с префиксом `cs-`:
- `cs-button` - базовый класс для кнопок
- `cs-text` - базовый класс для текста
- `hover-card` - карточка с эффектом hover

### 4.2 Framework
Сайт построен на **Next.js** (видно по путям `/_next/static/...`)

### 4.3 Важные заметки
1. Все API запросы требуют CORS заголовков
2. Токен авторизации обязателен для всех операций с активностью пользователя
3. Chapter ID - это числовой идентификатор (например, `578598`, `1926137`)
4. Slug тайтла - это текстовый идентификатор в URL (например, `the-a-disasterlevel-hero-has-returned`)

### 4.4 Структура данных главы
```typescript
interface Chapter {
  id: number;              // 1926137
  slug: string;            // "the-a-disasterlevel-hero-has-returned"
  volume: number;          // 3
  number: number;          // 168
  publisher: string;       // "Litres MS"
  publishDate: string;     // "28.03.2026"
  likes: number;           // 136
  isRead: boolean;         // определяется по состоянию кнопки
}
```

## 5. Рекомендации для расширения

### 5.1 Интеграция настроек в dropdown меню
Добавить новый пункт меню после "История чтения":
```html
<menuitem>
  <button onclick="openExtensionSettings()">
    Настройки расширения
  </button>
</menuitem>
```

### 5.2 Отслеживание прочитанных глав
- Перехватывать вызовы `POST /api/activity/views/`
- Сохранять информацию о прочитанных главах локально
- Визуально отмечать прочитанные главы на странице списка

### 5.3 Автоматический переход к следующей главе
- Находить ссылку на следующую главу в header: `a[href*="/{next_chapter_id}"]`
- При достижении конца страницы автоматически переходить по этой ссылке

### 5.4 Массовая отметка глав как прочитанных
- Собрать все chapter_id со страницы
- Отправить серию запросов `POST /api/activity/views/` для каждой главы
- Добавить UI для выбора диапазона глав

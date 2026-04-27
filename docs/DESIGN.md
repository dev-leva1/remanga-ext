# Design System Remanga.org

## 1. Visual Theme & Atmosphere

Remanga.org использует современный dark-mode дизайн с акцентом на контент — обложки манги. Интерфейс построен на принципах минимализма с четкой иерархией и продуманной типографикой. Основная философия: контент (обложки манги) — это герои страницы, UI отступает на второй план, создавая комфортную среду для просмотра.

Цветовая схема строго монохромная с темным фоном и светлым текстом. Единственные цветовые акценты — это сами обложки манги, которые выделяются на темном фоне. Интерфейс использует различные оттенки серого для создания глубины и иерархии без использования ярких цветов.

Типографика основана на шрифте **Exo 2** — современном геометрическом sans-serif с хорошей читаемостью. Шрифт используется с умеренными весами (300-700) и оптимальными межстрочными интервалами для комфортного чтения.

**Ключевые характеристики:**
- Dark-mode дизайн с глубоким темным фоном (`rgb(19, 20, 22)`)
- Контент-ориентированный подход: обложки манги как визуальные якоря
- Монохромная палитра с акцентом на оттенки серого
- Шрифт Exo 2 для всего интерфейса
- Rounded corners: 14px для изображений, 9999px (pill) для кнопок
- Aspect ratio 2:3 для обложек манги (стандарт книжного формата)
- Минимальное использование теней и границ
- Фиксированный header высотой 61px
- Grid-based layout для карточек манги

## 2. Color Palette & Roles

### Background
- **Primary Background** (`rgb(19, 20, 22)` / `#131416`): Основной фон страницы, глубокий темный оттенок
- **Secondary Background** (`rgb(24, 25, 27)` / `#18191B`): Фон кнопок, карточек, вторичных элементов
- **Sidebar Background** (`#18181b`): Фон боковой панели (из CSS переменных)

### Text
- **Primary Text** (`rgb(250, 250, 250)` / `#fafafa`): Основной текст, заголовки
- **Secondary Text** (`rgba(255, 255, 255, 0.77)`): Вторичный текст, описания, метаданные
- **Sidebar Foreground** (`#f4f4f5`): Текст в боковой панели

### Interactive
- **Button Background** (`rgb(24, 25, 27)`): Фон кнопок в состоянии по умолчанию
- **Button Hover** (`rgb(24, 25, 27) / 0.9`): Состояние hover с opacity 90%
- **Sidebar Primary** (`#1d4ed8`): Акцентный синий для активных элементов sidebar
- **Sidebar Ring** (`#3b82f6`): Focus ring для элементов sidebar
- **Sidebar Accent** (`#27272a`): Акцентный фон для hover состояний в sidebar
- **Sidebar Border** (`#27272a`): Границы элементов в sidebar

### Surface & Elevation
- **Card Background**: Прозрачный (`rgba(0, 0, 0, 0)`) — карточки не имеют собственного фона
- **Image Container**: Rounded 14px с overflow hidden, aspect-ratio 2:3
- **Button Surface**: `rgb(24, 25, 27)` с легким hover эффектом

### Shadows
Тени используются минимально. Основная глубина создается через контраст цветов фона, а не через shadows.

## 3. Typography Rules

### Font Family
- **Primary**: `"Exo 2", "Exo 2 Fallback"`
- Exo 2 — современный геометрический sans-serif с отличной читаемостью в dark mode

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Body | Exo 2 | 14px (0.875rem) | 400 | 20px (1.43) | normal | Основной текст, описания |
| Body Secondary | Exo 2 | 14px (0.875rem) | 400 | 20px (1.43) | normal | Вторичный текст с opacity 0.77 |
| Button | Exo 2 | 14px (0.875rem) | 500 | normal | normal | Текст кнопок, medium weight |
| Small | Exo 2 | 12px (0.75rem) | 400 | 16px (1.33) | normal | Мелкий текст, метки |
| Large | Exo 2 | 16px (1rem) | 400 | 24px (1.5) | normal | Увеличенный текст |

### Font Size Scale (из CSS переменных)
- **xs**: 0.75rem (12px) — `--r-font-size-xs`
- **sm**: 0.875rem (14px) — `--r-font-size-sm`
- **md**: 1rem (16px) — `--r-font-size-md`
- **lg**: 1.25rem (20px) — `--r-font-size-lg`
- **xl**: 1.5rem (24px) — `--r-font-size-xl`
- **2xl**: 2rem (32px) — `--r-font-size-2xl`
- **3xl**: 3rem (48px) — `--r-font-size-3xl`

### Font Weight Scale
- **Light**: 300 — `--font-weight-light`
- **Normal**: 400 — `--font-weight-normal`
- **Medium**: 500 — `--font-weight-medium`
- **Semibold**: 600 — `--font-weight-semibold`
- **Bold**: 700 — `--font-weight-bold`
- **Extrabold**: 800 — `--font-weight-extrabold`

### Principles
- **Умеренная контрастность**: Вес шрифта варьируется от 300 до 700, основной текст использует 400
- **Оптимальная читаемость**: Line-height 1.43 для body текста обеспечивает комфортное чтение
- **Нормальный tracking**: Letter-spacing остается normal для всех размеров
- **Геометрическая чистота**: Exo 2 обеспечивает современный, технологичный вид

## 4. Component Stylings

### Buttons

**Primary Button (cs-button)**
- Background: `rgb(24, 25, 27)`
- Text: `rgb(250, 250, 250)`
- Padding: `8px 16px` (стандартный), `8px 24px` (широкий)
- Radius: `9999px` (full pill)
- Border: none
- Font: Exo 2, 14px, weight 500
- Height: 36px (h-9)
- Min-width: 36px (min-w-9)
- Hover: `background opacity 0.9`
- Active: `scale(0.97)` transform
- Focus: outline hidden, ring-0
- Transition: all properties
- Use: Основные действия, навигация

**Icon Button (aspect-square)**
- Background: `rgb(24, 25, 27)`
- Padding: `0px`
- Radius: `9999px`
- Size: `36x36px` (aspect-square)
- Use: Иконочные кнопки без текста

**Secondary Button**
- Background: `rgb(24, 25, 27)`
- Text: `rgb(250, 250, 250)`
- Padding: `8px 16px`
- Radius: `9999px`
- Hover: `background opacity 0.9`
- Use: Вторичные действия

**Transparent Button**
- Background: `transparent`
- Text: `rgb(250, 250, 250)`
- Padding: `8px 16px`
- Radius: `0px` (square)
- Hover: `bg-accent`, `text-accent-foreground`
- Use: Навигационные элементы, меню

### Cards & Containers

**Manga Card (cs-title-card)**
- Background: `transparent`
- Border: none
- Radius: none (карточка сама не имеет radius)
- Padding: `0px`
- Gap: `12px` (между элементами внутри)
- Layout: `flex flex-col`
- Use: Карточки манги в grid

**Image Container**
- Background: varies (обложка манги)
- Radius: `14px`
- Overflow: `hidden`
- Aspect Ratio: `2 / 3` (книжный формат)
- Object Fit: `cover`
- Use: Контейнер для обложек манги

### Navigation

**Header**
- Background: `transparent` (или с backdrop-filter)
- Height: `61px`
- Position: `fixed`
- Text: `rgb(250, 250, 250)`
- Use: Основная навигация

### Image Treatment
- Обложки манги в контейнерах с aspect-ratio 2:3
- Border-radius 14px для всех изображений
- Object-fit: cover для сохранения пропорций
- Overflow: hidden для соблюдения rounded corners

### Distinctive Components

**Manga Grid**
- Grid layout с адаптивным количеством колонок
- Gap между карточками: 12px-16px
- Карточки с прозрачным фоном
- Изображения с rounded corners 14px

**Search/Filter Bar**
- Background: `rgb(24, 25, 27)`
- Radius: `9999px` (pill shape)
- Padding: `8px 16px`
- Max-width: `280px`
- Gap: `8px` между элементами

## 5. Layout Principles

### Spacing System
- Base unit: 4px (Tailwind default)
- Gap в карточках: `12px` (gap-3)
- Padding кнопок: `8px 16px`, `8px 24px`
- Header height: `61px`

### Grid & Container
- Manga cards: адаптивный grid (2-6 колонок в зависимости от viewport)
- Gap между карточками: `12px` (md: `16px`)
- Max content width: зависит от viewport
- Full-width sections для hero и основного контента

### Whitespace Philosophy
- **Минимализм**: Пространство используется для разделения контента, но не избыточно
- **Контент-фокус**: Обложки манги занимают максимум пространства
- **Компактность**: Gap 12px между карточками создает плотную, но читаемую сетку

### Border Radius Scale
- **Standard (14px)**: Изображения, контейнеры обложек
- **Medium (12px)**: Альтернативные контейнеры
- **Large (22px)**: Крупные панели
- **Full Pill (9999px)**: Кнопки, search bar, навигационные элементы
- **Square (0px)**: Карточки, некоторые кнопки

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, solid background | Карточки манги, основной контент |
| Surface (Level 1) | `rgb(24, 25, 27)` background | Кнопки, вторичные элементы |
| Navigation | Fixed position, возможно backdrop-filter | Header |
| Focus | Ring-0, outline hidden | Все интерактивные элементы |

**Shadow Philosophy**: Remanga использует тени минимально или не использует вообще. Глубина создается через контраст цветов фона (`rgb(19, 20, 22)` vs `rgb(24, 25, 27)`), а не через shadows. Это создает чистый, современный вид.

### Decorative Depth
- Контраст фона: основной фон темнее, элементы UI светлее
- Hover states: opacity 0.9 для кнопок
- Active states: scale(0.97) transform для тактильной обратной связи
- Rounded corners создают визуальное разделение без теней

## 7. Do's and Don'ts

### Do
- Используй Exo 2 для всего текста — единый шрифт для всего интерфейса
- Применяй dark mode палитру: `rgb(19, 20, 22)` для фона, `rgb(250, 250, 250)` для текста
- Используй pill shape (9999px radius) для всех кнопок — это signature элемент
- Применяй aspect-ratio 2:3 для всех обложек манги — стандарт книжного формата
- Используй 14px border-radius для всех изображений
- Создавай глубину через контраст цветов, а не через тени
- Применяй opacity 0.77 для вторичного текста
- Используй transform scale(0.97) для active состояния кнопок
- Применяй gap 12px между элементами в карточках

### Don't
- Не используй яркие accent colors — интерфейс монохромный
- Не добавляй тяжелые тени — глубина создается через цвет
- Не используй borders на карточках — они прозрачные
- Не применяй letter-spacing — оставляй normal
- Не используй font-weight больше 700
- Не добавляй градиенты или текстуры на фон — только solid colors
- Не используй aspect-ratio отличный от 2:3 для обложек манги
- Не центрируй body текст — он всегда left-aligned
- Не используй rounded corners больше 22px для прямоугольных элементов (9999px только для pills)

## 8. Responsive Behavior

### Breakpoints
Remanga использует стандартные Tailwind breakpoints:

| Name | Width | Key Changes |
|------|-------|-------------|
| sm | 640px | 2-column grid начинается |
| md | 768px | Gap увеличивается до 16px |
| lg | 1024px | 4-column grid, полная навигация |
| xl | 1280px | 5-6 column grid |
| 2xl | 1536px | Максимальная ширина grid |

### Touch Targets
- Кнопки: минимум 36x36px (h-9, min-w-9)
- Icon buttons: 36x36px square
- Navigation links: 61px height в header
- Pill buttons: 8px 16px padding создает комфортную область клика

### Collapsing Strategy
- Manga grid: 6-column → 4-column → 2-column → 1-column
- Navigation: full horizontal nav → hamburger menu
- Search bar: max-width 280px на всех размерах
- Gap: 12px → 16px на md+ breakpoints
- Image aspect-ratio: всегда 2:3, никогда не меняется
- Border-radius: всегда 14px для изображений на всех размерах

### Image Behavior
- Обложки манги сохраняют aspect-ratio 2:3 на всех breakpoints
- Object-fit: cover предотвращает искажение
- Border-radius 14px сохраняется на всех размерах
- Lazy loading для изображений вне viewport

## 9. Agent Prompt Guide

### Quick Color Reference
- Page background: `rgb(19, 20, 22)` / `#131416`
- Button background: `rgb(24, 25, 27)` / `#18191B`
- Primary text: `rgb(250, 250, 250)` / `#fafafa`
- Secondary text: `rgba(255, 255, 255, 0.77)`
- Sidebar primary: `#1d4ed8`
- Sidebar accent: `#27272a`
- Image border-radius: `14px`
- Button border-radius: `9999px`

### Example Component Prompts
- "Создай карточку манги: прозрачный фон, flex flex-col, gap 12px. Контейнер изображения с border-radius 14px, aspect-ratio 2/3, overflow hidden. Заголовок Exo 2, 14px, weight 400, color #fafafa."
- "Создай pill button: background rgb(24, 25, 27), text rgb(250, 250, 250), padding 8px 16px, border-radius 9999px, height 36px. Hover: opacity 0.9. Active: scale(0.97). Font: Exo 2, 14px, weight 500."
- "Создай grid карточек манги: адаптивный grid (sm:2-col, lg:4-col, xl:6-col), gap 12px (md:16px). Каждая карточка: прозрачный фон, изображение 2:3 с radius 14px, текст ниже."
- "Создай header: fixed position, height 61px, background transparent или с backdrop-filter. Навигация с pill buttons, search bar max-width 280px."
- "Создай search bar: background rgb(24, 25, 27), border-radius 9999px, padding 8px 16px, max-width 280px, gap 8px между иконкой и input. Font: Exo 2, 14px."

### Iteration Guide
1. Все кнопки используют pill shape (9999px radius) — это signature элемент Remanga
2. Обложки манги всегда aspect-ratio 2:3 с border-radius 14px
3. Фон страницы: `rgb(19, 20, 22)`, фон элементов: `rgb(24, 25, 27)`
4. Шрифт Exo 2 для всего интерфейса, weight 400-500 для основного текста
5. Глубина через контраст цветов, не через тени
6. Карточки манги имеют прозрачный фон, gap 12px между элементами
7. Hover состояние кнопок: opacity 0.9, active: scale(0.97)
8. Вторичный текст: opacity 0.77 на белом цвете

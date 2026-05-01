---
name: Remanga Enhanced Landing
description: Лендинг userscript для Remanga с упором на доверие, установку и ощущение усиленного контроля
colors:
  primary-accent: "#1d4ed8"
  primary-accent-hover: "#1e40af"
  neutral-bg: "#131416"
  neutral-surface: "#18191b"
  neutral-surface-strong: "#1e1f22"
  neutral-surface-overlay: "#18191bfa"
  neutral-text: "#fafafa"
  neutral-text-secondary: "#ffffffc4"
  neutral-text-muted: "#9ca3af"
  border-soft: "#ffffff14"
  border-strong: "#3b82f659"
  state-danger: "#ef4444"
  state-check: "#2297e8"
  accent-tint: "#1d4ed829"
typography:
  display:
    fontFamily: '"Exo 2", system-ui, -apple-system, sans-serif'
    fontSize: "clamp(2.25rem, 5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "normal"
  headline:
    fontFamily: '"Exo 2", system-ui, -apple-system, sans-serif'
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  title:
    fontFamily: '"Exo 2", system-ui, -apple-system, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: '"Exo 2", system-ui, -apple-system, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "normal"
  label:
    fontFamily: '"Exo 2", system-ui, -apple-system, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "2px"
  md: "12px"
  lg: "14px"
  xl: "18px"
  pill: "9999px"
  round: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  xxxl: "48px"
  hero: "88px"
components:
  button-primary:
    backgroundColor: "{colors.primary-accent}"
    textColor: "{colors.neutral-text}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.primary-accent-hover}"
    textColor: "{colors.neutral-text}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "36px"
  nav-link:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    height: "36px"
  info-card:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-text-secondary}"
    rounded: "{rounded.lg}"
    padding: "32px"
  faq-item:
    backgroundColor: "{colors.neutral-surface-overlay}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Remanga Enhanced Landing

## 1. Overview

**Creative North Star: "Reader Augment"**

Этот лендинг должен ощущаться не как отдельный бренд-мир, а как умное расширение уже знакомого опыта Remanga. Пользователь приходит не за вдохновением и не за storytelling, он приходит быстро понять, можно ли доверять userscript, что именно он усилит внутри сайта и насколько легко его поставить. Визуальный язык поэтому держится близко к темной интерфейсной среде, но делает ее чуть собраннее, чище и убедительнее.

Настроение системы, Night UI с ощущением точности. Темная база, сдержанный кобальтовый акцент, плотные pill-контролы, минимум лишнего блеска. Лендинг не должен звучать как SaaS-презентация и не должен проваливаться в фанатскую мягкость. Он обязан показывать контроль, безопасность и ускорение, не повышая голос.

Под запретом все, что PRODUCT.md уже отвергает по имени: AI и SaaS клише, gradient text, шаблонные hero metrics, одинаковые card grids, декоративный glassmorphism и пустой hype. Если экран можно спутать с типовым лендингом AI-инструмента, система провалилась.

**Key Characteristics:**
- Темная интерфейсная среда, близкая к привычному контексту Remanga
- Акцент через один уверенный синий, а не через пеструю палитру
- Плотные pill-кнопки и мягко скругленные панели
- Доверие и установка важнее декоративного вау-эффекта
- Глубина через tonal layering, а не через тяжелые тени
- Компоненты выглядят как естественное продолжение продукта, а не как отдельная промо-эстетика

## 2. Colors

Палитра строится вокруг почти черной интерфейсной базы и холодного синего акцента. Цвет здесь не развлекает, он обозначает действие, доверие и фокус.

### Primary
- **Anchor Blue** (`#1d4ed8`): Главный action-цвет. Используется на primary CTA, активных ссылках, выделенных состояниях и сигналах управляемого действия.
- **Pressed Anchor Blue** (`#1e40af`): Более плотное состояние primary CTA при hover, чтобы интерфейс ощущался живым, но не шумным.

### Secondary
- **Signal Check Blue** (`#2297e8`): Узкий служебный акцент для checked-state внутри preview UI. Не должен конкурировать с primary CTA на уровне страницы.
- **Danger Reset Red** (`#ef4444`): Исключительно для destructive или reset-действий в визуализации настроек.

### Neutral
- **Night Base** (`#131416`): Основной фон страницы. Самый темный слой, на котором держится вся система.
- **Control Surface** (`#18191b`): База для кнопок, навигации, dropdown-панелей и вторичных поверхностей.
- **Raised Surface** (`#1e1f22`): Чуть более плотная поверхность для hover и secondary-state.
- **Overlay Surface** (`#18191bfa`): Полупрозрачная панель для FAQ и мобильного меню, когда нужен более собранный слой над фоном.
- **Primary Ink** (`#fafafa`): Основной текст, заголовки, активные control labels.
- **Soft Ink** (`#ffffffc4`): Вторичный текст, объяснения, supporting copy.
- **Muted Ink** (`#9ca3af`): Версии, подписи, вспомогательные короткие строки.
- **Soft Border** (`#ffffff14`): Почти невидимая граница для отделения слоев без визуального мусора.
- **Focus Border** (`#3b82f659`): Усиленный border/focus tone для более заметных состояний.
- **Accent Tint** (`#1d4ed829`): Мягкая синяя подложка для accent-nav и icon circles.

**The One Accent Rule.** На уровне страницы работает один главный акцент, Anchor Blue. Остальные цветные сигналы допускаются только как локальные state-маркеры внутри интерфейсных примеров.

**The Night UI Rule.** Нейтрали должны оставаться темными, слегка разнесенными по плотности и почти никогда не спорить друг с другом по тону. Если нейтральный слой выглядит как отдельная карточка-витрина, слой слишком громкий.

## 3. Typography

**Display Font:** Exo 2 (с fallback `system-ui, -apple-system, sans-serif`)
**Body Font:** Exo 2 (с fallback `system-ui, -apple-system, sans-serif`)
**Label/Mono Font:** Отдельный label или mono-шрифт не нужен, система держится на одном семействе.

**Character:** Exo 2 дает нужное сочетание технологичности и читаемости. Шрифт достаточно геометричен для tech power, но не уходит в холодную терминальную эстетику.

### Hierarchy
- **Display** (700, `clamp(2.25rem, 5vw, 3.5rem)`, 1.02): Только hero headline и ключевые крупные сообщения. Должен сразу собирать внимание и удерживать плотный ритм.
- **Headline** (700, `clamp(1.75rem, 4vw, 2.5rem)`, 1.1): Заголовки секций, крупные блоки, важные точки в narrative.
- **Title** (600, `1.25rem`, 1.25): Заголовки карточек, FAQ-вопросы, trust blocks, steps.
- **Body** (400, `0.875rem`, 1.43): Основной текст системы. Для длинных абзацев держать строку в пределах 65–75ch.
- **Label** (600, `0.75rem`, 1.2, normal): Короткие labels, preview controls, version/meta copy.

**The Single Voice Rule.** Один шрифт на всей поверхности. Иерархия строится весом, размером и плотностью, не декоративными контрастами семейств.

**The Tight Hero Rule.** Hero-текст может быть плотным и почти плакатным по межстрочию, но supporting copy обязана дышать. Если subtitle выглядит так же плотной, как headline, иерархия сломана.

## 4. Elevation

Система опирается на tonal layering. Большинство поверхностей почти плоские, глубина создается разницей между Night Base, Control Surface и полупрозрачными overlays. Тень разрешена только там, где лендинг показывает signature preview или хочет подчеркнуть отдельную демонстрационную панель. По умолчанию поверхность не должна выглядеть подвешенной в воздухе.

### Shadow Vocabulary
- **Preview Lift** (`0 24px 70px rgba(0, 0, 0, 0.38)`): Только для крупного settings preview в hero. Эта тень не шаблон для всех cards, а способ отделить демонстрационный объект от фона.

**The Flat-by-Default Rule.** Обычные секции, FAQ, trust blocks и cards живут без тяжелой тени. Если каждый блок получил собственную атмосферную тень, интерфейс потерял дисциплину.

## 5. Components

Компоненты должны ощущаться как native enhancement, продолжение интерфейса Remanga, которое стало чуть собраннее и точнее.

### Buttons
- **Shape:** Полные pill-контролы (`9999px`) почти везде, кроме узкоспециальных внутренних элементов.
- **Primary:** Anchor Blue фон (`#1d4ed8`), Primary Ink текст (`#fafafa`), padding `12px 24px`, minimum height `36px`. Это главный путь к установке и ключевому действию.
- **Hover / Focus:** Hover затемняет primary до `#1e40af` и поднимает кнопку на `translateY(-2px)`. Focus-visible использует четкий `2px` outline с синей рамкой, без блюра.
- **Secondary / Ghost / Tertiary:** Secondary кнопки сидят на Control Surface (`#18191b`) с Soft Border и тем же pill-ритмом. Их задача, поддерживать primary, не спорить с ней.

### Cards / Containers
- **Corner Style:** Мягкие rounded surfaces, чаще `14px`, иногда `18px` на крупном preview-контейнере.
- **Background:** Большинство cards используют Night Base или полупрозрачные dark-surfaces (`#131416b8` / `#18191bb8` диапазон по смыслу), а не чистый solid-black.
- **Shadow Strategy:** По умолчанию без тени. Исключение, settings preview hero panel.
- **Border:** Почти невидимый `1px` Soft Border (`#ffffff14`) нужен чаще, чем тень.
- **Internal Padding:** Базовый rhythm держится на `24px` и `32px`.

### Inputs / Fields
- **Style:** В чистом лендинге полноценные inputs почти не доминируют, но все control-like surfaces должны использовать Control Surface, soft border и pill/rounded geometry в духе остальной системы.
- **Focus:** Только четкий outline/focus ring, без glow и без размытых свечений.
- **Error / Disabled:** Error-state может брать Danger Reset Red (`#ef4444`), но только локально и без общей смены палитры.

### Navigation
- **Style, typography, default/hover/active states, mobile treatment.** Навигация компактная, pill-based, сидит на sticky dark header с backdrop blur. Default link цвет, Soft Ink (`#ffffffc4`), hover включает Control Surface и Primary Ink. Accent link получает blue tint (`#1d4ed829`) вместо крикливого solid-fill. На mobile система раскрывается через компактный rounded menu-panel, а не через full-screen overlay.

### Signature Component
Settings Preview в hero, главный signature block. Большая панель (`18px`) с hybrid treatment: soft border, gradient-like dark layering и единственная крупная shadow. Она показывает не абстрактную выгоду, а реальный продуктовый UI, поэтому должна выглядеть достоверно и структурно, а не как маркетинговый mockup ради красоты.

## 6. Do's and Don'ts

### Do:
- **Do** использовать Night Base (`#131416`) как главный фон и строить глубину через ближайшие темные слои, а не через резкие цветовые скачки.
- **Do** держать Exo 2 как единый голос системы и собирать иерархию за счет веса `400/600/700` и размера.
- **Do** применять pill-геометрию (`9999px`) для CTA, nav links и control-like элементов.
- **Do** давать primary-action только Anchor Blue (`#1d4ed8`) и сохранять его редкость, чтобы CTA оставался читаемым.
- **Do** делать focus-visible явно заметным: `2px` outline, без reliance только на цвет фона.
- **Do** использовать real-product preview как доверительный аргумент, а не как декоративную картинку.
- **Do** уважать reduced motion: переходы короткие, state-driven, без choreographed motion.
- **Do** оставлять supporting copy на Soft Ink (`#ffffffc4`) и не поднимать ее до headline-контраста без причины.

### Don't:
- **Don't** использовать клише AI и SaaS лендингов, как уже зафиксировано в PRODUCT.md.
- **Don't** использовать gradient text, ни в hero, ни в CTA, ни в заголовках секций.
- **Don't** строить hero на шаблонных hero metrics, особенно на трех одинаковых карточках с big-number эстетикой.
- **Don't** собирать одинаковые card grids без смены ритма, если блоки можно подать более структурно.
- **Don't** использовать декоративный glassmorphism как основной стиль поверхностей.
- **Don't** подменять trust пустым hype-copy. Если строка не объясняет пользу, доверие или действие, ей не место на экране.
- **Don't** делать интерфейс слишком дружелюбным, мягким или игрушечным. Это не фанатский промо-сайт и не community-first посадочная страница.
- **Don't** уходить в стерильный корпоративный стиль без характера. Система должна чувствоваться точной и сильной, а не безликой.
- **Don't** раздавать тяжелые тени каждой панели. Если every card floats, tonal layering исчезает.

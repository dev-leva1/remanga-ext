# CLAUDE.md

Guidance for Claude Code in this repo.

## Проект

Tampermonkey extension for remanga.org automation: chapter auto-like, bulk mark-as-read.

## Сборка и разработка

```bash
# РЎР±РѕСЂРєР° СЂР°СЃС€РёСЂРµРЅРёСЏ
npm run build

# Р Р°Р·СЂР°Р±РѕС‚РєР° (СЃР±РѕСЂРєР° + РёРЅСЃС‚СЂСѓРєС†РёСЏ)
npm run dev
```

Build output: `dist/remanga-extension.user.js` - ready Tampermonkey userscript.

## Архитектура

Pragmatic OOP architecture. Clear responsibility split.

### Структура компонентов

```
src/
в”њв”Ђв”Ђ core/           # РЇРґСЂРѕ СЃРёСЃС‚РµРјС‹
в”‚   в”њв”Ђв”Ђ Config.js       # Singleton РґР»СЏ СѓРїСЂР°РІР»РµРЅРёСЏ РЅР°СЃС‚СЂРѕР№РєР°РјРё (GM.getValue/setValue)
в”‚   в””в”Ђв”Ђ ApiClient.js    # HTTP РєР»РёРµРЅС‚ СЃ rate limiting (300ms РјРµР¶РґСѓ Р·Р°РїСЂРѕСЃР°РјРё)
в”њв”Ђв”Ђ features/       # Р‘РёР·РЅРµСЃ-Р»РѕРіРёРєР°
в”‚   в”њв”Ђв”Ђ ChapterManager.js  # РћРїРµСЂР°С†РёРё СЃ РіР»Р°РІР°РјРё (РѕС‚РјРµС‚РєР°, Р»Р°Р№РєРё, batch РѕР±СЂР°Р±РѕС‚РєР°)
в”‚   в””в”Ђв”Ђ AutoLiker.js       # РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ Р»Р°Р№Рє РїСЂРё РѕС‚РєСЂС‹С‚РёРё РіР»Р°РІС‹
в”њв”Ђв”Ђ ui/             # UI РєРѕРјРїРѕРЅРµРЅС‚С‹
в”‚   в”њв”Ђв”Ђ SettingsPanel.js   # РџР°РЅРµР»СЊ РЅР°СЃС‚СЂРѕРµРє (РёРЅС‚РµРіСЂР°С†РёСЏ РІ dropdown РјРµРЅСЋ)
в”‚   в””в”Ђв”Ђ Notifications.js   # Toast СѓРІРµРґРѕРјР»РµРЅРёСЏ
в””в”Ђв”Ђ utils/          # РЈС‚РёР»РёС‚С‹
    в”њв”Ђв”Ђ validators.js      # Р’Р°Р»РёРґР°С†РёСЏ Рё СЃР°РЅРёС‚РёР·Р°С†РёСЏ РІС…РѕРґРЅС‹С… РґР°РЅРЅС‹С…
    в”њв”Ђв”Ђ logger.js          # Р›РѕРіРёСЂРѕРІР°РЅРёРµ (РІРєР»СЋС‡Р°РµС‚СЃСЏ С‡РµСЂРµР· localStorage)
    в””в”Ђв”Ђ dom.js             # Р Р°Р±РѕС‚Р° СЃ DOM (РїРѕРёСЃРє СЌР»РµРјРµРЅС‚РѕРІ, РёР·РІР»РµС‡РµРЅРёРµ ID)
```

### Поток данных

```
main.js (С‚РѕС‡РєР° РІС…РѕРґР°)
  в”њв”Ђ> Config (Р·Р°РіСЂСѓР·РєР° РЅР°СЃС‚СЂРѕРµРє)
  в”њв”Ђ> ApiClient (РёРЅРёС†РёР°Р»РёР·Р°С†РёСЏ СЃ С‚РѕРєРµРЅРѕРј РёР· cookie)
  в”њв”Ђ> ChapterManager (Р±РёР·РЅРµСЃ-Р»РѕРіРёРєР°)
  в”‚     в”њв”Ђ> AutoLiker (Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёРµ РґРµР№СЃС‚РІРёСЏ)
  в”‚     в””в”Ђ> API Р·Р°РїСЂРѕСЃС‹ С‡РµСЂРµР· ApiClient
  в””в”Ђ> UI РєРѕРјРїРѕРЅРµРЅС‚С‹ (SettingsPanel, Notifications)
```

### Ключевые особенности

**Config (Singleton):**
- Store settings via GM.getValue/GM.setValue.
- Validate via validators.sanitizeSettings().
- Defaults in this.defaults.

**ApiClient:**
- Rate limit: min 300ms between requests.
- Auto token from cookie (token=...).
- Use GM.xmlHttpRequest to bypass CORS.
- Timeout: 15 sec.

**ChapterManager:**
- Like batch: 10 chapters per batch.
- Operation delays: 300-500ms.
- loadAllChaptersByScroll() loads all chapters by page scroll.
- Update UI buttons after operations.

**main.js:**
- Detect page type: 'chapters' | 'reader' | 'other'.
- SPA navigation: intercept history.pushState/replaceState.
- MutationObserver tracks DOM changes.
- Two-step ops: 1) load chapters by scroll, 2) process.

## API Endpoints

Official remanga.org API:

- `POST /api/activity/views/` - mark chapter read
  - Body: `{ chapter: chapterId }`

- `POST /api/activity/votes/` - like chapter; supports arrays
  - Body: `{ chapter_ids: [id1, id2, ...] }`

- `GET /api/v2/titles/chapters/` - get chapter info
  - Params: `branch_id`, `user_data=1`, `ordering=-index`, `page`

## Безопасность

**КРИТИЧНО:** strict security rules:

- All input validated through validators.js.
- Chapter IDs sanitized: validators.sanitizeChapterId() / sanitizeChapterIds().
- Token extracted from cookie and validated: validators.isValidToken().
- Rate limiting protects from ban: 300ms between requests.
- API timeout: 15 sec.
- All errors handled via try/catch + logging.

## Сборка (build.js)

Simple dependency-free builder:
- Reads files in order: utils -> core -> features -> ui -> main.
- Removes import/export, comments, empty lines.
- Adds Tampermonkey header with version from package.json.
- Wraps in IIFE: `(function(){ 'use strict'; ... })()`.
- Output: single file dist/remanga-extension.user.js.

## Отладка

Enable debug:
```javascript
localStorage.setItem('remanga_ext_debug', 'true');
```

After this browser console shows detailed extension logs.

## Типы страниц

Page type by URL:

- **'chapters'**: `/manga/{название}/chapters` - chapter list page
  - Adds "Прочитать все" and "Лайкнуть все" buttons.
  - MutationObserver tracks DOM changes.

- **'reader'**: `/manga/{название}/{chapterId}` - reader page
  - Auto-like on open if enabled in settings.
  - Auto mark as read.

- **'other'**: all other pages
  - Extension inactive.

## Важные детали реализации

**SPA навигация:**
- Remanga.org uses React Router.
- Intercept history.pushState/replaceState to track transitions.
- Wait 300ms for React render before component init.

**Массовые операции:**
- Two-step process with progress modal.
- Step 1: load all chapters by scroll, show loading indicator.
- Step 2: process chapters, show progress bar with percent.

**UI интеграция:**
- Settings embedded into native user dropdown menu.
- Buttons use site class: 'cs-button'.
- Toast notifications with show/hide animation.

## Принципы разработки

- **ООП и SOLID**: each class has one responsibility.
- **Безопасность**: validate all input; never trust user input.
- **Производительность**: batch ops, rate limiting, minimal DOM manipulation.
- **Отказоустойчивость**: handle all errors, graceful degradation.

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementation:
- State assumptions. If uncertain, ask.
- If multiple interpretations exist, present them.
- If simpler approach exists, say it. Push back when warranted.
- If unclear, stop, name confusion, ask.

## 2. Simplicity First

**Minimum code that solves problem. Nothing speculative.**

- No unasked features.
- No abstractions for single-use code.
- No unrequested flexibility/configurability.
- No impossible-scenario error handling.
- If 200 lines could be 50, rewrite.

Ask: "Would senior engineer say overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only must. Clean only own mess.**

When editing existing code:
- Don't improve adjacent code/comments/formatting.
- Don't refactor unbroken code.
- Match existing style.
- If unrelated dead code found, mention it; don't delete.

When changes create orphans:
- Remove imports/variables/functions made unused by your changes.
- Don't remove pre-existing dead code unless asked.

Test: every changed line must trace to user request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" -> "Write invalid-input tests, then pass"
- "Fix bug" -> "Write reproducing test, then pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state brief plan:
```
1. [Step] в†’ verify: [check]
2. [Step] в†’ verify: [check]
3. [Step] в†’ verify: [check]
```

Strong success criteria enable independent loop. Weak criteria ("make it work") need clarification.

---

**Guidelines working if:** fewer useless diffs, fewer overcomplication rewrites, clarification before implementation.

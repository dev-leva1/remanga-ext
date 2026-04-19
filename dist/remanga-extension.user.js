// ==UserScript==
// @name         Remanga Enhanced
// @namespace    remanga.ext
// @version      1.6.5
// @description  Автоматизация действий на remanga.org: автолайк, массовая отметка глав
// @author       dev-leva1
// @match        https://remanga.org/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @connect      api.remanga.org
// @connect      ext.nexee.ru
// @updateURL    https://ext.nexee.ru/remanga-extension.user.js
// @downloadURL  https://ext.nexee.ru/remanga-extension.user.js
// @run-at       document-idle
// ==/UserScript==

/**
 * CHANGELOG
 *
 * v1.6.5 - Тултипы профилей
 * - Добавлены тултипы пользователей, отображающие краткую информацию о пользователе при наведении на аватар
 * - Добавлена настройка для включения/выключения тултипов пользователей
 * 
 * v1.6.4 - Telegram бот обратной связи
 * - Добавлен Telegram бот для сообщений об ошибках и предложений
 * - Кнопка "Обратная связь" в настройках (вкладка "Общее")
 * - Модальное окно выбора контекста (версия, браузер, URL страницы)
 * - Deep link интеграция с ботом для автоматической передачи данных
 * - Обновлен лендинг: секция "Обратная связь" вместо контактов
 *
 * v1.6.3 - Вкладки в окне настроек
 * - Окно настроек разбито на 3 вкладки: Автоматизация, Интерфейс, Общее
 * - Вертикальное меню вкладок слева (стили с remanga.org/user/settings)
 *
 * v1.6.2 - Выделение гильдий на форуме и в топе
 * - Автоматическое выделение постов от определенных гильдий на /forum
 * - Выделение гильдий в топе на /guild/top
 * - Эффект свечения для лучшей видимости выделенных элементов
 * - Оптимизация производительности через IntersectionObserver
 *
 * v1.6.1 - Улучшения UI настроек
 * - Убрана боковая панель с категориями из окна настроек
 * - Исправлен z-index модального окна обновлений (теперь поверх настроек)
 *
 * v1.6.0 - Кастомизация интерфейса и новая страница настроек
 * - Блокировка кастомных тем в профилях пользователей
 * - Скрытие блоков профиля (статистика, бейджи, ачивки, друзья и т.д.)
 * - Скрытие индикатора непрочитанных сообщений чата в header
 * - Страница настроек открывается как overlay модальное окно
 * - Стилизованная кнопка настроек в header
 *
 * v1.5.0 - Полное обновление UI и лендинг
 * - Полностью переработан UI согласно DESIGN.md
 * - Монохромная цветовая палитра (rgb(19,20,22), rgb(24,25,27))
 * - Централизованные design tokens в styles.js
 * - Pill-кнопки с анимациями (hover, active)
 * - Шрифт Exo 2 во всех компонентах
 * - Создан лендинг ext.nexee.ru с инструкцией по установке
 * - Динамический парсинг changelog на лендинге
 */

(function(){
'use strict';
const logger = {prefix: '[RemangaExt]',info(message, ...args) {console.log(`${this.prefix} ${message}`, ...args);},warn(message, ...args) {console.warn(`${this.prefix} ${message}`, ...args);},error(message, ...args) {console.error(`${this.prefix} ${message}`, ...args);},debug(message, ...args) {if (this.isDebugEnabled()) {console.debug(`${this.prefix} [DEBUG] ${message}`, ...args);}},isDebugEnabled() {return localStorage.getItem('remanga_ext_debug') === 'true';}};
const validators = {isChapterId(value) {const num = parseInt(value);return Number.isInteger(num) && num > 0 && num < Number.MAX_SAFE_INTEGER;},isChapterIds(values) {if (!Array.isArray(values)) {return false;}if (values.length === 0) {return false;}return values.every(v => this.isChapterId(v));},isDelay(value) {const num = parseInt(value);return Number.isInteger(num) && num >= 1000 && num <= 60000;},isValidToken(token) {if (typeof token !== 'string') {return false;}if (token.length < 20 || token.length > 100) {return false;}return /^[a-zA-Z0-9_-]+$/.test(token);},sanitizeChapterId(value) {const num = parseInt(value);if (!this.isChapterId(num)) {throw new Error(`Невалидный ID главы: ${value}`);}return num;},sanitizeChapterIds(values) {if (!Array.isArray(values)) {throw new Error('ID глав должны быть массивом');}if (values.length === 0) {throw new Error('Массив ID глав не может быть пустым');}if (values.length > 1000) {throw new Error('Слишком много ID глав (максимум 1000)');}return values.map(v => this.sanitizeChapterId(v));},sanitizeGuildName(name) {if (typeof name !== 'string') {throw new Error('Название гильдии должно быть строкой');}const trimmed = name.trim();if (trimmed.length === 0 || trimmed.length > 100) {throw new Error('Невалидная длина названия гильдии');}return trimmed;},sanitizeSettings(settings) {const sanitized = {};if ('autoLike' in settings) {sanitized.autoLike = Boolean(settings.autoLike);}if ('autoMarkAsRead' in settings) {sanitized.autoMarkAsRead = Boolean(settings.autoMarkAsRead);}if ('notificationsEnabled' in settings) {sanitized.notificationsEnabled = Boolean(settings.notificationsEnabled);}if ('notificationDuration' in settings) {const duration = parseInt(settings.notificationDuration);if (duration >= 1 && duration <= 10) {sanitized.notificationDuration = duration;}}if ('batchSize' in settings) {const batchSize = parseInt(settings.batchSize);if (batchSize >= 1 && batchSize <= 50) {sanitized.batchSize = batchSize;}}if ('skipProcessed' in settings) {sanitized.skipProcessed = Boolean(settings.skipProcessed);}if ('autoUpdateEnabled' in settings) {sanitized.autoUpdateEnabled = Boolean(settings.autoUpdateEnabled);}if ('blockCustomThemes' in settings) {sanitized.blockCustomThemes = Boolean(settings.blockCustomThemes);}if ('hideChatIndicator' in settings) {sanitized.hideChatIndicator = Boolean(settings.hideChatIndicator);}if ('hideProfileBlocks' in settings) {const blocks = settings.hideProfileBlocks;if (typeof blocks === 'object' && blocks !== null && !Array.isArray(blocks)) {sanitized.hideProfileBlocks = {};const allowedKeys = ['statistics', 'badges', 'achievements', 'favoriteCards', 'publishers', 'guilds', 'friends', 'followers', 'comments'];allowedKeys.forEach(key => {if (key in blocks) {sanitized.hideProfileBlocks[key] = Boolean(blocks[key]);}});}}if ('highlightGuilds' in settings) {sanitized.highlightGuilds = Boolean(settings.highlightGuilds);}return sanitized;}};
const domUtils = {waitForElement(selector, timeout = 10000) {return new Promise((resolve, reject) => {const existing = document.querySelector(selector);if (existing) {resolve(existing);return;}let observer = null;const timeoutId = setTimeout(() => {if (observer) {observer.disconnect();}reject(new Error(`Таймаут ожидания элемента: ${selector}`));}, timeout);observer = new MutationObserver(() => {const element = document.querySelector(selector);if (element) {clearTimeout(timeoutId);observer.disconnect();resolve(element);}});observer.observe(document.body, {childList: true,subtree: true});});},observeElement(selector, callback, options = {}) {const element = document.querySelector(selector);if (!element) {logger.warn(`Элемент не найден: ${selector}`);return null;}const defaultOptions = {childList: true,subtree: true,attributes: false};const observer = new MutationObserver((mutations) => {callback(mutations, element);});observer.observe(element, { ...defaultOptions, ...options });return observer;},extractChapterIdFromUrl() {const match = window.location.pathname.match(/\/manga\/[^/]+\/(\d+)/);return match ? parseInt(match[1]) : null;},extractMangaSlug() {const match = window.location.pathname.match(/\/manga\/([^/]+)/);return match ? match[1] : null;},extractBranchId() {const scripts = document.querySelectorAll('script[type="application/json"]');for (const script of scripts) {try {const data = JSON.parse(script.textContent);if (data.props?.pageProps?.branch?.id) {return data.props.pageProps.branch.id;}} catch (e) {}}if (typeof window !== 'undefined' && window.__NEXT_DATA__) {const branchId = window.__NEXT_DATA__?.props?.pageProps?.branch?.id;if (branchId) {return branchId;}}return null;},extractChapterIdsFromPage() {const elements = document.querySelectorAll('[data-testid^="chapter_"]');const ids = [];elements.forEach(el => {const match = el.dataset.testid.match(/chapter_(\d+)/);if (match) {ids.push(parseInt(match[1]));}});return ids;},findReadButton(chapterId) {return document.querySelector(`[data-testid="update_view_${chapterId}"]`);},findLikeButton(chapterId) {return document.querySelector(`[data-testid="like_btn_${chapterId}"]`);},findNextChapterLink() {const header = document.querySelector('header');if (!header) {return null;}const links = header.querySelectorAll('a[href*="/manga/"]');const currentPath = window.location.pathname;for (const link of links) {const href = link.getAttribute('href');if (href && href !== currentPath && href.match(/\/manga\/[^/]+\/\d+$/)) {return link;}}return null;},isAtPageBottom(threshold = 100) {const scrollTop = window.pageYOffset || document.documentElement.scrollTop;const scrollHeight = document.documentElement.scrollHeight;const clientHeight = document.documentElement.clientHeight;return scrollTop + clientHeight >= scrollHeight - threshold;}};
const changelogParser = {
parseVersion(scriptText) {
const versionMatch = scriptText.match(/@version\s+(\d+\.\d+\.\d+)/);
return versionMatch ? versionMatch[1] : null;
},
compareVersions(current, remote) {
const parseCurrent = current.split('.').map(Number);
const parseRemote = remote.split('.').map(Number);
for (let i = 0; i < 3; i++) {
if (parseRemote[i] > parseCurrent[i]) return 1;
if (parseRemote[i] < parseCurrent[i]) return -1;
}
return 0;
},
parseChangelog(scriptText) {
const changelogMatch = scriptText.match(/\/\*\*[\s\S]*?CHANGELOG[\s\S]*?\n([\s\S]*?)\*\//);
if (!changelogMatch) {
return 'Список изменений недоступен';
}
const changelogText = changelogMatch[1];
const lines = changelogText
.split('\n')
.map(line => line.replace(/^\s*\*\s*/, '').trim())
.filter(line => line.length > 0);
return lines.join('\n');
},
isValidVersion(version) {
if (typeof version !== 'string') return false;
return /^\d+\.\d+\.\d+$/.test(version);
}
};

const DESIGN_TOKENS = {
colors: {
bg: {
primary: 'rgb(19, 20, 22)',
secondary: 'rgb(24, 25, 27)',
modal: '#1a1a1a',
surface: '#2a2a2a'
},
text: {
primary: 'rgb(250, 250, 250)',
secondary: 'rgba(255, 255, 255, 0.77)',
muted: '#9ca3af'
},
interactive: {
hover: 'rgba(255, 255, 255, 0.1)',
active: 'rgba(255, 255, 255, 0.05)'
}
},
typography: {
fontFamily: '"Exo 2", system-ui, -apple-system, sans-serif',
fontSize: {
xs: '12px',
sm: '13px',
md: '14px',
lg: '16px',
xl: '18px',
xxl: '24px'
},
fontWeight: {
normal: 400,
medium: 500,
semibold: 600,
bold: 700
}
},
radius: {
sm: '6px',
md: '8px',
lg: '12px',
xl: '14px',
pill: '9999px'
},
spacing: {
xs: '4px',
sm: '8px',
md: '12px',
lg: '16px',
xl: '24px',
xxl: '32px'
},
shadows: {
none: 'none',
sm: '0 4px 12px rgba(0, 0, 0, 0.15)',
md: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
},
transitions: {
fast: '0.2s',
normal: '0.3s'
}
};
const buttonStyles = (variant = 'primary') => {
const base = `
font-family: ${DESIGN_TOKENS.typography.fontFamily};
font-size: ${DESIGN_TOKENS.typography.fontSize.md};
font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
border-radius: ${DESIGN_TOKENS.radius.pill};
border: none;
cursor: pointer;
transition: all ${DESIGN_TOKENS.transitions.fast};
outline: none;
`;
const variants = {
primary: `
background: ${DESIGN_TOKENS.colors.bg.secondary};
color: ${DESIGN_TOKENS.colors.text.primary};
padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
height: 36px;
`,
secondary: `
background: #374151;
color: ${DESIGN_TOKENS.colors.text.primary};
padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
`,
icon: `
background: rgba(255, 255, 255, 0.05);
color: ${DESIGN_TOKENS.colors.text.muted};
width: 40px;
height: 40px;
padding: 0;
display: flex;
align-items: center;
justify-content: center;
border-radius: ${DESIGN_TOKENS.radius.md};
`,
fullWidth: `
background: ${DESIGN_TOKENS.colors.bg.secondary};
color: ${DESIGN_TOKENS.colors.text.primary};
padding: 10px 20px;
width: 100%;
`
};
return base + (variants[variant] || variants.primary);
};
const modalStyles = () => `
background: ${DESIGN_TOKENS.colors.bg.modal};
color: ${DESIGN_TOKENS.colors.text.primary};
font-family: ${DESIGN_TOKENS.typography.fontFamily};
border-radius: ${DESIGN_TOKENS.radius.lg};
padding: ${DESIGN_TOKENS.spacing.xxl};
box-shadow: ${DESIGN_TOKENS.shadows.md};
animation: remanga-modal-appear ${DESIGN_TOKENS.transitions.fast} ease;
`;
const overlayStyles = () => `
position: fixed;
inset: 0;
background: rgba(0, 0, 0, 0.5);
z-index: 1000000;
display: flex;
align-items: center;
justify-content: center;
backdrop-filter: blur(4px);
`;
const toastStyles = () => `
position: fixed;
top: 20px;
right: 20px;
z-index: 999999;
background: ${DESIGN_TOKENS.colors.bg.secondary};
color: ${DESIGN_TOKENS.colors.text.primary};
padding: ${DESIGN_TOKENS.spacing.lg} ${DESIGN_TOKENS.spacing.xl};
border-radius: ${DESIGN_TOKENS.radius.lg};
box-shadow: ${DESIGN_TOKENS.shadows.none};
font-family: ${DESIGN_TOKENS.typography.fontFamily};
font-size: ${DESIGN_TOKENS.typography.fontSize.md};
font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
max-width: 400px;
animation: remanga-toast-slide-in ${DESIGN_TOKENS.transitions.normal} ease;
cursor: pointer;
transition: top ${DESIGN_TOKENS.transitions.normal} ease, opacity ${DESIGN_TOKENS.transitions.fast} ease;
display: flex;
align-items: center;
gap: ${DESIGN_TOKENS.spacing.sm};
border-left: 3px solid ${DESIGN_TOKENS.colors.text.secondary};
`;

class Config {
static instance = null;
constructor() {
if (Config.instance) {
return Config.instance;
}
this.defaults = {
autoLike: false,
notificationsEnabled: true,
notificationDuration: 3,
batchSize: 10,
skipProcessed: true,
autoUpdateEnabled: true,
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
},
highlightGuilds: true,
feedbackBotUsername: 'remanga_extension_bot',
userTooltipEnabled: true
};
this.settings = { ...this.defaults };
Config.instance = this;
}
async load() {
try {
const stored = await GM.getValue('settings', null);
if (stored) {
const parsed = JSON.parse(stored);
if (typeof parsed !== 'object' || parsed === null) {
throw new Error('Невалидная структура настроек');
}
this.settings = { ...this.defaults, ...parsed };
} else {
this.settings = { ...this.defaults };
}
logger.info('Настройки загружены:', this.settings);
return this.settings;
} catch (error) {
logger.error('Ошибка загрузки настроек:', error);
this.settings = { ...this.defaults };
return this.settings;
}
}
async save(newSettings) {
try {
const sanitized = validators.sanitizeSettings(newSettings);
this.settings = { ...this.settings, ...sanitized };
await GM.setValue('settings', JSON.stringify(this.settings));
logger.info('Настройки сохранены:', this.settings);
return true;
} catch (error) {
logger.error('Ошибка сохранения настроек:', error);
throw error;
}
}
get(key) {
if (!this.settings) {
logger.warn('Настройки не загружены, используются значения по умолчанию');
return this.defaults[key];
}
return this.settings[key] ?? this.defaults[key];
}
async set(key, value) {
return this.save({ [key]: value });
}
async reset() {
this.settings = { ...this.defaults };
await GM.setValue('settings', JSON.stringify(this.settings));
logger.info('Настройки сброшены к значениям по умолчанию');
}
export() {
const exportData = {
version: '1.2.0',
exportDate: new Date().toISOString(),
settings: this.settings
};
return JSON.stringify(exportData, null, 2);
}
async import(jsonString) {
try {
if (typeof jsonString !== 'string') {
throw new Error('Импорт требует строку JSON');
}
const imported = JSON.parse(jsonString);
if (typeof imported !== 'object' || imported === null || Array.isArray(imported)) {
throw new Error('Невалидная структура настроек');
}
let settingsToImport;
if (imported.settings && imported.version) {
settingsToImport = imported.settings;
logger.info(`Импорт настроек версии ${imported.version} от ${imported.exportDate}`);
} else {
settingsToImport = imported;
}
await this.save(settingsToImport);
return true;
} catch (error) {
logger.error('Ошибка импорта настроек:', error);
throw new Error('Невалидный формат настроек');
}
}
}

class Statistics {
static instance = null;
constructor() {
if (Statistics.instance) {
return Statistics.instance;
}
this.stats = {
chaptersRead: 0,
chaptersLiked: 0,
installDate: null
};
this.saveQueue = Promise.resolve();
Statistics.instance = this;
}
async load() {
try {
const stored = await GM.getValue('statistics', null);
if (stored) {
const parsed = JSON.parse(stored);
if (typeof parsed !== 'object' || parsed === null) {
throw new Error('Невалидная структура статистики');
}
const validRead = parseInt(parsed.chaptersRead);
const validLiked = parseInt(parsed.chaptersLiked);
this.stats = {
chaptersRead: (Number.isInteger(validRead) && validRead >= 0) ? validRead : 0,
chaptersLiked: (Number.isInteger(validLiked) && validLiked >= 0) ? validLiked : 0,
installDate: parsed.installDate || new Date().toISOString()
};
} else {
this.stats.installDate = new Date().toISOString();
await this.save();
}
logger.info('Статистика загружена:', this.stats);
return this.stats;
} catch (error) {
logger.error('Ошибка загрузки статистики:', error);
this.stats.installDate = new Date().toISOString();
return this.stats;
}
}
async save() {
this.saveQueue = this.saveQueue.then(async () => {
try {
await GM.setValue('statistics', JSON.stringify(this.stats));
logger.debug('Статистика сохранена');
} catch (error) {
logger.error('Ошибка сохранения статистики:', error);
}
});
return this.saveQueue;
}
async incrementReads(count = 1) {
const validCount = parseInt(count);
if (!Number.isInteger(validCount) || validCount < 0 || validCount > 10000) {
throw new Error(`Невалидное значение count: ${count}`);
}
this.stats.chaptersRead += validCount;
await this.save();
}
async incrementLikes(count = 1) {
const validCount = parseInt(count);
if (!Number.isInteger(validCount) || validCount < 0 || validCount > 10000) {
throw new Error(`Невалидное значение count: ${count}`);
}
this.stats.chaptersLiked += validCount;
await this.save();
}
getStats() {
return { ...this.stats };
}
async reset() {
this.stats = {
chaptersRead: 0,
chaptersLiked: 0,
installDate: new Date().toISOString()
};
await this.save();
logger.info('Статистика сброшена');
}
}

class ApiClient {constructor() {this.baseURL = 'https://api.remanga.org';this.token = null;this.requestCount = 0;this.lastRequestTime = 0;}extractToken() {const match = document.cookie.match(/token=([^;]+)/);if (!match) {throw new Error('Пользователь не авторизован');}const token = match[1];if (!validators.isValidToken(token)) {throw new Error('Невалидный токен авторизации');}return token;}init() {try {this.token = this.extractToken();logger.info('API клиент инициализирован');} catch (error) {logger.error('Ошибка инициализации API клиента:', error);throw error;}}async rateLimit() {const now = Date.now();const timeSinceLastRequest = now - this.lastRequestTime;const minDelay = 300;if (timeSinceLastRequest < minDelay) {const delay = minDelay - timeSinceLastRequest;await new Promise(resolve => setTimeout(resolve, delay));}this.lastRequestTime = Date.now();this.requestCount++;}async request(endpoint, options = {}) {await this.rateLimit();const url = `${this.baseURL}${endpoint}`;const method = options.method || 'GET';return new Promise((resolve, reject) => {GM.xmlHttpRequest({method: method,url: url,headers: {'Content-Type': 'application/json','Authorization': `Bearer ${this.token}`,...options.headers},data: options.body ? JSON.stringify(options.body) : undefined,timeout: 15000,onload: (response) => {if (response.status >= 200 && response.status < 300) {if (response.status === 204) {resolve(null);} else {try {const data = JSON.parse(response.responseText);resolve(data);} catch (e) {resolve(response.responseText);}}} else {logger.error(`API ошибка ${response.status}:`, response.statusText);reject(new Error(`API ошибка: ${response.status}`));}},onerror: (error) => {logger.error('Сетевая ошибка:', error);reject(new Error('Сетевая ошибка'));},ontimeout: () => {logger.error('Таймаут запроса');reject(new Error('Таймаут запроса'));}});});}async markChapterAsRead(chapterId) {const validId = validators.sanitizeChapterId(chapterId);logger.debug(`Отметка главы ${validId} как прочитанной`);return this.request('/api/activity/views/', {method: 'POST',body: { chapter: validId }});}async likeChapters(chapterIds) {const validIds = validators.sanitizeChapterIds(chapterIds);logger.debug('Лайк глав:', validIds);return this.request('/api/activity/votes/', {method: 'POST',body: { chapter_ids: validIds }});}async getChapters(branchId, page = 1) {const params = new URLSearchParams({branch_id: branchId,user_data: '1',ordering: '-index',page: page.toString()});return this.request(`/api/v2/titles/chapters/?${params.toString()}`);}async getCurrentUser() {return this.request('/api/v2/users/current/');}getStats() {return {requestCount: this.requestCount,lastRequestTime: this.lastRequestTime};}}
class UpdateChecker {
constructor(config, notifications) {
this.config = config;
this.notifications = notifications;
this.updateURL = 'https://ext.nexee.ru/remanga-extension.user.js';
this.currentVersion = '1.6.5';
this.checkInterval = 12 * 60 * 60 * 1000;
this.isChecking = false;
}
async init() {
if (!this.config.get('autoUpdateEnabled')) {
logger.info('Автообновления отключены');
return;
}
const shouldCheck = await this.shouldCheckForUpdates();
if (shouldCheck) {
await this.checkForUpdates(false);
}
}
async shouldCheckForUpdates() {
const lastCheck = await GM.getValue('lastUpdateCheck', 0);
const now = Date.now();
return (now - lastCheck) >= this.checkInterval;
}
async checkForUpdates(manual = false) {
if (this.isChecking) {
logger.debug('Проверка обновлений уже выполняется');
return;
}
this.isChecking = true;
try {
logger.info('Проверка обновлений...');
const scriptText = await this.fetchRemoteScript();
const remoteVersion = changelogParser.parseVersion(scriptText);
logger.info('Текущая версия:', this.currentVersion);
logger.info('Удаленная версия:', remoteVersion);
if (!remoteVersion || !changelogParser.isValidVersion(remoteVersion)) {
throw new Error('Не удалось определить версию удаленного скрипта');
}
await GM.setValue('lastUpdateCheck', Date.now());
const comparison = changelogParser.compareVersions(this.currentVersion, remoteVersion);
logger.info('Результат сравнения:', comparison, '(> 0 = есть обновление, 0 = одинаковые, < 0 = текущая новее)');
if (comparison > 0) {
logger.info(`Доступна новая версия: ${remoteVersion} (текущая: ${this.currentVersion})`);
const changelog = changelogParser.parseChangelog(scriptText);
this.showUpdateModal(remoteVersion, changelog);
} else if (manual) {
this.notifications.info('Установлена последняя версия');
}
} catch (error) {
logger.error('Ошибка проверки обновлений:', error);
if (manual) {
this.notifications.error('Не удалось проверить обновления');
}
} finally {
this.isChecking = false;
}
}
async fetchRemoteScript() {
return new Promise((resolve, reject) => {
GM.xmlHttpRequest({
method: 'GET',
url: this.updateURL + '?t=' + Date.now(),
headers: {
'Cache-Control': 'no-cache, no-store, must-revalidate',
'Pragma': 'no-cache',
'Expires': '0'
},
timeout: 10000,
onload: (response) => {
if (response.status === 200) {
resolve(response.responseText);
} else {
reject(new Error(`HTTP ${response.status}`));
}
},
onerror: () => reject(new Error('Сетевая ошибка')),
ontimeout: () => reject(new Error('Таймаут'))
});
});
}
showUpdateModal(version, changelog) {
const overlay = document.createElement('div');
overlay.style.cssText = overlayStyles() + `
z-index: 9999999;
`;
const modal = document.createElement('div');
modal.style.cssText = modalStyles() + `
min-width: 500px;
max-width: 600px;
max-height: 80vh;
overflow-y: auto;
`;
const changelogLines = changelog.split('\n');
const changelogHTML = changelogLines
.map(line => `<div style="padding: 4px 0; color: #d1d5db;">• ${line}</div>`)
.join('');
modal.innerHTML = `
<h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold; color: #ffffff;">
Обновление ${version}
</h2>
<div style="margin-bottom: 24px; color: #9ca3af; font-size: 14px;">
Текущая версия: ${this.currentVersion}
</div>
<div style="margin-bottom: 24px;">
<div style="font-weight: 600; margin-bottom: 12px; color: #ffffff; font-size: 16px;">
📝 Список изменений:
</div>
<div style="
background: #2a2a2a;
padding: 16px;
border-radius: 8px;
max-height: 300px;
overflow-y: auto;
font-size: 14px;
line-height: 1.6;
">
${changelogHTML}
</div>
</div>
<div style="
padding: 16px;
background: #2a2a2a;
border-radius: 8px;
margin-bottom: 24px;
font-size: 13px;
color: #9ca3af;
">
ℹ️ После нажатия "Обновить" Tampermonkey автоматически загрузит новую версию.
Страница будет перезагружена.
</div>
<div style="display: flex; gap: ${DESIGN_TOKENS.spacing.md}; justify-content: flex-end;">
<button id="update-later" style="
padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
background: #374151;
color: ${DESIGN_TOKENS.colors.text.primary};
border: none;
border-radius: ${DESIGN_TOKENS.radius.pill};
cursor: pointer;
font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
font-size: ${DESIGN_TOKENS.typography.fontSize.md};
font-family: ${DESIGN_TOKENS.typography.fontFamily};
">Позже</button>
<button id="update-now" style="
padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
background: ${DESIGN_TOKENS.colors.bg.secondary};
color: ${DESIGN_TOKENS.colors.text.primary};
border: none;
border-radius: ${DESIGN_TOKENS.radius.pill};
cursor: pointer;
font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
font-size: ${DESIGN_TOKENS.typography.fontSize.md};
font-family: ${DESIGN_TOKENS.typography.fontFamily};
">Обновить</button>
</div>
`;
overlay.appendChild(modal);
document.body.appendChild(overlay);
modal.querySelector('#update-later').addEventListener('click', () => {
overlay.remove();
});
modal.querySelector('#update-now').addEventListener('click', () => {
overlay.remove();
this.performUpdate();
});
overlay.addEventListener('click', (e) => {
if (e.target === overlay) {
overlay.remove();
}
});
}
performUpdate() {
this.notifications.info('Обновление начато. Tampermonkey загрузит новую версию...');
setTimeout(() => {
window.location.href = this.updateURL;
}, 1000);
}
getCurrentVersion() {
return this.currentVersion;
}
async getLastCheckTime() {
return await GM.getValue('lastUpdateCheck', 0);
}
}

class Notifications {constructor(config) {this.config = config;this.queue = [];this.activeToasts = new Map();this.maxToasts = 5;}show(message, type = 'info') {if (!this.config.get('notificationsEnabled')) {return;}const validMessage = String(message);const validTypes = ['info', 'success', 'warning', 'error'];const validType = validTypes.includes(type) ? type : 'info';const key = `${validType}:${validMessage}`;const duration = this.config.get('notificationDuration') * 1000;if (this.activeToasts.has(key)) {const existing = this.activeToasts.get(key);existing.count++;this.updateToastCount(existing.toast, existing.count);clearTimeout(existing.timeoutId);existing.timeoutId = setTimeout(() => {this.hide(key);}, duration);} else {if (this.activeToasts.size >= this.maxToasts) {const oldestKey = this.activeToasts.keys().next().value;this.hide(oldestKey);}const toast = this.createToast(message, type);document.body.appendChild(toast);const timeoutId = setTimeout(() => {this.hide(key);}, duration);this.activeToasts.set(key, { toast, timeoutId, count: 1 });this.updateToastPositions();}}cleanup() {this.activeToasts.forEach((entry, key) => {clearTimeout(entry.timeoutId);if (entry.toast.parentNode) {entry.toast.parentNode.removeChild(entry.toast);}});this.activeToasts.clear();}createToast(message, type) {const toast = document.createElement('div');toast.className = `remanga-ext-toast remanga-ext-toast-${type}`;const borderColors = {info: DESIGN_TOKENS.colors.text.secondary,success: DESIGN_TOKENS.colors.text.secondary,warning: '#f59e0b',error: '#ef4444'};toast.style.cssText = toastStyles() + `border-left-color: ${borderColors[type] || borderColors.info};`;const messageSpan = document.createElement('span');messageSpan.className = 'remanga-ext-toast-message';messageSpan.textContent = message;const countBadge = document.createElement('span');countBadge.className = 'remanga-ext-toast-count';countBadge.style.cssText = `display: none;background: rgba(0, 0, 0, 0.2);padding: 2px 8px;border-radius: ${DESIGN_TOKENS.radius.pill};font-size: ${DESIGN_TOKENS.typography.fontSize.xs};font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold};`;toast.appendChild(messageSpan);toast.appendChild(countBadge);const key = `${type}:${message}`;toast.addEventListener('click', () => {this.hide(key);});return toast;}updateToastCount(toast, count) {const countBadge = toast.querySelector('.remanga-ext-toast-count');if (countBadge) {if (count > 1) {countBadge.textContent = `x${count}`;countBadge.style.display = 'block';} else {countBadge.style.display = 'none';}}}updateToastPositions() {let offset = 20;this.activeToasts.forEach(({ toast }) => {toast.style.top = `${offset}px`;offset += toast.offsetHeight + 12;});}hide(key) {const entry = this.activeToasts.get(key);if (!entry) {return;}clearTimeout(entry.timeoutId);entry.toast.style.animation = 'remanga-toast-slide-out 0.3s ease';setTimeout(() => {if (entry.toast.parentNode) {entry.toast.parentNode.removeChild(entry.toast);}this.activeToasts.delete(key);this.updateToastPositions();}, 300);}injectStyles() {if (document.getElementById('remanga-ext-toast-styles')) {return;}const style = document.createElement('style');style.id = 'remanga-ext-toast-styles';style.textContent = `@keyframes remanga-toast-slide-in {from {transform: translateX(400px);opacity: 0;}to {transform: translateX(0);opacity: 1;}}@keyframes remanga-toast-slide-out {from {transform: translateX(0);opacity: 1;}to {transform: translateX(400px);opacity: 0;}}.remanga-ext-toast:hover {opacity: ${DESIGN_TOKENS.colors.interactive.hover.replace('rgba(255, 255, 255, ', '').replace(')', '')};}`;document.head.appendChild(style);}success(message) {this.show(message, 'success');}error(message) {this.show(message, 'error');}warning(message) {this.show(message, 'warning');}info(message) {this.show(message, 'info');}clearAll() {this.activeToasts.forEach((_, key) => this.hide(key));}}
class TooltipRenderer {
constructor() {
this.tooltip = null;
this.currentTarget = null;
}
create(userData, targetElement) {
this.remove();
const tooltip = document.createElement('div');
tooltip.className = 'remanga-ext-user-tooltip';
tooltip.style.cssText = this.getTooltipStyles();
const content = this.buildContent(userData);
tooltip.innerHTML = content;
document.body.appendChild(tooltip);
this.tooltip = tooltip;
this.currentTarget = targetElement;
this.position(targetElement);
return tooltip;
}
buildContent(userData) {
const { username, avatar, level, chapters_read, main_club, is_online } = userData;
const avatarUrl = avatar?.high ? `https://remanga.org/media/${avatar.high}` : '';
const clubName = main_club?.name || 'Нет гильдии';
const levelName = level?.name || 'Новичок';
const onlineStatus = is_online ? 'В сети' : 'Не в сети';
const onlineColor = is_online ? '#10b981' : '#6b7280';
return `
<div style="display: flex; gap: ${DESIGN_TOKENS.spacing.md}; align-items: flex-start;">
<img
src="${avatarUrl}"
alt="${username}"
style="
width: 60px;
height: 60px;
border-radius: ${DESIGN_TOKENS.radius.md};
object-fit: cover;
flex-shrink: 0;
"
/>
<div style="flex: 1; min-width: 0;">
<div style="
font-size: ${DESIGN_TOKENS.typography.fontSize.lg};
font-weight: ${DESIGN_TOKENS.typography.fontWeight.bold};
color: ${DESIGN_TOKENS.colors.text.primary};
margin-bottom: ${DESIGN_TOKENS.spacing.xs};
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
">
${this.escapeHtml(username)}
</div>
<div style="
display: flex;
align-items: center;
gap: ${DESIGN_TOKENS.spacing.xs};
margin-bottom: ${DESIGN_TOKENS.spacing.sm};
">
<div style="
width: 8px;
height: 8px;
border-radius: 50%;
background: ${onlineColor};
"></div>
<span style="
font-size: ${DESIGN_TOKENS.typography.fontSize.sm};
color: ${DESIGN_TOKENS.colors.text.muted};
">
${onlineStatus}
</span>
</div>
<div style="
display: flex;
flex-direction: column;
gap: ${DESIGN_TOKENS.spacing.xs};
font-size: ${DESIGN_TOKENS.typography.fontSize.sm};
color: ${DESIGN_TOKENS.colors.text.secondary};
">
<div style="display: flex; justify-content: space-between;">
<span>Уровень:</span>
<span style="color: ${DESIGN_TOKENS.colors.text.primary}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};">
${this.escapeHtml(levelName)}
</span>
</div>
<div style="display: flex; justify-content: space-between;">
<span>Прочитано глав:</span>
<span style="color: ${DESIGN_TOKENS.colors.text.primary}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};">
${this.formatNumber(chapters_read)}
</span>
</div>
<div style="display: flex; justify-content: space-between;">
<span>Гильдия:</span>
<span style="
color: ${DESIGN_TOKENS.colors.text.primary};
font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
max-width: 150px;
">
${this.escapeHtml(clubName)}
</span>
</div>
</div>
</div>
</div>
`;
}
getTooltipStyles() {
return `
position: fixed;
z-index: 999999;
background: ${DESIGN_TOKENS.colors.bg.modal};
color: ${DESIGN_TOKENS.colors.text.primary};
font-family: ${DESIGN_TOKENS.typography.fontFamily};
border-radius: ${DESIGN_TOKENS.radius.lg};
padding: ${DESIGN_TOKENS.spacing.lg};
box-shadow: ${DESIGN_TOKENS.shadows.md};
min-width: 320px;
max-width: 400px;
pointer-events: none;
animation: remanga-tooltip-fade-in 0.2s ease;
border: 1px solid rgba(255, 255, 255, 0.1);
`;
}
position(targetElement) {
if (!this.tooltip) return;
const rect = targetElement.getBoundingClientRect();
const tooltipRect = this.tooltip.getBoundingClientRect();
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;
const spacing = 12;
let top = rect.bottom + spacing;
let left = rect.left;
if (left + tooltipRect.width > viewportWidth - spacing) {
left = viewportWidth - tooltipRect.width - spacing;
}
if (left < spacing) {
left = spacing;
}
if (top + tooltipRect.height > viewportHeight - spacing) {
top = rect.top - tooltipRect.height - spacing;
}
if (top < spacing) {
top = spacing;
}
this.tooltip.style.top = `${top}px`;
this.tooltip.style.left = `${left}px`;
}
remove() {
if (this.tooltip && this.tooltip.parentNode) {
this.tooltip.style.animation = 'remanga-tooltip-fade-out 0.15s ease';
setTimeout(() => {
if (this.tooltip && this.tooltip.parentNode) {
this.tooltip.parentNode.removeChild(this.tooltip);
}
this.tooltip = null;
this.currentTarget = null;
}, 150);
} else {
this.tooltip = null;
this.currentTarget = null;
}
}
injectStyles() {
if (document.getElementById('remanga-ext-tooltip-styles')) {
return;
}
const style = document.createElement('style');
style.id = 'remanga-ext-tooltip-styles';
style.textContent = `
@keyframes remanga-tooltip-fade-in {
from {
opacity: 0;
transform: translateY(-8px);
}
to {
opacity: 1;
transform: translateY(0);
}
}
@keyframes remanga-tooltip-fade-out {
from {
opacity: 1;
transform: translateY(0);
}
to {
opacity: 0;
transform: translateY(-8px);
}
}
`;
document.head.appendChild(style);
}
formatNumber(num) {
if (!num) return '0';
return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
escapeHtml(text) {
const div = document.createElement('div');
div.textContent = text;
return div.innerHTML;
}
isVisible() {
return this.tooltip !== null;
}
getCurrentTarget() {
return this.currentTarget;
}
}

class SettingsPanel {constructor(config, notifications, statistics) {this.config = config;this.notifications = notifications;this.statistics = statistics;this.observer = null;}inject() {if (this.observer) {logger.debug('Observer уже активен');return;}let debounceTimer = null;const reinjectButton = () => {clearTimeout(debounceTimer);debounceTimer = setTimeout(() => {const header = document.querySelector('header');if (header && !document.getElementById('remanga-ext-settings-btn')) {this.injectHeaderButton(header);logger.debug('Кнопка настроек переинъецирована');}}, 100);};this.observer = new MutationObserver(reinjectButton);this.observer.observe(document.body, {childList: true,subtree: true});const existingHeader = document.querySelector('header');if (existingHeader && !document.getElementById('remanga-ext-settings-btn')) {this.injectHeaderButton(existingHeader);}logger.info('MutationObserver для кнопки настроек активирован');}cleanup() {if (this.observer) {this.observer.disconnect();this.observer = null;}}injectHeaderButton(header) {const link = document.createElement('button');link.id = 'remanga-ext-settings-btn';link.className = 'cs-button';link.setAttribute('aria-label', 'Настройки расширения');link.style.cssText = `position: relative;display: inline-flex;align-items: center;justify-content: center;box-sizing: border-box;appearance: none;user-select: none;white-space: nowrap;font-weight: 500;transition: all 0.2s;cursor: pointer;opacity: 1;outline: none;border: none;border-radius: 9999px;padding: 0 1rem;height: 2.25rem;min-width: 2.25rem;font-size: 0.875rem;background: ${DESIGN_TOKENS.colors.bg.secondary};color: ${DESIGN_TOKENS.colors.text.secondary};margin: 0 ${DESIGN_TOKENS.spacing.xs};`;link.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.11,9.59h-5.4V3.28a1.26,1.26,0,0,0-2.15-.89l-.15.18L4,12.47l-.15.19a1.21,1.21,0,0,0-.21.71,1.27,1.27,0,0,0,1.26,1.26H11v6.09A1.27,1.27,0,0,0,12.21,22a1.25,1.25,0,0,0,1-.49l.08-.1,6.82-9.77.07-.11a1.22,1.22,0,0,0,.19-.66A1.25,1.25,0,0,0,19.11,9.59Zm-6.27,9.12v-6H6.15l5.67-7.57v6.31H17.9Z"/></svg>`;link.addEventListener('mouseenter', () => {link.style.background = 'rgba(255, 255, 255, 0.15)';});link.addEventListener('mouseleave', () => {link.style.background = DESIGN_TOKENS.colors.bg.secondary;});link.addEventListener('click', (e) => {e.preventDefault();e.stopPropagation();if (window.remangaExtension && window.remangaExtension.settingsPage) {window.remangaExtension.settingsPage.init();}logger.info('Открытие страницы настроек');});const headerNav = header.querySelector('nav') || header.querySelector('div[class*="flex"]');if (headerNav) {const lastChild = headerNav.lastElementChild;if (lastChild) {headerNav.insertBefore(link, lastChild);logger.info('Кнопка настроек добавлена в header перед последним элементом');} else {headerNav.appendChild(link);logger.info('Кнопка настроек добавлена в header (appendChild)');}} else {header.appendChild(link);logger.info('Кнопка настроек добавлена в header (fallback)');}}}
class SettingsPage {
constructor(config, notifications, statistics) {
this.config = config;
this.notifications = notifications;
this.statistics = statistics;
this.container = null;
this.currentVersion = '1.6.5';
this.activeTab = 'automation';
}
init() {
this.render();
logger.info('SettingsPage инициализирована');
}
render() {
if (this.container) {
this.container.remove();
}
this.container = document.createElement('div');
this.container.id = 'remanga-ext-settings-page';
this.container.style.cssText = `
position: fixed;
inset: 0;
background: rgba(0, 0, 0, 0.8);
z-index: 999999;
overflow-y: auto;
font-family: ${DESIGN_TOKENS.typography.fontFamily};
backdrop-filter: blur(4px);
`;
const modal = document.createElement('div');
modal.style.cssText = `
max-width: 1200px;
margin: ${DESIGN_TOKENS.spacing.xxl} auto;
background: ${DESIGN_TOKENS.colors.bg.primary};
border-radius: ${DESIGN_TOKENS.radius.xl};
padding: ${DESIGN_TOKENS.spacing.xxl};
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;
modal.innerHTML = this.createContent();
this.container.appendChild(modal);
document.body.appendChild(this.container);
this.container.addEventListener('click', (e) => {
if (e.target === this.container) {
this.close();
}
});
this.attachEventListeners();
this.injectStyles();
}
close() {
this.cleanup();
window.location.reload();
}
createContent() {
const stats = this.statistics.getStats();
const installDate = new Date(stats.installDate).toLocaleDateString('ru-RU');
return `
<div style="display: flex; flex-direction: column; gap: ${DESIGN_TOKENS.spacing.xl};">
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${DESIGN_TOKENS.spacing.lg};">
<h1 style="margin: 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xxl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.bold}; color: ${DESIGN_TOKENS.colors.text.primary};">
Настройки расширения
</h1>
<a href="/" id="close-page" style="
padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
background: ${DESIGN_TOKENS.colors.bg.secondary};
color: ${DESIGN_TOKENS.colors.text.primary};
border: none;
border-radius: ${DESIGN_TOKENS.radius.pill};
cursor: pointer;
font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
font-size: ${DESIGN_TOKENS.typography.fontSize.md};
text-decoration: none;
display: inline-block;
">Закрыть</a>
</div>
<div style="display: flex; gap: ${DESIGN_TOKENS.spacing.xl};">
${this.renderTabs()}
<div style="flex: 1;">
${this.renderTabContent()}
</div>
</div>
<div style="display: flex; gap: ${DESIGN_TOKENS.spacing.md}; justify-content: flex-end;">
<button id="reset-settings" style="
padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
background: #ef4444;
color: ${DESIGN_TOKENS.colors.text.primary};
border: none;
border-radius: ${DESIGN_TOKENS.radius.pill};
cursor: pointer;
font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
font-size: ${DESIGN_TOKENS.typography.fontSize.md};
font-family: ${DESIGN_TOKENS.typography.fontFamily};
">Сбросить настройки</button>
<button id="save-settings" style="
padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
background: ${DESIGN_TOKENS.colors.bg.surface};
color: ${DESIGN_TOKENS.colors.text.primary};
border: none;
border-radius: ${DESIGN_TOKENS.radius.pill};
cursor: pointer;
font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
font-size: ${DESIGN_TOKENS.typography.fontSize.md};
font-family: ${DESIGN_TOKENS.typography.fontFamily};
">Сохранить изменения</button>
</div>
</div>
`;
}
renderTabs() {
const tabs = [
{
id: 'automation',
label: 'Автоматизация',
icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.11,9.59h-5.4V3.28a1.26,1.26,0,0,0-2.15-.89l-.15.18L4,12.47l-.15.19a1.21,1.21,0,0,0-.21.71,1.27,1.27,0,0,0,1.26,1.26H11v6.09A1.27,1.27,0,0,0,12.21,22a1.25,1.25,0,0,0,1-.49l.08-.1,6.82-9.77.07-.11a1.22,1.22,0,0,0,.19-.66A1.25,1.25,0,0,0,19.11,9.59Zm-6.27,9.12v-6H6.15l5.67-7.57v6.31H17.9Z"/></svg>'
},
{
id: 'interface',
label: 'Интерфейс',
icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" stroke-width="1.5" fill="none" stroke="currentColor"><g clip-path="url(#clip0_1678_14633)"><path d="M14.125 16.0667C15.9833 16.0667 17.5 14.525 17.5 12.6167C17.5 10.7084 15.9833 9.16669 14.125 9.16669C12.2667 9.16669 10.75 10.7084 10.75 12.6167C10.75 14.525 12.2667 16.0667 14.125 16.0667Z" stroke-miterlimit="10" stroke-linecap="round"></path><path d="M11.7427 15.0667L9.35938 17.5" stroke-miterlimit="10" stroke-linecap="round"></path><path d="M9.29688 15.825L10.9469 17.5" stroke-miterlimit="10" stroke-linecap="round"></path><path d="M5.75834 11.0333C7.55834 11.0333 9.01667 9.54164 9.01667 7.69997C9.01667 5.8583 7.55834 4.36664 5.75834 4.36664C3.95834 4.36664 2.5 5.8583 2.5 7.69997C2.5 9.54164 3.95834 11.0333 5.75834 11.0333Z" stroke-miterlimit="10" stroke-linecap="round"></path><path d="M10.8531 2.5L8.07812 5.34999" stroke-miterlimit="10" stroke-linecap="round"></path><path d="M8.75781 2.5H10.8411V4.63333" stroke-linecap="round" stroke-linejoin="round"></path></g><defs><clipPath id="clip0_1678_14633"><rect width="20" height="20" fill="currentColor"></rect></clipPath></defs></svg>'
},
{
id: 'general',
label: 'Общее',
icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" stroke-width="1.5" fill="currentColor" stroke="none"><path d="M14.2307 6.94175V5.90008C14.2307 3.65008 13.6891 0.666748 8.9974 0.666748C4.30573 0.666748 3.76406 3.65008 3.76406 5.90008V6.94175C1.43073 7.23341 0.664062 8.41675 0.664062 11.3251V12.8751C0.664062 16.2917 1.70573 17.3334 5.1224 17.3334H12.8724C16.2891 17.3334 17.3307 16.2917 17.3307 12.8751V11.3251C17.3307 8.41675 16.5641 7.23341 14.2307 6.94175ZM8.9974 14.6167C7.60573 14.6167 6.48073 13.4834 6.48073 12.1001C6.48073 10.7084 7.61406 9.58341 8.9974 9.58341C10.3807 9.58341 11.5141 10.7167 11.5141 12.1001C11.5141 13.4917 10.3891 14.6167 8.9974 14.6167ZM5.1224 6.86675C5.05573 6.86675 4.9974 6.86675 4.93073 6.86675V5.90008C4.93073 3.45841 5.6224 1.83341 8.9974 1.83341C12.3724 1.83341 13.0641 3.45841 13.0641 5.90008V6.87508C12.9974 6.87508 12.9391 6.87508 12.8724 6.87508H5.1224V6.86675Z"></path></svg>'
}
];
return `
<div style="
display: flex;
flex-direction: column;
gap: ${DESIGN_TOKENS.spacing.sm};
min-width: 200px;
">
${tabs.map(tab => `
<button
class="settings-tab"
data-tab="${tab.id}"
data-active="${this.activeTab === tab.id}"
style="
display: flex;
align-items: center;
gap: ${DESIGN_TOKENS.spacing.md};
padding: ${DESIGN_TOKENS.spacing.sm};
background: ${this.activeTab === tab.id ? DESIGN_TOKENS.colors.bg.secondary : DESIGN_TOKENS.colors.bg.primary};
color: ${DESIGN_TOKENS.colors.text.primary};
border: none;
border-radius: 22px;
cursor: pointer;
font-size: ${DESIGN_TOKENS.typography.fontSize.md};
font-family: ${DESIGN_TOKENS.typography.fontFamily};
font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
text-align: left;
outline: 1px solid transparent;
"
>
${tab.icon}
<span>${tab.label}</span>
</button>
`).join('')}
</div>
`;
}
renderTabContent() {
switch (this.activeTab) {
case 'automation':
return this.renderAutomationTab();
case 'interface':
return this.renderInterfaceTab();
case 'general':
return this.renderGeneralTab();
default:
return '';
}
}
renderAutomationTab() {
return `
<section style="background: ${DESIGN_TOKENS.colors.bg.secondary}; padding: ${DESIGN_TOKENS.spacing.xl}; border-radius: ${DESIGN_TOKENS.radius.lg};">
<h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold}; color: ${DESIGN_TOKENS.colors.text.primary};">
Автоматизация
</h2>
<div style="display: flex; flex-direction: column; gap: ${DESIGN_TOKENS.spacing.lg};">
<label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
<input type="checkbox" id="autoLike" ${this.config.get('autoLike') ? 'checked' : ''}
style="width: 20px; height: 20px; cursor: pointer;">
<div>
<div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Автолайк глав при открытии</div>
<div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Автоматически ставить лайк при открытии главы</div>
</div>
</label>
<label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
<input type="checkbox" id="skipProcessed" ${this.config.get('skipProcessed') ? 'checked' : ''}
style="width: 20px; height: 20px; cursor: pointer;">
<div>
<div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Пропускать обработанные главы</div>
<div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Не обрабатывать уже прочитанные/лайкнутые главы</div>
</div>
</label>
<div>
<label style="display: block; margin-bottom: ${DESIGN_TOKENS.spacing.sm}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">
Размер batch для массовых операций: <span id="batchSizeValue">${this.config.get('batchSize')}</span> глав
</label>
<input type="range" id="batchSize"
min="1" max="50" step="1"
value="${this.config.get('batchSize')}"
style="width: 100%;">
</div>
</div>
</section>
`;
}
renderInterfaceTab() {
return `
<section style="background: ${DESIGN_TOKENS.colors.bg.secondary}; padding: ${DESIGN_TOKENS.spacing.xl}; border-radius: ${DESIGN_TOKENS.radius.lg};">
<h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold}; color: ${DESIGN_TOKENS.colors.text.primary};">
Кастомизация интерфейса
</h2>
<div style="display: flex; flex-direction: column; gap: ${DESIGN_TOKENS.spacing.lg};">
<label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
<input type="checkbox" id="blockCustomThemes" ${this.config.get('blockCustomThemes') ? 'checked' : ''}
style="width: 20px; height: 20px; cursor: pointer;">
<div>
<div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Блокировать кастомные темы в профилях</div>
<div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Отключить пользовательские темы и оставить только стандартные стили</div>
</div>
</label>
<label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
<input type="checkbox" id="hideChatIndicator" ${this.config.get('hideChatIndicator') ? 'checked' : ''}
style="width: 20px; height: 20px; cursor: pointer;">
<div>
<div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Скрыть индикатор непрочитанных сообщений</div>
<div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Убрать счетчик сообщений у иконки чата в header</div>
</div>
</label>
<label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
<input type="checkbox" id="highlightGuilds" ${this.config.get('highlightGuilds') ? 'checked' : ''}
style="width: 20px; height: 20px; cursor: pointer;">
<div>
<div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Подсветка гильдий</div>
<div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Выделять посты и гильдии в топе</div>
</div>
</label>
<label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
<input type="checkbox" id="userTooltipEnabled" ${this.config.get('userTooltipEnabled') ? 'checked' : ''}
style="width: 20px; height: 20px; cursor: pointer;">
<div>
<div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Тултипы профилей</div>
<div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Показывать краткую информацию о пользователе при наведении на аватар</div>
</div>
</label>
<div>
<div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary}; margin-bottom: ${DESIGN_TOKENS.spacing.md};">
Скрыть блоки в профилях
</div>
<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: ${DESIGN_TOKENS.spacing.md};">
${this.createProfileBlockCheckboxes()}
</div>
</div>
</div>
</section>
`;
}
renderGeneralTab() {
const stats = this.statistics.getStats();
const installDate = new Date(stats.installDate).toLocaleDateString('ru-RU');
return `
<div style="display: flex; flex-direction: column; gap: ${DESIGN_TOKENS.spacing.lg};">
<section style="background: ${DESIGN_TOKENS.colors.bg.secondary}; padding: ${DESIGN_TOKENS.spacing.xl}; border-radius: ${DESIGN_TOKENS.radius.lg};">
<h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold}; color: ${DESIGN_TOKENS.colors.text.primary};">
Обратная связь
</h2>
<p style="color: ${DESIGN_TOKENS.colors.text.muted}; margin-bottom: ${DESIGN_TOKENS.spacing.lg};">
Нашли баг или есть предложение? Напишите нам в Telegram бот!
</p>
<button id="open-feedback-modal" style="
padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
background: ${DESIGN_TOKENS.colors.bg.surface};
color: ${DESIGN_TOKENS.colors.text.primary};
border: none;
border-radius: ${DESIGN_TOKENS.radius.pill};
cursor: pointer;
font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
font-size: ${DESIGN_TOKENS.typography.fontSize.md};
font-family: ${DESIGN_TOKENS.typography.fontFamily};
width: 100%;
">Открыть бот обратной связи</button>
</section>
<section style="background: ${DESIGN_TOKENS.colors.bg.secondary}; padding: ${DESIGN_TOKENS.spacing.xl}; border-radius: ${DESIGN_TOKENS.radius.lg};">
<h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold}; color: ${DESIGN_TOKENS.colors.text.primary};">
Уведомления и обновления
</h2>
<div style="display: flex; flex-direction: column; gap: ${DESIGN_TOKENS.spacing.lg};">
<label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
<input type="checkbox" id="notificationsEnabled" ${this.config.get('notificationsEnabled') ? 'checked' : ''}
style="width: 20px; height: 20px; cursor: pointer;">
<div>
<div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Показывать уведомления</div>
<div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Отображать toast уведомления о действиях</div>
</div>
</label>
<div>
<label style="display: block; margin-bottom: ${DESIGN_TOKENS.spacing.sm}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">
Время показа уведомлений: <span id="durationValue">${this.config.get('notificationDuration')}</span> сек
</label>
<input type="range" id="notificationDuration"
min="1" max="10" step="1"
value="${this.config.get('notificationDuration')}"
style="width: 100%;">
</div>
<label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
<input type="checkbox" id="autoUpdateEnabled" ${this.config.get('autoUpdateEnabled') ? 'checked' : ''}
style="width: 20px; height: 20px; cursor: pointer;">
<div>
<div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Автоматические обновления</div>
<div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Проверять наличие обновлений при загрузке страницы</div>
</div>
</label>
</div>
</section>
<section style="background: ${DESIGN_TOKENS.colors.bg.secondary}; padding: ${DESIGN_TOKENS.spacing.xl}; border-radius: ${DESIGN_TOKENS.radius.lg};">
<h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold}; color: ${DESIGN_TOKENS.colors.text.primary};">
Статистика
</h2>
<div style="display: flex; flex-direction: column; gap: ${DESIGN_TOKENS.spacing.md}; color: ${DESIGN_TOKENS.colors.text.secondary};">
<div>Прочитано глав: <span style="color: ${DESIGN_TOKENS.colors.text.primary}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold};">${stats.chaptersRead}</span></div>
<div>Лайков поставлено: <span style="color: ${DESIGN_TOKENS.colors.text.primary}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold};">${stats.chaptersLiked}</span></div>
<div>Дата установки: <span style="color: ${DESIGN_TOKENS.colors.text.primary};">${installDate}</span></div>
</div>
<button id="reset-stats" style="
margin-top: ${DESIGN_TOKENS.spacing.lg};
padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
background: #374151;
color: ${DESIGN_TOKENS.colors.text.primary};
border: none;
border-radius: ${DESIGN_TOKENS.radius.pill};
cursor: pointer;
font-size: ${DESIGN_TOKENS.typography.fontSize.md};
font-family: ${DESIGN_TOKENS.typography.fontFamily};
width: 100%;
">Сбросить статистику</button>
</section>
<section style="background: ${DESIGN_TOKENS.colors.bg.secondary}; padding: ${DESIGN_TOKENS.spacing.xl}; border-radius: ${DESIGN_TOKENS.radius.lg};">
<h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold}; color: ${DESIGN_TOKENS.colors.text.primary};">
Обновления
</h2>
<div style="display: flex; flex-direction: column; gap: ${DESIGN_TOKENS.spacing.md}; color: ${DESIGN_TOKENS.colors.text.secondary}; margin-bottom: ${DESIGN_TOKENS.spacing.lg};">
<div>Текущая версия: <span style="color: ${DESIGN_TOKENS.colors.text.primary}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold};">${this.currentVersion}</span></div>
<div id="last-check-info" style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm};">Проверка обновлений...</div>
</div>
<button id="check-updates" style="
padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
background: ${DESIGN_TOKENS.colors.bg.surface};
color: ${DESIGN_TOKENS.colors.text.primary};
border: none;
border-radius: ${DESIGN_TOKENS.radius.pill};
cursor: pointer;
font-size: ${DESIGN_TOKENS.typography.fontSize.md};
font-family: ${DESIGN_TOKENS.typography.fontFamily};
width: 100%;
">Проверить обновления</button>
</section>
</div>
`;
}
createProfileBlockCheckboxes() {
const blocks = this.config.get('hideProfileBlocks') || {};
const blockLabels = {
statistics: 'Статистика',
badges: 'Бейджи',
achievements: 'Ачивки',
favoriteCards: 'Избранные карточки',
publishers: 'Паблишеры',
guilds: 'Гильдии',
friends: 'Друзья',
followers: 'Подписчики',
comments: 'Комментарии'
};
return Object.keys(blockLabels).map(key => `
<label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.sm}; cursor: pointer;">
<input type="checkbox" class="profile-block-checkbox" data-block="${key}" ${blocks[key] ? 'checked' : ''}
style="width: 18px; height: 18px; cursor: pointer;">
<span style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.secondary};">${blockLabels[key]}</span>
</label>
`).join('');
}
attachEventListeners() {
const tabs = this.container.querySelectorAll('.settings-tab');
tabs.forEach(tab => {
tab.addEventListener('click', (e) => {
this.activeTab = e.currentTarget.dataset.tab;
this.updateContent();
});
});
const saveBtn = this.container.querySelector('#save-settings');
if (saveBtn) {
saveBtn.addEventListener('click', async () => {
await this.saveSettings();
});
}
const closeBtn = this.container.querySelector('#close-page');
if (closeBtn) {
closeBtn.addEventListener('click', (e) => {
e.preventDefault();
this.close();
});
}
const resetBtn = this.container.querySelector('#reset-settings');
if (resetBtn) {
resetBtn.addEventListener('click', () => {
if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
this.config.reset().then(() => {
this.notifications.success('Настройки сброшены. Перезагрузка...');
setTimeout(() => window.location.reload(), 1000);
});
}
});
}
const resetStatsBtn = this.container.querySelector('#reset-stats');
if (resetStatsBtn) {
resetStatsBtn.addEventListener('click', () => {
if (confirm('Сбросить всю статистику?')) {
this.statistics.reset().then(() => {
this.notifications.success('Статистика сброшена. Перезагрузка...');
setTimeout(() => window.location.reload(), 1000);
});
}
});
}
const checkUpdatesBtn = this.container.querySelector('#check-updates');
if (checkUpdatesBtn) {
checkUpdatesBtn.addEventListener('click', async () => {
checkUpdatesBtn.disabled = true;
checkUpdatesBtn.textContent = 'Проверка...';
if (window.remangaExtension && window.remangaExtension.updateChecker) {
await window.remangaExtension.updateChecker.checkForUpdates(true);
}
checkUpdatesBtn.disabled = false;
checkUpdatesBtn.textContent = 'Проверить обновления';
});
}
const durationSlider = this.container.querySelector('#notificationDuration');
const durationValue = this.container.querySelector('#durationValue');
if (durationSlider && durationValue) {
durationSlider.addEventListener('input', (e) => {
durationValue.textContent = e.target.value;
});
}
const batchSizeSlider = this.container.querySelector('#batchSize');
const batchSizeValue = this.container.querySelector('#batchSizeValue');
if (batchSizeSlider && batchSizeValue) {
batchSizeSlider.addEventListener('input', (e) => {
batchSizeValue.textContent = e.target.value;
});
}
const feedbackBtn = this.container.querySelector('#open-feedback-modal');
if (feedbackBtn) {
feedbackBtn.addEventListener('click', () => {
if (window.remangaExtension && window.remangaExtension.feedbackButton) {
window.remangaExtension.feedbackButton.openContextModal();
}
});
}
if (this.activeTab === 'general') {
this.updateLastCheckInfo();
}
}
updateContent() {
const contentContainer = this.container.querySelector('div[style*="flex: 1"]');
if (contentContainer) {
contentContainer.innerHTML = this.renderTabContent();
}
this.container.querySelectorAll('.settings-tab').forEach(tab => {
const isActive = tab.dataset.tab === this.activeTab;
tab.style.background = isActive ? DESIGN_TOKENS.colors.bg.secondary : DESIGN_TOKENS.colors.bg.primary;
tab.setAttribute('data-active', isActive);
});
this.attachEventListeners();
}
async saveSettings() {
try {
const hideProfileBlocks = {};
this.container.querySelectorAll('.profile-block-checkbox').forEach(checkbox => {
hideProfileBlocks[checkbox.dataset.block] = checkbox.checked;
});
const settings = {
autoLike: this.container.querySelector('#autoLike')?.checked ?? this.config.get('autoLike'),
skipProcessed: this.container.querySelector('#skipProcessed')?.checked ?? this.config.get('skipProcessed'),
batchSize: parseInt(this.container.querySelector('#batchSize')?.value ?? this.config.get('batchSize')),
notificationsEnabled: this.container.querySelector('#notificationsEnabled')?.checked ?? this.config.get('notificationsEnabled'),
notificationDuration: parseInt(this.container.querySelector('#notificationDuration')?.value ?? this.config.get('notificationDuration')),
autoUpdateEnabled: this.container.querySelector('#autoUpdateEnabled')?.checked ?? this.config.get('autoUpdateEnabled'),
blockCustomThemes: this.container.querySelector('#blockCustomThemes')?.checked ?? this.config.get('blockCustomThemes'),
hideChatIndicator: this.container.querySelector('#hideChatIndicator')?.checked ?? this.config.get('hideChatIndicator'),
highlightGuilds: this.container.querySelector('#highlightGuilds')?.checked ?? this.config.get('highlightGuilds'),
userTooltipEnabled: this.container.querySelector('#userTooltipEnabled')?.checked ?? this.config.get('userTooltipEnabled'),
hideProfileBlocks
};
await this.config.save(settings);
this.notifications.success('Настройки сохранены. Перезагрузка...');
setTimeout(() => {
this.cleanup();
window.location.reload();
}, 1000);
logger.info('Настройки успешно сохранены');
} catch (error) {
logger.error('Ошибка сохранения настроек:', error);
this.notifications.error('Ошибка сохранения настроек');
}
}
async updateLastCheckInfo() {
const lastCheckInfo = this.container.querySelector('#last-check-info');
if (window.remangaExtension && window.remangaExtension.updateChecker) {
const lastCheck = await window.remangaExtension.updateChecker.getLastCheckTime();
if (lastCheck > 0) {
const date = new Date(lastCheck);
const now = Date.now();
const diff = now - lastCheck;
const hours = Math.floor(diff / (1000 * 60 * 60));
if (hours < 1) {
lastCheckInfo.textContent = 'Последняя проверка: только что';
} else if (hours < 24) {
lastCheckInfo.textContent = `Последняя проверка: ${hours} ч. назад`;
} else {
lastCheckInfo.textContent = `Последняя проверка: ${date.toLocaleDateString('ru-RU')}`;
}
} else {
lastCheckInfo.textContent = 'Обновления еще не проверялись';
}
} else {
lastCheckInfo.textContent = 'Информация недоступна';
}
}
injectStyles() {
if (document.getElementById('remanga-ext-settings-page-styles')) {
return;
}
const style = document.createElement('style');
style.id = 'remanga-ext-settings-page-styles';
style.textContent = `
#remanga-ext-settings-page button:hover {
opacity: 0.9;
transform: translateY(-1px);
}
#remanga-ext-settings-page button:active {
transform: translateY(0);
}
#remanga-ext-settings-page .settings-tab:hover {
opacity: 0.7;
background: rgba(37, 39, 44, 0.5) !important;
}
#remanga-ext-settings-page .settings-tab[data-active="true"]:hover {
background: rgba(37, 39, 44, 0.8) !important;
}
#remanga-ext-settings-page input[type="checkbox"]:hover {
transform: scale(1.1);
}
#remanga-ext-settings-page input[type="range"] {
-webkit-appearance: none;
appearance: none;
height: 6px;
background: #374151;
border-radius: 3px;
outline: none;
cursor: pointer;
}
#remanga-ext-settings-page input[type="range"]::-webkit-slider-thumb {
-webkit-appearance: none;
appearance: none;
width: 18px;
height: 18px;
background: ${DESIGN_TOKENS.colors.bg.surface};
border-radius: 50%;
cursor: pointer;
}
#remanga-ext-settings-page input[type="range"]::-moz-range-thumb {
width: 18px;
height: 18px;
background: ${DESIGN_TOKENS.colors.bg.surface};
border-radius: 50%;
cursor: pointer;
border: none;
}
#remanga-ext-settings-page nav a:hover {
background: ${DESIGN_TOKENS.colors.interactive.hover};
}
`;
document.head.appendChild(style);
}
cleanup() {
if (this.container && this.container.parentNode) {
this.container.parentNode.removeChild(this.container);
this.container = null;
logger.info('SettingsPage удалена');
}
const styles = document.getElementById('remanga-ext-settings-page-styles');
if (styles && styles.parentNode) {
styles.parentNode.removeChild(styles);
}
}
}

class FeedbackButton {
constructor(config, notifications) {
this.config = config;
this.notifications = notifications;
this.botUsername = 'remanga_extension_bot'; // TODO: заменить на реальное имя бота
this.modal = null;
}
openContextModal() {
if (this.modal) {
this.modal.remove();
}
const overlay = document.createElement('div');
overlay.style.cssText = overlayStyles();
const modal = document.createElement('div');
modal.style.cssText = modalStyles() + `
min-width: 500px;
max-width: 600px;
`;
modal.innerHTML = `
<h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xxl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.bold}; color: ${DESIGN_TOKENS.colors.text.primary};">
Обратная связь
</h2>
<p style="margin-bottom: ${DESIGN_TOKENS.spacing.lg}; color: ${DESIGN_TOKENS.colors.text.secondary};">
Выберите тип обращения и технические данные для отправки:
</p>
<div style="margin-bottom: ${DESIGN_TOKENS.spacing.lg};">
<label style="display: block; margin-bottom: ${DESIGN_TOKENS.spacing.sm}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">
Тип обращения
</label>
<select id="feedback-type" style="
width: 100%;
padding: ${DESIGN_TOKENS.spacing.md};
background: ${DESIGN_TOKENS.colors.bg.surface};
color: ${DESIGN_TOKENS.colors.text.primary};
border: 1px solid #374151;
border-radius: ${DESIGN_TOKENS.radius.md};
font-family: ${DESIGN_TOKENS.typography.fontFamily};
font-size: ${DESIGN_TOKENS.typography.fontSize.md};
cursor: pointer;
">
<option value="bug">🐛 Сообщить о баге</option>
<option value="feature">💡 Предложить функцию</option>
<option value="question">❓ Задать вопрос</option>
<option value="other">📝 Другое</option>
</select>
</div>
<div style="margin-bottom: ${DESIGN_TOKENS.spacing.lg};">
<div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary}; margin-bottom: ${DESIGN_TOKENS.spacing.md};">
Включить технические данные:
</div>
<label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; margin-bottom: ${DESIGN_TOKENS.spacing.sm}; cursor: pointer;">
<input type="checkbox" id="include-version" checked style="width: 20px; height: 20px; cursor: pointer;">
<div>
<div style="color: ${DESIGN_TOKENS.colors.text.primary};">Версия расширения</div>
<div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Текущая версия: ${this.getVersion()}</div>
</div>
</label>
<label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; margin-bottom: ${DESIGN_TOKENS.spacing.sm}; cursor: pointer;">
<input type="checkbox" id="include-browser" checked style="width: 20px; height: 20px; cursor: pointer;">
<div>
<div style="color: ${DESIGN_TOKENS.colors.text.primary};">Браузер</div>
<div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">${this.detectBrowser()}</div>
</div>
</label>
<label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
<input type="checkbox" id="include-url" checked style="width: 20px; height: 20px; cursor: pointer;">
<div>
<div style="color: ${DESIGN_TOKENS.colors.text.primary};">Текущая страница</div>
<div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted}; word-break: break-all;">${this.truncateUrl(window.location.href)}</div>
</div>
</label>
</div>
<div style="margin-bottom: ${DESIGN_TOKENS.spacing.lg}; padding: ${DESIGN_TOKENS.spacing.md}; background: ${DESIGN_TOKENS.colors.bg.surface}; border-radius: ${DESIGN_TOKENS.radius.md}; border-left: 3px solid ${DESIGN_TOKENS.colors.text.secondary};">
<div style="color: ${DESIGN_TOKENS.colors.text.primary}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; margin-bottom: ${DESIGN_TOKENS.spacing.sm};">
ℹКак отправить обращение:
</div>
<div style="color: ${DESIGN_TOKENS.colors.text.muted}; font-size: ${DESIGN_TOKENS.typography.fontSize.sm};">
1. Нажмите "Открыть бота"<br>
2. Команда скопируется автоматически<br>
3. Вставьте её в чат с ботом (Ctrl+V)
</div>
</div>
<div style="display: flex; gap: ${DESIGN_TOKENS.spacing.md}; justify-content: flex-end;">
<button id="feedback-cancel" style="${buttonStyles('secondary')}">
Отмена
</button>
<button id="feedback-submit" style="${buttonStyles('primary')}">
Открыть бота
</button>
</div>
`;
overlay.appendChild(modal);
document.body.appendChild(overlay);
this.modal = overlay;
modal.querySelector('#feedback-cancel').addEventListener('click', () => {
overlay.remove();
this.modal = null;
});
modal.querySelector('#feedback-submit').addEventListener('click', () => {
this.submitFeedback(modal);
});
overlay.addEventListener('click', (e) => {
if (e.target === overlay) {
overlay.remove();
this.modal = null;
}
});
logger.info('Feedback modal opened');
}
submitFeedback(modal) {
try {
const type = modal.querySelector('#feedback-type').value;
const includeVersion = modal.querySelector('#include-version').checked;
const includeBrowser = modal.querySelector('#include-browser').checked;
const includeUrl = modal.querySelector('#include-url').checked;
const context = {
v: includeVersion ? this.getVersion() : null,
b: includeBrowser ? this.detectBrowser() : null,
u: includeUrl ? window.location.href : null
};
const deepLink = this.generateDeepLink(type, context);
const command = `/start ${deepLink.split('?start=')[1]}`;
navigator.clipboard.writeText(command).then(() => {
this.notifications.success('Команда скопирована! Вставьте её в бота.');
}).catch(() => {
this.notifications.info('Скопируйте команду вручную из бота');
});
window.open(`https://t.me/${this.botUsername}`, '_blank');
this.modal.remove();
this.modal = null;
logger.info('Feedback deep link generated', { type, context });
} catch (error) {
logger.error('Error submitting feedback', { error: error.message });
this.notifications.error('Ошибка при открытии бота');
}
}
generateDeepLink(type, context) {
const payload = {
type,
...context
};
const json = JSON.stringify(payload);
const base64 = btoa(json);
const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
return `https://t.me/${this.botUsername}?start=${base64url}`;
}
getVersion() {
return '1.6.5'; // Заменяется при сборке
}
detectBrowser() {
const ua = navigator.userAgent;
if (ua.includes('Firefox')) return 'Firefox';
if (ua.includes('Edg')) return 'Edge';
if (ua.includes('Chrome')) return 'Chrome';
if (ua.includes('Safari')) return 'Safari';
return 'Unknown';
}
truncateUrl(url, maxLength = 60) {
if (url.length <= maxLength) {
return url;
}
return url.substring(0, maxLength) + '...';
}
cleanup() {
if (this.modal) {
this.modal.remove();
this.modal = null;
}
}
}

class HeaderCustomizer {
constructor(config) {
this.config = config;
this.styleElement = null;
}
init() {
this.injectStyles();
logger.info('HeaderCustomizer инициализирован');
}
injectStyles() {
if (this.styleElement) {
return;
}
const hideChatIndicator = this.config.get('hideChatIndicator');
if (!hideChatIndicator) {
return;
}
const styles = `
/* Скрытие индикатора непрочитанных сообщений в чате */
a[href*="/chat"] [data-slot="badge"] {
display: none !important;
}
`;
this.styleElement = document.createElement('style');
this.styleElement.id = 'remanga-header-customizer';
this.styleElement.textContent = styles;
document.head.appendChild(this.styleElement);
logger.info('HeaderCustomizer стили применены');
}
update() {
this.cleanup();
this.injectStyles();
}
cleanup() {
if (this.styleElement && this.styleElement.parentNode) {
this.styleElement.parentNode.removeChild(this.styleElement);
this.styleElement = null;
logger.info('HeaderCustomizer стили удалены');
}
}
}

class ProfileCustomizer {
constructor(config) {
this.config = config;
this.observer = null;
this.styleElement = null;
}
init() {
this.blockCustomThemes();
this.hideProfileBlocks();
this.startObserver();
logger.info('ProfileCustomizer инициализирован');
}
blockCustomThemes() {
const blockThemes = this.config.get('blockCustomThemes');
if (!blockThemes) {
return;
}
const styleTags = document.querySelectorAll('style:not([id^="remanga-"]):not([data-styled]):not([data-emotion])');
styleTags.forEach(tag => {
const content = tag.textContent || '';
if (content.includes('background') || content.includes('color')) {
tag.setAttribute('data-blocked-by-remanga', 'true');
tag.textContent = '';
logger.debug('Заблокирован кастомный style тег');
}
});
const elementsWithInlineStyles = document.querySelectorAll('[style*="background"], [style*="color"]');
elementsWithInlineStyles.forEach(el => {
if (!el.id || !el.id.startsWith('remanga-')) {
const style = el.getAttribute('style') || '';
const cleanedStyle = style
.split(';')
.filter(rule => {
const prop = rule.trim().split(':')[0];
return prop && !prop.includes('background') && !prop.includes('color');
})
.join(';');
if (cleanedStyle) {
el.setAttribute('style', cleanedStyle);
} else {
el.removeAttribute('style');
}
}
});
logger.info('Кастомные темы заблокированы');
}
hideProfileBlocks() {
const hideBlocks = this.config.get('hideProfileBlocks');
if (!hideBlocks || typeof hideBlocks !== 'object') {
return;
}
const blockTexts = {
statistics: ['Просмотры', 'Лайки', 'Посты', 'Комменты'],
badges: ['Бейджи'],
achievements: ['Ачивки'],
favoriteCards: ['Избранные карточки'],
publishers: ['Паблишеры'],
guilds: ['Гильдии'],
friends: ['Друзья'],
followers: ['Подписчики'],
comments: ['Комментарии']
};
Object.keys(hideBlocks).forEach(blockKey => {
if (hideBlocks[blockKey] && blockTexts[blockKey]) {
if (blockKey === 'statistics') {
const statsBlock = document.querySelector('ul.cs-layout-stats-root');
if (statsBlock && !statsBlock.hasAttribute('data-hidden-by-remanga')) {
statsBlock.style.display = 'none';
statsBlock.setAttribute('data-hidden-by-remanga', blockKey);
logger.debug(`Скрыт блок: ${blockKey}`);
}
} else {
blockTexts[blockKey].forEach(text => {
const headers = Array.from(document.querySelectorAll('h2, h3, h4'));
headers.forEach(header => {
const headerText = header.textContent.trim();
if (headerText === text) {
let blockElement = header.closest('section');
if (!blockElement) {
let parent = header.parentElement;
for (let i = 0; i < 3 && parent && parent !== document.body; i++) {
const hasMultipleChildren = parent.children.length > 2;
const hasMinHeight = parent.offsetHeight > 100;
if (hasMultipleChildren && hasMinHeight) {
blockElement = parent;
break;
}
parent = parent.parentElement;
}
}
if (blockElement &&
blockElement !== document.body &&
!blockElement.hasAttribute('data-hidden-by-remanga') &&
!blockElement.querySelector('header') &&
blockElement.offsetHeight > 50) {
blockElement.style.display = 'none';
blockElement.setAttribute('data-hidden-by-remanga', blockKey);
logger.debug(`Скрыт блок: ${blockKey} (${text})`);
}
}
});
});
}
}
});
logger.info('Блоки профиля скрыты:', Object.keys(hideBlocks).filter(k => hideBlocks[k]));
}
startObserver() {
const blockThemes = this.config.get('blockCustomThemes');
const hideBlocks = this.config.get('hideProfileBlocks');
if (!blockThemes && (!hideBlocks || typeof hideBlocks !== 'object')) {
return;
}
this.observer = new MutationObserver(mutations => {
let shouldHideBlocks = false;
mutations.forEach(mutation => {
mutation.addedNodes.forEach(node => {
if (node.nodeType === 1) {
if (blockThemes) {
if (node.tagName === 'STYLE' &&
!node.id?.startsWith('remanga-') &&
!node.hasAttribute('data-styled') &&
!node.hasAttribute('data-emotion')) {
const content = node.textContent || '';
if (content.includes('background') || content.includes('color')) {
node.setAttribute('data-blocked-by-remanga', 'true');
node.textContent = '';
logger.debug('MutationObserver: заблокирован добавленный style тег');
}
}
if (node.hasAttribute && node.hasAttribute('style')) {
const style = node.getAttribute('style') || '';
if ((style.includes('background') || style.includes('color')) &&
(!node.id || !node.id.startsWith('remanga-'))) {
const cleanedStyle = style
.split(';')
.filter(rule => {
const prop = rule.trim().split(':')[0];
return prop && !prop.includes('background') && !prop.includes('color');
})
.join(';');
if (cleanedStyle) {
node.setAttribute('style', cleanedStyle);
} else {
node.removeAttribute('style');
}
logger.debug('MutationObserver: очищены inline стили');
}
}
}
if (hideBlocks && typeof hideBlocks === 'object') {
if (node.tagName === 'H2' || node.tagName === 'H3' || node.tagName === 'SECTION' || node.tagName === 'DIV') {
shouldHideBlocks = true;
}
}
}
});
});
if (shouldHideBlocks) {
this.hideProfileBlocks();
}
});
this.observer.observe(document.body, {
childList: true,
subtree: true,
attributes: true,
attributeFilter: ['style']
});
logger.info('MutationObserver запущен');
}
update() {
this.cleanup();
this.init();
}
cleanup() {
if (this.observer) {
this.observer.disconnect();
this.observer = null;
logger.info('MutationObserver остановлен');
}
if (this.styleElement && this.styleElement.parentNode) {
this.styleElement.parentNode.removeChild(this.styleElement);
this.styleElement = null;
logger.info('ProfileCustomizer стили удалены');
}
const hiddenElements = document.querySelectorAll('[data-hidden-by-remanga]');
hiddenElements.forEach(el => {
el.style.display = '';
el.removeAttribute('data-hidden-by-remanga');
});
}
}

class GuildHighlighter {
constructor(config) {
this.config = config;
this.intersectionObserver = null;
this.mutationObserver = null;
this.debounceTimer = null;
this.processedElements = new WeakSet();
this.targetGuilds = new Set([
'Демоны Дракмортуса',
'Святой Культ Крыс',
'Семь Смертных Грехов DS',
'И г г д р а с и л ь',
'Р К Н',
'Diavol Satori Филиал',
'Diavol Satori',
'Шаббат'
]);
}
init(pageType) {
const enabled = this.config.get('highlightGuilds');
if (!enabled) {
logger.info('Выделение гильдий отключено в настройках');
return;
}
this.cleanup();
logger.info(`Инициализация GuildHighlighter для типа страницы: ${pageType}`);
this.setupIntersectionObserver();
if (pageType === 'forum') {
this.initForumPage();
} else if (pageType === 'guild-top') {
this.initGuildTopPage();
}
}
setupIntersectionObserver() {
if (this.intersectionObserver) {
return;
}
this.intersectionObserver = new IntersectionObserver(
(entries) => {
entries.forEach(entry => {
if (entry.isIntersecting && !this.processedElements.has(entry.target)) {
this.processElement(entry.target);
}
});
},
{
root: null,
rootMargin: '500px',
threshold: 0
}
);
logger.debug('IntersectionObserver настроен');
}
initForumPage() {
logger.info('Инициализация страницы форума');
this.highlightForumPosts();
this.startMutationObserver('forum');
}
initGuildTopPage() {
logger.info('Инициализация страницы топа гильдий');
this.highlightGuildTopItems();
this.startMutationObserver('guild-top');
}
highlightForumPosts() {
const posts = document.querySelectorAll('article.cs-post-item');
posts.forEach(post => {
if (!this.processedElements.has(post)) {
this.intersectionObserver.observe(post);
}
});
logger.info(`[GuildHighlighter] Найдено ${posts.length} постов на форуме`);
}
highlightGuildTopItems() {
const items = document.querySelectorAll('a[href*="/guild/"][href*="/about"]');
items.forEach(item => {
if (!this.processedElements.has(item)) {
this.intersectionObserver.observe(item);
}
});
logger.info(`[GuildHighlighter] Найдено ${items.length} элементов в топе гильдий`);
}
processElement(element) {
const guildName = this.extractGuildName(element);
logger.info(`[GuildHighlighter] Извлечено название гильдии: "${guildName}"`);
if (guildName && this.targetGuilds.has(guildName)) {
this.applyHighlight(element);
logger.info(`[GuildHighlighter] ✓ Выделен элемент от гильдии: ${guildName}`);
} else if (guildName) {
logger.info(`[GuildHighlighter] ✗ Гильдия не в списке целевых: ${guildName}`);
}
this.processedElements.add(element);
this.intersectionObserver.unobserve(element);
}
extractGuildName(element) {
if (element.tagName === 'A' && element.href.includes('/guild/')) {
const img = element.querySelector('img[alt]');
if (img && img.alt) {
try {
return validators.sanitizeGuildName(img.alt);
} catch (error) {
logger.warn('Невалидное название гильдии:', error);
return null;
}
}
}
const guildLink = element.querySelector('a[href*="/guild/"]');
if (!guildLink) {
return null;
}
const img = guildLink.querySelector('img[alt]');
if (!img || !img.alt) {
return null;
}
try {
return validators.sanitizeGuildName(img.alt);
} catch (error) {
logger.warn('Невалидное название гильдии:', error);
return null;
}
}
applyHighlight(element) {
if (!(element instanceof HTMLElement)) {
logger.warn('Попытка применить стили к невалидному элементу');
return;
}
element.style.borderLeft = '3px solid rgba(255, 255, 255, 0.3)';
element.style.background = 'rgba(255, 255, 255, 0.05)';
element.style.boxShadow = '0 0 12px rgba(255, 255, 255, 0.2)';
element.setAttribute('data-guild-highlighted', 'true');
}
startMutationObserver(pageType) {
if (this.mutationObserver) {
return;
}
this.mutationObserver = new MutationObserver(() => {
clearTimeout(this.debounceTimer);
this.debounceTimer = setTimeout(() => {
if (pageType === 'forum') {
this.highlightForumPosts();
} else if (pageType === 'guild-top') {
this.highlightGuildTopItems();
}
}, 100);
});
this.mutationObserver.observe(document.body, {
childList: true,
subtree: true
});
logger.debug('MutationObserver запущен');
}
cleanup() {
clearTimeout(this.debounceTimer);
this.debounceTimer = null;
if (this.intersectionObserver) {
this.intersectionObserver.disconnect();
this.intersectionObserver = null;
logger.debug('IntersectionObserver отключен');
}
if (this.mutationObserver) {
this.mutationObserver.disconnect();
this.mutationObserver = null;
logger.debug('MutationObserver отключен');
}
this.processedElements = new WeakSet();
const highlightedElements = document.querySelectorAll('[data-guild-highlighted]');
highlightedElements.forEach(el => {
el.style.borderLeft = '';
el.style.background = '';
el.style.boxShadow = '';
el.removeAttribute('data-guild-highlighted');
});
logger.info('GuildHighlighter очищен');
}
}

class UserTooltip {
constructor(api, config, renderer) {
this.api = api;
this.config = config;
this.renderer = renderer;
this.cache = new Map();
this.hoverTimeout = null;
this.currentHoveredElement = null;
this.isEnabled = true;
this.requestId = 0;
this.boundHandleMouseOver = this.handleMouseOver.bind(this);
this.boundHandleMouseOut = this.handleMouseOut.bind(this);
}
init() {
if (!this.config.get('userTooltipEnabled')) {
logger.info('Тултипы профилей отключены в настройках');
return;
}
this.renderer.injectStyles();
this.attachEventListeners();
logger.info('UserTooltip инициализирован');
}
attachEventListeners() {
document.addEventListener('mouseover', this.boundHandleMouseOver, true);
document.addEventListener('mouseout', this.boundHandleMouseOut, true);
}
handleMouseOver(event) {
if (!this.isEnabled) return;
const avatarLink = this.findAvatarLink(event.target);
if (!avatarLink) return;
const userId = this.extractUserId(avatarLink);
if (!userId) return;
this.currentHoveredElement = avatarLink;
this.clearHoverTimeout();
const requestId = ++this.requestId;
this.hoverTimeout = setTimeout(() => {
if (this.currentHoveredElement === avatarLink && this.requestId === requestId) {
this.showTooltip(userId, avatarLink, requestId);
}
}, 500);
}
handleMouseOut(event) {
const avatarLink = this.findAvatarLink(event.target);
if (!avatarLink) return;
if (this.currentHoveredElement === avatarLink) {
this.clearHoverTimeout();
this.currentHoveredElement = null;
this.renderer.remove();
}
}
findAvatarLink(element) {
let current = element;
let depth = 0;
const maxDepth = 5;
while (current && depth < maxDepth) {
if (current.tagName === 'A' && current.href && current.href.includes('/user/') && current.href.includes('/about')) {
return current;
}
current = current.parentElement;
depth++;
}
return null;
}
extractUserId(link) {
const match = link.href.match(/\/user\/(\d+)\//);
if (!match) return null;
const userId = parseInt(match[1]);
if (!Number.isInteger(userId) || userId <= 0) {
logger.warn(`Невалидный ID пользователя: ${userId}`);
return null;
}
return userId;
}
async showTooltip(userId, targetElement, requestId) {
try {
const userData = await this.getUserData(userId);
if (!userData) {
logger.warn(`Не удалось получить данные пользователя ${userId}`);
return;
}
if (this.requestId === requestId && this.currentHoveredElement === targetElement) {
this.renderer.create(userData, targetElement);
}
} catch (error) {
logger.error('Ошибка показа тултипа:', error);
}
}
async getUserData(userId) {
if (this.cache.has(userId)) {
const cached = this.cache.get(userId);
const now = Date.now();
if (now - cached.timestamp < 5 * 60 * 1000) {
logger.debug(`Данные пользователя ${userId} взяты из кеша`);
return cached.data;
} else {
this.cache.delete(userId);
}
}
try {
const data = await this.api.request(`/api/v2/users/${userId}/`);
if (!data) {
return null;
}
const userData = {
id: data.id,
username: data.username,
avatar: data.avatar,
level: data.level,
chapters_read: data.chapters_read,
main_club: data.main_club,
is_online: data.is_online
};
this.cache.set(userId, {
data: userData,
timestamp: Date.now()
});
logger.debug(`Данные пользователя ${userId} загружены и закешированы`);
return userData;
} catch (error) {
logger.error(`Ошибка загрузки данных пользователя ${userId}:`, error);
return null;
}
}
clearHoverTimeout() {
if (this.hoverTimeout) {
clearTimeout(this.hoverTimeout);
this.hoverTimeout = null;
}
}
clearCache() {
this.cache.clear();
logger.debug('Кеш тултипов очищен');
}
setEnabled(enabled) {
this.isEnabled = enabled;
if (!enabled) {
this.clearHoverTimeout();
this.renderer.remove();
}
logger.debug(`Тултипы ${enabled ? 'включены' : 'отключены'}`);
}
cleanup() {
this.clearHoverTimeout();
this.renderer.remove();
this.cache.clear();
this.currentHoveredElement = null;
logger.info('UserTooltip очищен');
}
}

class ChapterManager {constructor(apiClient, config, notifications, statistics) {this.api = apiClient;this.config = config;this.notifications = notifications;this.statistics = statistics;this.processingQueue = [];this.operationTimes = [];}async markAsRead(chapterId) {try {await this.api.markChapterAsRead(chapterId);logger.debug(`Глава ${chapterId} отмечена как прочитанная`);this.updateReadButton(chapterId);return true;} catch (error) {logger.error(`Ошибка отметки главы ${chapterId}:`, error);return false;}}async markMultipleAsRead(chapterIds, onProgress = null) {const skipProcessed = this.config.get('skipProcessed');let filteredIds = chapterIds;if (skipProcessed) {filteredIds = chapterIds.filter(id => !this.isChapterRead(id));const skipped = chapterIds.length - filteredIds.length;if (skipped > 0) {logger.info(`Пропущено ${skipped} уже прочитанных глав`);}}if (filteredIds.length === 0) {return { total: chapterIds.length, completed: 0, failed: 0, skipped: chapterIds.length };}const total = filteredIds.length;let completed = 0;let failed = 0;this.operationTimes = [];logger.info(`Начало массовой отметки ${total} глав`);for (const chapterId of filteredIds) {const startTime = Date.now();try {await this.api.markChapterAsRead(chapterId);completed++;this.updateReadButton(chapterId);const operationTime = Date.now() - startTime;this.operationTimes.push(operationTime);if (this.operationTimes.length > 10) {this.operationTimes.shift();}if (onProgress) {const eta = this.calculateETA(completed, total);onProgress(completed, total, eta);}await this.delay(300);} catch (error) {logger.error(`Ошибка отметки главы ${chapterId}:`, error);failed++;}}await this.statistics.incrementReads(completed);logger.info(`Массовая отметка завершена: ${completed} успешно, ${failed} ошибок`);return {total: chapterIds.length,completed,failed,skipped: chapterIds.length - filteredIds.length};}async likeChapter(chapterId) {try {await this.api.likeChapters([chapterId]);logger.debug(`Глава ${chapterId} лайкнута`);this.updateLikeButton(chapterId);return true;} catch (error) {logger.error(`Ошибка лайка главы ${chapterId}:`, error);return false;}}async likeMultiple(chapterIds, onProgress = null) {const skipProcessed = this.config.get('skipProcessed');let filteredIds = chapterIds;if (skipProcessed) {filteredIds = chapterIds.filter(id => !this.isChapterLiked(id));const skipped = chapterIds.length - filteredIds.length;if (skipped > 0) {logger.info(`Пропущено ${skipped} уже лайкнутых глав`);}}if (filteredIds.length === 0) {return { total: chapterIds.length, completed: 0, failed: 0, skipped: chapterIds.length };}const batchSize = this.config.get('batchSize');const total = filteredIds.length;let completed = 0;let failed = 0;this.operationTimes = [];logger.info(`Начало массового лайка ${total} глав (batch: ${batchSize})`);for (let i = 0; i < filteredIds.length; i += batchSize) {const batch = filteredIds.slice(i, i + batchSize);const startTime = Date.now();try {await this.api.likeChapters(batch);completed += batch.length;batch.forEach(id => this.updateLikeButton(id));const operationTime = Date.now() - startTime;this.operationTimes.push(operationTime);if (this.operationTimes.length > 10) {this.operationTimes.shift();}if (onProgress) {const eta = this.calculateETA(completed, total);onProgress(completed, total, eta);}if (i + batchSize < filteredIds.length) {await this.delay(500);}} catch (error) {logger.error('Ошибка лайка батча:', error);failed += batch.length;}}await this.statistics.incrementLikes(completed);logger.info(`Массовый лайк завершен: ${completed} успешно, ${failed} ошибок`);return {total: chapterIds.length,completed,failed,skipped: chapterIds.length - filteredIds.length};}updateReadButton(chapterId) {const button = domUtils.findReadButton(chapterId);if (button) {button.classList.add('remanga-ext-read');button.style.opacity = '0.5';}}updateLikeButton(chapterId) {const button = domUtils.findLikeButton(chapterId);if (button) {button.classList.add('remanga-ext-liked');const icon = button.querySelector('svg');if (icon) {icon.style.fill = '#ef4444';}}}async loadAllChaptersByScroll(onProgress = null) {logger.info('Начало загрузки глав через скролл');let previousCount = 0;let stableCount = 0;let scrollAttempts = 0;const maxScrollAttempts = 100;while (scrollAttempts < maxScrollAttempts) {const currentIds = this.getChapterIdsFromPage();const currentCount = currentIds.length;if (onProgress) {onProgress(currentCount);}if (currentCount === previousCount) {stableCount++;if (stableCount >= 3) {logger.info(`Загрузка завершена: ${currentCount} глав`);break;}} else {stableCount = 0;}previousCount = currentCount;window.scrollTo({top: document.documentElement.scrollHeight,behavior: 'smooth'});await this.delay(500);scrollAttempts++;}window.scrollTo({top: 0,behavior: 'smooth'});await this.delay(300);const finalIds = this.getChapterIdsFromPage();logger.info(`Итого загружено глав: ${finalIds.length}`);return finalIds;}getChapterIdsFromPage() {return domUtils.extractChapterIdsFromPage();}getCurrentChapterId() {return domUtils.extractChapterIdFromUrl();}delay(ms) {return new Promise(resolve => setTimeout(resolve, ms));}isChapterRead(chapterId) {const button = domUtils.findReadButton(chapterId);if (!button) {return false;}const isNativeRead = button.style.opacity === '0.5' ||button.disabled === true ||button.classList.contains('opacity-50') ||button.hasAttribute('disabled');const isExtensionRead = button.classList.contains('remanga-ext-read');return isNativeRead || isExtensionRead;}isChapterLiked(chapterId) {const button = domUtils.findLikeButton(chapterId);if (!button) {return false;}const icon = button.querySelector('svg');const isNativeLiked = icon && (icon.style.fill === 'rgb(239, 68, 68)' ||icon.style.fill === '#ef4444' ||icon.classList.contains('text-red-500') ||button.classList.contains('text-red-500') ||button.getAttribute('aria-pressed') === 'true');const isExtensionLiked = button.classList.contains('remanga-ext-liked');return isNativeLiked || isExtensionLiked;}calculateETA(completed, total) {if (this.operationTimes.length === 0 || completed === 0) {return null;}const avgTime = this.operationTimes.reduce((a, b) => a + b, 0) / this.operationTimes.length;const remaining = total - completed;const etaMs = remaining * avgTime;const minutes = Math.floor(etaMs / 60000);const seconds = Math.floor((etaMs % 60000) / 1000);return { minutes, seconds, totalSeconds: Math.floor(etaMs / 1000) };}}
class AutoLiker {constructor(chapterManager, config, notifications) {this.chapterManager = chapterManager;this.config = config;this.notifications = notifications;this.likedChapters = new Set();}async init() {if (!this.config.get('autoLike')) {logger.debug('Автолайк отключен');return;}const chapterId = this.chapterManager.getCurrentChapterId();if (!chapterId) {logger.warn('Не удалось определить ID главы');return;}if (this.likedChapters.has(chapterId)) {logger.debug(`Глава ${chapterId} уже была лайкнута в этой сессии`);return;}await this.likeCurrentChapter(chapterId);}async likeCurrentChapter(chapterId) {try {logger.info(`Автолайк главы ${chapterId}`);if (this.chapterManager.isChapterLiked(chapterId)) {logger.debug(`Глава ${chapterId} уже лайкнута, пропускаем`);return;}const success = await this.chapterManager.likeChapter(chapterId);if (success) {this.likedChapters.add(chapterId);this.notifications.success('Глава автоматически лайкнута');logger.debug(`Глава ${chapterId} успешно лайкнута`);}} catch (error) {logger.error('Ошибка автолайка:', error);}}wasLikedInSession(chapterId) {return this.likedChapters.has(chapterId);}clearHistory() {this.likedChapters.clear();}}
class RemangaExtension {constructor() {this.config = null;this.api = null;this.statistics = null;this.chapterManager = null;this.autoLiker = null;this.notifications = null;this.settingsPanel = null;this.updateChecker = null;this.progressModal = null;this.headerCustomizer = null;this.profileCustomizer = null;this.settingsPage = null;this.guildHighlighter = null;this.feedbackButton = null;this.userTooltip = null;this.observers = [];}async init() {try {logger.info('Инициализация расширения...');if (!this.isUserLoggedIn()) {logger.info('Пользователь не авторизован');return;}this.config = new Config();await this.config.load();this.statistics = new Statistics();await this.statistics.load();this.api = new ApiClient();this.api.init();this.notifications = new Notifications(this.config);this.notifications.injectStyles();this.chapterManager = new ChapterManager(this.api, this.config, this.notifications, this.statistics);this.autoLiker = new AutoLiker(this.chapterManager, this.config, this.notifications);this.settingsPanel = new SettingsPanel(this.config, this.notifications, this.statistics);this.updateChecker = new UpdateChecker(this.config, this.notifications);this.headerCustomizer = new HeaderCustomizer(this.config);this.profileCustomizer = new ProfileCustomizer(this.config);this.settingsPage = new SettingsPage(this.config, this.notifications, this.statistics);this.guildHighlighter = new GuildHighlighter(this.config);this.feedbackButton = new FeedbackButton(this.config, this.notifications);const tooltipRenderer = new TooltipRenderer();this.userTooltip = new UserTooltip(this.api, this.config, tooltipRenderer);this.userTooltip.init();window.remangaExtension = this;const pageType = this.detectPageType();logger.info(`Тип страницы: ${pageType}`);if (pageType === 'chapters') {this.initChaptersPage();} else if (pageType === 'reader') {this.initReaderPage();} else if (pageType === 'profile') {this.initProfilePage();} else if (pageType === 'forum' || pageType === 'guild-top') {this.initGuildPages(pageType);}this.settingsPanel.inject();this.headerCustomizer.init();await this.updateChecker.init();this.setupNavigationListener();logger.info('Расширение успешно инициализировано');window.addEventListener('beforeunload', () => {this.cleanup();});} catch (error) {logger.error('Ошибка инициализации:', error);}}setupNavigationListener() {let lastUrl = location.href;const checkUrlChange = () => {const currentUrl = location.href;if (currentUrl !== lastUrl) {lastUrl = currentUrl;this.handleUrlChange();}};const originalPushState = history.pushState;const originalReplaceState = history.replaceState;history.pushState = function(...args) {originalPushState.apply(this, args);checkUrlChange();};history.replaceState = function(...args) {originalReplaceState.apply(this, args);checkUrlChange();};window.addEventListener('popstate', checkUrlChange);logger.info('Navigation listener активирован');}handleUrlChange() {const pageType = this.detectPageType();logger.info(`URL изменен, новый тип страницы: ${pageType}`);if (pageType === 'chapters') {setTimeout(() => {this.initChaptersPage();}, 300);} else if (pageType === 'reader') {setTimeout(() => {this.initReaderPage();}, 300);} else if (pageType === 'profile') {setTimeout(() => {this.initProfilePage();}, 300);} else if (pageType === 'forum' || pageType === 'guild-top') {setTimeout(() => {this.initGuildPages(pageType);}, 300);} else {this.removeChapterButtons();this.cleanupProfilePage();this.cleanupGuildPages();}}cleanup() {this.observers.forEach(observer => observer.disconnect());this.observers = [];if (this.notifications) {this.notifications.cleanup();}if (this.settingsPanel) {this.settingsPanel.cleanup();}if (this.headerCustomizer) {this.headerCustomizer.cleanup();}if (this.profileCustomizer) {this.profileCustomizer.cleanup();}if (this.settingsPage) {this.settingsPage.cleanup();}if (this.guildHighlighter) {this.guildHighlighter.cleanup();}if (this.userTooltip) {this.userTooltip.cleanup();}logger.info('Ресурсы расширения очищены');}isUserLoggedIn() {return document.cookie.includes('token=');}detectPageType() {const path = window.location.pathname;if (path.includes('/user/') && path.includes('/about')) {return 'profile';}if (path.includes('/chapters')) {return 'chapters';}if (path.match(/\/manga\/[^/]+\/\d+/)) {return 'reader';}if (path.includes('/forum')) {return 'forum';}if (path.includes('/guild/top')) {return 'guild-top';}return 'other';}initChaptersPage() {logger.info('Инициализация страницы глав');let debounceTimer = null;const containerSelector = '.relative.flex.flex-col.gap-2';const reinjectButtons = () => {clearTimeout(debounceTimer);debounceTimer = setTimeout(() => {if (!window.location.pathname.includes('/chapters')) {this.removeChapterButtons();return;}const container = document.querySelector(containerSelector);if (container) {this.ensureButtonsExist(container);}}, 100);};const observer = new MutationObserver(reinjectButtons);domUtils.waitForElement(containerSelector, 5000).then(container => {this.ensureButtonsExist(container);observer.observe(document.body, {childList: true,subtree: true});this.observers.push(observer);logger.info('MutationObserver для кнопок активирован');}).catch(error => {logger.warn('Контейнер глав не найден:', error);});}removeChapterButtons() {const markAllBtn = document.getElementById('remanga-ext-mark-all-btn');const likeAllBtn = document.getElementById('remanga-ext-like-all-btn');if (markAllBtn) {markAllBtn.remove();logger.debug('Кнопка "Прочитать все" удалена');}if (likeAllBtn) {likeAllBtn.remove();logger.debug('Кнопка "Лайкнуть все" удалена');}}ensureButtonsExist(container) {if (!document.getElementById('remanga-ext-mark-all-btn')) {this.addMarkAllReadButton(container);}if (!document.getElementById('remanga-ext-like-all-btn')) {this.addLikeAllButton(container);}}async initReaderPage() {logger.info('Инициализация страницы чтения');if (this.config.get('autoLike')) {await this.autoLiker.init();}}initProfilePage() {logger.info('Инициализация страницы профиля');this.cleanupProfilePage();this.profileCustomizer.init();}cleanupProfilePage() {if (this.profileCustomizer) {this.profileCustomizer.cleanup();}}initGuildPages(pageType) {logger.info(`Инициализация страницы гильдий: ${pageType}`);this.cleanupGuildPages();if (this.guildHighlighter) {this.guildHighlighter.init(pageType);}}cleanupGuildPages() {if (this.guildHighlighter) {this.guildHighlighter.cleanup();}}addMarkAllReadButton(container) {if (document.getElementById('remanga-ext-mark-all-btn')) {return;}const button = document.createElement('button');button.id = 'remanga-ext-mark-all-btn';button.className = 'cs-button';button.style.cssText = buttonStyles('fullWidth') + `margin-bottom: ${DESIGN_TOKENS.spacing.md};`;button.textContent = '✓ Прочитать все главы';button.addEventListener('mouseenter', () => {button.style.opacity = '0.9';});button.addEventListener('mouseleave', () => {button.style.opacity = '1';});button.addEventListener('mousedown', () => {button.style.transform = 'scale(0.97)';});button.addEventListener('mouseup', () => {button.style.transform = 'scale(1)';});button.addEventListener('click', async () => {try {await this.handleMarkAllRead(button);} catch (error) {logger.error('Ошибка обработки массовой отметки:', error);this.notifications.error('Произошла ошибка при обработке');button.disabled = false;button.textContent = '✓ Прочитать все главы';this.hideProgressModal();}});container.insertBefore(button, container.firstChild);logger.info('Кнопка "Прочитать все" добавлена');}addLikeAllButton(container) {if (document.getElementById('remanga-ext-like-all-btn')) {return;}const button = document.createElement('button');button.id = 'remanga-ext-like-all-btn';button.className = 'cs-button';button.style.cssText = buttonStyles('fullWidth') + `margin-bottom: ${DESIGN_TOKENS.spacing.md};`;button.textContent = '❤️ Лайкнуть все главы';button.addEventListener('mouseenter', () => {button.style.opacity = '0.9';});button.addEventListener('mouseleave', () => {button.style.opacity = '1';});button.addEventListener('mousedown', () => {button.style.transform = 'scale(0.97)';});button.addEventListener('mouseup', () => {button.style.transform = 'scale(1)';});button.addEventListener('click', async () => {try {await this.handleLikeAll(button);} catch (error) {logger.error('Ошибка обработки массового лайка:', error);this.notifications.error('Произошла ошибка при обработке');button.disabled = false;button.textContent = '❤️ Лайкнуть все главы';this.hideProgressModal();}});container.insertBefore(button, container.children[1]);logger.info('Кнопка "Лайкнуть все" добавлена');}async handleMarkAllRead(button) {button.disabled = true;button.textContent = 'Подготовка...';this.showProgressModal('Этап 1/2: Загрузка глав', 0, 0, true);const chapterIds = await this.chapterManager.loadAllChaptersByScroll((count) => {this.updateProgressModalLoading(`Этап 1/2: Загрузка глав (${count})`);});if (chapterIds.length === 0) {this.hideProgressModal();this.notifications.warning('Главы не найдены');button.disabled = false;button.textContent = '✓ Прочитать все главы';return;}button.textContent = 'Обработка...';this.showProgressModal('Этап 2/2: Отметка глав как прочитанных', 0, chapterIds.length, false);const result = await this.chapterManager.markMultipleAsRead(chapterIds,(current, total, eta) => {this.updateProgressModal(current, total, eta);});this.hideProgressModal();button.disabled = false;button.textContent = '✓ Прочитать все главы';if (result.skipped > 0) {this.notifications.info(`Пропущено ${result.skipped} уже прочитанных глав`);}if (result.failed > 0) {this.notifications.warning(`Отмечено ${result.completed} из ${result.total} глав (${result.failed} ошибок)`);} else {this.notifications.success(`Отмечено ${result.completed} глав. Обновите страницу для отображения изменений.`);}}async handleLikeAll(button) {button.disabled = true;button.textContent = 'Подготовка...';this.showProgressModal('Этап 1/2: Загрузка глав', 0, 0, true);const chapterIds = await this.chapterManager.loadAllChaptersByScroll((count) => {this.updateProgressModalLoading(`Этап 1/2: Загрузка глав (${count})`);});if (chapterIds.length === 0) {this.hideProgressModal();this.notifications.warning('Главы не найдены');button.disabled = false;button.textContent = '❤️ Лайкнуть все главы';return;}button.textContent = 'Обработка...';this.showProgressModal('Этап 2/2: Лайк глав', 0, chapterIds.length, false);const result = await this.chapterManager.likeMultiple(chapterIds,(current, total, eta) => {this.updateProgressModal(current, total, eta);});this.hideProgressModal();button.disabled = false;button.textContent = '❤️ Лайкнуть все главы';if (result.skipped > 0) {this.notifications.info(`Пропущено ${result.skipped} уже лайкнутых глав`);}if (result.failed > 0) {this.notifications.warning(`Лайкнуто ${result.completed} из ${result.total} глав (${result.failed} ошибок)`);} else {this.notifications.success(`Лайкнуто ${result.completed} глав`);}}showProgressModal(title, current, total, isLoading = false) {if (this.progressModal) {this.progressModal.remove();}const overlay = document.createElement('div');overlay.style.cssText = overlayStyles();const modal = document.createElement('div');modal.id = 'remanga-ext-progress-modal';modal.style.cssText = modalStyles() + `min-width: 400px;`;if (isLoading) {modal.innerHTML = `<div style="margin-bottom: ${DESIGN_TOKENS.spacing.lg}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.bold}; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; color: ${DESIGN_TOKENS.colors.text.primary};">${title}</div><div style="display: flex; align-items: center; justify-content: center; padding: 20px 0;"><div style="width: 40px;height: 40px;border: 4px solid #374151;border-top-color: ${DESIGN_TOKENS.colors.bg.secondary};border-radius: 50%;animation: spin 1s linear infinite;"></div></div><div style="text-align: center; color: ${DESIGN_TOKENS.colors.text.muted}; font-size: ${DESIGN_TOKENS.typography.fontSize.md};"><span id="progress-text">Загрузка...</span></div><style>@keyframes spin {to { transform: rotate(360deg); }}</style>`;} else {const percent = total > 0 ? Math.round((current / total) * 100) : 0;modal.innerHTML = `<div style="margin-bottom: ${DESIGN_TOKENS.spacing.lg}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.bold}; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; color: ${DESIGN_TOKENS.colors.text.primary};">${title}</div><div style="background: #374151; height: 12px; border-radius: ${DESIGN_TOKENS.radius.sm}; overflow: hidden; margin-bottom: ${DESIGN_TOKENS.spacing.md};"><div id="progress-bar" style="background: ${DESIGN_TOKENS.colors.bg.secondary}; height: 100%; width: ${percent}%; transition: width ${DESIGN_TOKENS.transitions.normal};"></div></div><div style="text-align: center; color: ${DESIGN_TOKENS.colors.text.muted}; font-size: ${DESIGN_TOKENS.typography.fontSize.md};"><span id="progress-text">${current} из ${total}</span></div>`;}overlay.appendChild(modal);document.body.appendChild(overlay);this.progressModal = overlay;}updateProgressModalLoading(text) {if (!this.progressModal) {return;}const progressText = this.progressModal.querySelector('#progress-text');if (progressText) {progressText.textContent = text;}}updateProgressModal(current, total, eta = null) {if (!this.progressModal) {return;}const percent = Math.round((current / total) * 100);const progressBar = this.progressModal.querySelector('#progress-bar');const progressText = this.progressModal.querySelector('#progress-text');if (progressBar) {progressBar.style.width = `${percent}%`;}if (progressText) {let text = `${current} из ${total}`;if (eta && eta.totalSeconds > 0) {const mins = eta.minutes;const secs = eta.seconds;text += ` • Осталось ~${mins > 0 ? `${mins} мин ` : ''}${secs} сек`;}progressText.textContent = text;}}hideProgressModal() {if (this.progressModal) {setTimeout(() => {if (this.progressModal) {this.progressModal.remove();this.progressModal = null;}}, 500);}}}(function() {'use strict';const extension = new RemangaExtension();if (document.readyState === 'loading') {document.addEventListener('DOMContentLoaded', () => extension.init());} else {extension.init();}})();
})();
// ==UserScript==
// @name         Remanga Enhanced
// @namespace    remanga.ext
// @version      1.2.0
// @description  Автоматизация действий на remanga.org: автолайк, массовая отметка глав
// @author       fills
// @match        https://remanga.org/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @connect      api.remanga.org
// @run-at       document-idle
// ==/UserScript==

(function(){
'use strict';
const logger = {
prefix: '[RemangaExt]',
info(message, ...args) {
console.log(`${this.prefix} ${message}`, ...args);
},
warn(message, ...args) {
console.warn(`${this.prefix} ${message}`, ...args);
},
error(message, ...args) {
console.error(`${this.prefix} ${message}`, ...args);
},
debug(message, ...args) {
if (this.isDebugEnabled()) {
console.debug(`${this.prefix} [DEBUG] ${message}`, ...args);
}
},
isDebugEnabled() {
return localStorage.getItem('remanga_ext_debug') === 'true';
}
};

const validators = {
isChapterId(value) {
const num = parseInt(value);
return Number.isInteger(num) && num > 0 && num < Number.MAX_SAFE_INTEGER;
},
isChapterIds(values) {
if (!Array.isArray(values)) return false;
if (values.length === 0) return false;
return values.every(v => this.isChapterId(v));
},
isDelay(value) {
const num = parseInt(value);
return Number.isInteger(num) && num >= 1000 && num <= 60000;
},
isValidToken(token) {
if (typeof token !== 'string') return false;
if (token.length < 20 || token.length > 100) return false;
return /^[a-zA-Z0-9_-]+$/.test(token);
},
sanitizeChapterId(value) {
const num = parseInt(value);
if (!this.isChapterId(num)) {
throw new Error(`Невалидный ID главы: ${value}`);
}
return num;
},
sanitizeChapterIds(values) {
if (!Array.isArray(values)) {
throw new Error('ID глав должны быть массивом');
}
if (values.length === 0) {
throw new Error('Массив ID глав не может быть пустым');
}
if (values.length > 1000) {
throw new Error('Слишком много ID глав (максимум 1000)');
}
return values.map(v => this.sanitizeChapterId(v));
},
sanitizeSettings(settings) {
const sanitized = {};
if ('autoLike' in settings) {
sanitized.autoLike = Boolean(settings.autoLike);
}
if ('autoMarkAsRead' in settings) {
sanitized.autoMarkAsRead = Boolean(settings.autoMarkAsRead);
}
if ('notificationsEnabled' in settings) {
sanitized.notificationsEnabled = Boolean(settings.notificationsEnabled);
}
if ('notificationDuration' in settings) {
const duration = parseInt(settings.notificationDuration);
if (duration >= 1 && duration <= 10) {
sanitized.notificationDuration = duration;
}
}
if ('batchSize' in settings) {
const batchSize = parseInt(settings.batchSize);
if (batchSize >= 1 && batchSize <= 50) {
sanitized.batchSize = batchSize;
}
}
if ('skipProcessed' in settings) {
sanitized.skipProcessed = Boolean(settings.skipProcessed);
}
return sanitized;
}
};

const domUtils = {
waitForElement(selector, timeout = 10000) {
return new Promise((resolve, reject) => {
const existing = document.querySelector(selector);
if (existing) {
resolve(existing);
return;
}
let observer = null;
const timeoutId = setTimeout(() => {
if (observer) observer.disconnect();
reject(new Error(`Таймаут ожидания элемента: ${selector}`));
}, timeout);
observer = new MutationObserver(() => {
const element = document.querySelector(selector);
if (element) {
clearTimeout(timeoutId);
observer.disconnect();
resolve(element);
}
});
observer.observe(document.body, {
childList: true,
subtree: true
});
});
},
observeElement(selector, callback, options = {}) {
const element = document.querySelector(selector);
if (!element) {
logger.warn(`Элемент не найден: ${selector}`);
return null;
}
const defaultOptions = {
childList: true,
subtree: true,
attributes: false
};
const observer = new MutationObserver((mutations) => {
callback(mutations, element);
});
observer.observe(element, { ...defaultOptions, ...options });
return observer;
},
extractChapterIdFromUrl() {
const match = window.location.pathname.match(/\/manga\/[^/]+\/(\d+)/);
return match ? parseInt(match[1]) : null;
},
extractMangaSlug() {
const match = window.location.pathname.match(/\/manga\/([^/]+)/);
return match ? match[1] : null;
},
extractBranchId() {
const scripts = document.querySelectorAll('script[type="application/json"]');
for (const script of scripts) {
try {
const data = JSON.parse(script.textContent);
if (data.props?.pageProps?.branch?.id) {
return data.props.pageProps.branch.id;
}
} catch (e) {
}
}
if (typeof window !== 'undefined' && window.__NEXT_DATA__) {
const branchId = window.__NEXT_DATA__?.props?.pageProps?.branch?.id;
if (branchId) return branchId;
}
return null;
},
extractChapterIdsFromPage() {
const elements = document.querySelectorAll('[data-testid^="chapter_"]');
const ids = [];
elements.forEach(el => {
const match = el.dataset.testid.match(/chapter_(\d+)/);
if (match) {
ids.push(parseInt(match[1]));
}
});
return ids;
},
findReadButton(chapterId) {
return document.querySelector(`[data-testid="update_view_${chapterId}"]`);
},
findLikeButton(chapterId) {
return document.querySelector(`[data-testid="like_btn_${chapterId}"]`);
},
findNextChapterLink() {
const header = document.querySelector('header');
if (!header) return null;
const links = header.querySelectorAll('a[href*="/manga/"]');
const currentPath = window.location.pathname;
for (const link of links) {
const href = link.getAttribute('href');
if (href && href !== currentPath && href.match(/\/manga\/[^/]+\/\d+$/)) {
return link;
}
}
return null;
},
isAtPageBottom(threshold = 100) {
const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
const scrollHeight = document.documentElement.scrollHeight;
const clientHeight = document.documentElement.clientHeight;
return scrollTop + clientHeight >= scrollHeight - threshold;
}
};

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
skipProcessed: true
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

class ApiClient {
constructor() {
this.baseURL = 'https://api.remanga.org';
this.token = null;
this.requestCount = 0;
this.lastRequestTime = 0;
}
extractToken() {
const match = document.cookie.match(/token=([^;]+)/);
if (!match) {
throw new Error('Пользователь не авторизован');
}
const token = match[1];
if (!validators.isValidToken(token)) {
throw new Error('Невалидный токен авторизации');
}
return token;
}
init() {
try {
this.token = this.extractToken();
logger.info('API клиент инициализирован');
} catch (error) {
logger.error('Ошибка инициализации API клиента:', error);
throw error;
}
}
async rateLimit() {
const now = Date.now();
const timeSinceLastRequest = now - this.lastRequestTime;
const minDelay = 300;
if (timeSinceLastRequest < minDelay) {
const delay = minDelay - timeSinceLastRequest;
await new Promise(resolve => setTimeout(resolve, delay));
}
this.lastRequestTime = Date.now();
this.requestCount++;
}
async request(endpoint, options = {}) {
await this.rateLimit();
const url = `${this.baseURL}${endpoint}`;
const method = options.method || 'GET';
return new Promise((resolve, reject) => {
GM.xmlHttpRequest({
method: method,
url: url,
headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${this.token}`,
...options.headers
},
data: options.body ? JSON.stringify(options.body) : undefined,
timeout: 15000,
onload: (response) => {
if (response.status >= 200 && response.status < 300) {
if (response.status === 204) {
resolve(null);
} else {
try {
const data = JSON.parse(response.responseText);
resolve(data);
} catch (e) {
resolve(response.responseText);
}
}
} else {
logger.error(`API ошибка ${response.status}:`, response.statusText);
reject(new Error(`API ошибка: ${response.status}`));
}
},
onerror: (error) => {
logger.error('Сетевая ошибка:', error);
reject(new Error('Сетевая ошибка'));
},
ontimeout: () => {
logger.error('Таймаут запроса');
reject(new Error('Таймаут запроса'));
}
});
});
}
async markChapterAsRead(chapterId) {
const validId = validators.sanitizeChapterId(chapterId);
logger.debug(`Отметка главы ${validId} как прочитанной`);
return this.request('/api/activity/views/', {
method: 'POST',
body: { chapter: validId }
});
}
async likeChapters(chapterIds) {
const validIds = validators.sanitizeChapterIds(chapterIds);
logger.debug(`Лайк глав:`, validIds);
return this.request('/api/activity/votes/', {
method: 'POST',
body: { chapter_ids: validIds }
});
}
async getChapters(branchId, page = 1) {
const params = new URLSearchParams({
branch_id: branchId,
user_data: '1',
ordering: '-index',
page: page.toString()
});
return this.request(`/api/v2/titles/chapters/?${params.toString()}`);
}
async getCurrentUser() {
return this.request('/api/v2/users/current/');
}
getStats() {
return {
requestCount: this.requestCount,
lastRequestTime: this.lastRequestTime
};
}
}

class Notifications {
constructor(config) {
this.config = config;
this.queue = [];
this.activeToasts = new Map();
this.maxToasts = 5;
}
show(message, type = 'info') {
if (!this.config.get('notificationsEnabled')) {
return;
}
const validMessage = String(message);
const validTypes = ['info', 'success', 'warning', 'error'];
const validType = validTypes.includes(type) ? type : 'info';
const key = `${validType}:${validMessage}`;
const duration = this.config.get('notificationDuration') * 1000;
if (this.activeToasts.has(key)) {
const existing = this.activeToasts.get(key);
existing.count++;
this.updateToastCount(existing.toast, existing.count);
clearTimeout(existing.timeoutId);
existing.timeoutId = setTimeout(() => {
this.hide(key);
}, duration);
} else {
if (this.activeToasts.size >= this.maxToasts) {
const oldestKey = this.activeToasts.keys().next().value;
this.hide(oldestKey);
}
const toast = this.createToast(message, type);
document.body.appendChild(toast);
const timeoutId = setTimeout(() => {
this.hide(key);
}, duration);
this.activeToasts.set(key, { toast, timeoutId, count: 1 });
this.updateToastPositions();
}
}
cleanup() {
this.activeToasts.forEach((entry, key) => {
clearTimeout(entry.timeoutId);
if (entry.toast.parentNode) {
entry.toast.parentNode.removeChild(entry.toast);
}
});
this.activeToasts.clear();
}
createToast(message, type) {
const toast = document.createElement('div');
toast.className = `remanga-ext-toast remanga-ext-toast-${type}`;
const colors = {
info: '#3b82f6',
success: '#10b981',
warning: '#f59e0b',
error: '#ef4444'
};
toast.style.cssText = `
position: fixed;
top: 20px;
right: 20px;
z-index: 999999;
background: ${colors[type] || colors.info};
color: white;
padding: 16px 24px;
border-radius: 8px;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
font-family: system-ui, -apple-system, sans-serif;
font-size: 14px;
font-weight: 500;
max-width: 400px;
animation: remanga-toast-slide-in 0.3s ease;
cursor: pointer;
transition: top 0.3s ease;
display: flex;
align-items: center;
gap: 8px;
`;
const messageSpan = document.createElement('span');
messageSpan.className = 'remanga-ext-toast-message';
messageSpan.textContent = message;
const countBadge = document.createElement('span');
countBadge.className = 'remanga-ext-toast-count';
countBadge.style.cssText = `
display: none;
background: rgba(0, 0, 0, 0.2);
padding: 2px 8px;
border-radius: 12px;
font-size: 12px;
font-weight: 600;
`;
toast.appendChild(messageSpan);
toast.appendChild(countBadge);
const key = `${type}:${message}`;
toast.addEventListener('click', () => {
this.hide(key);
});
return toast;
}
updateToastCount(toast, count) {
const countBadge = toast.querySelector('.remanga-ext-toast-count');
if (countBadge) {
if (count > 1) {
countBadge.textContent = `x${count}`;
countBadge.style.display = 'block';
} else {
countBadge.style.display = 'none';
}
}
}
updateToastPositions() {
let offset = 20;
this.activeToasts.forEach(({ toast }) => {
toast.style.top = `${offset}px`;
offset += toast.offsetHeight + 12;
});
}
hide(key) {
const entry = this.activeToasts.get(key);
if (!entry) {
return;
}
clearTimeout(entry.timeoutId);
entry.toast.style.animation = 'remanga-toast-slide-out 0.3s ease';
setTimeout(() => {
if (entry.toast.parentNode) {
entry.toast.parentNode.removeChild(entry.toast);
}
this.activeToasts.delete(key);
this.updateToastPositions();
}, 300);
}
injectStyles() {
if (document.getElementById('remanga-ext-toast-styles')) return;
const style = document.createElement('style');
style.id = 'remanga-ext-toast-styles';
style.textContent = `
@keyframes remanga-toast-slide-in {
from {
transform: translateX(400px);
opacity: 0;
}
to {
transform: translateX(0);
opacity: 1;
}
}
@keyframes remanga-toast-slide-out {
from {
transform: translateX(0);
opacity: 1;
}
to {
transform: translateX(400px);
opacity: 0;
}
}
.remanga-ext-toast:hover {
opacity: 0.9;
}
`;
document.head.appendChild(style);
}
success(message) {
this.show(message, 'success');
}
error(message) {
this.show(message, 'error');
}
warning(message) {
this.show(message, 'warning');
}
info(message) {
this.show(message, 'info');
}
clearAll() {
this.activeToasts.forEach((_, key) => this.hide(key));
}
}

class SettingsPanel {
constructor(config, notifications, statistics) {
this.config = config;
this.notifications = notifications;
this.statistics = statistics;
this.panel = null;
this.observer = null;
}
inject() {
if (this.observer) {
logger.debug('Observer уже активен');
return;
}
let debounceTimer = null;
const reinjectButton = () => {
clearTimeout(debounceTimer);
debounceTimer = setTimeout(() => {
const header = document.querySelector('header');
if (header && !document.getElementById('remanga-ext-settings-btn')) {
this.injectHeaderButton(header);
logger.debug('Кнопка настроек переинъецирована');
}
}, 100);
};
this.observer = new MutationObserver(reinjectButton);
this.observer.observe(document.body, {
childList: true,
subtree: true
});
const existingHeader = document.querySelector('header');
if (existingHeader && !document.getElementById('remanga-ext-settings-btn')) {
this.injectHeaderButton(existingHeader);
}
logger.info('MutationObserver для кнопки настроек активирован');
}
cleanup() {
if (this.observer) {
this.observer.disconnect();
this.observer = null;
}
}
injectHeaderButton(header) {
const button = document.createElement('button');
button.id = 'remanga-ext-settings-btn';
button.className = 'remanga-ext-header-btn';
button.setAttribute('aria-label', 'Настройки расширения');
button.style.cssText = `
display: flex;
align-items: center;
justify-content: center;
width: 40px;
height: 40px;
background: transparent;
border: none;
border-radius: 8px;
cursor: pointer;
color: #9ca3af;
transition: all 0.2s;
margin: 0 4px;
`;
button.innerHTML = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
<path d="M19.11,9.59h-5.4V3.28a1.26,1.26,0,0,0-2.15-.89l-.15.18L4,12.47l-.15.19a1.21,1.21,0,0,0-.21.71,1.27,1.27,0,0,0,1.26,1.26H11v6.09A1.27,1.27,0,0,0,12.21,22a1.25,1.25,0,0,0,1-.49l.08-.1,6.82-9.77.07-.11a1.22,1.22,0,0,0,.19-.66A1.25,1.25,0,0,0,19.11,9.59Zm-6.27,9.12v-6H6.15l5.67-7.57v6.31H17.9Z"/>
</svg>
`;
button.addEventListener('mouseenter', () => {
button.style.background = 'rgba(255, 255, 255, 0.1)';
button.style.color = '#ffffff';
});
button.addEventListener('mouseleave', () => {
button.style.background = 'transparent';
button.style.color = '#9ca3af';
});
button.addEventListener('click', (e) => {
e.preventDefault();
e.stopPropagation();
this.show();
});
const headerNav = header.querySelector('nav') || header.querySelector('div[class*="flex"]');
if (headerNav) {
const lastChild = headerNav.lastElementChild;
if (lastChild) {
headerNav.insertBefore(button, lastChild);
logger.info('Кнопка настроек добавлена в header перед последним элементом');
} else {
headerNav.appendChild(button);
logger.info('Кнопка настроек добавлена в header (appendChild)');
}
} else {
header.appendChild(button);
logger.info('Кнопка настроек добавлена в header (fallback)');
}
}
show() {
if (this.panel) {
this.panel.style.display = 'flex';
return;
}
this.panel = this.createPanel();
document.body.appendChild(this.panel);
}
createPanel() {
const overlay = document.createElement('div');
overlay.className = 'remanga-ext-settings-overlay';
overlay.style.cssText = `
position: fixed;
inset: 0;
background: rgba(0, 0, 0, 0.5);
z-index: 999998;
display: flex;
align-items: center;
justify-content: center;
backdrop-filter: blur(4px);
`;
const modal = document.createElement('div');
modal.className = 'remanga-ext-settings-modal';
modal.style.cssText = `
background: #1a1a1a;
color: #ffffff;
border-radius: 12px;
padding: 32px;
min-width: 500px;
max-width: 600px;
max-height: 80vh;
overflow-y: auto;
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
animation: remanga-modal-appear 0.2s ease;
`;
const stats = this.statistics.getStats();
const installDate = new Date(stats.installDate).toLocaleDateString('ru-RU');
modal.innerHTML = `
<h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: bold; color: #ffffff;">
Настройки расширения
</h2>
<div style="display: flex; flex-direction: column; gap: 20px;">
<label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
<input type="checkbox" id="autoLike" ${this.config.get('autoLike') ? 'checked' : ''}
style="width: 20px; height: 20px; cursor: pointer; accent-color: #3b82f6;">
<div>
<div style="font-weight: 500; color: #ffffff;">Автолайк глав при открытии</div>
<div style="font-size: 12px; color: #9ca3af;">Автоматически ставить лайк при открытии главы</div>
</div>
</label>
<label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
<input type="checkbox" id="skipProcessed" ${this.config.get('skipProcessed') ? 'checked' : ''}
style="width: 20px; height: 20px; cursor: pointer; accent-color: #3b82f6;">
<div>
<div style="font-weight: 500; color: #ffffff;">Пропускать обработанные главы</div>
<div style="font-size: 12px; color: #9ca3af;">Не обрабатывать уже прочитанные/лайкнутые главы</div>
</div>
</label>
<label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
<input type="checkbox" id="notificationsEnabled" ${this.config.get('notificationsEnabled') ? 'checked' : ''}
style="width: 20px; height: 20px; cursor: pointer; accent-color: #3b82f6;">
<div>
<div style="font-weight: 500; color: #ffffff;">Показывать уведомления</div>
<div style="font-size: 12px; color: #9ca3af;">Отображать toast уведомления о действиях</div>
</div>
</label>
<div>
<label style="display: block; margin-bottom: 8px; font-weight: 500; color: #ffffff;">
Время показа уведомлений (секунды)
</label>
<input type="range" id="notificationDuration"
min="1" max="10" step="1"
value="${this.config.get('notificationDuration')}"
style="width: 100%; accent-color: #3b82f6;">
<div style="text-align: center; margin-top: 4px; color: #9ca3af;">
<span id="durationValue">${this.config.get('notificationDuration')}</span> сек
</div>
</div>
<div>
<label style="display: block; margin-bottom: 8px; font-weight: 500; color: #ffffff;">
Размер batch для массовых операций
</label>
<input type="range" id="batchSize"
min="1" max="50" step="1"
value="${this.config.get('batchSize')}"
style="width: 100%; accent-color: #3b82f6;">
<div style="text-align: center; margin-top: 4px; color: #9ca3af;">
<span id="batchSizeValue">${this.config.get('batchSize')}</span> глав за раз
</div>
</div>
<div style="padding: 16px; background: #2a2a2a; border-radius: 8px;">
<div style="font-weight: 500; margin-bottom: 12px; color: #ffffff;">📊 Статистика</div>
<div style="display: flex; flex-direction: column; gap: 8px; color: #9ca3af; font-size: 14px;">
<div>Прочитано глав: <span style="color: #10b981; font-weight: 600;">${stats.chaptersRead}</span></div>
<div>Лайков поставлено: <span style="color: #ef4444; font-weight: 600;">${stats.chaptersLiked}</span></div>
<div>Дата установки: <span style="color: #ffffff;">${installDate}</span></div>
</div>
<button id="reset-stats" style="
margin-top: 12px;
padding: 8px 16px;
background: #374151;
color: #ffffff;
border: none;
border-radius: 6px;
cursor: pointer;
font-size: 13px;
width: 100%;
">Сбросить статистику</button>
</div>
<div style="padding: 16px; background: #2a2a2a; border-radius: 8px;">
<div style="font-weight: 500; margin-bottom: 12px; color: #ffffff;">💾 Экспорт/Импорт</div>
<div style="display: flex; gap: 8px;">
<button id="export-settings" style="
flex: 1;
padding: 8px 16px;
background: #3b82f6;
color: white;
border: none;
border-radius: 6px;
cursor: pointer;
font-size: 13px;
">Экспорт</button>
<button id="import-settings" style="
flex: 1;
padding: 8px 16px;
background: #10b981;
color: white;
border: none;
border-radius: 6px;
cursor: pointer;
font-size: 13px;
">Импорт</button>
</div>
<input type="file" id="import-file" accept=".json" style="display: none;">
</div>
</div>
<div style="display: flex; gap: 12px; margin-top: 32px; justify-content: space-between;">
<button id="reset-settings" style="
padding: 12px 24px;
background: #ef4444;
color: #ffffff;
border: none;
border-radius: 8px;
cursor: pointer;
font-weight: 500;
font-size: 14px;
">Сбросить настройки</button>
<div style="display: flex; gap: 12px;">
<button id="close-settings" style="
padding: 12px 24px;
background: #374151;
color: #ffffff;
border: none;
border-radius: 8px;
cursor: pointer;
font-weight: 500;
font-size: 14px;
">Закрыть</button>
<button id="save-settings" style="
padding: 12px 24px;
background: #3b82f6;
color: white;
border: none;
border-radius: 8px;
cursor: pointer;
font-weight: 500;
font-size: 14px;
">Сохранить</button>
</div>
</div>
`;
overlay.appendChild(modal);
this.attachEventListeners(overlay, modal);
this.injectModalStyles();
return overlay;
}
attachEventListeners(overlay, modal) {
const durationSlider = modal.querySelector('#notificationDuration');
const durationValue = modal.querySelector('#durationValue');
const batchSizeSlider = modal.querySelector('#batchSize');
const batchSizeValue = modal.querySelector('#batchSizeValue');
durationSlider.addEventListener('input', (e) => {
durationValue.textContent = e.target.value;
});
batchSizeSlider.addEventListener('input', (e) => {
batchSizeValue.textContent = e.target.value;
});
modal.querySelector('#save-settings').addEventListener('click', async () => {
await this.saveSettings(modal);
});
modal.querySelector('#close-settings').addEventListener('click', () => {
this.hide();
});
modal.querySelector('#reset-settings').addEventListener('click', () => {
this.showResetConfirmation();
});
modal.querySelector('#reset-stats').addEventListener('click', () => {
this.showResetStatsConfirmation();
});
modal.querySelector('#export-settings').addEventListener('click', () => {
this.exportSettings();
});
modal.querySelector('#import-settings').addEventListener('click', () => {
modal.querySelector('#import-file').click();
});
modal.querySelector('#import-file').addEventListener('change', async (e) => {
await this.importSettings(e.target.files[0]);
});
overlay.addEventListener('click', (e) => {
if (e.target === overlay) {
this.hide();
}
});
}
async saveSettings(modal) {
try {
const settings = {
autoLike: modal.querySelector('#autoLike').checked,
skipProcessed: modal.querySelector('#skipProcessed').checked,
notificationsEnabled: modal.querySelector('#notificationsEnabled').checked,
notificationDuration: parseInt(modal.querySelector('#notificationDuration').value),
batchSize: parseInt(modal.querySelector('#batchSize').value)
};
await this.config.save(settings);
this.notifications.success('Настройки сохранены');
this.hide();
logger.info('Настройки успешно сохранены');
} catch (error) {
logger.error('Ошибка сохранения настроек:', error);
this.notifications.error('Ошибка сохранения настроек');
}
}
hide() {
if (this.panel) {
this.panel.style.display = 'none';
}
}
injectModalStyles() {
if (document.getElementById('remanga-ext-modal-styles')) return;
const style = document.createElement('style');
style.id = 'remanga-ext-modal-styles';
style.textContent = `
@keyframes remanga-modal-appear {
from {
opacity: 0;
transform: scale(0.95);
}
to {
opacity: 1;
transform: scale(1);
}
}
.remanga-ext-settings-modal button:hover {
opacity: 0.9;
transform: translateY(-1px);
}
.remanga-ext-settings-modal button:active {
transform: translateY(0);
}
.remanga-ext-settings-modal input[type="checkbox"]:hover {
transform: scale(1.1);
}
.remanga-ext-settings-modal input[type="range"] {
-webkit-appearance: none;
appearance: none;
height: 6px;
background: #374151;
border-radius: 3px;
outline: none;
}
.remanga-ext-settings-modal input[type="range"]::-webkit-slider-thumb {
-webkit-appearance: none;
appearance: none;
width: 18px;
height: 18px;
background: #3b82f6;
border-radius: 50%;
cursor: pointer;
}
.remanga-ext-settings-modal input[type="range"]::-moz-range-thumb {
width: 18px;
height: 18px;
background: #3b82f6;
border-radius: 50%;
cursor: pointer;
border: none;
}
`;
document.head.appendChild(style);
}
exportSettings() {
try {
const json = this.config.export();
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `remanga-ext-settings-${new Date().toISOString().split('T')[0]}.json`;
a.click();
URL.revokeObjectURL(url);
this.notifications.success('Настройки экспортированы');
logger.info('Настройки экспортированы');
} catch (error) {
logger.error('Ошибка экспорта настроек:', error);
this.notifications.error('Ошибка экспорта настроек');
}
}
async importSettings(file) {
if (!file) {
return;
}
if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
this.notifications.error('Неверный тип файла. Требуется JSON');
return;
}
if (file.size > 1024 * 1024) {
this.notifications.error('Файл слишком большой (максимум 1MB)');
return;
}
try {
const text = await file.text();
await this.config.import(text);
this.notifications.success('Настройки импортированы');
this.hide();
setTimeout(() => {
this.show();
}, 500);
logger.info('Настройки импортированы');
} catch (error) {
logger.error('Ошибка импорта настроек:', error);
this.notifications.error('Ошибка импорта: невалидный файл');
}
}
showResetConfirmation() {
this.showConfirmDialog(
'Сбросить настройки?',
'Все настройки будут сброшены к значениям по умолчанию. Это действие нельзя отменить.',
async () => {
await this.config.reset();
this.notifications.success('Настройки сброшены');
this.hide();
setTimeout(() => {
this.show();
}, 500);
}
);
}
showResetStatsConfirmation() {
this.showConfirmDialog(
'Сбросить статистику?',
'Вся статистика будет удалена. Это действие нельзя отменить.',
async () => {
await this.statistics.reset();
this.notifications.success('Статистика сброшена');
this.hide();
setTimeout(() => {
this.show();
}, 500);
}
);
}
showConfirmDialog(title, message, onConfirm) {
const overlay = document.createElement('div');
overlay.style.cssText = `
position: fixed;
inset: 0;
background: rgba(0, 0, 0, 0.7);
z-index: 999999;
display: flex;
align-items: center;
justify-content: center;
backdrop-filter: blur(4px);
`;
const dialog = document.createElement('div');
dialog.style.cssText = `
background: #1a1a1a;
color: #ffffff;
border-radius: 12px;
padding: 24px;
min-width: 400px;
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
`;
dialog.innerHTML = `
<h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: bold; color: #ffffff;">
${title}
</h3>
<p style="margin: 0 0 24px 0; color: #9ca3af; font-size: 14px; line-height: 1.5;">
${message}
</p>
<div style="display: flex; gap: 12px; justify-content: flex-end;">
<button id="cancel-btn" style="
padding: 10px 20px;
background: #374151;
color: #ffffff;
border: none;
border-radius: 8px;
cursor: pointer;
font-weight: 500;
font-size: 14px;
">Отмена</button>
<button id="confirm-btn" style="
padding: 10px 20px;
background: #ef4444;
color: white;
border: none;
border-radius: 8px;
cursor: pointer;
font-weight: 500;
font-size: 14px;
">Подтвердить</button>
</div>
`;
overlay.appendChild(dialog);
document.body.appendChild(overlay);
dialog.querySelector('#cancel-btn').addEventListener('click', () => {
overlay.remove();
});
dialog.querySelector('#confirm-btn').addEventListener('click', async () => {
overlay.remove();
await onConfirm();
});
overlay.addEventListener('click', (e) => {
if (e.target === overlay) {
overlay.remove();
}
});
}
}

class ChapterManager {
constructor(apiClient, config, notifications, statistics) {
this.api = apiClient;
this.config = config;
this.notifications = notifications;
this.statistics = statistics;
this.processingQueue = [];
this.operationTimes = [];
}
async markAsRead(chapterId) {
try {
await this.api.markChapterAsRead(chapterId);
logger.debug(`Глава ${chapterId} отмечена как прочитанная`);
this.updateReadButton(chapterId);
return true;
} catch (error) {
logger.error(`Ошибка отметки главы ${chapterId}:`, error);
return false;
}
}
async markMultipleAsRead(chapterIds, onProgress = null) {
const skipProcessed = this.config.get('skipProcessed');
let filteredIds = chapterIds;
if (skipProcessed) {
filteredIds = chapterIds.filter(id => !this.isChapterRead(id));
const skipped = chapterIds.length - filteredIds.length;
if (skipped > 0) {
logger.info(`Пропущено ${skipped} уже прочитанных глав`);
}
}
if (filteredIds.length === 0) {
return { total: chapterIds.length, completed: 0, failed: 0, skipped: chapterIds.length };
}
const total = filteredIds.length;
let completed = 0;
let failed = 0;
this.operationTimes = [];
logger.info(`Начало массовой отметки ${total} глав`);
for (const chapterId of filteredIds) {
const startTime = Date.now();
try {
await this.api.markChapterAsRead(chapterId);
completed++;
this.updateReadButton(chapterId);
const operationTime = Date.now() - startTime;
this.operationTimes.push(operationTime);
if (this.operationTimes.length > 10) {
this.operationTimes.shift();
}
if (onProgress) {
const eta = this.calculateETA(completed, total);
onProgress(completed, total, eta);
}
await this.delay(300);
} catch (error) {
logger.error(`Ошибка отметки главы ${chapterId}:`, error);
failed++;
}
}
await this.statistics.incrementReads(completed);
logger.info(`Массовая отметка завершена: ${completed} успешно, ${failed} ошибок`);
return {
total: chapterIds.length,
completed,
failed,
skipped: chapterIds.length - filteredIds.length
};
}
async likeChapter(chapterId) {
try {
await this.api.likeChapters([chapterId]);
logger.debug(`Глава ${chapterId} лайкнута`);
this.updateLikeButton(chapterId);
return true;
} catch (error) {
logger.error(`Ошибка лайка главы ${chapterId}:`, error);
return false;
}
}
async likeMultiple(chapterIds, onProgress = null) {
const skipProcessed = this.config.get('skipProcessed');
let filteredIds = chapterIds;
if (skipProcessed) {
filteredIds = chapterIds.filter(id => !this.isChapterLiked(id));
const skipped = chapterIds.length - filteredIds.length;
if (skipped > 0) {
logger.info(`Пропущено ${skipped} уже лайкнутых глав`);
}
}
if (filteredIds.length === 0) {
return { total: chapterIds.length, completed: 0, failed: 0, skipped: chapterIds.length };
}
const batchSize = this.config.get('batchSize');
const total = filteredIds.length;
let completed = 0;
let failed = 0;
this.operationTimes = [];
logger.info(`Начало массового лайка ${total} глав (batch: ${batchSize})`);
for (let i = 0; i < filteredIds.length; i += batchSize) {
const batch = filteredIds.slice(i, i + batchSize);
const startTime = Date.now();
try {
await this.api.likeChapters(batch);
completed += batch.length;
batch.forEach(id => this.updateLikeButton(id));
const operationTime = Date.now() - startTime;
this.operationTimes.push(operationTime);
if (this.operationTimes.length > 10) {
this.operationTimes.shift();
}
if (onProgress) {
const eta = this.calculateETA(completed, total);
onProgress(completed, total, eta);
}
if (i + batchSize < filteredIds.length) {
await this.delay(500);
}
} catch (error) {
logger.error(`Ошибка лайка батча:`, error);
failed += batch.length;
}
}
await this.statistics.incrementLikes(completed);
logger.info(`Массовый лайк завершен: ${completed} успешно, ${failed} ошибок`);
return {
total: chapterIds.length,
completed,
failed,
skipped: chapterIds.length - filteredIds.length
};
}
updateReadButton(chapterId) {
const button = domUtils.findReadButton(chapterId);
if (button) {
button.classList.add('remanga-ext-read');
button.style.opacity = '0.5';
}
}
updateLikeButton(chapterId) {
const button = domUtils.findLikeButton(chapterId);
if (button) {
button.classList.add('remanga-ext-liked');
const icon = button.querySelector('svg');
if (icon) {
icon.style.fill = '#ef4444';
}
}
}
async loadAllChaptersByScroll(onProgress = null) {
logger.info('Начало загрузки глав через скролл');
let previousCount = 0;
let stableCount = 0;
let scrollAttempts = 0;
const maxScrollAttempts = 100;
while (scrollAttempts < maxScrollAttempts) {
const currentIds = this.getChapterIdsFromPage();
const currentCount = currentIds.length;
if (onProgress) {
onProgress(currentCount);
}
if (currentCount === previousCount) {
stableCount++;
if (stableCount >= 3) {
logger.info(`Загрузка завершена: ${currentCount} глав`);
break;
}
} else {
stableCount = 0;
}
previousCount = currentCount;
window.scrollTo({
top: document.documentElement.scrollHeight,
behavior: 'smooth'
});
await this.delay(500);
scrollAttempts++;
}
window.scrollTo({
top: 0,
behavior: 'smooth'
});
await this.delay(300);
const finalIds = this.getChapterIdsFromPage();
logger.info(`Итого загружено глав: ${finalIds.length}`);
return finalIds;
}
getChapterIdsFromPage() {
return domUtils.extractChapterIdsFromPage();
}
getCurrentChapterId() {
return domUtils.extractChapterIdFromUrl();
}
delay(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}
isChapterRead(chapterId) {
const button = domUtils.findReadButton(chapterId);
if (!button) return false;
return button.classList.contains('remanga-ext-read') ||
button.style.opacity === '0.5';
}
isChapterLiked(chapterId) {
const button = domUtils.findLikeButton(chapterId);
if (!button) {
return false;
}
return button.classList.contains('remanga-ext-liked');
}
calculateETA(completed, total) {
if (this.operationTimes.length === 0 || completed === 0) {
return null;
}
const avgTime = this.operationTimes.reduce((a, b) => a + b, 0) / this.operationTimes.length;
const remaining = total - completed;
const etaMs = remaining * avgTime;
const minutes = Math.floor(etaMs / 60000);
const seconds = Math.floor((etaMs % 60000) / 1000);
return { minutes, seconds, totalSeconds: Math.floor(etaMs / 1000) };
}
}

class AutoLiker {
constructor(chapterManager, config, notifications) {
this.chapterManager = chapterManager;
this.config = config;
this.notifications = notifications;
this.likedChapters = new Set();
}
async init() {
if (!this.config.get('autoLike')) {
logger.debug('Автолайк отключен');
return;
}
const chapterId = this.chapterManager.getCurrentChapterId();
if (!chapterId) {
logger.warn('Не удалось определить ID главы');
return;
}
if (this.likedChapters.has(chapterId)) {
logger.debug(`Глава ${chapterId} уже была лайкнута в этой сессии`);
return;
}
await this.likeCurrentChapter(chapterId);
}
async likeCurrentChapter(chapterId) {
try {
logger.info(`Автолайк главы ${chapterId}`);
if (this.chapterManager.isChapterLiked(chapterId)) {
logger.debug(`Глава ${chapterId} уже лайкнута, пропускаем`);
return;
}
const success = await this.chapterManager.likeChapter(chapterId);
if (success) {
this.likedChapters.add(chapterId);
this.notifications.success('Глава автоматически лайкнута');
logger.debug(`Глава ${chapterId} успешно лайкнута`);
}
} catch (error) {
logger.error('Ошибка автолайка:', error);
}
}
wasLikedInSession(chapterId) {
return this.likedChapters.has(chapterId);
}
clearHistory() {
this.likedChapters.clear();
}
}

class RemangaExtension {
constructor() {
this.config = null;
this.api = null;
this.statistics = null;
this.chapterManager = null;
this.autoLiker = null;
this.notifications = null;
this.settingsPanel = null;
this.progressModal = null;
this.observers = [];
}
async init() {
try {
logger.info('Инициализация расширения...');
if (!this.isUserLoggedIn()) {
logger.info('Пользователь не авторизован');
return;
}
this.config = new Config();
await this.config.load();
this.statistics = new Statistics();
await this.statistics.load();
this.api = new ApiClient();
this.api.init();
this.notifications = new Notifications(this.config);
this.notifications.injectStyles();
this.chapterManager = new ChapterManager(this.api, this.config, this.notifications, this.statistics);
this.autoLiker = new AutoLiker(this.chapterManager, this.config, this.notifications);
this.settingsPanel = new SettingsPanel(this.config, this.notifications, this.statistics);
const pageType = this.detectPageType();
logger.info(`Тип страницы: ${pageType}`);
if (pageType === 'chapters') {
this.initChaptersPage();
} else if (pageType === 'reader') {
this.initReaderPage();
}
this.settingsPanel.inject();
this.setupNavigationListener();
logger.info('Расширение успешно инициализировано');
window.addEventListener('beforeunload', () => {
this.cleanup();
});
} catch (error) {
logger.error('Ошибка инициализации:', error);
}
}
setupNavigationListener() {
let lastUrl = location.href;
const checkUrlChange = () => {
const currentUrl = location.href;
if (currentUrl !== lastUrl) {
lastUrl = currentUrl;
this.handleUrlChange();
}
};
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;
history.pushState = function(...args) {
originalPushState.apply(this, args);
checkUrlChange();
};
history.replaceState = function(...args) {
originalReplaceState.apply(this, args);
checkUrlChange();
};
window.addEventListener('popstate', checkUrlChange);
logger.info('Navigation listener активирован');
}
handleUrlChange() {
const pageType = this.detectPageType();
logger.info(`URL изменен, новый тип страницы: ${pageType}`);
if (pageType === 'chapters') {
setTimeout(() => {
this.initChaptersPage();
}, 300);
} else if (pageType === 'reader') {
setTimeout(() => {
this.initReaderPage();
}, 300);
} else {
this.removeChapterButtons();
}
}
cleanup() {
this.observers.forEach(observer => observer.disconnect());
this.observers = [];
if (this.notifications) {
this.notifications.cleanup();
}
if (this.settingsPanel) {
this.settingsPanel.cleanup();
}
logger.info('Ресурсы расширения очищены');
}
isUserLoggedIn() {
return document.cookie.includes('token=');
}
detectPageType() {
const path = window.location.pathname;
if (path.includes('/chapters')) {
return 'chapters';
}
if (path.match(/\/manga\/[^/]+\/\d+/)) {
return 'reader';
}
return 'other';
}
initChaptersPage() {
logger.info('Инициализация страницы глав');
let debounceTimer = null;
const containerSelector = '.relative.flex.flex-col.gap-2';
const reinjectButtons = () => {
clearTimeout(debounceTimer);
debounceTimer = setTimeout(() => {
if (!window.location.pathname.includes('/chapters')) {
this.removeChapterButtons();
return;
}
const container = document.querySelector(containerSelector);
if (container) {
this.ensureButtonsExist(container);
}
}, 100);
};
const observer = new MutationObserver(reinjectButtons);
domUtils.waitForElement(containerSelector, 5000)
.then(container => {
this.ensureButtonsExist(container);
observer.observe(document.body, {
childList: true,
subtree: true
});
this.observers.push(observer);
logger.info('MutationObserver для кнопок активирован');
})
.catch(error => {
logger.warn('Контейнер глав не найден:', error);
});
}
removeChapterButtons() {
const markAllBtn = document.getElementById('remanga-ext-mark-all-btn');
const likeAllBtn = document.getElementById('remanga-ext-like-all-btn');
if (markAllBtn) {
markAllBtn.remove();
logger.debug('Кнопка "Прочитать все" удалена');
}
if (likeAllBtn) {
likeAllBtn.remove();
logger.debug('Кнопка "Лайкнуть все" удалена');
}
}
ensureButtonsExist(container) {
if (!document.getElementById('remanga-ext-mark-all-btn')) {
this.addMarkAllReadButton(container);
}
if (!document.getElementById('remanga-ext-like-all-btn')) {
this.addLikeAllButton(container);
}
}
async initReaderPage() {
logger.info('Инициализация страницы чтения');
if (this.config.get('autoLike')) {
await this.autoLiker.init();
}
}
addMarkAllReadButton(container) {
if (document.getElementById('remanga-ext-mark-all-btn')) return;
const button = document.createElement('button');
button.id = 'remanga-ext-mark-all-btn';
button.className = 'cs-button';
button.style.cssText = `
padding: 10px 20px;
background: transparent;
color: #10b981;
border: 1px solid #10b981;
border-radius: 6px;
cursor: pointer;
font-weight: 500;
font-size: 14px;
margin-bottom: 12px;
width: 100%;
transition: all 0.2s;
`;
button.textContent = '✓ Прочитать все главы';
button.addEventListener('mouseenter', () => {
button.style.background = '#10b981';
button.style.color = 'white';
});
button.addEventListener('mouseleave', () => {
button.style.background = 'transparent';
button.style.color = '#10b981';
});
button.addEventListener('click', async () => {
try {
await this.handleMarkAllRead(button);
} catch (error) {
logger.error('Ошибка обработки массовой отметки:', error);
this.notifications.error('Произошла ошибка при обработке');
button.disabled = false;
button.textContent = '✓ Прочитать все главы';
this.hideProgressModal();
}
});
container.insertBefore(button, container.firstChild);
logger.info('Кнопка "Прочитать все" добавлена');
}
addLikeAllButton(container) {
if (document.getElementById('remanga-ext-like-all-btn')) return;
const button = document.createElement('button');
button.id = 'remanga-ext-like-all-btn';
button.className = 'cs-button';
button.style.cssText = `
padding: 10px 20px;
background: transparent;
color: #ef4444;
border: 1px solid #ef4444;
border-radius: 6px;
cursor: pointer;
font-weight: 500;
font-size: 14px;
margin-bottom: 12px;
width: 100%;
transition: all 0.2s;
`;
button.textContent = '❤️ Лайкнуть все главы';
button.addEventListener('mouseenter', () => {
button.style.background = '#ef4444';
button.style.color = 'white';
});
button.addEventListener('mouseleave', () => {
button.style.background = 'transparent';
button.style.color = '#ef4444';
});
button.addEventListener('click', async () => {
try {
await this.handleLikeAll(button);
} catch (error) {
logger.error('Ошибка обработки массового лайка:', error);
this.notifications.error('Произошла ошибка при обработке');
button.disabled = false;
button.textContent = '❤️ Лайкнуть все главы';
this.hideProgressModal();
}
});
container.insertBefore(button, container.children[1]);
logger.info('Кнопка "Лайкнуть все" добавлена');
}
async handleMarkAllRead(button) {
button.disabled = true;
button.textContent = 'Подготовка...';
this.showProgressModal('Этап 1/2: Загрузка глав', 0, 0, true);
const chapterIds = await this.chapterManager.loadAllChaptersByScroll((count) => {
this.updateProgressModalLoading(`Этап 1/2: Загрузка глав (${count})`);
});
if (chapterIds.length === 0) {
this.hideProgressModal();
this.notifications.warning('Главы не найдены');
button.disabled = false;
button.textContent = '✓ Прочитать все главы';
return;
}
button.textContent = 'Обработка...';
this.showProgressModal('Этап 2/2: Отметка глав как прочитанных', 0, chapterIds.length, false);
const result = await this.chapterManager.markMultipleAsRead(
chapterIds,
(current, total, eta) => {
this.updateProgressModal(current, total, eta);
}
);
this.hideProgressModal();
button.disabled = false;
button.textContent = '✓ Прочитать все главы';
if (result.skipped > 0) {
this.notifications.info(`Пропущено ${result.skipped} уже прочитанных глав`);
}
if (result.failed > 0) {
this.notifications.warning(
`Отмечено ${result.completed} из ${result.total} глав (${result.failed} ошибок)`
);
} else {
this.notifications.success(`Отмечено ${result.completed} глав. Обновите страницу для отображения изменений.`);
}
}
async handleLikeAll(button) {
button.disabled = true;
button.textContent = 'Подготовка...';
this.showProgressModal('Этап 1/2: Загрузка глав', 0, 0, true);
const chapterIds = await this.chapterManager.loadAllChaptersByScroll((count) => {
this.updateProgressModalLoading(`Этап 1/2: Загрузка глав (${count})`);
});
if (chapterIds.length === 0) {
this.hideProgressModal();
this.notifications.warning('Главы не найдены');
button.disabled = false;
button.textContent = '❤️ Лайкнуть все главы';
return;
}
button.textContent = 'Обработка...';
this.showProgressModal('Этап 2/2: Лайк глав', 0, chapterIds.length, false);
const result = await this.chapterManager.likeMultiple(
chapterIds,
(current, total, eta) => {
this.updateProgressModal(current, total, eta);
}
);
this.hideProgressModal();
button.disabled = false;
button.textContent = '❤️ Лайкнуть все главы';
if (result.skipped > 0) {
this.notifications.info(`Пропущено ${result.skipped} уже лайкнутых глав`);
}
if (result.failed > 0) {
this.notifications.warning(
`Лайкнуто ${result.completed} из ${result.total} глав (${result.failed} ошибок)`
);
} else {
this.notifications.success(`Лайкнуто ${result.completed} глав`);
}
}
showProgressModal(title, current, total, isLoading = false) {
if (this.progressModal) {
this.progressModal.remove();
}
const overlay = document.createElement('div');
overlay.style.cssText = `
position: fixed;
inset: 0;
background: rgba(0, 0, 0, 0.5);
z-index: 999998;
display: flex;
align-items: center;
justify-content: center;
backdrop-filter: blur(4px);
`;
const modal = document.createElement('div');
modal.id = 'remanga-ext-progress-modal';
modal.style.cssText = `
background: #1a1a1a;
color: #ffffff;
padding: 32px;
border-radius: 12px;
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
min-width: 400px;
animation: remanga-modal-appear 0.2s ease;
`;
if (isLoading) {
modal.innerHTML = `
<div style="margin-bottom: 16px; font-weight: bold; font-size: 18px; color: #ffffff;">
${title}
</div>
<div style="display: flex; align-items: center; justify-content: center; padding: 20px 0;">
<div style="
width: 40px;
height: 40px;
border: 4px solid #374151;
border-top-color: #3b82f6;
border-radius: 50%;
animation: spin 1s linear infinite;
"></div>
</div>
<div style="text-align: center; color: #9ca3af; font-size: 14px;">
<span id="progress-text">Загрузка...</span>
</div>
<style>
@keyframes spin {
to { transform: rotate(360deg); }
}
</style>
`;
} else {
const percent = total > 0 ? Math.round((current / total) * 100) : 0;
modal.innerHTML = `
<div style="margin-bottom: 16px; font-weight: bold; font-size: 18px; color: #ffffff;">
${title}
</div>
<div style="background: #374151; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 12px;">
<div id="progress-bar" style="background: #3b82f6; height: 100%; width: ${percent}%; transition: width 0.3s;"></div>
</div>
<div style="text-align: center; color: #9ca3af; font-size: 14px;">
<span id="progress-text">${current} из ${total}</span>
</div>
`;
}
overlay.appendChild(modal);
document.body.appendChild(overlay);
this.progressModal = overlay;
}
updateProgressModalLoading(text) {
if (!this.progressModal) return;
const progressText = this.progressModal.querySelector('#progress-text');
if (progressText) {
progressText.textContent = text;
}
}
updateProgressModal(current, total, eta = null) {
if (!this.progressModal) {
return;
}
const percent = Math.round((current / total) * 100);
const progressBar = this.progressModal.querySelector('#progress-bar');
const progressText = this.progressModal.querySelector('#progress-text');
if (progressBar) {
progressBar.style.width = `${percent}%`;
}
if (progressText) {
let text = `${current} из ${total}`;
if (eta && eta.totalSeconds > 0) {
const mins = eta.minutes;
const secs = eta.seconds;
text += ` • Осталось ~${mins > 0 ? `${mins} мин ` : ''}${secs} сек`;
}
progressText.textContent = text;
}
}
hideProgressModal() {
if (this.progressModal) {
setTimeout(() => {
if (this.progressModal) {
this.progressModal.remove();
this.progressModal = null;
}
}, 500);
}
}
}
(function() {
'use strict';
const extension = new RemangaExtension();
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => extension.init());
} else {
extension.init();
}
})();

})();
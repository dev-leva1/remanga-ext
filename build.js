const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const version = packageJson.version;

const files = [
  'src/utils/logger.js',
  'src/utils/validators.js',
  'src/utils/dom.js',
  'src/utils/changelog-parser.js',
  'src/ui/styles.js',
  'src/core/Config.js',
  'src/core/Statistics.js',
  'src/core/ApiClient.js',
  'src/core/UpdateChecker.js',
  'src/ui/Notifications.js',
  'src/ui/TooltipRenderer.js',
  'src/ui/SettingsPanel.js',
  'src/ui/SettingsPage.js',
  'src/ui/FeedbackButton.js',
  'src/features/HeaderCustomizer.js',
  'src/features/ProfileCustomizer.js',
  'src/features/GuildHighlighter.js',
  'src/features/UserTooltip.js',
  'src/features/ChapterManager.js',
  'src/features/AutoLiker.js',
  'src/main.js'
];

const header = `// ==UserScript==
// @name         Remanga Enhanced
// @namespace    remanga.ext
// @version      ${version}
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
 * v1.6.6 - Исправления безопасности и стабильности
 * - Исправлены XSS/HTML injection в тултипах, модальном окне обновления и окне обратной связи
 * - Усилена валидация URL для remanga.org в feedback-bot
 * - Исправлен reverse tabnabbing при открытии внешних ссылок и Telegram бота
 * - Исправлено дублирование обработчиков во вкладках настроек
 * - Исправлена работа clipboard fallback в обратной связи
 * - Снято ограничение на большие инкременты статистики в массовых операциях
 * - Исправлена порча dist userscript при сборке
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

`;

function extractChangelogVersions(headerText) {
  const changelogMatch = headerText.match(/\/\*\*[\s\S]*?CHANGELOG\s*\n([\s\S]*?)\*\//);

  if (!changelogMatch) {
    return [];
  }

  const lines = changelogMatch[1]
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean);

  const versions = [];
  let currentVersion = null;

  lines.forEach(line => {
    const versionMatch = line.match(/^v([\d.]+)\s+-\s+(.+)$/);

    if (versionMatch) {
      currentVersion = {
        version: versionMatch[1],
        title: versionMatch[2],
        changes: []
      };
      versions.push(currentVersion);
      return;
    }

    if (currentVersion && line.startsWith('- ')) {
      currentVersion.changes.push(line.slice(2).trim());
    }
  });

  return versions;
}

function syncLandingChangelog(versions) {
  const landingScriptPath = path.join(__dirname, 'dist', 'script.js');

  if (!fs.existsSync(landingScriptPath)) {
    return;
  }

  const replacement = `const CHANGELOG_DATA = ${JSON.stringify(versions, null, 2)};`;
  const landingScript = fs.readFileSync(landingScriptPath, 'utf8');
  const updatedLandingScript = landingScript.replace(/const CHANGELOG_DATA = \[[\s\S]*?\];/, replacement);

  fs.writeFileSync(landingScriptPath, updatedLandingScript, 'utf8');
}

console.log('🔨 Начало сборки...\n');
console.log(`📌 Версия: ${version}\n`);

let output = header + '(function(){\n\'use strict\';\n';

files.forEach(file => {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Файл не найден: ${file}`);
    process.exit(1);
  }

  console.log(`📦 Добавление: ${file}`);

  let content = fs.readFileSync(filePath, 'utf8');

  content = content
    .replace(/^import .+$/gm, '')
    .replace(/^export .+$/gm, '')
    .replace(/^export default .+$/gm, '');

  content = content.replace(/__VERSION__/g, version);
  content = content.replace(/\/\*\*[\s\S]*?\*\//g, '');
  content = content.replace(/^\s*\/\/.*$/gm, '');
  content = content.replace(/^\s*[\r\n]/gm, '');
  content = content.replace(/^[ \t]+/gm, '');
  content = content.replace(/ {2,}/g, ' ');

  output += content + '\n';
});

output += '})();';

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const outputPath = path.join(distDir, 'remanga-extension.user.js');
fs.writeFileSync(outputPath, output, 'utf8');

const changelogVersions = extractChangelogVersions(header);
syncLandingChangelog(changelogVersions);

const stats = fs.statSync(outputPath);
const sizeKB = (stats.size / 1024).toFixed(2);
const lines = output.split('\n').length;

console.log('\n✅ Сборка завершена!');
console.log(`📄 Файл: ${outputPath}`);
console.log(`📊 Размер: ${sizeKB} KB`);
console.log(`📝 Строк кода: ${lines}`);
console.log(`🔖 Версия: ${version}`);

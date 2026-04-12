const fs = require('fs');
const path = require('path');

// Читаем версию из package.json
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
  'src/ui/SettingsPanel.js',
  'src/ui/SettingsPage.js',
  'src/features/HeaderCustomizer.js',
  'src/features/ProfileCustomizer.js',
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
 *
 * v1.4.2 - Улучшен UX автообновлений
 * - При обнаружении обновления сразу открывается модальное окно
 * - Убрано промежуточное toast уведомление
 *
 * v1.4.1 - Упрощен regex для парсинга changelog
 *
 * v1.3.0 - Добавлена система автообновлений
 * - Автоматическая проверка обновлений при загрузке страницы (раз в 12 часов)
 * - Уведомления о доступных обновлениях с changelog
 * - Ручная проверка обновлений через настройки
 * - Настройка включения/отключения автообновлений
 * - Интеграция с Tampermonkey для надежного обновления
 */

`;

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

  // Удаляем import/export
  content = content
    .replace(/^import .+$/gm, '')
    .replace(/^export .+$/gm, '')
    .replace(/^export default .+$/gm, '');

  // Заменяем __VERSION__ на реальную версию
  content = content.replace(/__VERSION__/g, version);

  // Удаляем многострочные комментарии /** ... */
  content = content.replace(/\/\*\*[\s\S]*?\*\//g, '');

  // Удаляем однострочные комментарии // (но не в строках)
  // Более безопасный подход: удаляем только если // в начале строки после пробелов
  content = content.replace(/^\s*\/\/.*$/gm, '');

  // Удаляем пустые строки
  content = content.replace(/^\s*[\r\n]/gm, '');

  // Удаляем лишние пробелы в начале строк (оставляем минимальные отступы)
  content = content.replace(/^[ \t]+/gm, '');

  // Удаляем множественные пробелы
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

const stats = fs.statSync(outputPath);
const sizeKB = (stats.size / 1024).toFixed(2);
const lines = output.split('\n').length;

console.log('\n✅ Сборка завершена!');
console.log(`📄 Файл: ${outputPath}`);
console.log(`📊 Размер: ${sizeKB} KB`);
console.log(`📝 Строк кода: ${lines}`);
console.log(`🔖 Версия: ${version}`);


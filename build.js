const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const version = packageJson.version;
const updateURL = 'https://raw.githubusercontent.com/dev-leva1/remanga-ext/main/dist/remanga-extension.user.js';
const changelogPath = path.join(__dirname, 'CHANGELOG.md');
const changelogMarkdown = fs.readFileSync(changelogPath, 'utf8');

const files = [
  'src/utils/logger.js',
  'src/utils/validators.js',
  'src/utils/dom.js',
  'src/utils/changelog-parser.js',
  'src/core/NavigationCoordinator.js',
  'src/ui/styles.js',
  'src/core/Config.js',
  'src/core/Statistics.js',
  'src/core/ApiClient.js',
  'src/core/UpdateChecker.js',
  'src/ui/Notifications.js',
  'src/ui/TooltipRenderer.js',
  'src/ui/SettingsPanel.js',
  'src/ui/SettingsPageController.js',
  'src/ui/SettingsPage.js',
  'src/ui/FeedbackButton.js',
  'src/features/HeaderCustomizer.js',
  'src/features/ProfileCustomizer.js',
  'src/features/GuildHighlighter.js',
  'src/features/UserTooltip.js',
  'src/features/RandomTitleNavigator.js',
  'src/features/TitleCoverPreview.js',
  'src/features/ChapterManager.js',
  'src/features/AutoCommenter.js',
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
// @connect      ${updateURL.split('/')[2]}
// @homepageURL  https://github.com/dev-leva1/remanga-ext
// @supportURL   https://github.com/dev-leva1/remanga-ext/issues
// @updateURL    ${updateURL}
// @downloadURL  ${updateURL}
// @run-at       document-idle
// ==/UserScript==

${formatUserscriptChangelog(changelogMarkdown)}

`;

function parseChangelogMarkdown(markdown) {
  const lines = markdown
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const versions = [];
  let currentVersion = null;

  lines.forEach(line => {
    const versionMatch = line.match(/^##\s+v([\d.]+)\s+-\s+(.+)$/);

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

function formatUserscriptChangelog(markdown) {
  const versions = parseChangelogMarkdown(markdown);
  const lines = [
    '/**',
    ' * CHANGELOG',
    ' *'
  ];

  versions.forEach((entry, index) => {
    lines.push(` * v${entry.version} - ${entry.title}`);
    entry.changes.forEach(change => {
      lines.push(` * - ${change}`);
    });

    if (index < versions.length - 1) {
      lines.push(' *');
    }
  });

  lines.push(' */');
  return lines.join('\n');
}

function findSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return findSourceFiles(entryPath);
    }
    if (!entry.name.endsWith('.js')) {
      return [];
    }
    return [path.relative(__dirname, entryPath).replace(/\\/g, '/')];
  });
}

function validateManifest() {
  const uniqueFiles = new Set(files);
  if (uniqueFiles.size !== files.length) {
    throw new Error('Build manifest contains duplicate files');
  }

  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Build manifest references missing file: ${file}`);
    }
  });

  const manifestFiles = new Set(files.map(file => file.replace(/\\/g, '/')));
  const sourceFiles = findSourceFiles(path.join(__dirname, 'src'));
  const missingFromManifest = sourceFiles.filter(file => !manifestFiles.has(file));

  if (missingFromManifest.length > 0) {
    throw new Error(`Build manifest does not include source files: ${missingFromManifest.join(', ')}`);
  }
}

function prepareSource(content) {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^import .+$/gm, '')
    .replace(/^export default .+$/gm, '')
    .replace(/^export .+$/gm, '')
    .replace(/__VERSION__/g, version)
    .replace(/__UPDATE_URL__/g, updateURL);
}

function assertBalancedBraces(script) {
  const pairs = [
    ['{', '}'],
    ['(', ')'],
    ['[', ']']
  ];

  pairs.forEach(([open, close]) => {
    const opened = (script.match(new RegExp(`\\${open}`, 'g')) || []).length;
    const closed = (script.match(new RegExp(`\\${close}`, 'g')) || []).length;
    if (opened !== closed) {
      throw new Error(`Built script has unbalanced ${open}${close}: ${opened}/${closed}`);
    }
  });
}

function assertExpectedClasses(script) {
  [
    'Config',
    'ApiClient',
    'UpdateChecker',
    'SettingsPage',
    'FeedbackButton',
    'NavigationCoordinator',
    'RemangaExtension'
  ].forEach(className => {
    if (!script.includes(`class ${className}`)) {
      throw new Error(`Built script does not contain class ${className}`);
    }
  });
}

function smokeCheck(script) {
  assertBalancedBraces(script);
  assertExpectedClasses(script);
}

function buildUserscript() {
  validateManifest();

  console.log('🔨 Начало сборки userscript...\n');
  console.log(`📌 Версия: ${version}\n`);

  let output = header + '(function(){\n\'use strict\';\n';

  files.forEach(file => {
    const filePath = path.join(__dirname, file);

    console.log(`📦 Добавление: ${file}`);

    const content = prepareSource(fs.readFileSync(filePath, 'utf8'));
    output += content + '\n';
  });

  output += '})();';

  smokeCheck(output);

  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const outputPath = path.join(distDir, 'remanga-extension.user.js');
  fs.writeFileSync(outputPath, output, 'utf8');

  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  const lines = output.split('\n').length;

  console.log('\n✅ Сборка userscript завершена!');
  console.log(`📄 Файл: ${outputPath}`);
  console.log(`📊 Размер: ${sizeKB} KB`);
  console.log(`📝 Строк кода: ${lines}`);
  console.log(`🔖 Версия: ${version}`);
}

function run() {
  const command = process.argv[2] || 'userscript';

  if (command === 'userscript' || command === 'all') {
    buildUserscript();
    return;
  }

  throw new Error(`Unknown build command: ${command}`);
}

try {
  run();
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}

// Парсинг changelog из userscript
async function loadChangelog() {
  try {
    const response = await fetch('remanga-extension.user.js');
    const text = await response.text();

    // Извлекаем блок CHANGELOG из комментариев
    const changelogMatch = text.match(/\/\*\*\s*\n\s*\*\s*CHANGELOG\s*\n([\s\S]*?)\*\//);

    if (!changelogMatch) {
      showChangelogError('Changelog не найден');
      return;
    }

    const changelogText = changelogMatch[1];

    // Парсим версии
    const versionRegex = /\*\s*v([\d.]+)\s*-\s*([^\n]+)\n((?:\s*\*\s*-[^\n]+\n)*)/g;
    const versions = [];

    let match;
    while ((match = versionRegex.exec(changelogText)) !== null) {
      const version = match[1];
      const title = match[2].trim();
      const changesText = match[3];

      // Парсим изменения
      const changeRegex = /\*\s*-\s*([^\n]+)/g;
      const changes = [];
      let changeMatch;

      while ((changeMatch = changeRegex.exec(changesText)) !== null) {
        changes.push(changeMatch[1].trim());
      }

      versions.push({ version, title, changes });
    }

    if (versions.length === 0) {
      showChangelogError('Версии не найдены');
      return;
    }

    renderChangelog(versions);
  } catch (error) {
    console.error('Ошибка загрузки changelog:', error);
    showChangelogError('Ошибка загрузки changelog');
  }
}

function renderChangelog(versions) {
  const container = document.getElementById('changelog-list');
  container.innerHTML = '';

  versions.forEach(({ version, title, changes }) => {
    const versionEl = document.createElement('div');
    versionEl.className = 'changelog-version';

    const header = document.createElement('div');
    header.className = 'changelog-header';

    const versionNumber = document.createElement('div');
    versionNumber.className = 'changelog-version-number';
    versionNumber.textContent = `v${version} - ${title}`;

    header.appendChild(versionNumber);
    versionEl.appendChild(header);

    if (changes.length > 0) {
      const changesList = document.createElement('ul');
      changesList.className = 'changelog-changes';

      changes.forEach(change => {
        const li = document.createElement('li');
        li.textContent = change;
        changesList.appendChild(li);
      });

      versionEl.appendChild(changesList);
    }

    container.appendChild(versionEl);
  });
}

function showChangelogError(message) {
  const container = document.getElementById('changelog-list');
  container.innerHTML = `<div class="changelog-loading">${message}</div>`;
}

// Загрузка changelog при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  loadChangelog();
});

// Smooth scroll для якорных ссылок
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

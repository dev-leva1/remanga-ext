const CHANGELOG_DATA = [
  {
    "version": "1.6.9",
    "title": "Полноэкранный просмотр обложки",
    "changes": [
      "Клик по обложке тайтла открывает overlay без перехода на другую страницу",
      "Добавлена настройка включения и выключения полноэкранного просмотра обложки",
      "Добавлена поддержка SPA-переинициализации и cleanup для preview обложки"
    ]
  },
  {
    "version": "1.6.8",
    "title": "Исправления cleanup SPA-навигации",
    "changes": [
      "Закрытие тултипов профилей при смене подстраницы внутри SPA",
      "Очистка progress/update/feedback/settings overlays при route change",
      "Сброс route-scoped observers и cleanup состояния перед переинициализацией страницы"
    ]
  },
  {
    "version": "1.6.7",
    "title": "Случайный тайтл в каталоге",
    "changes": [
      "Добавлена кнопка \"Рандомный тайтл\" на странице каталога /manga",
      "Добавлена настройка для включения/выключения кнопки в интерфейсе расширения",
      "Реализован переход к случайному доступному тайтлу через API каталога с fallback логикой"
    ]
  },
  {
    "version": "1.6.6",
    "title": "Исправления безопасности и стабильности",
    "changes": [
      "Исправлены XSS/HTML injection в тултипах, модальном окне обновления и окне обратной связи",
      "Усилена валидация URL для remanga.org в feedback-bot",
      "Исправлен reverse tabnabbing при открытии внешних ссылок и Telegram бота",
      "Исправлено дублирование обработчиков во вкладках настроек",
      "Исправлена работа clipboard fallback в обратной связи",
      "Снято ограничение на большие инкременты статистики в массовых операциях",
      "Исправлена порча dist userscript при сборке"
    ]
  },
  {
    "version": "1.6.5",
    "title": "Тултипы профилей",
    "changes": [
      "Добавлены тултипы пользователей, отображающие краткую информацию о пользователе при наведении на аватар",
      "Добавлена настройка для включения/выключения тултипов пользователей"
    ]
  },
  {
    "version": "1.6.4",
    "title": "Telegram бот обратной связи",
    "changes": [
      "Добавлен Telegram бот для сообщений об ошибках и предложений",
      "Кнопка \"Обратная связь\" в настройках (вкладка \"Общее\")",
      "Модальное окно выбора контекста (версия, браузер, URL страницы)",
      "Deep link интеграция с ботом для автоматической передачи данных",
      "Обновлен лендинг: секция \"Обратная связь\" вместо контактов"
    ]
  },
  {
    "version": "1.6.3",
    "title": "Вкладки в окне настроек",
    "changes": [
      "Окно настроек разбито на 3 вкладки: Автоматизация, Интерфейс, Общее",
      "Вертикальное меню вкладок слева (стили с remanga.org/user/settings)"
    ]
  },
  {
    "version": "1.6.2",
    "title": "Выделение гильдий на форуме и в топе",
    "changes": [
      "Автоматическое выделение постов от определенных гильдий на /forum",
      "Выделение гильдий в топе на /guild/top",
      "Эффект свечения для лучшей видимости выделенных элементов",
      "Оптимизация производительности через IntersectionObserver"
    ]
  },
  {
    "version": "1.6.1",
    "title": "Улучшения UI настроек",
    "changes": [
      "Убрана боковая панель с категориями из окна настроек",
      "Исправлен z-index модального окна обновлений (теперь поверх настроек)"
    ]
  },
  {
    "version": "1.6.0",
    "title": "Кастомизация интерфейса и новая страница настроек",
    "changes": [
      "Блокировка кастомных тем в профилях пользователей",
      "Скрытие блоков профиля (статистика, бейджи, ачивки, друзья и т.д.)",
      "Скрытие индикатора непрочитанных сообщений чата в header",
      "Страница настроек открывается как overlay модальное окно",
      "Стилизованная кнопка настроек в header"
    ]
  },
  {
    "version": "1.5.0",
    "title": "Полное обновление UI и лендинг",
    "changes": [
      "Полностью переработан UI согласно DESIGN.md",
      "Монохромная цветовая палитра (rgb(19,20,22), rgb(24,25,27))",
      "Централизованные design tokens в styles.js",
      "Pill-кнопки с анимациями (hover, active)",
      "Шрифт Exo 2 во всех компонентах",
      "Создан лендинг ext.nexee.ru с инструкцией по установке",
      "Динамический парсинг changelog на лендинге"
    ]
  }
];

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (typeof text === 'string') {
    element.textContent = text;
  }

  return element;
}

function renderChangelog(versions) {
  const container = document.getElementById('changelog-list');

  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!Array.isArray(versions) || versions.length === 0) {
    container.appendChild(createElement('div', 'changelog-empty', 'История изменений скоро появится.'));
    return;
  }

  versions.slice(0, 4).forEach(({ version, title, changes }) => {
    const versionElement = createElement('article', 'changelog-version');
    const headerElement = createElement('div', 'changelog-header');
    const versionTitle = title ? `v${version} — ${title}` : `v${version}`;

    headerElement.appendChild(createElement('h3', 'changelog-version-number', versionTitle));
    versionElement.appendChild(headerElement);

    if (Array.isArray(changes) && changes.length > 0) {
      const changesList = createElement('ul', 'changelog-changes');

      changes.forEach(change => {
        changesList.appendChild(createElement('li', '', change));
      });

      versionElement.appendChild(changesList);
    }

    container.appendChild(versionElement);
  });
}

function setupSmoothScroll() {
  const anchors = document.querySelectorAll('a[href^="#"]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  anchors.forEach(anchor => {
    anchor.addEventListener('click', event => {
      const targetSelector = anchor.getAttribute('href');

      if (!targetSelector || targetSelector === '#') {
        return;
      }

      const target = document.querySelector(targetSelector);

      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });
}

function setupMobileNav() {
  const mobileNav = document.querySelector('.mobile-nav');

  if (!mobileNav) {
    return;
  }

  const links = mobileNav.querySelectorAll('.mobile-nav-link');

  links.forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.removeAttribute('open');
    });
  });

  document.addEventListener('click', event => {
    if (!mobileNav.hasAttribute('open')) {
      return;
    }

    if (mobileNav.contains(event.target)) {
      return;
    }

    mobileNav.removeAttribute('open');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderChangelog(CHANGELOG_DATA);
  setupSmoothScroll();
  setupMobileNav();
});

const CHANGELOG_DATA = [
  {
    "version": "1.7.0",
    "title": "Усиление runtime-границ и feedback-bot",
    "changes": [
      "Усилена валидация API-запросов, deep link контекста обратной связи и пользовательских данных",
      "Добавлены NavigationCoordinator и SettingsPageController для изоляции SPA-навигации и применения настроек без перезагрузки",
      "Добавлена строгая валидация startup config для feedback-bot, включая BOT_TOKEN, ADMIN_IDS и PostgreSQL-переменные",
      "Обновлена архитектурная документация userscript и feedback-bot",
      "Пересобран userscript dist/remanga-extension.user.js",
      "Workflow update-ext перенесён в .agents/skills/update-ext"
    ]
  },
  {
    "version": "1.6.10",
    "title": "Обновление брендинга настроек",
    "changes": [
      "Добавлены логотип и название Remanga Enhanced в страницу настроек",
      "Улучшена мобильная адаптация SettingsPage для экранов до 768px"
    ]
  },
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

class DomElementFactory {
  create(tagName, className, text) {
    if (!this.isSafeTagName(tagName)) {
      throw new TypeError('Invalid tag name');
    }

    const element = document.createElement(tagName);

    if (typeof className === 'string' && className.trim()) {
      element.className = className.trim();
    }

    if (typeof text === 'string') {
      element.textContent = text;
    }

    return element;
  }

  isSafeTagName(tagName) {
    return typeof tagName === 'string' && /^[a-z][a-z0-9-]*$/i.test(tagName);
  }
}

class ChangelogRenderer {
  constructor(container, elementFactory, maxItems = 4) {
    this.container = container instanceof Element ? container : null;
    this.elementFactory = elementFactory instanceof DomElementFactory ? elementFactory : new DomElementFactory();
    this.maxItems = Number.isInteger(maxItems) && maxItems > 0 ? maxItems : 4;
  }

  render(versions) {
    if (!this.container) {
      return;
    }

    this.container.replaceChildren();

    if (!Array.isArray(versions) || versions.length === 0) {
      this.container.appendChild(this.elementFactory.create('div', 'changelog-empty', 'История изменений скоро появится.'));
      return;
    }

    versions.slice(0, this.maxItems).forEach(item => this.renderVersion(item));
  }

  renderVersion(item) {
    if (!item || typeof item !== 'object') {
      return;
    }

    const version = this.toText(item.version);

    if (!version) {
      return;
    }

    const title = this.toText(item.title);
    const changes = Array.isArray(item.changes) ? item.changes.filter(change => typeof change === 'string' && change.trim()) : [];
    const versionElement = this.elementFactory.create('article', 'changelog-version');
    const headerElement = this.elementFactory.create('div', 'changelog-header');
    const versionTitle = title ? `v${version}: ${title}` : `v${version}`;

    headerElement.appendChild(this.elementFactory.create('h3', 'changelog-version-number', versionTitle));
    versionElement.appendChild(headerElement);

    if (changes.length > 0) {
      const changesList = this.elementFactory.create('ul', 'changelog-changes');

      changes.forEach(change => {
        changesList.appendChild(this.elementFactory.create('li', '', change.trim()));
      });

      versionElement.appendChild(changesList);
    }

    this.container.appendChild(versionElement);
  }

  toText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }
}

class AnchorScrollController {
  constructor(documentRef, windowRef, options = {}) {
    this.document = documentRef && typeof documentRef.querySelectorAll === 'function' ? documentRef : document;
    this.window = windowRef && typeof windowRef.scrollTo === 'function' ? windowRef : window;
    this.anchorSelector = typeof options.anchorSelector === 'string' ? options.anchorSelector : 'a[href^="#"]';
    this.headerSelector = typeof options.headerSelector === 'string' ? options.headerSelector : '.site-header';
    this.extraOffset = Number.isFinite(options.extraOffset) && options.extraOffset >= 0 ? options.extraOffset : 16;
  }

  init() {
    const anchors = this.document.querySelectorAll(this.anchorSelector);

    anchors.forEach(anchor => {
      if (anchor instanceof HTMLAnchorElement) {
        anchor.addEventListener('click', event => this.handleClick(event, anchor));
      }
    });
  }

  handleClick(event, anchor) {
    if (!(event instanceof Event) || !(anchor instanceof HTMLAnchorElement)) {
      return;
    }

    const targetId = this.getTargetId(anchor.getAttribute('href'));

    if (!targetId) {
      return;
    }

    const target = this.document.getElementById(targetId);

    if (!(target instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    this.scrollToTarget(target);
    this.updateHash(targetId);

    if (this.shouldMoveFocus(anchor, target)) {
      this.focusTarget(target);
    }
  }

  getTargetId(href) {
    if (typeof href !== 'string' || href.length < 2 || !href.startsWith('#')) {
      return '';
    }

    try {
      const targetId = decodeURIComponent(href.slice(1));
      return /^[A-Za-z][A-Za-z0-9_-]*$/.test(targetId) ? targetId : '';
    } catch {
      return '';
    }
  }

  scrollToTarget(target) {
    if (!(target instanceof HTMLElement)) {
      return;
    }

    this.window.scrollTo({
      top: this.getScrollTop(target),
      behavior: this.prefersReducedMotion() ? 'auto' : 'smooth'
    });
  }

  getScrollTop(target) {
    if (!(target instanceof HTMLElement)) {
      return 0;
    }

    const targetTop = target.getBoundingClientRect().top + this.window.scrollY;
    return Math.max(0, Math.round(targetTop - this.getHeaderOffset()));
  }

  getHeaderOffset() {
    const header = this.document.querySelector(this.headerSelector);

    if (!(header instanceof HTMLElement)) {
      return this.extraOffset;
    }

    return Math.ceil(header.getBoundingClientRect().height) + this.extraOffset;
  }

  updateHash(targetId) {
    if (typeof targetId !== 'string' || !targetId) {
      return;
    }

    this.window.history.pushState(null, '', `#${encodeURIComponent(targetId)}`);
  }

  shouldMoveFocus(anchor, target) {
    if (!(anchor instanceof HTMLAnchorElement) || !(target instanceof HTMLElement)) {
      return false;
    }

    return anchor.classList.contains('skip-link') || target.id === 'main-content';
  }

  focusTarget(target) {
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const hadTabIndex = target.hasAttribute('tabindex');

    if (!this.isFocusable(target) && !hadTabIndex) {
      target.setAttribute('tabindex', '-1');
    }

    target.focus({ preventScroll: true });

    if (!hadTabIndex) {
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
  }

  isFocusable(target) {
    return target instanceof HTMLElement && target.matches('a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])');
  }

  prefersReducedMotion() {
    return this.window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

class MobileNavController {
  constructor(root, documentRef) {
    this.root = root instanceof HTMLDetailsElement ? root : null;
    this.document = documentRef && typeof documentRef.addEventListener === 'function' ? documentRef : document;
    this.toggle = this.root ? this.root.querySelector('.mobile-nav-toggle') : null;
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  init() {
    if (!this.root) {
      return;
    }

    const links = this.root.querySelectorAll('.mobile-nav-link');

    links.forEach(link => {
      if (link instanceof HTMLAnchorElement) {
        link.addEventListener('click', () => this.close());
      }
    });

    this.root.addEventListener('toggle', () => this.syncExpandedState());
    this.document.addEventListener('click', this.handleDocumentClick);
    this.document.addEventListener('keydown', this.handleKeyDown);
    this.syncExpandedState();
  }

  handleDocumentClick(event) {
    if (!(event instanceof MouseEvent) || !this.root || !this.root.hasAttribute('open')) {
      return;
    }

    if (event.target instanceof Node && this.root.contains(event.target)) {
      return;
    }

    this.close();
  }

  handleKeyDown(event) {
    if (!(event instanceof KeyboardEvent) || event.key !== 'Escape' || !this.root || !this.root.hasAttribute('open')) {
      return;
    }

    this.close();

    if (this.toggle instanceof HTMLElement) {
      this.toggle.focus();
    }
  }

  close() {
    if (!this.root) {
      return;
    }

    this.root.removeAttribute('open');
    this.syncExpandedState();
  }

  syncExpandedState() {
    if (!this.root || !(this.toggle instanceof HTMLElement)) {
      return;
    }

    this.toggle.setAttribute('aria-expanded', this.root.hasAttribute('open') ? 'true' : 'false');
  }
}

class LandingPageApp {
  constructor(documentRef = document, windowRef = window) {
    this.document = documentRef && typeof documentRef.getElementById === 'function' ? documentRef : document;
    this.window = windowRef && typeof windowRef.matchMedia === 'function' ? windowRef : window;
    this.elementFactory = new DomElementFactory();
  }

  init() {
    new ChangelogRenderer(this.document.getElementById('changelog-list'), this.elementFactory).render(CHANGELOG_DATA);
    new AnchorScrollController(this.document, this.window).init();
    new MobileNavController(this.document.querySelector('.mobile-nav'), this.document).init();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LandingPageApp(document, window).init();
});

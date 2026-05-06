/**
 * Панель настроек расширения
 * Только инъекция кнопки в header для перехода на /extension-settings
 */

class SettingsPanel {
  constructor(config, notifications, statistics, options = {}) {
    this.config = config;
    this.notifications = notifications;
    this.statistics = statistics;
    this.observer = null;
    this.onOpenSettings = typeof options.onOpenSettings === 'function' ? options.onOpenSettings : null;
  }

  /**
   * Инъекция кнопки настроек в header
   */
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

  /**
   * Очистка ресурсов
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Добавление кнопки в header
   */
  injectHeaderButton(header) {
    const link = document.createElement('button');
    link.id = 'remanga-ext-settings-btn';
    link.className = 'cs-button';
    link.setAttribute('aria-label', 'Настройки расширения');
    link.style.cssText = `
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      appearance: none;
      user-select: none;
      white-space: nowrap;
      font-weight: 500;
      transition: all 0.2s;
      cursor: pointer;
      opacity: 1;
      outline: none;
      border: none;
      border-radius: 9999px;
      padding: 0 1rem;
      height: 2.25rem;
      min-width: 2.25rem;
      font-size: 0.875rem;
      background: ${DESIGN_TOKENS.colors.bg.secondary};
      color: ${DESIGN_TOKENS.colors.text.secondary};
      margin: 0 ${DESIGN_TOKENS.spacing.xs};
    `;

    link.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.11,9.59h-5.4V3.28a1.26,1.26,0,0,0-2.15-.89l-.15.18L4,12.47l-.15.19a1.21,1.21,0,0,0-.21.71,1.27,1.27,0,0,0,1.26,1.26H11v6.09A1.27,1.27,0,0,0,12.21,22a1.25,1.25,0,0,0,1-.49l.08-.1,6.82-9.77.07-.11a1.22,1.22,0,0,0,.19-.66A1.25,1.25,0,0,0,19.11,9.59Zm-6.27,9.12v-6H6.15l5.67-7.57v6.31H17.9Z"/>
      </svg>
    `;

    link.addEventListener('mouseenter', () => {
      link.style.background = 'rgba(255, 255, 255, 0.15)';
    });

    link.addEventListener('mouseleave', () => {
      link.style.background = DESIGN_TOKENS.colors.bg.secondary;
    });

    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (this.onOpenSettings) {
        this.onOpenSettings();
      }

      logger.info('Открытие страницы настроек');
    });

    const headerNav = header.querySelector('nav') || header.querySelector('div[class*="flex"]');

    if (headerNav) {
      const lastChild = headerNav.lastElementChild;
      if (lastChild) {
        headerNav.insertBefore(link, lastChild);
        logger.info('Кнопка настроек добавлена в header перед последним элементом');
      } else {
        headerNav.appendChild(link);
        logger.info('Кнопка настроек добавлена в header (appendChild)');
      }
    } else {
      header.appendChild(link);
      logger.info('Кнопка настроек добавлена в header (fallback)');
    }
  }
}

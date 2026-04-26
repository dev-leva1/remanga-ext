class RandomTitleNavigator {
  constructor(apiClient, config, notifications) {
    this.api = apiClient;
    this.config = config;
    this.notifications = notifications;
    this.observer = null;
    this.isNavigating = false;
  }

  init() {
    if (!this.config.get('randomTitleButtonEnabled') || !this.isCatalogPage()) {
      this.cleanup();
      return;
    }

    if (this.observer) {
      this.ensureButtonExists();
      return;
    }

    let debounceTimer = null;

    const reinjectButton = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.ensureButtonExists();
      }, 100);
    };

    this.observer = new MutationObserver(reinjectButton);
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.ensureButtonExists();
    logger.info('RandomTitleNavigator инициализирован');
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    const button = document.getElementById('remanga-ext-random-title-btn');
    if (button) {
      button.remove();
    }
  }

  isCatalogPage() {
    return window.location.pathname === '/manga';
  }

  ensureButtonExists() {
    if (!this.isCatalogPage()) {
      this.cleanup();
      return;
    }

    const anchor = this.findAnchor();
    if (!anchor) {
      return;
    }

    const existingButton = document.getElementById('remanga-ext-random-title-btn');
    if (existingButton) {
      if (existingButton.parentElement === anchor) {
        return;
      }
      existingButton.remove();
    }

    this.injectCatalogButton(anchor);
  }

  findAnchor() {
    const sortButton = document.querySelector('main [data-testid="catalog-ordering-value"], main [role="combobox"]');
    if (!sortButton) {
      return null;
    }

    return sortButton.closest('[data-sentry-component="SelectCatalogOrderingDropdown"]') || sortButton.parentElement;
  }

  injectCatalogButton(anchor) {
    const button = document.createElement('button');
    button.id = 'remanga-ext-random-title-btn';
    button.className = 'cs-button';
    button.type = 'button';
    button.title = 'Открыть рандомный тайтл';
    button.setAttribute('aria-label', 'Открыть рандомный тайтл');
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: ${DESIGN_TOKENS.spacing.sm};
      margin-left: ${DESIGN_TOKENS.spacing.sm};
      flex-shrink: 0;
      padding: 0 1rem;
      height: 2.25rem;
      min-width: 2.25rem;
      border: none;
      border-radius: 9999px;
      background: ${DESIGN_TOKENS.colors.bg.secondary};
      color: ${DESIGN_TOKENS.colors.text.secondary};
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
    `;

    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
        <g fill-rule="evenodd">
          <path d="M47.895 88.097c.001-4.416 3.064-9.837 6.854-12.117l66.257-39.858c3.785-2.277 9.915-2.277 13.707.008l66.28 39.934c3.786 2.28 6.853 7.703 6.852 12.138l-.028 79.603c-.001 4.423-3.069 9.865-6.848 12.154l-66.4 40.205c-3.781 2.29-9.903 2.289-13.69-.01l-66.167-40.185c-3.78-2.295-6.842-7.733-6.84-12.151l.023-79.72zm13.936-6.474l65.834 36.759 62.766-36.278-62.872-36.918L61.83 81.623zM57.585 93.52c0 1.628-1.065 71.86-1.065 71.86-.034 2.206 1.467 4.917 3.367 6.064l61.612 37.182.567-77.413s-64.48-39.322-64.48-37.693zm76.107 114.938l60.912-38.66c2.332-1.48 4.223-4.915 4.223-7.679V93.125l-65.135 37.513v77.82z"/>
          <path d="M77.76 132.287c-4.782 2.762-11.122.735-14.16-4.526-3.037-5.261-1.622-11.765 3.16-14.526 4.783-2.762 11.123-.735 14.16 4.526 3.038 5.261 1.623 11.765-3.16 14.526zm32 21c-4.782 2.762-11.122.735-14.16-4.526-3.037-5.261-1.622-11.765 3.16-14.526 4.783-2.762 11.123-.735 14.16 4.526 3.038 5.261 1.623 11.765-3.16 14.526zm-32 16c-4.782 2.762-11.122.735-14.16-4.526-3.037-5.261-1.622-11.765 3.16-14.526 4.783-2.762 11.123-.735 14.16 4.526 3.038 5.261 1.623 11.765-3.16 14.526zm32 21c-4.782 2.762-11.122.735-14.16-4.526-3.037-5.261-1.622-11.765 3.16-14.526 4.783-2.762 11.123-.735 14.16 4.526 3.038 5.261 1.623 11.765-3.16 14.526zm78.238-78.052c-4.783-2.762-11.122-.735-14.16 4.526-3.037 5.261-1.623 11.765 3.16 14.526 4.783 2.762 11.123.735 14.16-4.526 3.038-5.261 1.623-11.765-3.16-14.526zm-16.238 29c-4.782-2.762-11.122-.735-14.16 4.526-3.037 5.261-1.622 11.765 3.16 14.526 4.783 2.762 11.123.735 14.16-4.526 3.038-5.261 1.623-11.765-3.16-14.526zm-17 28c-4.782-2.762-11.122-.735-14.16 4.526-3.037 5.261-1.622 11.765 3.16 14.526 4.783 2.762 11.123.735 14.16-4.526 3.038-5.261 1.623-11.765-3.16-14.526zM128.5 69c-6.351 0-11.5 4.925-11.5 11s5.149 11 11.5 11S140 86.075 140 80s-5.149-11-11.5-11z"/>
        </g>
      </svg>
      <span class="remanga-ext-random-title-label">Рандомный тайтл</span>
    `;

    button.addEventListener('mouseenter', () => {
      if (!button.disabled) {
        button.style.background = 'rgba(255, 255, 255, 0.15)';
      }
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = DESIGN_TOKENS.colors.bg.secondary;
    });

    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await this.handleRandomNavigation(button);
    });

    anchor.appendChild(button);
  }

  navigateToTitle(dir) {
    const encodedDir = encodeURIComponent(dir);
    const targetPath = `/manga/${encodedDir}/main`;
    window.location.assign(targetPath);
  }

  async handleRandomNavigation(button) {
    if (this.isNavigating) {
      return;
    }

    this.isNavigating = true;
    const initialText = button.innerHTML;
    button.disabled = true;
    button.style.opacity = '0.7';
    button.querySelector('.remanga-ext-random-title-label').textContent = 'Поиск...';

    try {
      const title = await this.api.getRandomTitle();

      if (!title || typeof title.dir !== 'string' || !title.dir.trim()) {
        throw new Error('Не удалось получить случайный тайтл');
      }

      this.navigateToTitle(title.dir);
    } catch (error) {
      logger.error('Ошибка перехода к случайному тайтлу:', error);
      this.notifications.error('Не удалось открыть случайный тайтл');
      button.disabled = false;
      button.style.opacity = '1';
      button.innerHTML = initialText;
      this.isNavigating = false;
    }
  }
}

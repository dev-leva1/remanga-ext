/**
 * Главный файл расширения
 * Точка входа и координация всех компонентов
 */

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

  /**
   * Инициализация расширения
   */
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

      // Отслеживание изменений URL для SPA навигации
      this.setupNavigationListener();

      logger.info('Расширение успешно инициализировано');

      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    } catch (error) {
      logger.error('Ошибка инициализации:', error);
    }
  }

  /**
   * Отслеживание навигации в SPA
   */
  setupNavigationListener() {
    let lastUrl = location.href;

    const checkUrlChange = () => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        this.handleUrlChange();
      }
    };

    // Перехват pushState и replaceState
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

    // Отслеживание popstate (кнопки назад/вперед)
    window.addEventListener('popstate', checkUrlChange);

    logger.info('Navigation listener активирован');
  }

  /**
   * Обработка изменения URL
   */
  handleUrlChange() {
    const pageType = this.detectPageType();
    logger.info(`URL изменен, новый тип страницы: ${pageType}`);

    if (pageType === 'chapters') {
      // Даем время React отрендерить страницу
      setTimeout(() => {
        this.initChaptersPage();
      }, 300);
    } else if (pageType === 'reader') {
      // Даем время React отрендерить страницу
      setTimeout(() => {
        this.initReaderPage();
      }, 300);
    } else {
      this.removeChapterButtons();
    }
  }

  /**
   * Очистка ресурсов
   */
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

  /**
   * Проверка авторизации пользователя
   */
  isUserLoggedIn() {
    return document.cookie.includes('token=');
  }

  /**
   * Определение типа страницы
   */
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

  /**
   * Инициализация страницы списка глав
   */
  initChaptersPage() {
    logger.info('Инициализация страницы глав');

    let debounceTimer = null;
    const containerSelector = '.relative.flex.flex-col.gap-2';

    const reinjectButtons = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // Проверяем, что мы все еще на странице /chapters
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

  /**
   * Удаление кнопок со страницы
   */
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

  /**
   * Проверка и добавление кнопок при необходимости
   */
  ensureButtonsExist(container) {
    if (!document.getElementById('remanga-ext-mark-all-btn')) {
      this.addMarkAllReadButton(container);
    }
    if (!document.getElementById('remanga-ext-like-all-btn')) {
      this.addLikeAllButton(container);
    }
  }

  /**
   * Инициализация страницы чтения
   */
  async initReaderPage() {
    logger.info('Инициализация страницы чтения');

    if (this.config.get('autoLike')) {
      await this.autoLiker.init();
    }
  }

  /**
   * Добавление кнопки "Прочитать все главы"
   */
  addMarkAllReadButton(container) {
    if (document.getElementById('remanga-ext-mark-all-btn')) {
      return;
    }

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

  /**
   * Добавление кнопки "Лайкнуть все главы"
   */
  addLikeAllButton(container) {
    if (document.getElementById('remanga-ext-like-all-btn')) {
      return;
    }

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

  /**
   * Обработка массовой отметки глав
   */
  async handleMarkAllRead(button) {
    button.disabled = true;
    button.textContent = 'Подготовка...';

    // Этап 1: Загрузка всех глав через скролл
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

    // Этап 2: Отметка глав
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

  /**
   * Обработка массового лайка глав
   */
  async handleLikeAll(button) {
    button.disabled = true;
    button.textContent = 'Подготовка...';

    // Этап 1: Загрузка всех глав через скролл
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

    // Этап 2: Лайк глав
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

  /**
   * Показать модальное окно прогресса
   */
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
      // Режим загрузки - индикатор без прогресс-бара
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
      // Режим прогресса - с прогресс-баром
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

  /**
   * Обновить текст в режиме загрузки
   */
  updateProgressModalLoading(text) {
    if (!this.progressModal) {
      return;
    }

    const progressText = this.progressModal.querySelector('#progress-text');
    if (progressText) {
      progressText.textContent = text;
    }
  }

  /**
   * Обновить прогресс
   */
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

  /**
   * Скрыть модальное окно прогресса
   */
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

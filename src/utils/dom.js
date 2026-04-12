/**
 * Утилиты для работы с DOM
 */

const domUtils = {
  /**
   * Ожидание появления элемента в DOM
   */
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

  /**
   * Наблюдение за изменениями элемента
   */
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

  /**
   * Извлечение ID главы из URL
   */
  extractChapterIdFromUrl() {
    const match = window.location.pathname.match(/\/manga\/[^/]+\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  },

  /**
   * Извлечение slug манги из URL
   */
  extractMangaSlug() {
    const match = window.location.pathname.match(/\/manga\/([^/]+)/);
    return match ? match[1] : null;
  },

  /**
   * Извлечение branch_id из страницы
   */
  extractBranchId() {
    // Ищем в data-атрибутах или в скриптах Next.js
    const scripts = document.querySelectorAll('script[type="application/json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        // Next.js хранит данные в __NEXT_DATA__
        if (data.props?.pageProps?.branch?.id) {
          return data.props.pageProps.branch.id;
        }
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    }

    // Fallback: ищем в window.__NEXT_DATA__
    if (typeof window !== 'undefined' && window.__NEXT_DATA__) {
      const branchId = window.__NEXT_DATA__?.props?.pageProps?.branch?.id;
      if (branchId) return branchId;
    }

    return null;
  },

  /**
   * Извлечение всех ID глав со страницы
   */
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

  /**
   * Поиск кнопки "прочитано" для главы
   */
  findReadButton(chapterId) {
    return document.querySelector(`[data-testid="update_view_${chapterId}"]`);
  },

  /**
   * Поиск кнопки лайка для главы
   */
  findLikeButton(chapterId) {
    return document.querySelector(`[data-testid="like_btn_${chapterId}"]`);
  },

  /**
   * Поиск ссылки на следующую главу
   */
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

  /**
   * Проверка достижения конца страницы
   */
  isAtPageBottom(threshold = 100) {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    return scrollTop + clientHeight >= scrollHeight - threshold;
  }
};

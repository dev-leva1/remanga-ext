/**
 * Выделение постов и гильдий от определенных гильдий
 * Работает на страницах /forum и /guild/top
 */

class GuildHighlighter {
  constructor(config) {
    this.config = config;
    this.intersectionObserver = null;
    this.mutationObserver = null;
    this.debounceTimer = null;
    this.processedElements = new WeakSet();
    this.targetGuilds = new Set([
      'Демоны Дракмортуса',
      'Святой Культ Крыс',
      'Семь Смертных Грехов DS',
      'И г г д р а с и л ь',
      'Р К Н',
      'Diavol Satori Филиал',
      'Diavol Satori',
      'Шаббат'
    ]);
  }

  /**
   * Инициализация для текущей страницы
   */
  init(pageType) {
    const enabled = this.config.get('highlightGuilds');
    if (!enabled) {
      logger.info('Выделение гильдий отключено в настройках');
      return;
    }

    this.cleanup();

    logger.info(`Инициализация GuildHighlighter для типа страницы: ${pageType}`);

    this.setupIntersectionObserver();

    if (pageType === 'forum') {
      this.initForumPage();
    } else if (pageType === 'guild-top') {
      this.initGuildTopPage();
    }
  }

  /**
   * Настройка IntersectionObserver для производительности
   */
  setupIntersectionObserver() {
    if (this.intersectionObserver) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.processedElements.has(entry.target)) {
            this.processElement(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '500px',
        threshold: 0
      }
    );

    logger.debug('IntersectionObserver настроен');
  }

  /**
   * Инициализация для страницы форума
   */
  initForumPage() {
    logger.info('Инициализация страницы форума');

    this.highlightForumPosts();
    this.startMutationObserver('forum');
  }

  /**
   * Инициализация для страницы топа гильдий
   */
  initGuildTopPage() {
    logger.info('Инициализация страницы топа гильдий');

    this.highlightGuildTopItems();
    this.startMutationObserver('guild-top');
  }

  /**
   * Выделение постов на форуме
   */
  highlightForumPosts() {
    const posts = document.querySelectorAll('article.cs-post-item');

    posts.forEach(post => {
      if (!this.processedElements.has(post)) {
        this.intersectionObserver.observe(post);
      }
    });

    logger.info(`[GuildHighlighter] Найдено ${posts.length} постов на форуме`);
  }

  /**
   * Выделение гильдий в топе
   */
  highlightGuildTopItems() {
    const items = document.querySelectorAll('a[href*="/guild/"][href*="/about"]');

    items.forEach(item => {
      if (!this.processedElements.has(item)) {
        this.intersectionObserver.observe(item);
      }
    });

    logger.info(`[GuildHighlighter] Найдено ${items.length} элементов в топе гильдий`);
  }

  /**
   * Обработка элемента (пост или карточка гильдии)
   */
  processElement(element) {
    const guildName = this.extractGuildName(element);

    logger.info(`[GuildHighlighter] Извлечено название гильдии: "${guildName}"`);

    if (guildName && this.targetGuilds.has(guildName)) {
      this.applyHighlight(element);
      logger.info(`[GuildHighlighter] ✓ Выделен элемент от гильдии: ${guildName}`);
    } else if (guildName) {
      logger.info(`[GuildHighlighter] ✗ Гильдия не в списке целевых: ${guildName}`);
    }

    this.processedElements.add(element);
    this.intersectionObserver.unobserve(element);
  }

  /**
   * Извлечение названия гильдии из элемента
   */
  extractGuildName(element) {
    // Для топа гильдий: элемент сам является ссылкой
    if (element.tagName === 'A' && element.href.includes('/guild/')) {
      const img = element.querySelector('img[alt]');
      if (img && img.alt) {
        try {
          return validators.sanitizeGuildName(img.alt);
        } catch (error) {
          logger.warn('Невалидное название гильдии:', error);
          return null;
        }
      }
    }

    // Для форума: ищем ссылку внутри элемента
    const guildLink = element.querySelector('a[href*="/guild/"]');
    if (!guildLink) {
      return null;
    }

    const img = guildLink.querySelector('img[alt]');
    if (!img || !img.alt) {
      return null;
    }

    try {
      return validators.sanitizeGuildName(img.alt);
    } catch (error) {
      logger.warn('Невалидное название гильдии:', error);
      return null;
    }
  }

  /**
   * Применение стилей выделения
   */
  applyHighlight(element) {
    if (!(element instanceof HTMLElement)) {
      logger.warn('Попытка применить стили к невалидному элементу');
      return;
    }

    element.style.borderLeft = '3px solid rgba(255, 255, 255, 0.3)';
    element.style.background = 'rgba(255, 255, 255, 0.05)';
    element.style.boxShadow = '0 0 12px rgba(255, 255, 255, 0.2)';
    element.setAttribute('data-guild-highlighted', 'true');
  }

  /**
   * Запуск MutationObserver для отслеживания новых элементов
   */
  startMutationObserver(pageType) {
    if (this.mutationObserver) {
      return;
    }

    this.mutationObserver = new MutationObserver(() => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        if (pageType === 'forum') {
          this.highlightForumPosts();
        } else if (pageType === 'guild-top') {
          this.highlightGuildTopItems();
        }
      }, 100);
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    logger.debug('MutationObserver запущен');
  }

  /**
   * Очистка ресурсов
   */
  cleanup() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = null;

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
      logger.debug('IntersectionObserver отключен');
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
      logger.debug('MutationObserver отключен');
    }

    this.processedElements = new WeakSet();

    const highlightedElements = document.querySelectorAll('[data-guild-highlighted]');
    highlightedElements.forEach(el => {
      el.style.borderLeft = '';
      el.style.background = '';
      el.style.boxShadow = '';
      el.removeAttribute('data-guild-highlighted');
    });

    logger.info('GuildHighlighter очищен');
  }
}

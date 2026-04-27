/**
 * Управление тултипами профилей пользователей
 */

class UserTooltip {
  constructor(api, config, renderer) {
    this.api = api;
    this.config = config;
    this.renderer = renderer;
    this.cache = new Map();
    this.hoverTimeout = null;
    this.currentHoveredElement = null;
    this.isEnabled = true;
    this.requestId = 0;
    this.listenersAttached = false;
    this.boundHandleMouseOver = this.handleMouseOver.bind(this);
    this.boundHandleMouseOut = this.handleMouseOut.bind(this);
  }

  /**
   * Инициализация
   */
  init() {
    if (!this.config.get('userTooltipEnabled')) {
      logger.info('Тултипы профилей отключены в настройках');
      return;
    }

    this.renderer.injectStyles();
    this.attachEventListeners();
    logger.info('UserTooltip инициализирован');
  }

  /**
   * Подключение обработчиков событий
   */
  attachEventListeners() {
    if (this.listenersAttached) {
      return;
    }

    document.addEventListener('mouseover', this.boundHandleMouseOver, true);
    document.addEventListener('mouseout', this.boundHandleMouseOut, true);
    this.listenersAttached = true;
  }

  detachEventListeners() {
    if (!this.listenersAttached) {
      return;
    }

    document.removeEventListener('mouseover', this.boundHandleMouseOver, true);
    document.removeEventListener('mouseout', this.boundHandleMouseOut, true);
    this.listenersAttached = false;
  }

  /**
   * Обработка наведения мыши
   */
  handleMouseOver(event) {
    if (!this.isEnabled) return;

    const avatarLink = this.findAvatarLink(event.target);
    if (!avatarLink) return;

    const userId = this.extractUserId(avatarLink);
    if (!userId) return;

    this.currentHoveredElement = avatarLink;

    this.clearHoverTimeout();

    const requestId = ++this.requestId;

    this.hoverTimeout = setTimeout(() => {
      if (this.currentHoveredElement === avatarLink && this.requestId === requestId) {
        this.showTooltip(userId, avatarLink, requestId);
      }
    }, 500);
  }

  /**
   * Обработка ухода мыши
   */
  handleMouseOut(event) {
    const avatarLink = this.findAvatarLink(event.target);
    if (!avatarLink) return;

    if (this.currentHoveredElement === avatarLink) {
      this.clearHoverTimeout();
      this.currentHoveredElement = null;
      this.renderer.remove();
    }
  }

  /**
   * Поиск ссылки на аватар
   */
  findAvatarLink(element) {
    let current = element;
    let depth = 0;
    const maxDepth = 5;

    while (current && depth < maxDepth) {
      if (current.tagName === 'A' && current.href && current.href.includes('/user/') && current.href.includes('/about')) {
        return current;
      }
      current = current.parentElement;
      depth++;
    }

    return null;
  }

  /**
   * Извлечение ID пользователя из ссылки
   */
  extractUserId(link) {
    const match = link.href.match(/\/user\/(\d+)\//);
    if (!match) return null;

    const userId = parseInt(match[1]);

    if (!Number.isInteger(userId) || userId <= 0) {
      logger.warn(`Невалидный ID пользователя: ${userId}`);
      return null;
    }

    return userId;
  }

  /**
   * Показ тултипа
   */
  async showTooltip(userId, targetElement, requestId) {
    try {
      const userData = await this.getUserData(userId);

      if (!userData) {
        logger.warn(`Не удалось получить данные пользователя ${userId}`);
        return;
      }

      if (this.requestId === requestId && this.currentHoveredElement === targetElement) {
        this.renderer.create(userData, targetElement);
      }
    } catch (error) {
      logger.error('Ошибка показа тултипа:', error);
    }
  }

  /**
   * Получение данных пользователя (с кешированием)
   */
  async getUserData(userId) {
    if (this.cache.has(userId)) {
      const cached = this.cache.get(userId);
      const now = Date.now();

      if (now - cached.timestamp < 5 * 60 * 1000) {
        logger.debug(`Данные пользователя ${userId} взяты из кеша`);
        return cached.data;
      } else {
        this.cache.delete(userId);
      }
    }

    try {
      const data = await this.api.request(`/api/v2/users/${userId}/`);

      if (!data) {
        return null;
      }

      const userData = {
        id: data.id,
        username: data.username,
        avatar: data.avatar,
        level: data.level,
        chapters_read: data.chapters_read,
        main_club: data.main_club,
        is_online: data.is_online
      };

      this.cache.set(userId, {
        data: userData,
        timestamp: Date.now()
      });

      logger.debug(`Данные пользователя ${userId} загружены и закешированы`);
      return userData;
    } catch (error) {
      logger.error(`Ошибка загрузки данных пользователя ${userId}:`, error);
      return null;
    }
  }

  /**
   * Очистка таймера наведения
   */
  clearHoverTimeout() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }

  close() {
    this.requestId++;
    this.clearHoverTimeout();
    this.currentHoveredElement = null;
    this.renderer.remove();
  }

  /**
   * Очистка кеша
   */
  clearCache() {
    this.cache.clear();
    logger.debug('Кеш тултипов очищен');
  }

  /**
   * Включение/выключение тултипов
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.close();
    }
    logger.debug(`Тултипы ${enabled ? 'включены' : 'отключены'}`);
  }

  /**
   * Очистка ресурсов
   */
  cleanup() {
    this.close();
    this.detachEventListeners();
    this.cache.clear();
    logger.info('UserTooltip очищен');
  }
}

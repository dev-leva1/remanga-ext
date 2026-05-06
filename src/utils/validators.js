/**
 * Валидаторы для проверки входных данных
 * Защита от некорректных данных и инъекций
 */

const validators = {
  /**
   * Проверка ID главы
   */
  isChapterId(value) {
    const num = typeof value === 'number' ? value : Number(String(value).trim());
    return Number.isInteger(num) && num > 0 && num < Number.MAX_SAFE_INTEGER;
  },

  /**
   * Проверка массива ID глав
   */
  isChapterIds(values) {
    if (!Array.isArray(values)) {
      return false;
    }
    if (values.length === 0) {
      return false;
    }
    return values.every(v => this.isChapterId(v));
  },

  /**
   * Проверка задержки (мс)
   */
  isDelay(value) {
    const num = typeof value === 'number' ? value : Number(String(value).trim());
    return Number.isInteger(num) && num >= 1000 && num <= 60000;
  },

  /**
   * Проверка токена авторизации
   */
  isValidToken(token) {
    if (typeof token !== 'string') {
      return false;
    }
    if (token.length < 20 || token.length > 100) {
      return false;
    }
    return /^[a-zA-Z0-9_-]+$/.test(token);
  },

  /**
   * Санитизация ID главы
   */
  sanitizeChapterId(value) {
    const num = typeof value === 'number' ? value : Number(String(value).trim());
    if (!this.isChapterId(num)) {
      throw new Error(`Невалидный ID главы: ${value}`);
    }
    return num;
  },

  /**
   * Санитизация массива ID глав
   */
  sanitizeChapterIds(values) {
    if (!Array.isArray(values)) {
      throw new Error('ID глав должны быть массивом');
    }
    if (values.length === 0) {
      throw new Error('Массив ID глав не может быть пустым');
    }
    if (values.length > 1000) {
      throw new Error('Слишком много ID глав (максимум 1000)');
    }
    return values.map(v => this.sanitizeChapterId(v));
  },

  /**
   * Санитизация названия гильдии
   */
  sanitizeGuildName(name) {
    if (typeof name !== 'string') {
      throw new Error('Название гильдии должно быть строкой');
    }

    const trimmed = name.trim();

    if (trimmed.length === 0 || trimmed.length > 100) {
      throw new Error('Невалидная длина названия гильдии');
    }

    return trimmed;
  },

  /**
   * Санитизация настроек
   */
  sanitizeSettings(settings) {
    if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) {
      throw new Error('Настройки должны быть объектом');
    }

    const sanitized = {};

    if ('autoLike' in settings) {
      sanitized.autoLike = Boolean(settings.autoLike);
    }

    if ('notificationsEnabled' in settings) {
      sanitized.notificationsEnabled = Boolean(settings.notificationsEnabled);
    }
    if ('notificationDuration' in settings) {
      const duration = Number(String(settings.notificationDuration).trim());
      if (Number.isInteger(duration) && duration >= 1 && duration <= 10) {
        sanitized.notificationDuration = duration;
      }
    }

    if ('batchSize' in settings) {
      const batchSize = Number(String(settings.batchSize).trim());
      if (Number.isInteger(batchSize) && batchSize >= 1 && batchSize <= 50) {
        sanitized.batchSize = batchSize;
      }
    }

    if ('skipProcessed' in settings) {
      sanitized.skipProcessed = Boolean(settings.skipProcessed);
    }

    if ('autoUpdateEnabled' in settings) {
      sanitized.autoUpdateEnabled = Boolean(settings.autoUpdateEnabled);
    }

    if ('blockCustomThemes' in settings) {
      sanitized.blockCustomThemes = Boolean(settings.blockCustomThemes);
    }

    if ('hideChatIndicator' in settings) {
      sanitized.hideChatIndicator = Boolean(settings.hideChatIndicator);
    }

    if ('hideProfileBlocks' in settings) {
      const blocks = settings.hideProfileBlocks;
      if (typeof blocks === 'object' && blocks !== null && !Array.isArray(blocks)) {
        sanitized.hideProfileBlocks = {};
        const allowedKeys = ['statistics', 'badges', 'achievements', 'favoriteCards', 'publishers', 'guilds', 'friends', 'followers', 'comments'];
        allowedKeys.forEach(key => {
          if (key in blocks) {
            sanitized.hideProfileBlocks[key] = Boolean(blocks[key]);
          }
        });
      }
    }

    if ('highlightGuilds' in settings) {
      sanitized.highlightGuilds = Boolean(settings.highlightGuilds);
    }

    if ('feedbackBotUsername' in settings) {
      const username = String(settings.feedbackBotUsername).trim().replace(/^@/, '');
      if (/^[a-zA-Z0-9_]{5,32}$/.test(username)) {
        sanitized.feedbackBotUsername = username;
      }
    }

    if ('userTooltipEnabled' in settings) {
      sanitized.userTooltipEnabled = Boolean(settings.userTooltipEnabled);
    }

    if ('randomTitleButtonEnabled' in settings) {
      sanitized.randomTitleButtonEnabled = Boolean(settings.randomTitleButtonEnabled);
    }

    if ('titleCoverPreviewEnabled' in settings) {
      sanitized.titleCoverPreviewEnabled = Boolean(settings.titleCoverPreviewEnabled);
    }

    return sanitized;
  }
};

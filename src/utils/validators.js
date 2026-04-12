/**
 * Валидаторы для проверки входных данных
 * Защита от некорректных данных и инъекций
 */

const validators = {
  /**
   * Проверка ID главы
   */
  isChapterId(value) {
    const num = parseInt(value);
    return Number.isInteger(num) && num > 0 && num < Number.MAX_SAFE_INTEGER;
  },

  /**
   * Проверка массива ID глав
   */
  isChapterIds(values) {
    if (!Array.isArray(values)) return false;
    if (values.length === 0) return false;
    return values.every(v => this.isChapterId(v));
  },

  /**
   * Проверка задержки (мс)
   */
  isDelay(value) {
    const num = parseInt(value);
    return Number.isInteger(num) && num >= 1000 && num <= 60000;
  },

  /**
   * Проверка токена авторизации
   */
  isValidToken(token) {
    if (typeof token !== 'string') return false;
    if (token.length < 20 || token.length > 100) return false;
    return /^[a-zA-Z0-9_-]+$/.test(token);
  },

  /**
   * Санитизация ID главы
   */
  sanitizeChapterId(value) {
    const num = parseInt(value);
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
   * Санитизация настроек
   */
  sanitizeSettings(settings) {
    const sanitized = {};

    if ('autoLike' in settings) {
      sanitized.autoLike = Boolean(settings.autoLike);
    }

    if ('autoMarkAsRead' in settings) {
      sanitized.autoMarkAsRead = Boolean(settings.autoMarkAsRead);
    }

    if ('notificationsEnabled' in settings) {
      sanitized.notificationsEnabled = Boolean(settings.notificationsEnabled);
    }

    if ('notificationDuration' in settings) {
      const duration = parseInt(settings.notificationDuration);
      if (duration >= 1 && duration <= 10) {
        sanitized.notificationDuration = duration;
      }
    }

    return sanitized;
  }
};

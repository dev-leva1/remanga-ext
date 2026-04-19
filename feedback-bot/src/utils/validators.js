/**
 * Валидация и санитизация входных данных
 */

export const validators = {
  /**
   * Валидация типа обращения
   */
  validateFeedbackType(type) {
    const allowed = ['bug', 'feature', 'question', 'other'];
    if (!type || !allowed.includes(type)) {
      throw new Error('Невалидный тип обращения');
    }
    return type;
  },

  /**
   * Валидация и санитизация сообщения
   */
  validateMessage(text) {
    if (typeof text !== 'string') {
      throw new Error('Сообщение должно быть строкой');
    }

    const trimmed = text.trim();

    if (trimmed.length < 10) {
      throw new Error('Сообщение слишком короткое (минимум 10 символов)');
    }

    if (trimmed.length > 2000) {
      throw new Error('Сообщение слишком длинное (максимум 2000 символов)');
    }

    return trimmed;
  },

  /**
   * Валидация версии расширения
   */
  validateVersion(version) {
    if (!version) return null;

    if (typeof version !== 'string') return null;

    // Формат: X.Y.Z
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      return null;
    }

    return version;
  },

  /**
   * Валидация браузера
   */
  validateBrowser(browser) {
    if (!browser) return null;

    const allowed = ['chrome', 'firefox', 'safari', 'edge', 'other'];
    const normalized = String(browser).toLowerCase();

    return allowed.includes(normalized) ? normalized : 'other';
  },

  /**
   * Валидация URL страницы
   */
  validateUrl(url) {
    if (!url) return null;

    try {
      const parsed = new URL(url);

      // Только remanga.org
      if (!parsed.hostname.includes('remanga.org')) {
        return null;
      }

      return url;
    } catch {
      return null;
    }
  },

  /**
   * Валидация статуса
   */
  validateStatus(status) {
    const allowed = ['new', 'in_progress', 'resolved', 'closed'];
    if (!status || !allowed.includes(status)) {
      throw new Error('Невалидный статус');
    }
    return status;
  },

  /**
   * Валидация заметки админа
   */
  validateAdminNote(note) {
    if (!note) return null;

    if (typeof note !== 'string') {
      throw new Error('Заметка должна быть строкой');
    }

    const trimmed = note.trim();

    if (trimmed.length > 1000) {
      throw new Error('Заметка слишком длинная (максимум 1000 символов)');
    }

    return trimmed;
  },

  /**
   * Санитизация Telegram user ID
   */
  sanitizeTelegramUserId(userId) {
    const id = parseInt(userId);

    if (isNaN(id) || id <= 0) {
      throw new Error('Невалидный Telegram user ID');
    }

    return id;
  },

  /**
   * Санитизация HTML (базовая защита от XSS)
   */
  sanitizeHtml(text) {
    if (!text) return '';

    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
};

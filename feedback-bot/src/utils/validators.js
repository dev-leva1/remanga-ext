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
      const hostname = parsed.hostname.toLowerCase();

      // Только remanga.org
      if (hostname !== 'remanga.org' && !hostname.endsWith('.remanga.org')) {
        return null;
      }

      return parsed.toString();
    } catch {
      return null;
    }
  },

  validateDeepLinkContext(parsed) {
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Невалидный контекст');
    }

    const schemaVersion = Number(parsed.s ?? 1);
    if (schemaVersion !== 1) {
      throw new Error('Неподдерживаемая версия контекста');
    }

    return {
      v: this.validateVersion(parsed.v),
      b: this.validateBrowser(parsed.b),
      u: this.validateUrl(parsed.u)
    };
  },

  parseContextText(text) {
    if (typeof text !== 'string') {
      throw new Error('Контекст должен быть строкой');
    }

    const context = {
      extension_version: null,
      browser: null,
      page_url: null
    };

    const lines = text.split('\n').slice(0, 20);

    for (const line of lines) {
      const versionMatch = line.match(/версия[:\s]+([0-9.]+)/i);
      const browserMatch = line.match(/браузер[:\s]+([a-zа-я0-9 _.-]+)/i);
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/i);

      if (versionMatch) {
        context.extension_version = this.validateVersion(versionMatch[1]);
      }
      if (browserMatch) {
        context.browser = this.validateBrowser(browserMatch[1]);
      }
      if (urlMatch) {
        context.page_url = this.validateUrl(urlMatch[1]);
      }
    }

    return context;
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
    const id = typeof userId === 'number' ? userId : Number(String(userId).trim());

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Невалидный Telegram user ID');
    }

    return id;
  },

  validateTelegramUsername(username) {
    if (!username) return null;

    const value = String(username).trim();

    if (!/^[A-Za-z0-9_]{5,32}$/.test(value)) {
      return null;
    }

    return value;
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

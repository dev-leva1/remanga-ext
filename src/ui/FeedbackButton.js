/**
 * FeedbackButton - кнопка обратной связи
 */

class FeedbackButton {
  constructor(config, notifications) {
    this.config = config;
    this.notifications = notifications;
    this.botUsername = this.resolveBotUsername();
    this.modal = null;
  }

  /**
   * Открытие модалки выбора контекста
   */
  openContextModal() {
    if (this.modal) {
      this.modal.remove();
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = overlayStyles();

    const modal = document.createElement('div');
    modal.style.cssText = modalStyles() + `
      min-width: 500px;
      max-width: 600px;
    `;

    modal.innerHTML = `
      <h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xxl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.bold}; color: ${DESIGN_TOKENS.colors.text.primary};">
        Обратная связь
      </h2>

      <p style="margin-bottom: ${DESIGN_TOKENS.spacing.lg}; color: ${DESIGN_TOKENS.colors.text.secondary};">
        Выберите тип обращения и технические данные для отправки:
      </p>

      <div style="margin-bottom: ${DESIGN_TOKENS.spacing.lg};">
        <label style="display: block; margin-bottom: ${DESIGN_TOKENS.spacing.sm}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">
          Тип обращения
        </label>
        <select id="feedback-type" style="
          width: 100%;
          padding: ${DESIGN_TOKENS.spacing.md};
          background: ${DESIGN_TOKENS.colors.bg.surface};
          color: ${DESIGN_TOKENS.colors.text.primary};
          border: 1px solid #374151;
          border-radius: ${DESIGN_TOKENS.radius.md};
          font-family: ${DESIGN_TOKENS.typography.fontFamily};
          font-size: ${DESIGN_TOKENS.typography.fontSize.md};
          cursor: pointer;
        ">
          <option value="bug">🐛 Сообщить о баге</option>
          <option value="feature">💡 Предложить функцию</option>
          <option value="question">❓ Задать вопрос</option>
          <option value="other">📝 Другое</option>
        </select>
      </div>

      <div style="margin-bottom: ${DESIGN_TOKENS.spacing.lg};">
        <div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary}; margin-bottom: ${DESIGN_TOKENS.spacing.md};">
          Включить технические данные:
        </div>

        <label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; margin-bottom: ${DESIGN_TOKENS.spacing.sm}; cursor: pointer;">
          <input type="checkbox" id="include-version" checked style="width: 20px; height: 20px; cursor: pointer;">
          <div>
            <div style="color: ${DESIGN_TOKENS.colors.text.primary};">Версия расширения</div>
            <div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Текущая версия: ${this.getVersion()}</div>
          </div>
        </label>

        <label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; margin-bottom: ${DESIGN_TOKENS.spacing.sm}; cursor: pointer;">
          <input type="checkbox" id="include-browser" checked style="width: 20px; height: 20px; cursor: pointer;">
          <div>
            <div style="color: ${DESIGN_TOKENS.colors.text.primary};">Браузер</div>
            <div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">${this.detectBrowser()}</div>
          </div>
        </label>

        <label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
          <input type="checkbox" id="include-url" checked style="width: 20px; height: 20px; cursor: pointer;">
          <div>
            <div style="color: ${DESIGN_TOKENS.colors.text.primary};">Текущая страница</div>
            <div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted}; word-break: break-all;">${this.escapeHtml(this.truncateUrl(window.location.href))}</div>
          </div>
        </label>
      </div>

      <div style="margin-bottom: ${DESIGN_TOKENS.spacing.lg}; padding: ${DESIGN_TOKENS.spacing.md}; background: ${DESIGN_TOKENS.colors.bg.surface}; border-radius: ${DESIGN_TOKENS.radius.md}; border-left: 3px solid ${DESIGN_TOKENS.colors.text.secondary};">
        <div style="color: ${DESIGN_TOKENS.colors.text.primary}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; margin-bottom: ${DESIGN_TOKENS.spacing.sm};">
          ℹКак отправить обращение:
        </div>
        <div style="color: ${DESIGN_TOKENS.colors.text.muted}; font-size: ${DESIGN_TOKENS.typography.fontSize.sm};">
          1. Нажмите "Открыть бота"<br>
          2. Команда скопируется автоматически<br>
          3. Вставьте её в чат с ботом (Ctrl+V)
        </div>
      </div>

      <div style="display: flex; gap: ${DESIGN_TOKENS.spacing.md}; justify-content: flex-end;">
        <button id="feedback-cancel" style="${buttonStyles('secondary')}">
          Отмена
        </button>
        <button id="feedback-submit" style="${buttonStyles('primary')}">
          Открыть бота
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    this.modal = overlay;

    // Обработчики
    modal.querySelector('#feedback-cancel').addEventListener('click', () => {
      overlay.remove();
      this.modal = null;
    });

    modal.querySelector('#feedback-submit').addEventListener('click', () => {
      this.submitFeedback(modal);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        this.modal = null;
      }
    });

    logger.info('Feedback modal opened');
  }

  /**
   * Отправка обратной связи
   */
  submitFeedback(modal) {
    try {
      const type = modal.querySelector('#feedback-type').value;
      const includeVersion = modal.querySelector('#include-version').checked;
      const includeBrowser = modal.querySelector('#include-browser').checked;
      const includeUrl = modal.querySelector('#include-url').checked;

      const context = {
        v: includeVersion ? this.getVersion() : null,
        b: includeBrowser ? this.detectBrowser() : null,
        u: includeUrl ? window.location.href : null
      };

      const deepLink = this.generateDeepLink(type, context);

      const command = `/start ${new URL(deepLink).searchParams.get('start')}`;
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(command).then(() => {
          this.notifications.success('Команда скопирована! Вставьте её в бота.');
        }).catch(() => {
          this.notifications.info('Скопируйте команду вручную из бота');
        });
      } else {
        this.notifications.info('Скопируйте команду вручную из бота');
      }

      window.open(`https://t.me/${this.botUsername}`, '_blank', 'noopener,noreferrer');

      this.modal.remove();
      this.modal = null;

      logger.info('Feedback deep link generated', { type, context });
    } catch (error) {
      logger.error('Error submitting feedback', { error: error.message });
      this.notifications.error('Ошибка при открытии бота');
    }
  }

  /**
   * Генерация deep link
   */
  generateDeepLink(type, context) {
    this.botUsername = this.resolveBotUsername();

    const allowedTypes = ['bug', 'feature', 'question', 'other'];
    if (!allowedTypes.includes(type)) {
      throw new Error('Невалидный тип обращения');
    }

    const safeContext = this.sanitizeContext(context);
    const payload = {
      s: 1,
      type,
      ...safeContext
    };

    const json = JSON.stringify(payload);
    const base64 = btoa(json);
    const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    return `https://t.me/${this.botUsername}?start=${base64url}`;
  }

  /**
   * Получение версии расширения
   */
  getVersion() {
    return '__VERSION__'; // Заменяется при сборке
  }

  resolveBotUsername() {
    const configuredUsername = this.config?.get('feedbackBotUsername') || 'remanga_extension_bot';
    const username = String(configuredUsername).trim().replace(/^@/, '');

    if (!/^[a-zA-Z0-9_]{5,32}$/.test(username)) {
      return 'remanga_extension_bot';
    }

    return username;
  }

  sanitizeContext(context) {
    const source = typeof context === 'object' && context !== null && !Array.isArray(context)
      ? context
      : {};

    const safeContext = {
      v: null,
      b: null,
      u: null
    };

    if (typeof source.v === 'string' && /^\d+\.\d+\.\d+$/.test(source.v)) {
      safeContext.v = source.v;
    }

    if (typeof source.b === 'string') {
      const browser = source.b.toLowerCase();
      safeContext.b = ['chrome', 'firefox', 'safari', 'edge', 'other'].includes(browser) ? browser : 'other';
    }

    if (typeof source.u === 'string') {
      try {
        const url = new URL(source.u);
        const hostname = url.hostname.toLowerCase();
        if (hostname === 'remanga.org' || hostname.endsWith('.remanga.org')) {
          safeContext.u = url.toString();
        }
      } catch (error) {
        logger.warn('Невалидный URL контекста обратной связи:', error);
      }
    }

    return safeContext;
  }

  /**
   * Определение браузера
   */
  detectBrowser() {
    const ua = navigator.userAgent;

    if (ua.includes('Firefox')) {
      return 'firefox';
    }
    if (ua.includes('Edg')) {
      return 'edge';
    }
    if (ua.includes('Chrome')) {
      return 'chrome';
    }
    if (ua.includes('Safari')) {
      return 'safari';
    }

    return 'other';
  }

  /**
   * Обрезка длинного URL
   */
  truncateUrl(url, maxLength = 60) {
    if (url.length <= maxLength) {
      return url;
    }

    return url.substring(0, maxLength) + '...';
  }

  /**
   * HTML-экранирование для безопасной вставки в innerHTML
   */
  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Очистка
   */
  cleanup() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
}

/**
 * Кастомизация header
 * Скрытие индикатора непрочитанных сообщений
 */

class HeaderCustomizer {
  constructor(config) {
    this.config = config;
    this.styleElement = null;
  }

  /**
   * Инициализация
   */
  init() {
    this.injectStyles();
    logger.info('HeaderCustomizer инициализирован');
  }

  /**
   * Инъекция CSS стилей
   */
  injectStyles() {
    if (this.styleElement) {
      return;
    }

    const hideChatIndicator = this.config.get('hideChatIndicator');

    if (!hideChatIndicator) {
      return;
    }

    const styles = `
      /* Скрытие индикатора непрочитанных сообщений в чате */
      a[href*="/chat"] [data-slot="badge"] {
        display: none !important;
      }
    `;

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'remanga-header-customizer';
    this.styleElement.textContent = styles;
    document.head.appendChild(this.styleElement);

    logger.info('HeaderCustomizer стили применены');
  }

  /**
   * Обновление стилей при изменении настроек
   */
  update() {
    this.cleanup();
    this.injectStyles();
  }

  /**
   * Очистка
   */
  cleanup() {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
      logger.info('HeaderCustomizer стили удалены');
    }
  }
}

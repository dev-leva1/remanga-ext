/**
 * Простой логгер для отладки
 */

const logger = {
  prefix: '[RemangaExt]',

  info(message, ...args) {
    console.log(`${this.prefix} ${message}`, ...args);
  },

  warn(message, ...args) {
    console.warn(`${this.prefix} ${message}`, ...args);
  },

  error(message, ...args) {
    console.error(`${this.prefix} ${message}`, ...args);
  },

  debug(message, ...args) {
    if (this.isDebugEnabled()) {
      console.debug(`${this.prefix} [DEBUG] ${message}`, ...args);
    }
  },

  isDebugEnabled() {
    return localStorage.getItem('remanga_ext_debug') === 'true';
  }
};

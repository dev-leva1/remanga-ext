/**
 * Простой логгер
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

function redactSecrets(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/\/bot\d+:[A-Za-z0-9_-]+/g, '/bot[REDACTED]');
}

export function serializeError(error) {
  if (!(error instanceof Error)) {
    return { message: redactSecrets(String(error)) };
  }

  const serialized = {
    name: error.name,
    message: redactSecrets(error.message)
  };

  for (const key of ['type', 'code', 'errno', 'syscall', 'address', 'port']) {
    if (Object.prototype.hasOwnProperty.call(error, key)) {
      serialized[key] = redactSecrets(error[key]);
    }
  }

  if (error.cause) {
    serialized.cause = serializeError(error.cause);
  }

  return serialized;
}

class Logger {
  constructor() {
    this.level = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  debug(message, meta) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, meta));
    }
  }

  info(message, meta) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.log(this.formatMessage('INFO', message, meta));
    }
  }

  warn(message, meta) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage('WARN', message, meta));
    }
  }

  error(message, meta) {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error(this.formatMessage('ERROR', message, meta));
    }
  }
}

export const logger = new Logger();

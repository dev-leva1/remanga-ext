class AppConfig {
  constructor(env) {
    if (!env || typeof env !== 'object') {
      throw new Error('Environment config is required');
    }

    this.botToken = this.readRequiredString(env, 'BOT_TOKEN');
    this.adminIds = this.parseAdminIds(this.readRequiredString(env, 'ADMIN_IDS'));
    this.database = Object.freeze({
      host: this.readRequiredString(env, 'DB_HOST'),
      port: this.parsePort(this.readRequiredString(env, 'DB_PORT')),
      database: this.readRequiredString(env, 'DB_NAME'),
      user: this.readRequiredString(env, 'DB_USER'),
      password: this.readRequiredString(env, 'DB_PASSWORD')
    });

    Object.freeze(this.adminIds);
    Object.freeze(this);
  }

  static fromEnv(env = process.env) {
    return new AppConfig(env);
  }

  readRequiredString(env, key) {
    const value = env[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${key} not found in environment`);
    }

    return value.trim();
  }

  parseAdminIds(value) {
    const rawIds = value.split(',').map(id => id.trim()).filter(Boolean);
    const invalidIds = rawIds.filter(id => !/^\d+$/.test(id) || Number(id) <= 0);

    if (invalidIds.length > 0) {
      throw new Error('ADMIN_IDS contains invalid Telegram user IDs');
    }

    const ids = rawIds.map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0);

    if (ids.length === 0) {
      throw new Error('ADMIN_IDS must contain at least one valid Telegram user ID');
    }

    return [...new Set(ids)];
  }

  parsePort(value) {
    if (!/^\d+$/.test(value)) {
      throw new Error('DB_PORT must be a number');
    }

    const port = Number(value);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('DB_PORT must be between 1 and 65535');
    }

    return port;
  }
}

export default AppConfig;

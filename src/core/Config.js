/**
 * Менеджер конфигурации (Singleton)
 * Управление настройками расширения
 */

class Config {
  static instance = null;

  constructor() {
    if (Config.instance) {
      return Config.instance;
    }

    this.defaults = {
      autoLike: false,
      notificationsEnabled: true,
      notificationDuration: 3
    };

    this.settings = { ...this.defaults };
    Config.instance = this;
  }

  /**
   * Загрузка настроек из хранилища
   */
  async load() {
    try {
      const stored = await GM.getValue('settings', null);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Невалидная структура настроек');
        }

        this.settings = { ...this.defaults, ...parsed };
      } else {
        this.settings = { ...this.defaults };
      }

      logger.info('Настройки загружены:', this.settings);
      return this.settings;
    } catch (error) {
      logger.error('Ошибка загрузки настроек:', error);
      this.settings = { ...this.defaults };
      return this.settings;
    }
  }

  /**
   * Сохранение настроек
   */
  async save(newSettings) {
    try {
      const sanitized = validators.sanitizeSettings(newSettings);
      this.settings = { ...this.settings, ...sanitized };
      await GM.setValue('settings', JSON.stringify(this.settings));
      logger.info('Настройки сохранены:', this.settings);
      return true;
    } catch (error) {
      logger.error('Ошибка сохранения настроек:', error);
      throw error;
    }
  }

  /**
   * Получение значения настройки
   */
  get(key) {
    if (!this.settings) {
      logger.warn('Настройки не загружены, используются значения по умолчанию');
      return this.defaults[key];
    }
    return this.settings[key] ?? this.defaults[key];
  }

  /**
   * Установка значения настройки
   */
  async set(key, value) {
    return this.save({ [key]: value });
  }

  /**
   * Сброс к значениям по умолчанию
   */
  async reset() {
    this.settings = { ...this.defaults };
    await GM.setValue('settings', JSON.stringify(this.settings));
    logger.info('Настройки сброшены к значениям по умолчанию');
  }

  /**
   * Экспорт настроек
   */
  export() {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Импорт настроек
   */
  async import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      await this.save(imported);
      return true;
    } catch (error) {
      logger.error('Ошибка импорта настроек:', error);
      throw new Error('Невалидный формат настроек');
    }
  }
}

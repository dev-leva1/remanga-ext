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
      autoCommentEnabled: false,
      autoCommentText: '',
      notificationsEnabled: true,
      notificationDuration: 3,
      batchSize: 10,
      skipProcessed: true,
      autoUpdateEnabled: true,
      blockCustomThemes: false,
      hideChatIndicator: false,
      hideProfileBlocks: {
        statistics: false,
        badges: false,
        achievements: false,
        favoriteCards: false,
        publishers: false,
        guilds: false,
        friends: false,
        followers: false,
        comments: false
      },
      highlightGuilds: true,
      feedbackBotUsername: 'remanga_extension_bot',
      userTooltipEnabled: true,
      randomTitleButtonEnabled: true,
      titleCoverPreviewEnabled: true
    };

    this.settings = this.mergeSettings();
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

        const sanitized = validators.sanitizeSettings(parsed);
        this.settings = this.mergeSettings(sanitized);
      } else {
        this.settings = this.mergeSettings();
      }

      logger.info('Настройки загружены:', this.settings);
      return this.settings;
    } catch (error) {
      logger.error('Ошибка загрузки настроек:', error);
      this.settings = this.mergeSettings();
      return this.settings;
    }
  }

  mergeSettings(settings = {}) {
    const source = typeof settings === 'object' && settings !== null && !Array.isArray(settings)
      ? settings
      : {};

    const merged = {
      ...this.defaults,
      ...source,
      hideProfileBlocks: {
        ...this.defaults.hideProfileBlocks,
        ...(source.hideProfileBlocks || {})
      }
    };

    if (merged.autoCommentEnabled && !merged.autoCommentText) {
      merged.autoCommentEnabled = false;
    }

    return merged;
  }

  /**
   * Сохранение настроек
   */
  async save(newSettings) {
    try {
      const sanitized = validators.sanitizeSettings(newSettings);
      this.settings = this.mergeSettings({
        ...this.settings,
        ...sanitized,
        hideProfileBlocks: {
          ...(this.settings.hideProfileBlocks || {}),
          ...(sanitized.hideProfileBlocks || {})
        }
      });
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
    this.settings = this.mergeSettings();
    await GM.setValue('settings', JSON.stringify(this.settings));
    logger.info('Настройки сброшены к значениям по умолчанию');
  }

  /**
   * Экспорт настроек
   */
  export() {
    const exportData = {
      version: '__VERSION__',
      exportDate: new Date().toISOString(),
      settings: this.settings
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Импорт настроек
   */
  async import(jsonString) {
    try {
      if (typeof jsonString !== 'string') {
        throw new Error('Импорт требует строку JSON');
      }

      const imported = JSON.parse(jsonString);

      if (typeof imported !== 'object' || imported === null || Array.isArray(imported)) {
        throw new Error('Невалидная структура настроек');
      }

      let settingsToImport;
      if (imported.settings && imported.version) {
        settingsToImport = imported.settings;
        logger.info(`Импорт настроек версии ${imported.version} от ${imported.exportDate}`);
      } else {
        settingsToImport = imported;
      }

      await this.save(settingsToImport);
      return true;
    } catch (error) {
      logger.error('Ошибка импорта настроек:', error);
      throw new Error('Невалидный формат настроек');
    }
  }
}

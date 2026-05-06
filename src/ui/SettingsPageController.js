class SettingsPageController {
  constructor(config, notifications, statistics, collaborators = {}) {
    if (!config || !notifications || !statistics) {
      throw new Error('SettingsPageController требует config, notifications и statistics');
    }

    this.config = config;
    this.notifications = notifications;
    this.statistics = statistics;
    this.updateChecker = collaborators.updateChecker || null;
    this.feedbackButton = collaborators.feedbackButton || null;
    this.onSettingsChanged = typeof collaborators.onSettingsChanged === 'function'
      ? collaborators.onSettingsChanged
      : null;
  }

  async saveSettings(settings) {
    if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) {
      throw new Error('Невалидные настройки');
    }

    await this.config.save(settings);
    await this.notifySettingsChanged();
    this.notifications.success('Настройки сохранены');
    logger.info('Настройки успешно сохранены');
  }

  async resetSettings() {
    await this.config.reset();
    await this.notifySettingsChanged();
    this.notifications.success('Настройки сброшены');
  }

  async resetStatistics() {
    await this.statistics.reset();
    this.notifications.success('Статистика сброшена');
  }

  async checkForUpdates() {
    if (!this.updateChecker) {
      this.notifications.error('Проверка обновлений недоступна');
      return;
    }

    await this.updateChecker.checkForUpdates(true);
  }

  async getLastCheckTime() {
    if (!this.updateChecker) {
      return null;
    }

    return await this.updateChecker.getLastCheckTime();
  }

  openFeedback() {
    if (!this.feedbackButton) {
      this.notifications.error('Обратная связь недоступна');
      return;
    }

    this.feedbackButton.openContextModal();
  }

  async notifySettingsChanged() {
    if (this.onSettingsChanged) {
      await this.onSettingsChanged(this.config.settings);
    }
  }
}

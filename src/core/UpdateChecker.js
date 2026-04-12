/**
 * Менеджер проверки обновлений
 */

class UpdateChecker {
  constructor(config, notifications) {
    this.config = config;
    this.notifications = notifications;
    this.updateURL = 'https://ext.nexee.ru/remanga-extension.user.js';
    this.currentVersion = '1.2.4';
    this.checkInterval = 12 * 60 * 60 * 1000;
    this.isChecking = false;
  }

  /**
   * Инициализация проверки обновлений
   */
  async init() {
    if (!this.config.get('autoUpdateEnabled')) {
      logger.info('Автообновления отключены');
      return;
    }

    const shouldCheck = await this.shouldCheckForUpdates();
    if (shouldCheck) {
      await this.checkForUpdates(false);
    }
  }

  /**
   * Проверка необходимости проверки обновлений
   */
  async shouldCheckForUpdates() {
    const lastCheck = await GM.getValue('lastUpdateCheck', 0);
    const now = Date.now();
    return (now - lastCheck) >= this.checkInterval;
  }

  /**
   * Проверка наличия обновлений
   */
  async checkForUpdates(manual = false) {
    if (this.isChecking) {
      logger.debug('Проверка обновлений уже выполняется');
      return;
    }

    this.isChecking = true;

    try {
      logger.info('Проверка обновлений...');

      const scriptText = await this.fetchRemoteScript();
      const remoteVersion = changelogParser.parseVersion(scriptText);

      if (!remoteVersion || !changelogParser.isValidVersion(remoteVersion)) {
        throw new Error('Не удалось определить версию удаленного скрипта');
      }

      await GM.setValue('lastUpdateCheck', Date.now());

      const comparison = changelogParser.compareVersions(this.currentVersion, remoteVersion);

      if (comparison < 0) {
        logger.info(`Доступна новая версия: ${remoteVersion} (текущая: ${this.currentVersion})`);
        const changelog = changelogParser.parseChangelog(scriptText);
        this.showUpdateNotification(remoteVersion, changelog);
      } else if (manual) {
        this.notifications.info('Установлена последняя версия');
      }
    } catch (error) {
      logger.error('Ошибка проверки обновлений:', error);
      if (manual) {
        this.notifications.error('Не удалось проверить обновления');
      }
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Загрузка удаленного скрипта
   */
  async fetchRemoteScript() {
    return new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: 'GET',
        url: this.updateURL,
        timeout: 10000,
        onload: (response) => {
          if (response.status === 200) {
            resolve(response.responseText);
          } else {
            reject(new Error(`HTTP ${response.status}`));
          }
        },
        onerror: () => reject(new Error('Сетевая ошибка')),
        ontimeout: () => reject(new Error('Таймаут'))
      });
    });
  }

  /**
   * Показать уведомление об обновлении
   */
  showUpdateNotification(version, changelog) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: #3b82f6;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      max-width: 400px;
      animation: remanga-toast-slide-in 0.3s ease;
    `;

    toast.innerHTML = `
      <div style="margin-bottom: 12px; font-weight: 600; font-size: 16px;">
        🎉 Доступно обновление ${version}
      </div>
      <div style="margin-bottom: 12px; font-size: 13px; opacity: 0.9;">
        Нажмите для просмотра изменений
      </div>
    `;

    toast.addEventListener('click', () => {
      toast.remove();
      this.showUpdateModal(version, changelog);
    });

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'remanga-toast-slide-out 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 10000);
  }

  /**
   * Показать модальное окно с changelog
   */
  showUpdateModal(version, changelog) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: #1a1a1a;
      color: #ffffff;
      border-radius: 12px;
      padding: 32px;
      min-width: 500px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      animation: remanga-modal-appear 0.2s ease;
    `;

    const changelogLines = changelog.split('\n');
    const changelogHTML = changelogLines
      .map(line => `<div style="padding: 4px 0; color: #d1d5db;">• ${line}</div>`)
      .join('');

    modal.innerHTML = `
      <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold; color: #ffffff;">
        Обновление ${version}
      </h2>
      <div style="margin-bottom: 24px; color: #9ca3af; font-size: 14px;">
        Текущая версия: ${this.currentVersion}
      </div>

      <div style="margin-bottom: 24px;">
        <div style="font-weight: 600; margin-bottom: 12px; color: #ffffff; font-size: 16px;">
          📝 Список изменений:
        </div>
        <div style="
          background: #2a2a2a;
          padding: 16px;
          border-radius: 8px;
          max-height: 300px;
          overflow-y: auto;
          font-size: 14px;
          line-height: 1.6;
        ">
          ${changelogHTML}
        </div>
      </div>

      <div style="
        padding: 16px;
        background: #2a2a2a;
        border-radius: 8px;
        margin-bottom: 24px;
        font-size: 13px;
        color: #9ca3af;
      ">
        ℹ️ После нажатия "Обновить" Tampermonkey автоматически загрузит новую версию.
        Страница будет перезагружена.
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="update-later" style="
          padding: 12px 24px;
          background: #374151;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
        ">Позже</button>

        <button id="update-now" style="
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
        ">Обновить</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector('#update-later').addEventListener('click', () => {
      overlay.remove();
    });

    modal.querySelector('#update-now').addEventListener('click', () => {
      overlay.remove();
      this.performUpdate();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  /**
   * Выполнить обновление
   */
  performUpdate() {
    this.notifications.info('Обновление начато. Tampermonkey загрузит новую версию...');

    setTimeout(() => {
      window.location.href = this.updateURL;
    }, 1000);
  }

  /**
   * Получить информацию о текущей версии
   */
  getCurrentVersion() {
    return this.currentVersion;
  }

  /**
   * Получить время последней проверки
   */
  async getLastCheckTime() {
    return await GM.getValue('lastUpdateCheck', 0);
  }
}

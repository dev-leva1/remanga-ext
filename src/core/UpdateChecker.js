/**
 * Менеджер проверки обновлений
 */

class UpdateChecker {
  constructor(config, notifications) {
    this.config = config;
    this.notifications = notifications;
    this.updateURL = 'https://ext.nexee.ru/remanga-extension.user.js';
    this.currentVersion = '__VERSION__';
    this.checkInterval = 12 * 60 * 60 * 1000;
    this.isChecking = false;
    this.modal = null;
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

      logger.info('Текущая версия:', this.currentVersion);
      logger.info('Удаленная версия:', remoteVersion);

      if (!remoteVersion || !changelogParser.isValidVersion(remoteVersion)) {
        throw new Error('Не удалось определить версию удаленного скрипта');
      }

      await GM.setValue('lastUpdateCheck', Date.now());

      const comparison = changelogParser.compareVersions(this.currentVersion, remoteVersion);
      logger.info('Результат сравнения:', comparison, '(> 0 = есть обновление, 0 = одинаковые, < 0 = текущая новее)');

      if (comparison > 0) {
        logger.info(`Доступна новая версия: ${remoteVersion} (текущая: ${this.currentVersion})`);
        const changelog = changelogParser.parseChangelog(scriptText);
        this.showUpdateModal(remoteVersion, changelog);
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
        url: this.updateURL + '?t=' + Date.now(),
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
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
   * Показать модальное окно с changelog
   */
  showUpdateModal(version, changelog) {
    this.cleanup();

    const overlay = document.createElement('div');
    overlay.style.cssText = overlayStyles() + `
      z-index: 9999999;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = modalStyles() + `
      min-width: 500px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
    `;

    const safeVersion = this.escapeHtml(version);
    const safeCurrentVersion = this.escapeHtml(this.currentVersion);
    const changelogLines = changelog.split('\n');
    const changelogHTML = changelogLines
      .map(line => `<div style="padding: 4px 0; color: #d1d5db;">• ${this.escapeHtml(line)}</div>`)
      .join('');

    modal.innerHTML = `
      <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold; color: #ffffff;">
        Обновление ${safeVersion}
      </h2>
      <div style="margin-bottom: 24px; color: #9ca3af; font-size: 14px;">
        Текущая версия: ${safeCurrentVersion}
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

      <div style="display: flex; gap: ${DESIGN_TOKENS.spacing.md}; justify-content: flex-end;">
        <button id="update-later" style="
          padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
          background: #374151;
          color: ${DESIGN_TOKENS.colors.text.primary};
          border: none;
          border-radius: ${DESIGN_TOKENS.radius.pill};
          cursor: pointer;
          font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
          font-size: ${DESIGN_TOKENS.typography.fontSize.md};
          font-family: ${DESIGN_TOKENS.typography.fontFamily};
        ">Позже</button>

        <button id="update-now" style="
          padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
          background: ${DESIGN_TOKENS.colors.bg.secondary};
          color: ${DESIGN_TOKENS.colors.text.primary};
          border: none;
          border-radius: ${DESIGN_TOKENS.radius.pill};
          cursor: pointer;
          font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
          font-size: ${DESIGN_TOKENS.typography.fontSize.md};
          font-family: ${DESIGN_TOKENS.typography.fontFamily};
        ">Обновить</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    this.modal = overlay;

    modal.querySelector('#update-later').addEventListener('click', () => {
      this.cleanup();
    });

    modal.querySelector('#update-now').addEventListener('click', () => {
      this.cleanup();
      this.performUpdate();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.cleanup();
      }
    });
  }

  cleanup() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  /**
   * Экранирование HTML-спецсимволов
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
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

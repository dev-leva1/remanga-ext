/**
 * Панель настроек расширения
 */

class SettingsPanel {
  constructor(config, notifications, statistics) {
    this.config = config;
    this.notifications = notifications;
    this.statistics = statistics;
    this.panel = null;
    this.observer = null;
  }

  /**
   * Инъекция кнопки настроек в header
   */
  inject() {
    if (this.observer) {
      logger.debug('Observer уже активен');
      return;
    }

    let debounceTimer = null;

    const reinjectButton = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const header = document.querySelector('header');
        if (header && !document.getElementById('remanga-ext-settings-btn')) {
          this.injectHeaderButton(header);
          logger.debug('Кнопка настроек переинъецирована');
        }
      }, 100);
    };

    this.observer = new MutationObserver(reinjectButton);

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    const existingHeader = document.querySelector('header');
    if (existingHeader && !document.getElementById('remanga-ext-settings-btn')) {
      this.injectHeaderButton(existingHeader);
    }

    logger.info('MutationObserver для кнопки настроек активирован');
  }

  /**
   * Очистка ресурсов
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Добавление кнопки в header
   */
  injectHeaderButton(header) {
    const button = document.createElement('button');
    button.id = 'remanga-ext-settings-btn';
    button.className = 'remanga-ext-header-btn';
    button.setAttribute('aria-label', 'Настройки расширения');
    button.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      color: #9ca3af;
      transition: all 0.2s;
      margin: 0 4px;
    `;

    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.11,9.59h-5.4V3.28a1.26,1.26,0,0,0-2.15-.89l-.15.18L4,12.47l-.15.19a1.21,1.21,0,0,0-.21.71,1.27,1.27,0,0,0,1.26,1.26H11v6.09A1.27,1.27,0,0,0,12.21,22a1.25,1.25,0,0,0,1-.49l.08-.1,6.82-9.77.07-.11a1.22,1.22,0,0,0,.19-.66A1.25,1.25,0,0,0,19.11,9.59Zm-6.27,9.12v-6H6.15l5.67-7.57v6.31H17.9Z"/>
      </svg>
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255, 255, 255, 0.1)';
      button.style.color = '#ffffff';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'transparent';
      button.style.color = '#9ca3af';
    });

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.show();
    });

    // Ищем контейнер с кнопками в header (обычно справа)
    const headerNav = header.querySelector('nav') || header.querySelector('div[class*="flex"]');

    if (headerNav) {
      // Вставляем перед последним элементом (обычно это аватар пользователя)
      const lastChild = headerNav.lastElementChild;
      if (lastChild) {
        headerNav.insertBefore(button, lastChild);
        logger.info('Кнопка настроек добавлена в header перед последним элементом');
      } else {
        headerNav.appendChild(button);
        logger.info('Кнопка настроек добавлена в header (appendChild)');
      }
    } else {
      // Fallback - добавляем в конец header
      header.appendChild(button);
      logger.info('Кнопка настроек добавлена в header (fallback)');
    }
  }

  /**
   * Показать панель настроек
   */
  show() {
    if (this.panel) {
      this.panel.style.display = 'flex';
      return;
    }

    this.panel = this.createPanel();
    document.body.appendChild(this.panel);
  }

  /**
   * Создание панели настроек
   */
  createPanel() {
    const overlay = document.createElement('div');
    overlay.className = 'remanga-ext-settings-overlay';
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
    modal.className = 'remanga-ext-settings-modal';
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

    const stats = this.statistics.getStats();
    const installDate = new Date(stats.installDate).toLocaleDateString('ru-RU');

    modal.innerHTML = `
      <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: bold; color: #ffffff;">
        Настройки расширения
      </h2>

      <div style="display: flex; flex-direction: column; gap: 20px;">
        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
          <input type="checkbox" id="autoLike" ${this.config.get('autoLike') ? 'checked' : ''}
                 style="width: 20px; height: 20px; cursor: pointer; accent-color: #3b82f6;">
          <div>
            <div style="font-weight: 500; color: #ffffff;">Автолайк глав при открытии</div>
            <div style="font-size: 12px; color: #9ca3af;">Автоматически ставить лайк при открытии главы</div>
          </div>
        </label>

        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
          <input type="checkbox" id="skipProcessed" ${this.config.get('skipProcessed') ? 'checked' : ''}
                 style="width: 20px; height: 20px; cursor: pointer; accent-color: #3b82f6;">
          <div>
            <div style="font-weight: 500; color: #ffffff;">Пропускать обработанные главы</div>
            <div style="font-size: 12px; color: #9ca3af;">Не обрабатывать уже прочитанные/лайкнутые главы</div>
          </div>
        </label>

        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
          <input type="checkbox" id="notificationsEnabled" ${this.config.get('notificationsEnabled') ? 'checked' : ''}
                 style="width: 20px; height: 20px; cursor: pointer; accent-color: #3b82f6;">
          <div>
            <div style="font-weight: 500; color: #ffffff;">Показывать уведомления</div>
            <div style="font-size: 12px; color: #9ca3af;">Отображать toast уведомления о действиях</div>
          </div>
        </label>

        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #ffffff;">
            Время показа уведомлений (секунды)
          </label>
          <input type="range" id="notificationDuration"
                 min="1" max="10" step="1"
                 value="${this.config.get('notificationDuration')}"
                 style="width: 100%; accent-color: #3b82f6;">
          <div style="text-align: center; margin-top: 4px; color: #9ca3af;">
            <span id="durationValue">${this.config.get('notificationDuration')}</span> сек
          </div>
        </div>

        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #ffffff;">
            Размер batch для массовых операций
          </label>
          <input type="range" id="batchSize"
                 min="1" max="50" step="1"
                 value="${this.config.get('batchSize')}"
                 style="width: 100%; accent-color: #3b82f6;">
          <div style="text-align: center; margin-top: 4px; color: #9ca3af;">
            <span id="batchSizeValue">${this.config.get('batchSize')}</span> глав за раз
          </div>
        </div>

        <div style="padding: 16px; background: #2a2a2a; border-radius: 8px;">
          <div style="font-weight: 500; margin-bottom: 12px; color: #ffffff;">📊 Статистика</div>
          <div style="display: flex; flex-direction: column; gap: 8px; color: #9ca3af; font-size: 14px;">
            <div>Прочитано глав: <span style="color: #10b981; font-weight: 600;">${stats.chaptersRead}</span></div>
            <div>Лайков поставлено: <span style="color: #ef4444; font-weight: 600;">${stats.chaptersLiked}</span></div>
            <div>Дата установки: <span style="color: #ffffff;">${installDate}</span></div>
          </div>
          <button id="reset-stats" style="
            margin-top: 12px;
            padding: 8px 16px;
            background: #374151;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            width: 100%;
          ">Сбросить статистику</button>
        </div>

        <div style="padding: 16px; background: #2a2a2a; border-radius: 8px;">
          <div style="font-weight: 500; margin-bottom: 12px; color: #ffffff;">💾 Экспорт/Импорт</div>
          <div style="display: flex; gap: 8px;">
            <button id="export-settings" style="
              flex: 1;
              padding: 8px 16px;
              background: #3b82f6;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 13px;
            ">Экспорт</button>
            <button id="import-settings" style="
              flex: 1;
              padding: 8px 16px;
              background: #10b981;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 13px;
            ">Импорт</button>
          </div>
          <input type="file" id="import-file" accept=".json" style="display: none;">
        </div>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 32px; justify-content: space-between;">
        <button id="reset-settings" style="
          padding: 12px 24px;
          background: #ef4444;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
        ">Сбросить настройки</button>

        <div style="display: flex; gap: 12px;">
          <button id="close-settings" style="
            padding: 12px 24px;
            background: #374151;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
          ">Закрыть</button>

          <button id="save-settings" style="
            padding: 12px 24px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
          ">Сохранить</button>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    this.attachEventListeners(overlay, modal);
    this.injectModalStyles();

    return overlay;
  }

  /**
   * Привязка обработчиков событий
   */
  attachEventListeners(overlay, modal) {
    const durationSlider = modal.querySelector('#notificationDuration');
    const durationValue = modal.querySelector('#durationValue');
    const batchSizeSlider = modal.querySelector('#batchSize');
    const batchSizeValue = modal.querySelector('#batchSizeValue');

    durationSlider.addEventListener('input', (e) => {
      durationValue.textContent = e.target.value;
    });

    batchSizeSlider.addEventListener('input', (e) => {
      batchSizeValue.textContent = e.target.value;
    });

    modal.querySelector('#save-settings').addEventListener('click', async () => {
      await this.saveSettings(modal);
    });

    modal.querySelector('#close-settings').addEventListener('click', () => {
      this.hide();
    });

    modal.querySelector('#reset-settings').addEventListener('click', () => {
      this.showResetConfirmation();
    });

    modal.querySelector('#reset-stats').addEventListener('click', () => {
      this.showResetStatsConfirmation();
    });

    modal.querySelector('#export-settings').addEventListener('click', () => {
      this.exportSettings();
    });

    modal.querySelector('#import-settings').addEventListener('click', () => {
      modal.querySelector('#import-file').click();
    });

    modal.querySelector('#import-file').addEventListener('change', async (e) => {
      await this.importSettings(e.target.files[0]);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });
  }

  /**
   * Сохранение настроек
   */
  async saveSettings(modal) {
    try {
      const settings = {
        autoLike: modal.querySelector('#autoLike').checked,
        skipProcessed: modal.querySelector('#skipProcessed').checked,
        notificationsEnabled: modal.querySelector('#notificationsEnabled').checked,
        notificationDuration: parseInt(modal.querySelector('#notificationDuration').value),
        batchSize: parseInt(modal.querySelector('#batchSize').value)
      };

      await this.config.save(settings);
      this.notifications.success('Настройки сохранены');
      this.hide();

      logger.info('Настройки успешно сохранены');
    } catch (error) {
      logger.error('Ошибка сохранения настроек:', error);
      this.notifications.error('Ошибка сохранения настроек');
    }
  }

  /**
   * Скрыть панель
   */
  hide() {
    if (this.panel) {
      this.panel.style.display = 'none';
    }
  }

  /**
   * Инъекция стилей для модального окна
   */
  injectModalStyles() {
    if (document.getElementById('remanga-ext-modal-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'remanga-ext-modal-styles';
    style.textContent = `
      @keyframes remanga-modal-appear {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .remanga-ext-settings-modal button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      .remanga-ext-settings-modal button:active {
        transform: translateY(0);
      }

      .remanga-ext-settings-modal input[type="checkbox"]:hover {
        transform: scale(1.1);
      }

      .remanga-ext-settings-modal input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        background: #374151;
        border-radius: 3px;
        outline: none;
      }

      .remanga-ext-settings-modal input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background: #3b82f6;
        border-radius: 50%;
        cursor: pointer;
      }

      .remanga-ext-settings-modal input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background: #3b82f6;
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Экспорт настроек
   */
  exportSettings() {
    try {
      const json = this.config.export();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `remanga-ext-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      this.notifications.success('Настройки экспортированы');
      logger.info('Настройки экспортированы');
    } catch (error) {
      logger.error('Ошибка экспорта настроек:', error);
      this.notifications.error('Ошибка экспорта настроек');
    }
  }

  /**
   * Импорт настроек
   */
  async importSettings(file) {
    if (!file) {
      return;
    }

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      this.notifications.error('Неверный тип файла. Требуется JSON');
      return;
    }

    if (file.size > 1024 * 1024) {
      this.notifications.error('Файл слишком большой (максимум 1MB)');
      return;
    }

    try {
      const text = await file.text();
      await this.config.import(text);
      this.notifications.success('Настройки импортированы. Перезагрузите страницу для применения.');
      this.hide();

      logger.info('Настройки импортированы');
    } catch (error) {
      logger.error('Ошибка импорта настроек:', error);
      this.notifications.error('Ошибка импорта: невалидный файл');
    }
  }

  /**
   * Показать подтверждение сброса настроек
   */
  showResetConfirmation() {
    this.showConfirmDialog(
      'Сбросить настройки?',
      'Все настройки будут сброшены к значениям по умолчанию. Это действие нельзя отменить.',
      async () => {
        await this.config.reset();
        this.notifications.success('Настройки сброшены');
        this.hide();
        setTimeout(() => {
          this.show();
        }, 500);
      }
    );
  }

  /**
   * Показать подтверждение сброса статистики
   */
  showResetStatsConfirmation() {
    this.showConfirmDialog(
      'Сбросить статистику?',
      'Вся статистика будет удалена. Это действие нельзя отменить.',
      async () => {
        await this.statistics.reset();
        this.notifications.success('Статистика сброшена');
        this.hide();
        setTimeout(() => {
          this.show();
        }, 500);
      }
    );
  }

  /**
   * Показать диалог подтверждения
   */
  showConfirmDialog(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #1a1a1a;
      color: #ffffff;
      border-radius: 12px;
      padding: 24px;
      min-width: 400px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    `;

    dialog.innerHTML = `
      <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: bold; color: #ffffff;">
        ${title}
      </h3>
      <p style="margin: 0 0 24px 0; color: #9ca3af; font-size: 14px; line-height: 1.5;">
        ${message}
      </p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancel-btn" style="
          padding: 10px 20px;
          background: #374151;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
        ">Отмена</button>
        <button id="confirm-btn" style="
          padding: 10px 20px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
        ">Подтвердить</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    dialog.querySelector('#cancel-btn').addEventListener('click', () => {
      overlay.remove();
    });

    dialog.querySelector('#confirm-btn').addEventListener('click', async () => {
      overlay.remove();
      await onConfirm();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }
}

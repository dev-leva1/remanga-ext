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
    this.currentVersion = '__VERSION__';
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
    button.style.cssText = buttonStyles('icon') + `
      margin: 0 ${DESIGN_TOKENS.spacing.xs};
    `;

    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.11,9.59h-5.4V3.28a1.26,1.26,0,0,0-2.15-.89l-.15.18L4,12.47l-.15.19a1.21,1.21,0,0,0-.21.71,1.27,1.27,0,0,0,1.26,1.26H11v6.09A1.27,1.27,0,0,0,12.21,22a1.25,1.25,0,0,0,1-.49l.08-.1,6.82-9.77.07-.11a1.22,1.22,0,0,0,.19-.66A1.25,1.25,0,0,0,19.11,9.59Zm-6.27,9.12v-6H6.15l5.67-7.57v6.31H17.9Z"/>
      </svg>
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = DESIGN_TOKENS.colors.interactive.hover;
      button.style.color = DESIGN_TOKENS.colors.text.primary;
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'transparent';
      button.style.color = DESIGN_TOKENS.colors.text.muted;
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
    overlay.style.cssText = overlayStyles();

    const modal = document.createElement('div');
    modal.className = 'remanga-ext-settings-modal';
    modal.style.cssText = modalStyles() + `
      min-width: 500px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
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
                 style="width: 20px; height: 20px; cursor: pointer; accent-color: ${DESIGN_TOKENS.colors.bg.secondary};">
          <div>
            <div style="font-weight: 500; color: #ffffff;">Автолайк глав при открытии</div>
            <div style="font-size: 12px; color: #9ca3af;">Автоматически ставить лайк при открытии главы</div>
          </div>
        </label>

        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
          <input type="checkbox" id="skipProcessed" ${this.config.get('skipProcessed') ? 'checked' : ''}
                 style="width: 20px; height: 20px; cursor: pointer; accent-color: ${DESIGN_TOKENS.colors.bg.secondary};">
          <div>
            <div style="font-weight: 500; color: #ffffff;">Пропускать обработанные главы</div>
            <div style="font-size: 12px; color: #9ca3af;">Не обрабатывать уже прочитанные/лайкнутые главы</div>
          </div>
        </label>

        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
          <input type="checkbox" id="notificationsEnabled" ${this.config.get('notificationsEnabled') ? 'checked' : ''}
                 style="width: 20px; height: 20px; cursor: pointer; accent-color: ${DESIGN_TOKENS.colors.bg.secondary};">
          <div>
            <div style="font-weight: 500; color: #ffffff;">Показывать уведомления</div>
            <div style="font-size: 12px; color: #9ca3af;">Отображать toast уведомления о действиях</div>
          </div>
        </label>

        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
          <input type="checkbox" id="autoUpdateEnabled" ${this.config.get('autoUpdateEnabled') ? 'checked' : ''}
                 style="width: 20px; height: 20px; cursor: pointer; accent-color: ${DESIGN_TOKENS.colors.bg.secondary};">
          <div>
            <div style="font-weight: 500; color: #ffffff;">Автоматические обновления</div>
            <div style="font-size: 12px; color: #9ca3af;">Проверять наличие обновлений при загрузке страницы</div>
          </div>
        </label>

        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #ffffff;">
            Время показа уведомлений (секунды)
          </label>
          <input type="range" id="notificationDuration"
                 min="1" max="10" step="1"
                 value="${this.config.get('notificationDuration')}"
                 style="width: 100%; accent-color: ${DESIGN_TOKENS.colors.bg.secondary};">
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
                 style="width: 100%; accent-color: ${DESIGN_TOKENS.colors.bg.secondary};">
          <div style="text-align: center; margin-top: 4px; color: #9ca3af;">
            <span id="batchSizeValue">${this.config.get('batchSize')}</span> глав за раз
          </div>
        </div>

        <div style="padding: 16px; background: #2a2a2a; border-radius: 8px;">
          <div style="font-weight: 500; margin-bottom: 12px; color: #ffffff;">📊 Статистика</div>
          <div style="display: flex; flex-direction: column; gap: 8px; color: #9ca3af; font-size: 14px;">
            <div>Прочитано глав: <span style="color: ${DESIGN_TOKENS.colors.text.primary}; font-weight: 600;">${stats.chaptersRead}</span></div>
            <div>Лайков поставлено: <span style="color: ${DESIGN_TOKENS.colors.text.primary}; font-weight: 600;">${stats.chaptersLiked}</span></div>
            <div>Дата установки: <span style="color: #ffffff;">${installDate}</span></div>
          </div>
          <button id="reset-stats" style="
            margin-top: ${DESIGN_TOKENS.spacing.md};
            padding: ${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.lg};
            background: #374151;
            color: ${DESIGN_TOKENS.colors.text.primary};
            border: none;
            border-radius: ${DESIGN_TOKENS.radius.pill};
            cursor: pointer;
            font-size: ${DESIGN_TOKENS.typography.fontSize.sm};
            font-family: ${DESIGN_TOKENS.typography.fontFamily};
            width: 100%;
          ">Сбросить статистику</button>
        </div>

        <div style="padding: 16px; background: #2a2a2a; border-radius: 8px;">
          <div style="font-weight: 500; margin-bottom: 12px; color: #ffffff;">🔄 Обновления</div>
          <div style="display: flex; flex-direction: column; gap: 8px; color: #9ca3af; font-size: 14px; margin-bottom: 12px;">
            <div>Текущая версия: <span style="color: #ffffff; font-weight: 600;" id="current-version">${this.currentVersion}</span></div>
            <div id="last-check-info" style="font-size: 12px;">Проверка обновлений...</div>
          </div>
          <button id="check-updates" style="
            padding: ${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.lg};
            background: ${DESIGN_TOKENS.colors.bg.secondary};
            color: ${DESIGN_TOKENS.colors.text.primary};
            border: none;
            border-radius: ${DESIGN_TOKENS.radius.pill};
            cursor: pointer;
            font-size: ${DESIGN_TOKENS.typography.fontSize.sm};
            font-family: ${DESIGN_TOKENS.typography.fontFamily};
            width: 100%;
          ">Проверить обновления</button>
        </div>

        <div style="padding: 16px; background: #2a2a2a; border-radius: 8px;">
          <div style="font-weight: 500; margin-bottom: 12px; color: #ffffff;">💾 Экспорт/Импорт</div>
          <div style="display: flex; gap: 8px;">
            <button id="export-settings" style="
              flex: 1;
              padding: ${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.lg};
              background: ${DESIGN_TOKENS.colors.bg.secondary};
              color: ${DESIGN_TOKENS.colors.text.primary};
              border: none;
              border-radius: ${DESIGN_TOKENS.radius.pill};
              cursor: pointer;
              font-size: ${DESIGN_TOKENS.typography.fontSize.sm};
              font-family: ${DESIGN_TOKENS.typography.fontFamily};
            ">Экспорт</button>
            <button id="import-settings" style="
              flex: 1;
              padding: ${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.lg};
              background: ${DESIGN_TOKENS.colors.bg.secondary};
              color: ${DESIGN_TOKENS.colors.text.primary};
              border: none;
              border-radius: ${DESIGN_TOKENS.radius.pill};
              cursor: pointer;
              font-size: ${DESIGN_TOKENS.typography.fontSize.sm};
              font-family: ${DESIGN_TOKENS.typography.fontFamily};
            ">Импорт</button>
          </div>
          <input type="file" id="import-file" accept=".json" style="display: none;">
        </div>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 32px; justify-content: space-between;">
        <button id="reset-settings" style="
          padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
          background: #ef4444;
          color: ${DESIGN_TOKENS.colors.text.primary};
          border: none;
          border-radius: ${DESIGN_TOKENS.radius.pill};
          cursor: pointer;
          font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
          font-size: ${DESIGN_TOKENS.typography.fontSize.md};
          font-family: ${DESIGN_TOKENS.typography.fontFamily};
        ">Сбросить настройки</button>

        <div style="display: flex; gap: ${DESIGN_TOKENS.spacing.md};">
          <button id="close-settings" style="
            padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
            background: #374151;
            color: ${DESIGN_TOKENS.colors.text.primary};
            border: none;
            border-radius: ${DESIGN_TOKENS.radius.pill};
            cursor: pointer;
            font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
            font-size: ${DESIGN_TOKENS.typography.fontSize.md};
            font-family: ${DESIGN_TOKENS.typography.fontFamily};
          ">Закрыть</button>

          <button id="save-settings" style="
            padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
            background: ${DESIGN_TOKENS.colors.bg.secondary};
            color: ${DESIGN_TOKENS.colors.text.primary};
            border: none;
            border-radius: ${DESIGN_TOKENS.radius.pill};
            cursor: pointer;
            font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
            font-size: ${DESIGN_TOKENS.typography.fontSize.md};
            font-family: ${DESIGN_TOKENS.typography.fontFamily};
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

    modal.querySelector('#check-updates').addEventListener('click', async () => {
      const btn = modal.querySelector('#check-updates');
      btn.disabled = true;
      btn.textContent = 'Проверка...';

      if (window.remangaExtension && window.remangaExtension.updateChecker) {
        await window.remangaExtension.updateChecker.checkForUpdates(true);
      }

      btn.disabled = false;
      btn.textContent = 'Проверить обновления';
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

    this.updateLastCheckInfo(modal);
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
        autoUpdateEnabled: modal.querySelector('#autoUpdateEnabled').checked,
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
   * Обновление информации о последней проверке обновлений
   */
  async updateLastCheckInfo(modal) {
    const lastCheckInfo = modal.querySelector('#last-check-info');

    if (window.remangaExtension && window.remangaExtension.updateChecker) {
      const lastCheck = await window.remangaExtension.updateChecker.getLastCheckTime();

      if (lastCheck > 0) {
        const date = new Date(lastCheck);
        const now = Date.now();
        const diff = now - lastCheck;
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) {
          lastCheckInfo.textContent = 'Последняя проверка: только что';
        } else if (hours < 24) {
          lastCheckInfo.textContent = `Последняя проверка: ${hours} ч. назад`;
        } else {
          lastCheckInfo.textContent = `Последняя проверка: ${date.toLocaleDateString('ru-RU')}`;
        }
      } else {
        lastCheckInfo.textContent = 'Обновления еще не проверялись';
      }
    } else {
      lastCheckInfo.textContent = 'Информация недоступна';
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
      @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&display=swap');

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
        transform: translateY(0) scale(0.97);
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
        background: ${DESIGN_TOKENS.colors.bg.secondary};
        border-radius: 50%;
        cursor: pointer;
      }

      .remanga-ext-settings-modal input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background: ${DESIGN_TOKENS.colors.bg.secondary};
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
        this.notifications.success('Настройки сброшены. Перезагрузка...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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
        this.notifications.success('Статистика сброшена. Перезагрузка...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    );
  }

  /**
   * Показать диалог подтверждения
   */
  showConfirmDialog(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = overlayStyles();

    const dialog = document.createElement('div');
    dialog.style.cssText = modalStyles() + `
      min-width: 400px;
    `;

    dialog.innerHTML = `
      <h3 style="margin: 0 0 ${DESIGN_TOKENS.spacing.md} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.bold}; color: ${DESIGN_TOKENS.colors.text.primary};">
        ${title}
      </h3>
      <p style="margin: 0 0 ${DESIGN_TOKENS.spacing.xl} 0; color: ${DESIGN_TOKENS.colors.text.muted}; font-size: ${DESIGN_TOKENS.typography.fontSize.md}; line-height: 1.5;">
        ${message}
      </p>
      <div style="display: flex; gap: ${DESIGN_TOKENS.spacing.md}; justify-content: flex-end;">
        <button id="cancel-btn" style="
          padding: 10px 20px;
          background: #374151;
          color: ${DESIGN_TOKENS.colors.text.primary};
          border: none;
          border-radius: ${DESIGN_TOKENS.radius.pill};
          cursor: pointer;
          font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
          font-size: ${DESIGN_TOKENS.typography.fontSize.md};
          font-family: ${DESIGN_TOKENS.typography.fontFamily};
        ">Отмена</button>
        <button id="confirm-btn" style="
          padding: 10px 20px;
          background: #ef4444;
          color: ${DESIGN_TOKENS.colors.text.primary};
          border: none;
          border-radius: ${DESIGN_TOKENS.radius.pill};
          cursor: pointer;
          font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
          font-size: ${DESIGN_TOKENS.typography.fontSize.md};
          font-family: ${DESIGN_TOKENS.typography.fontFamily};
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

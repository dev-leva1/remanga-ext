/**
 * Страница настроек расширения
 * Полноценная страница на /extension-settings
 */

class SettingsPage {
  constructor(config, notifications, statistics) {
    this.config = config;
    this.notifications = notifications;
    this.statistics = statistics;
    this.container = null;
    this.currentVersion = '__VERSION__';
  }

  /**
   * Инициализация страницы
   */
  init() {
    this.render();
    logger.info('SettingsPage инициализирована');
  }

  /**
   * Рендеринг страницы
   */
  render() {
    if (this.container) {
      this.container.remove();
    }

    this.container = document.createElement('div');
    this.container.id = 'remanga-ext-settings-page';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 999999;
      overflow-y: auto;
      font-family: ${DESIGN_TOKENS.typography.fontFamily};
      backdrop-filter: blur(4px);
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      max-width: 1200px;
      margin: ${DESIGN_TOKENS.spacing.xxl} auto;
      background: ${DESIGN_TOKENS.colors.bg.primary};
      border-radius: ${DESIGN_TOKENS.radius.xl};
      padding: ${DESIGN_TOKENS.spacing.xxl};
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;

    modal.innerHTML = this.createContent();
    this.container.appendChild(modal);
    document.body.appendChild(this.container);

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });

    this.attachEventListeners();
    this.injectStyles();
  }

  /**
   * Закрытие страницы настроек
   */
  close() {
    this.cleanup();
    window.location.reload();
  }

  /**
   * Создание контента страницы
   */
  createContent() {
    const stats = this.statistics.getStats();
    const installDate = new Date(stats.installDate).toLocaleDateString('ru-RU');

    return `
      <div style="display: flex; flex-direction: column; gap: ${DESIGN_TOKENS.spacing.xl};">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${DESIGN_TOKENS.spacing.lg};">
          <h1 style="margin: 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xxl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.bold}; color: ${DESIGN_TOKENS.colors.text.primary};">
            Настройки расширения
          </h1>
          <a href="/" id="close-page" style="
            padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
            background: ${DESIGN_TOKENS.colors.bg.secondary};
            color: ${DESIGN_TOKENS.colors.text.primary};
            border: none;
            border-radius: ${DESIGN_TOKENS.radius.pill};
            cursor: pointer;
            font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
            font-size: ${DESIGN_TOKENS.typography.fontSize.md};
            text-decoration: none;
            display: inline-block;
          ">Закрыть</a>
        </div>

        <section style="background: ${DESIGN_TOKENS.colors.bg.secondary}; padding: ${DESIGN_TOKENS.spacing.xl}; border-radius: ${DESIGN_TOKENS.radius.lg};">
          <h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold}; color: ${DESIGN_TOKENS.colors.text.primary};">
            Основные настройки
          </h2>

              <div style="display: flex; flex-direction: column; gap: ${DESIGN_TOKENS.spacing.lg};">
                <label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
                  <input type="checkbox" id="autoLike" ${this.config.get('autoLike') ? 'checked' : ''}
                         style="width: 20px; height: 20px; cursor: pointer;">
                  <div>
                    <div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Автолайк глав при открытии</div>
                    <div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Автоматически ставить лайк при открытии главы</div>
                  </div>
                </label>

                <label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
                  <input type="checkbox" id="skipProcessed" ${this.config.get('skipProcessed') ? 'checked' : ''}
                         style="width: 20px; height: 20px; cursor: pointer;">
                  <div>
                    <div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Пропускать обработанные главы</div>
                    <div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Не обрабатывать уже прочитанные/лайкнутые главы</div>
                  </div>
                </label>

                <label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
                  <input type="checkbox" id="notificationsEnabled" ${this.config.get('notificationsEnabled') ? 'checked' : ''}
                         style="width: 20px; height: 20px; cursor: pointer;">
                  <div>
                    <div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Показывать уведомления</div>
                    <div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Отображать toast уведомления о действиях</div>
                  </div>
                </label>

                <label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
                  <input type="checkbox" id="autoUpdateEnabled" ${this.config.get('autoUpdateEnabled') ? 'checked' : ''}
                         style="width: 20px; height: 20px; cursor: pointer;">
                  <div>
                    <div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Автоматические обновления</div>
                    <div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Проверять наличие обновлений при загрузке страницы</div>
                  </div>
                </label>

                <div>
                  <label style="display: block; margin-bottom: ${DESIGN_TOKENS.spacing.sm}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">
                    Время показа уведомлений: <span id="durationValue">${this.config.get('notificationDuration')}</span> сек
                  </label>
                  <input type="range" id="notificationDuration"
                         min="1" max="10" step="1"
                         value="${this.config.get('notificationDuration')}"
                         style="width: 100%;">
                </div>

                <div>
                  <label style="display: block; margin-bottom: ${DESIGN_TOKENS.spacing.sm}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">
                    Размер batch для массовых операций: <span id="batchSizeValue">${this.config.get('batchSize')}</span> глав
                  </label>
                  <input type="range" id="batchSize"
                         min="1" max="50" step="1"
                         value="${this.config.get('batchSize')}"
                         style="width: 100%;">
                </div>
              </div>
            </section>

            <section style="background: ${DESIGN_TOKENS.colors.bg.secondary}; padding: ${DESIGN_TOKENS.spacing.xl}; border-radius: ${DESIGN_TOKENS.radius.lg};">
              <h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold}; color: ${DESIGN_TOKENS.colors.text.primary};">
                Кастомизация интерфейса
              </h2>

              <div style="display: flex; flex-direction: column; gap: ${DESIGN_TOKENS.spacing.lg};">
                <label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
                  <input type="checkbox" id="blockCustomThemes" ${this.config.get('blockCustomThemes') ? 'checked' : ''}
                         style="width: 20px; height: 20px; cursor: pointer;">
                  <div>
                    <div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Блокировать кастомные темы в профилях</div>
                    <div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Отключить пользовательские темы и оставить только стандартные стили</div>
                  </div>
                </label>

                <label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
                  <input type="checkbox" id="hideChatIndicator" ${this.config.get('hideChatIndicator') ? 'checked' : ''}
                         style="width: 20px; height: 20px; cursor: pointer;">
                  <div>
                    <div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Скрыть индикатор непрочитанных сообщений</div>
                    <div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Убрать счетчик сообщений у иконки чата в header</div>
                  </div>
                </label>

                <div>
                  <div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary}; margin-bottom: ${DESIGN_TOKENS.spacing.md};">
                    Скрыть блоки в профилях
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: ${DESIGN_TOKENS.spacing.md};">
                    ${this.createProfileBlockCheckboxes()}
                  </div>
                </div>
              </div>
            </section>

            <section style="background: ${DESIGN_TOKENS.colors.bg.secondary}; padding: ${DESIGN_TOKENS.spacing.xl}; border-radius: ${DESIGN_TOKENS.radius.lg};">
              <h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold}; color: ${DESIGN_TOKENS.colors.text.primary};">
                Статистика
              </h2>

              <div style="display: flex; flex-direction: column; gap: ${DESIGN_TOKENS.spacing.md}; color: ${DESIGN_TOKENS.colors.text.secondary};">
                <div>Прочитано глав: <span style="color: ${DESIGN_TOKENS.colors.text.primary}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold};">${stats.chaptersRead}</span></div>
                <div>Лайков поставлено: <span style="color: ${DESIGN_TOKENS.colors.text.primary}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold};">${stats.chaptersLiked}</span></div>
                <div>Дата установки: <span style="color: ${DESIGN_TOKENS.colors.text.primary};">${installDate}</span></div>
              </div>
              <button id="reset-stats" style="
                margin-top: ${DESIGN_TOKENS.spacing.lg};
                padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
                background: #374151;
                color: ${DESIGN_TOKENS.colors.text.primary};
                border: none;
                border-radius: ${DESIGN_TOKENS.radius.pill};
                cursor: pointer;
                font-size: ${DESIGN_TOKENS.typography.fontSize.md};
                font-family: ${DESIGN_TOKENS.typography.fontFamily};
                width: 100%;
              ">Сбросить статистику</button>
            </section>

            <section style="background: ${DESIGN_TOKENS.colors.bg.secondary}; padding: ${DESIGN_TOKENS.spacing.xl}; border-radius: ${DESIGN_TOKENS.radius.lg};">
              <h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold}; color: ${DESIGN_TOKENS.colors.text.primary};">
                Обновления
              </h2>

              <div style="display: flex; flex-direction: column; gap: ${DESIGN_TOKENS.spacing.md}; color: ${DESIGN_TOKENS.colors.text.secondary}; margin-bottom: ${DESIGN_TOKENS.spacing.lg};">
                <div>Текущая версия: <span style="color: ${DESIGN_TOKENS.colors.text.primary}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold};">${this.currentVersion}</span></div>
                <div id="last-check-info" style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm};">Проверка обновлений...</div>
              </div>
              <button id="check-updates" style="
                padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
                background: ${DESIGN_TOKENS.colors.bg.surface};
                color: ${DESIGN_TOKENS.colors.text.primary};
                border: none;
                border-radius: ${DESIGN_TOKENS.radius.pill};
                cursor: pointer;
                font-size: ${DESIGN_TOKENS.typography.fontSize.md};
                font-family: ${DESIGN_TOKENS.typography.fontFamily};
                width: 100%;
              ">Проверить обновления</button>
            </section>

            <div style="display: flex; gap: ${DESIGN_TOKENS.spacing.md}; justify-content: flex-end;">
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

              <button id="save-settings" style="
                padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
                background: ${DESIGN_TOKENS.colors.bg.surface};
                color: ${DESIGN_TOKENS.colors.text.primary};
                border: none;
                border-radius: ${DESIGN_TOKENS.radius.pill};
                cursor: pointer;
                font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
                font-size: ${DESIGN_TOKENS.typography.fontSize.md};
                font-family: ${DESIGN_TOKENS.typography.fontFamily};
              ">Сохранить изменения</button>
            </div>
          </section>
        </div>
    `;
  }

  /**
   * Создание чекбоксов для блоков профиля
   */
  createProfileBlockCheckboxes() {
    const blocks = this.config.get('hideProfileBlocks') || {};
    const blockLabels = {
      statistics: 'Статистика',
      badges: 'Бейджи',
      achievements: 'Ачивки',
      favoriteCards: 'Избранные карточки',
      publishers: 'Паблишеры',
      guilds: 'Гильдии',
      friends: 'Друзья',
      followers: 'Подписчики',
      comments: 'Комментарии'
    };

    return Object.keys(blockLabels).map(key => `
      <label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.sm}; cursor: pointer;">
        <input type="checkbox" class="profile-block-checkbox" data-block="${key}" ${blocks[key] ? 'checked' : ''}
               style="width: 18px; height: 18px; cursor: pointer;">
        <span style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.secondary};">${blockLabels[key]}</span>
      </label>
    `).join('');
  }

  /**
   * Привязка обработчиков событий
   */
  attachEventListeners() {
    const durationSlider = this.container.querySelector('#notificationDuration');
    const durationValue = this.container.querySelector('#durationValue');
    const batchSizeSlider = this.container.querySelector('#batchSize');
    const batchSizeValue = this.container.querySelector('#batchSizeValue');

    durationSlider.addEventListener('input', (e) => {
      durationValue.textContent = e.target.value;
    });

    batchSizeSlider.addEventListener('input', (e) => {
      batchSizeValue.textContent = e.target.value;
    });

    this.container.querySelector('#save-settings').addEventListener('click', async () => {
      await this.saveSettings();
    });

    this.container.querySelector('#close-page').addEventListener('click', (e) => {
      e.preventDefault();
      this.close();
    });

    this.container.querySelector('#reset-settings').addEventListener('click', () => {
      if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
        this.config.reset().then(() => {
          this.notifications.success('Настройки сброшены. Перезагрузка...');
          setTimeout(() => window.location.reload(), 1000);
        });
      }
    });

    this.container.querySelector('#reset-stats').addEventListener('click', () => {
      if (confirm('Сбросить всю статистику?')) {
        this.statistics.reset().then(() => {
          this.notifications.success('Статистика сброшена. Перезагрузка...');
          setTimeout(() => window.location.reload(), 1000);
        });
      }
    });

    this.container.querySelector('#check-updates').addEventListener('click', async () => {
      const btn = this.container.querySelector('#check-updates');
      btn.disabled = true;
      btn.textContent = 'Проверка...';

      if (window.remangaExtension && window.remangaExtension.updateChecker) {
        await window.remangaExtension.updateChecker.checkForUpdates(true);
      }

      btn.disabled = false;
      btn.textContent = 'Проверить обновления';
    });

    this.updateLastCheckInfo();
  }

  /**
   * Сохранение настроек
   */
  async saveSettings() {
    try {
      const hideProfileBlocks = {};
      this.container.querySelectorAll('.profile-block-checkbox').forEach(checkbox => {
        hideProfileBlocks[checkbox.dataset.block] = checkbox.checked;
      });

      const settings = {
        autoLike: this.container.querySelector('#autoLike').checked,
        skipProcessed: this.container.querySelector('#skipProcessed').checked,
        notificationsEnabled: this.container.querySelector('#notificationsEnabled').checked,
        autoUpdateEnabled: this.container.querySelector('#autoUpdateEnabled').checked,
        notificationDuration: parseInt(this.container.querySelector('#notificationDuration').value),
        batchSize: parseInt(this.container.querySelector('#batchSize').value),
        blockCustomThemes: this.container.querySelector('#blockCustomThemes').checked,
        hideChatIndicator: this.container.querySelector('#hideChatIndicator').checked,
        hideProfileBlocks
      };

      await this.config.save(settings);
      this.notifications.success('Настройки сохранены. Перезагрузка...');

      setTimeout(() => {
        this.cleanup();
        window.location.reload();
      }, 1000);

      logger.info('Настройки успешно сохранены');
    } catch (error) {
      logger.error('Ошибка сохранения настроек:', error);
      this.notifications.error('Ошибка сохранения настроек');
    }
  }

  /**
   * Обновление информации о последней проверке обновлений
   */
  async updateLastCheckInfo() {
    const lastCheckInfo = this.container.querySelector('#last-check-info');

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
   * Инъекция стилей
   */
  injectStyles() {
    if (document.getElementById('remanga-ext-settings-page-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'remanga-ext-settings-page-styles';
    style.textContent = `
      #remanga-ext-settings-page button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      #remanga-ext-settings-page button:active {
        transform: translateY(0);
      }

      #remanga-ext-settings-page input[type="checkbox"]:hover {
        transform: scale(1.1);
      }

      #remanga-ext-settings-page input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        background: #374151;
        border-radius: 3px;
        outline: none;
        cursor: pointer;
      }

      #remanga-ext-settings-page input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background: ${DESIGN_TOKENS.colors.bg.surface};
        border-radius: 50%;
        cursor: pointer;
      }

      #remanga-ext-settings-page input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background: ${DESIGN_TOKENS.colors.bg.surface};
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }

      #remanga-ext-settings-page nav a:hover {
        background: ${DESIGN_TOKENS.colors.interactive.hover};
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Закрытие страницы настроек без перезагрузки
   */
  close() {
    this.cleanup();
    logger.info('SettingsPage закрыта');
  }

  /**
   * Очистка
   */
  cleanup() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
      logger.info('SettingsPage удалена');
    }

    const styles = document.getElementById('remanga-ext-settings-page-styles');
    if (styles && styles.parentNode) {
      styles.parentNode.removeChild(styles);
    }
  }
}

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
    this.activeTab = 'automation';
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

        <div style="display: flex; gap: ${DESIGN_TOKENS.spacing.xl};">
          ${this.renderTabs()}
          <div style="flex: 1;">
            ${this.renderTabContent()}
          </div>
        </div>

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
      </div>
    `;
  }

  /**
   * Рендеринг вкладок
   */
  renderTabs() {
    const tabs = [
      {
        id: 'automation',
        label: 'Автоматизация',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.11,9.59h-5.4V3.28a1.26,1.26,0,0,0-2.15-.89l-.15.18L4,12.47l-.15.19a1.21,1.21,0,0,0-.21.71,1.27,1.27,0,0,0,1.26,1.26H11v6.09A1.27,1.27,0,0,0,12.21,22a1.25,1.25,0,0,0,1-.49l.08-.1,6.82-9.77.07-.11a1.22,1.22,0,0,0,.19-.66A1.25,1.25,0,0,0,19.11,9.59Zm-6.27,9.12v-6H6.15l5.67-7.57v6.31H17.9Z"/></svg>'
      },
      {
        id: 'interface',
        label: 'Интерфейс',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" stroke-width="1.5" fill="none" stroke="currentColor"><g clip-path="url(#clip0_1678_14633)"><path d="M14.125 16.0667C15.9833 16.0667 17.5 14.525 17.5 12.6167C17.5 10.7084 15.9833 9.16669 14.125 9.16669C12.2667 9.16669 10.75 10.7084 10.75 12.6167C10.75 14.525 12.2667 16.0667 14.125 16.0667Z" stroke-miterlimit="10" stroke-linecap="round"></path><path d="M11.7427 15.0667L9.35938 17.5" stroke-miterlimit="10" stroke-linecap="round"></path><path d="M9.29688 15.825L10.9469 17.5" stroke-miterlimit="10" stroke-linecap="round"></path><path d="M5.75834 11.0333C7.55834 11.0333 9.01667 9.54164 9.01667 7.69997C9.01667 5.8583 7.55834 4.36664 5.75834 4.36664C3.95834 4.36664 2.5 5.8583 2.5 7.69997C2.5 9.54164 3.95834 11.0333 5.75834 11.0333Z" stroke-miterlimit="10" stroke-linecap="round"></path><path d="M10.8531 2.5L8.07812 5.34999" stroke-miterlimit="10" stroke-linecap="round"></path><path d="M8.75781 2.5H10.8411V4.63333" stroke-linecap="round" stroke-linejoin="round"></path></g><defs><clipPath id="clip0_1678_14633"><rect width="20" height="20" fill="currentColor"></rect></clipPath></defs></svg>'
      },
      {
        id: 'general',
        label: 'Общее',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" stroke-width="1.5" fill="currentColor" stroke="none"><path d="M14.2307 6.94175V5.90008C14.2307 3.65008 13.6891 0.666748 8.9974 0.666748C4.30573 0.666748 3.76406 3.65008 3.76406 5.90008V6.94175C1.43073 7.23341 0.664062 8.41675 0.664062 11.3251V12.8751C0.664062 16.2917 1.70573 17.3334 5.1224 17.3334H12.8724C16.2891 17.3334 17.3307 16.2917 17.3307 12.8751V11.3251C17.3307 8.41675 16.5641 7.23341 14.2307 6.94175ZM8.9974 14.6167C7.60573 14.6167 6.48073 13.4834 6.48073 12.1001C6.48073 10.7084 7.61406 9.58341 8.9974 9.58341C10.3807 9.58341 11.5141 10.7167 11.5141 12.1001C11.5141 13.4917 10.3891 14.6167 8.9974 14.6167ZM5.1224 6.86675C5.05573 6.86675 4.9974 6.86675 4.93073 6.86675V5.90008C4.93073 3.45841 5.6224 1.83341 8.9974 1.83341C12.3724 1.83341 13.0641 3.45841 13.0641 5.90008V6.87508C12.9974 6.87508 12.9391 6.87508 12.8724 6.87508H5.1224V6.86675Z"></path></svg>'
      }
    ];

    return `
      <div style="
        display: flex;
        flex-direction: column;
        gap: ${DESIGN_TOKENS.spacing.sm};
        min-width: 200px;
      ">
        ${tabs.map(tab => `
          <button
            class="settings-tab"
            data-tab="${tab.id}"
            data-active="${this.activeTab === tab.id}"
            style="
              display: flex;
              align-items: center;
              gap: ${DESIGN_TOKENS.spacing.md};
              padding: ${DESIGN_TOKENS.spacing.sm};
              background: ${this.activeTab === tab.id ? DESIGN_TOKENS.colors.bg.secondary : DESIGN_TOKENS.colors.bg.primary};
              color: ${DESIGN_TOKENS.colors.text.primary};
              border: none;
              border-radius: 22px;
              cursor: pointer;
              font-size: ${DESIGN_TOKENS.typography.fontSize.md};
              font-family: ${DESIGN_TOKENS.typography.fontFamily};
              font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              text-align: left;
              outline: 1px solid transparent;
            "
          >
            ${tab.icon}
            <span>${tab.label}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Рендеринг контента вкладки
   */
  renderTabContent() {
    switch (this.activeTab) {
      case 'automation':
        return this.renderAutomationTab();
      case 'interface':
        return this.renderInterfaceTab();
      case 'general':
        return this.renderGeneralTab();
      default:
        return '';
    }
  }

  /**
   * Вкладка "Автоматизация"
   */
  renderAutomationTab() {
    return `
      <section style="background: ${DESIGN_TOKENS.colors.bg.secondary}; padding: ${DESIGN_TOKENS.spacing.xl}; border-radius: ${DESIGN_TOKENS.radius.lg};">
        <h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold}; color: ${DESIGN_TOKENS.colors.text.primary};">
          Автоматизация
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
    `;
  }

  /**
   * Вкладка "Интерфейс"
   */
  renderInterfaceTab() {
    return `
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

          <label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
            <input type="checkbox" id="highlightGuilds" ${this.config.get('highlightGuilds') ? 'checked' : ''}
                   style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Подсветка гильдий</div>
              <div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Выделять посты и гильдии в топе</div>
            </div>
          </label>

          <label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
            <input type="checkbox" id="userTooltipEnabled" ${this.config.get('userTooltipEnabled') ? 'checked' : ''}
                   style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Тултипы профилей</div>
              <div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Показывать краткую информацию о пользователе при наведении на аватар</div>
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
    `;
  }

  /**
   * Вкладка "Общее"
   */
  renderGeneralTab() {
    const stats = this.statistics.getStats();
    const installDate = new Date(stats.installDate).toLocaleDateString('ru-RU');

    return `
      <div style="display: flex; flex-direction: column; gap: ${DESIGN_TOKENS.spacing.lg};">
        <section style="background: ${DESIGN_TOKENS.colors.bg.secondary}; padding: ${DESIGN_TOKENS.spacing.xl}; border-radius: ${DESIGN_TOKENS.radius.lg};">
          <h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold}; color: ${DESIGN_TOKENS.colors.text.primary};">
            Обратная связь
          </h2>

          <p style="color: ${DESIGN_TOKENS.colors.text.muted}; margin-bottom: ${DESIGN_TOKENS.spacing.lg};">
            Нашли баг или есть предложение? Напишите нам в Telegram бот!
          </p>

          <button id="open-feedback-modal" style="
            padding: ${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.xl};
            background: ${DESIGN_TOKENS.colors.bg.surface};
            color: ${DESIGN_TOKENS.colors.text.primary};
            border: none;
            border-radius: ${DESIGN_TOKENS.radius.pill};
            cursor: pointer;
            font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
            font-size: ${DESIGN_TOKENS.typography.fontSize.md};
            font-family: ${DESIGN_TOKENS.typography.fontFamily};
            width: 100%;
          ">Открыть бот обратной связи</button>
        </section>

        <section style="background: ${DESIGN_TOKENS.colors.bg.secondary}; padding: ${DESIGN_TOKENS.spacing.xl}; border-radius: ${DESIGN_TOKENS.radius.lg};">
          <h2 style="margin: 0 0 ${DESIGN_TOKENS.spacing.lg} 0; font-size: ${DESIGN_TOKENS.typography.fontSize.xl}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold}; color: ${DESIGN_TOKENS.colors.text.primary};">
            Уведомления и обновления
          </h2>

          <div style="display: flex; flex-direction: column; gap: ${DESIGN_TOKENS.spacing.lg};">
            <label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
              <input type="checkbox" id="notificationsEnabled" ${this.config.get('notificationsEnabled') ? 'checked' : ''}
                     style="width: 20px; height: 20px; cursor: pointer;">
              <div>
                <div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Показывать уведомления</div>
                <div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Отображать toast уведомления о действиях</div>
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

            <label style="display: flex; align-items: center; gap: ${DESIGN_TOKENS.spacing.md}; cursor: pointer;">
              <input type="checkbox" id="autoUpdateEnabled" ${this.config.get('autoUpdateEnabled') ? 'checked' : ''}
                     style="width: 20px; height: 20px; cursor: pointer;">
              <div>
                <div style="font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium}; color: ${DESIGN_TOKENS.colors.text.primary};">Автоматические обновления</div>
                <div style="font-size: ${DESIGN_TOKENS.typography.fontSize.sm}; color: ${DESIGN_TOKENS.colors.text.muted};">Проверять наличие обновлений при загрузке страницы</div>
              </div>
            </label>
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
    const tabs = this.container.querySelectorAll('.settings-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.activeTab = e.currentTarget.dataset.tab;
        this.updateContent();
      });
    });

    const saveBtn = this.container.querySelector('#save-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        await this.saveSettings();
      });
    }

    const closeBtn = this.container.querySelector('#close-page');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
      });
    }

    const resetBtn = this.container.querySelector('#reset-settings');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
          this.config.reset().then(() => {
            this.notifications.success('Настройки сброшены. Перезагрузка...');
            setTimeout(() => window.location.reload(), 1000);
          });
        }
      });
    }

    const resetStatsBtn = this.container.querySelector('#reset-stats');
    if (resetStatsBtn) {
      resetStatsBtn.addEventListener('click', () => {
        if (confirm('Сбросить всю статистику?')) {
          this.statistics.reset().then(() => {
            this.notifications.success('Статистика сброшена. Перезагрузка...');
            setTimeout(() => window.location.reload(), 1000);
          });
        }
      });
    }

    const checkUpdatesBtn = this.container.querySelector('#check-updates');
    if (checkUpdatesBtn) {
      checkUpdatesBtn.addEventListener('click', async () => {
        checkUpdatesBtn.disabled = true;
        checkUpdatesBtn.textContent = 'Проверка...';

        if (window.remangaExtension && window.remangaExtension.updateChecker) {
          await window.remangaExtension.updateChecker.checkForUpdates(true);
        }

        checkUpdatesBtn.disabled = false;
        checkUpdatesBtn.textContent = 'Проверить обновления';
      });
    }

    const durationSlider = this.container.querySelector('#notificationDuration');
    const durationValue = this.container.querySelector('#durationValue');
    if (durationSlider && durationValue) {
      durationSlider.addEventListener('input', (e) => {
        durationValue.textContent = e.target.value;
      });
    }

    const batchSizeSlider = this.container.querySelector('#batchSize');
    const batchSizeValue = this.container.querySelector('#batchSizeValue');
    if (batchSizeSlider && batchSizeValue) {
      batchSizeSlider.addEventListener('input', (e) => {
        batchSizeValue.textContent = e.target.value;
      });
    }

    const feedbackBtn = this.container.querySelector('#open-feedback-modal');
    if (feedbackBtn) {
      feedbackBtn.addEventListener('click', () => {
        if (window.remangaExtension && window.remangaExtension.feedbackButton) {
          window.remangaExtension.feedbackButton.openContextModal();
        }
      });
    }

    if (this.activeTab === 'general') {
      this.updateLastCheckInfo();
    }
  }

  /**
   * Обновление контента при переключении вкладок
   */
  updateContent() {
    const contentContainer = this.container.querySelector('div[style*="flex: 1"]');
    if (contentContainer) {
      contentContainer.innerHTML = this.renderTabContent();
    }

    this.container.querySelectorAll('.settings-tab').forEach(tab => {
      const isActive = tab.dataset.tab === this.activeTab;
      tab.style.background = isActive ? DESIGN_TOKENS.colors.bg.secondary : DESIGN_TOKENS.colors.bg.primary;
      tab.setAttribute('data-active', isActive);
    });

    this.attachEventListeners();
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
        autoLike: this.container.querySelector('#autoLike')?.checked ?? this.config.get('autoLike'),
        skipProcessed: this.container.querySelector('#skipProcessed')?.checked ?? this.config.get('skipProcessed'),
        batchSize: parseInt(this.container.querySelector('#batchSize')?.value ?? this.config.get('batchSize')),
        notificationsEnabled: this.container.querySelector('#notificationsEnabled')?.checked ?? this.config.get('notificationsEnabled'),
        notificationDuration: parseInt(this.container.querySelector('#notificationDuration')?.value ?? this.config.get('notificationDuration')),
        autoUpdateEnabled: this.container.querySelector('#autoUpdateEnabled')?.checked ?? this.config.get('autoUpdateEnabled'),
        blockCustomThemes: this.container.querySelector('#blockCustomThemes')?.checked ?? this.config.get('blockCustomThemes'),
        hideChatIndicator: this.container.querySelector('#hideChatIndicator')?.checked ?? this.config.get('hideChatIndicator'),
        highlightGuilds: this.container.querySelector('#highlightGuilds')?.checked ?? this.config.get('highlightGuilds'),
        userTooltipEnabled: this.container.querySelector('#userTooltipEnabled')?.checked ?? this.config.get('userTooltipEnabled'),
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

      #remanga-ext-settings-page .settings-tab:hover {
        opacity: 0.7;
        background: rgba(37, 39, 44, 0.5) !important;
      }

      #remanga-ext-settings-page .settings-tab[data-active="true"]:hover {
        background: rgba(37, 39, 44, 0.8) !important;
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

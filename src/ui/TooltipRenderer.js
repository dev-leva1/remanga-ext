/**
 * Рендерер тултипа профиля пользователя
 */

class TooltipRenderer {
  constructor() {
    this.tooltip = null;
    this.currentTarget = null;
  }

  /**
   * Создание тултипа
   */
  create(userData, targetElement) {
    this.remove();

    const tooltip = document.createElement('div');
    tooltip.className = 'remanga-ext-user-tooltip';
    tooltip.style.cssText = this.getTooltipStyles();

    const content = this.buildContent(userData);
    tooltip.innerHTML = content;

    document.body.appendChild(tooltip);
    this.tooltip = tooltip;
    this.currentTarget = targetElement;

    this.position(targetElement);

    return tooltip;
  }

  /**
   * Построение контента тултипа
   */
  buildContent(userData) {
    const { username, avatar, level, chapters_read, main_club, is_online } = userData;

    const avatarUrl = avatar?.high ? `https://remanga.org/media/${avatar.high}` : '';
    const safeAvatarUrl = this.escapeAttribute(avatarUrl);
    const safeUsername = this.escapeAttribute(username || '');
    const clubName = main_club?.name || 'Нет гильдии';
    const levelName = level?.name || 'Новичок';
    const onlineStatus = is_online ? 'В сети' : 'Не в сети';
    const onlineColor = is_online ? '#10b981' : '#6b7280';

    return `
      <div style="display: flex; gap: ${DESIGN_TOKENS.spacing.md}; align-items: flex-start;">
        <img
          src="${safeAvatarUrl}"
          alt="${safeUsername}"
          style="
            width: 60px;
            height: 60px;
            border-radius: ${DESIGN_TOKENS.radius.md};
            object-fit: cover;
            flex-shrink: 0;
          "
        />
        <div style="flex: 1; min-width: 0;">
          <div style="
            font-size: ${DESIGN_TOKENS.typography.fontSize.lg};
            font-weight: ${DESIGN_TOKENS.typography.fontWeight.bold};
            color: ${DESIGN_TOKENS.colors.text.primary};
            margin-bottom: ${DESIGN_TOKENS.spacing.xs};
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">
            ${this.escapeHtml(username)}
          </div>

          <div style="
            display: flex;
            align-items: center;
            gap: ${DESIGN_TOKENS.spacing.xs};
            margin-bottom: ${DESIGN_TOKENS.spacing.sm};
          ">
            <div style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${onlineColor};
            "></div>
            <span style="
              font-size: ${DESIGN_TOKENS.typography.fontSize.sm};
              color: ${DESIGN_TOKENS.colors.text.muted};
            ">
              ${onlineStatus}
            </span>
          </div>

          <div style="
            display: flex;
            flex-direction: column;
            gap: ${DESIGN_TOKENS.spacing.xs};
            font-size: ${DESIGN_TOKENS.typography.fontSize.sm};
            color: ${DESIGN_TOKENS.colors.text.secondary};
          ">
            <div style="display: flex; justify-content: space-between;">
              <span>Уровень:</span>
              <span style="color: ${DESIGN_TOKENS.colors.text.primary}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};">
                ${this.escapeHtml(levelName)}
              </span>
            </div>

            <div style="display: flex; justify-content: space-between;">
              <span>Прочитано глав:</span>
              <span style="color: ${DESIGN_TOKENS.colors.text.primary}; font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};">
                ${this.formatNumber(chapters_read)}
              </span>
            </div>

            <div style="display: flex; justify-content: space-between;">
              <span>Гильдия:</span>
              <span style="
                color: ${DESIGN_TOKENS.colors.text.primary};
                font-weight: ${DESIGN_TOKENS.typography.fontWeight.medium};
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 150px;
              ">
                ${this.escapeHtml(clubName)}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Стили тултипа
   */
  getTooltipStyles() {
    return `
      position: fixed;
      z-index: 999999;
      background: ${DESIGN_TOKENS.colors.bg.modal};
      color: ${DESIGN_TOKENS.colors.text.primary};
      font-family: ${DESIGN_TOKENS.typography.fontFamily};
      border-radius: ${DESIGN_TOKENS.radius.lg};
      padding: ${DESIGN_TOKENS.spacing.lg};
      box-shadow: ${DESIGN_TOKENS.shadows.md};
      min-width: 320px;
      max-width: 400px;
      pointer-events: none;
      animation: remanga-tooltip-fade-in 0.2s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
  }

  /**
   * Позиционирование тултипа
   */
  position(targetElement) {
    if (!this.tooltip) {
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spacing = 12;

    let top = rect.bottom + spacing;
    let left = rect.left;

    if (left + tooltipRect.width > viewportWidth - spacing) {
      left = viewportWidth - tooltipRect.width - spacing;
    }

    if (left < spacing) {
      left = spacing;
    }

    if (top + tooltipRect.height > viewportHeight - spacing) {
      top = rect.top - tooltipRect.height - spacing;
    }

    if (top < spacing) {
      top = spacing;
    }

    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
  }

  /**
   * Удаление тултипа
   */
  remove() {
    const tooltip = this.tooltip;

    if (tooltip && tooltip.parentNode) {
      tooltip.style.animation = 'remanga-tooltip-fade-out 0.15s ease';
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
        if (this.tooltip === tooltip) {
          this.tooltip = null;
          this.currentTarget = null;
        }
      }, 150);
    } else {
      this.tooltip = null;
      this.currentTarget = null;
    }
  }

  /**
   * Инъекция стилей анимации
   */
  injectStyles() {
    if (document.getElementById('remanga-ext-tooltip-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'remanga-ext-tooltip-styles';
    style.textContent = `
      @keyframes remanga-tooltip-fade-in {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes remanga-tooltip-fade-out {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-8px);
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Форматирование числа
   */
  formatNumber(num) {
    if (!num) {
      return '0';
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /**
   * Экранирование HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Экранирование HTML-атрибутов
   */
  escapeAttribute(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Проверка видимости тултипа
   */
  isVisible() {
    return this.tooltip !== null;
  }

  /**
   * Получение текущего target элемента
   */
  getCurrentTarget() {
    return this.currentTarget;
  }
}

/**
 * Менеджер уведомлений
 */

class Notifications {
  constructor(config) {
    this.config = config;
    this.queue = [];
    this.activeToasts = new Map();
    this.maxToasts = 5;
  }

  /**
   * Показать уведомление
   */
  show(message, type = 'info') {
    if (!this.config.get('notificationsEnabled')) {
      return;
    }

    const validMessage = String(message);
    const validTypes = ['info', 'success', 'warning', 'error'];
    const validType = validTypes.includes(type) ? type : 'info';

    const key = `${validType}:${validMessage}`;
    const duration = this.config.get('notificationDuration') * 1000;

    if (this.activeToasts.has(key)) {
      const existing = this.activeToasts.get(key);
      existing.count++;
      this.updateToastCount(existing.toast, existing.count);

      clearTimeout(existing.timeoutId);
      existing.timeoutId = setTimeout(() => {
        this.hide(key);
      }, duration);
    } else {
      if (this.activeToasts.size >= this.maxToasts) {
        const oldestKey = this.activeToasts.keys().next().value;
        this.hide(oldestKey);
      }

      const toast = this.createToast(message, type);
      document.body.appendChild(toast);

      const timeoutId = setTimeout(() => {
        this.hide(key);
      }, duration);

      this.activeToasts.set(key, { toast, timeoutId, count: 1 });
      this.updateToastPositions();
    }
  }

  cleanup() {
    this.activeToasts.forEach((entry, key) => {
      clearTimeout(entry.timeoutId);
      if (entry.toast.parentNode) {
        entry.toast.parentNode.removeChild(entry.toast);
      }
    });
    this.activeToasts.clear();
  }

  /**
   * Создание toast элемента
   */
  createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `remanga-ext-toast remanga-ext-toast-${type}`;

    const colors = {
      info: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    };

    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      max-width: 400px;
      animation: remanga-toast-slide-in 0.3s ease;
      cursor: pointer;
      transition: top 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const messageSpan = document.createElement('span');
    messageSpan.className = 'remanga-ext-toast-message';
    messageSpan.textContent = message;

    const countBadge = document.createElement('span');
    countBadge.className = 'remanga-ext-toast-count';
    countBadge.style.cssText = `
      display: none;
      background: rgba(0, 0, 0, 0.2);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    `;

    toast.appendChild(messageSpan);
    toast.appendChild(countBadge);

    const key = `${type}:${message}`;
    toast.addEventListener('click', () => {
      this.hide(key);
    });

    return toast;
  }

  /**
   * Обновление счетчика в toast
   */
  updateToastCount(toast, count) {
    const countBadge = toast.querySelector('.remanga-ext-toast-count');
    if (countBadge) {
      if (count > 1) {
        countBadge.textContent = `x${count}`;
        countBadge.style.display = 'block';
      } else {
        countBadge.style.display = 'none';
      }
    }
  }

  /**
   * Обновление позиций всех тостов
   */
  updateToastPositions() {
    let offset = 20;
    this.activeToasts.forEach(({ toast }) => {
      toast.style.top = `${offset}px`;
      offset += toast.offsetHeight + 12;
    });
  }

  /**
   * Скрытие уведомления
   */
  hide(key) {
    const entry = this.activeToasts.get(key);
    if (!entry) {
      return;
    }

    clearTimeout(entry.timeoutId);
    entry.toast.style.animation = 'remanga-toast-slide-out 0.3s ease';

    setTimeout(() => {
      if (entry.toast.parentNode) {
        entry.toast.parentNode.removeChild(entry.toast);
      }
      this.activeToasts.delete(key);
      this.updateToastPositions();
    }, 300);
  }

  /**
   * Инъекция стилей для анимаций
   */
  injectStyles() {
    if (document.getElementById('remanga-ext-toast-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'remanga-ext-toast-styles';
    style.textContent = `
      @keyframes remanga-toast-slide-in {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes remanga-toast-slide-out {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }

      .remanga-ext-toast:hover {
        opacity: 0.9;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Показать успешное уведомление
   */
  success(message) {
    this.show(message, 'success');
  }

  /**
   * Показать ошибку
   */
  error(message) {
    this.show(message, 'error');
  }

  /**
   * Показать предупреждение
   */
  warning(message) {
    this.show(message, 'warning');
  }

  /**
   * Показать информацию
   */
  info(message) {
    this.show(message, 'info');
  }

  /**
   * Очистить все уведомления
   */
  clearAll() {
    this.activeToasts.forEach((_, key) => this.hide(key));
  }
}

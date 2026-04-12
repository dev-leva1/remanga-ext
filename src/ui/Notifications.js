/**
 * Менеджер уведомлений
 */

class Notifications {
  constructor(config) {
    this.config = config;
    this.queue = [];
    this.activeToasts = new Set();
  }

  /**
   * Показать уведомление
   */
  show(message, type = 'info') {
    if (!this.config.get('notificationsEnabled')) {
      return;
    }

    const duration = this.config.get('notificationDuration') * 1000;
    const toast = this.createToast(message, type);

    document.body.appendChild(toast);

    const timeoutId = setTimeout(() => {
      this.hide(toast);
    }, duration);

    this.activeToasts.add({ toast, timeoutId });
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
    `;

    toast.textContent = message;

    toast.addEventListener('click', () => {
      this.hide(toast);
    });

    return toast;
  }

  /**
   * Скрытие уведомления
   */
  hide(toast) {
    const entry = Array.from(this.activeToasts).find(e => e.toast === toast);
    if (!entry) return;

    clearTimeout(entry.timeoutId);
    toast.style.animation = 'remanga-toast-slide-out 0.3s ease';

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.activeToasts.delete(entry);
    }, 300);
  }

  /**
   * Инъекция стилей для анимаций
   */
  injectStyles() {
    if (document.getElementById('remanga-ext-toast-styles')) return;

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
    this.activeToasts.forEach(toast => this.hide(toast));
  }
}

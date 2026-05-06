/**
 * NotificationService - отправка уведомлений
 */

import { logger } from '../utils/logger.js';
import { validators } from '../utils/validators.js';

class NotificationService {
  constructor(bot, options = {}) {
    this.bot = bot;
    this.adminIds = this.resolveAdminIds(options.adminIds);
  }

  resolveAdminIds(adminIds) {
    if (!Array.isArray(adminIds) || adminIds.length === 0) {
      throw new Error('NotificationService требует список adminIds');
    }

    const normalized = adminIds.filter(id => Number.isInteger(id) && id > 0);
    if (normalized.length === 0) {
      throw new Error('NotificationService требует валидные adminIds');
    }

    return normalized;
  }

  /**
   * Уведомление админов о новом обращении
   */
  async notifyAdmins(feedback) {
    try {
      const message = this.formatFeedbackMessage(feedback);

      const deliveryResults = await Promise.all(this.adminIds.map(async (adminId) => {
        try {
          await this.bot.telegram.sendMessage(adminId, message, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '👁 Просмотреть', callback_data: `admin_view_${feedback.id}` }]
              ]
            }
          });
          logger.debug('Admin notified', { adminId, feedbackId: feedback.id });
          return { adminId, delivered: true };
        } catch (error) {
          logger.error('Failed to notify admin', { adminId, error: error.message });
          return { adminId, delivered: false, error: error.message };
        }
      }));

      const delivered = deliveryResults.filter(result => result.delivered).length;
      const failed = deliveryResults.length - delivered;

      if (delivered === 0) {
        throw new Error('Failed to notify all admins');
      }

      logger.info('Admins notified', {
        feedbackId: feedback.id,
        adminCount: this.adminIds.length,
        delivered,
        failed
      });

      return { total: deliveryResults.length, delivered, failed, results: deliveryResults };
    } catch (error) {
      logger.error('Error notifying admins', { error: error.message });
      throw error;
    }
  }

  /**
   * Уведомление пользователя
   */
  async notifyUser(userId, message) {
    try {
      await this.bot.telegram.sendMessage(userId, message, { parse_mode: 'HTML' });
      logger.info('User notified', { userId });
    } catch (error) {
      logger.error('Failed to notify user', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Форматирование сообщения об обращении
   */
  formatFeedbackMessage(feedback) {
    const typeEmoji = {
      bug: '🐛',
      feature: '💡',
      question: '❓',
      other: '📝'
    };

    const emoji = typeEmoji[feedback.type] || '📝';

    let message = `🆕 <b>Новое обращение #${feedback.id}</b>\n\n`;
    message += `${emoji} <b>Тип:</b> ${this.translateType(feedback.type)}\n`;
    message += `👤 <b>От:</b> ${feedback.username ? '@' + validators.sanitizeHtml(feedback.username) : 'Аноним'}\n`;

    if (feedback.extension_version) {
      message += `📦 <b>Версия:</b> ${validators.sanitizeHtml(feedback.extension_version)}\n`;
    }

    if (feedback.browser) {
      message += `🌐 <b>Браузер:</b> ${validators.sanitizeHtml(feedback.browser)}\n`;
    }

    if (feedback.page_url) {
      message += `🔗 <b>Страница:</b> ${validators.sanitizeHtml(this.truncateUrl(feedback.page_url))}\n`;
    }

    message += `\n💬 <b>Сообщение:</b>\n${validators.sanitizeHtml(feedback.message)}`;

    return message;
  }

  /**
   * Перевод типа обращения
   */
  translateType(type) {
    const translations = {
      bug: 'Баг',
      feature: 'Предложение',
      question: 'Вопрос',
      other: 'Другое'
    };

    return translations[type] || type;
  }

  /**
   * Обрезка длинного URL
   */
  truncateUrl(url, maxLength = 50) {
    if (url.length <= maxLength) {
      return url;
    }

    return url.substring(0, maxLength) + '...';
  }
}

export default NotificationService;

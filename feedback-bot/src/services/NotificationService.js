/**
 * NotificationService - отправка уведомлений
 */

import { logger } from '../utils/logger.js';
import { validators } from '../utils/validators.js';

class NotificationService {
  constructor(bot) {
    this.bot = bot;
    this.adminIds = process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim()));
  }

  /**
   * Уведомление админов о новом обращении
   */
  async notifyAdmins(feedback) {
    try {
      const message = this.formatFeedbackMessage(feedback);

      const promises = this.adminIds.map(async (adminId) => {
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
        } catch (error) {
          logger.error('Failed to notify admin', { adminId, error: error.message });
        }
      });

      await Promise.all(promises);

      logger.info('Admins notified', { feedbackId: feedback.id, adminCount: this.adminIds.length });
    } catch (error) {
      logger.error('Error notifying admins', { error: error.message });
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
    message += `👤 <b>От:</b> ${feedback.username ? '@' + feedback.username : 'Аноним'}\n`;

    if (feedback.extension_version) {
      message += `📦 <b>Версия:</b> ${feedback.extension_version}\n`;
    }

    if (feedback.browser) {
      message += `🌐 <b>Браузер:</b> ${feedback.browser}\n`;
    }

    if (feedback.page_url) {
      message += `🔗 <b>Страница:</b> ${this.truncateUrl(feedback.page_url)}\n`;
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

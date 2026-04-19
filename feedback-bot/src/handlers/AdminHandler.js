/**
 * AdminHandler - админская панель
 */

import FeedbackService from '../services/FeedbackService.js';
import NotificationService from '../services/NotificationService.js';
import { logger } from '../utils/logger.js';
import { validators } from '../utils/validators.js';

class AdminHandler {
  constructor(bot) {
    this.bot = bot;
    this.feedbackService = new FeedbackService();
    this.notificationService = new NotificationService(bot);
    this.adminIds = process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim()));
  }

  /**
   * Проверка прав админа
   */
  isAdmin(userId) {
    return this.adminIds.includes(userId);
  }

  /**
   * Команда /admin
   */
  async handleAdminPanel(ctx) {
    try {
      if (!this.isAdmin(ctx.from.id)) {
        await ctx.reply('❌ Доступ запрещен');
        return;
      }

      const stats = await this.feedbackService.getStatistics();

      await ctx.reply(
        `📊 <b>Админ-панель</b>\n\n` +
        `🆕 Новых: ${stats.new}\n` +
        `🔄 В работе: ${stats.in_progress}\n` +
        `✅ Решено: ${stats.resolved}\n` +
        `🔒 Закрыто: ${stats.closed}\n\n` +
        `📈 Всего: ${stats.total}`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📥 Новые обращения', callback_data: 'admin_list_new' }],
              [{ text: '🔄 В работе', callback_data: 'admin_list_in_progress' }],
              [{ text: '✅ Решенные', callback_data: 'admin_list_resolved' }]
            ]
          }
        }
      );

      logger.info('Admin panel opened', { userId: ctx.from.id });
    } catch (error) {
      logger.error('Error in handleAdminPanel', { error: error.message });
      await ctx.reply('Произошла ошибка');
    }
  }

  /**
   * Обработка callback_query
   */
  async handleCallback(ctx) {
    try {
      if (!this.isAdmin(ctx.from.id)) {
        await ctx.answerCbQuery('Доступ запрещен');
        return;
      }

      const data = ctx.callbackQuery.data;

      if (data.startsWith('admin_list_')) {
        const status = data.replace('admin_list_', '');
        await this.handleList(ctx, status);
      } else if (data.startsWith('admin_view_')) {
        const id = parseInt(data.replace('admin_view_', ''));
        if (isNaN(id) || id <= 0) {
          await ctx.answerCbQuery('Невалидный ID');
          return;
        }
        await this.handleView(ctx, id);
      } else if (data.startsWith('admin_status_')) {
        const parts = data.split('_');
        const id = parseInt(parts[2]);
        if (isNaN(id) || id <= 0) {
          await ctx.answerCbQuery('Невалидный ID');
          return;
        }
        const status = parts.slice(3).join('_');
        await this.handleStatusChange(ctx, id, status);
      } else if (data.startsWith('admin_back')) {
        await this.handleAdminPanel(ctx);
      }

      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error in admin handleCallback', { error: error.message });
      await ctx.answerCbQuery('Произошла ошибка');
    }
  }

  /**
   * Список обращений
   */
  async handleList(ctx, status) {
    try {
      const feedbacks = await this.feedbackService.getFeedbackList(
        { status },
        { limit: 10, offset: 0 }
      );

      if (feedbacks.length === 0) {
        await ctx.editMessageText(
          `Нет обращений со статусом "${status}"`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '« Назад', callback_data: 'admin_back' }]
              ]
            }
          }
        );
        return;
      }

      const buttons = feedbacks.map(f => [
        {
          text: `#${f.id} - ${this.translateType(f.type)} - @${f.username || 'Аноним'}`,
          callback_data: `admin_view_${f.id}`
        }
      ]);

      buttons.push([{ text: '« Назад', callback_data: 'admin_back' }]);

      await ctx.editMessageText(
        `📋 <b>Обращения (${status})</b>\n\nВыберите обращение:`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: buttons
          }
        }
      );
    } catch (error) {
      logger.error('Error in handleList', { error: error.message });
      await ctx.editMessageText('Произошла ошибка при загрузке списка');
    }
  }

  /**
   * Просмотр обращения
   */
  async handleView(ctx, id) {
    try {
      const feedback = await this.feedbackService.getFeedbackById(id);

      if (!feedback) {
        await ctx.editMessageText('Обращение не найдено');
        return;
      }

      const typeEmoji = {
        bug: '🐛',
        feature: '💡',
        question: '❓',
        other: '📝'
      };

      const statusEmoji = {
        new: '🆕',
        in_progress: '🔄',
        resolved: '✅',
        closed: '🔒'
      };

      let message = `${typeEmoji[feedback.type]} <b>Обращение #${feedback.id}</b>\n\n`;
      message += `👤 <b>От:</b> ${feedback.username ? '@' + feedback.username : 'Аноним'}\n`;
      message += `📋 <b>Тип:</b> ${this.translateType(feedback.type)}\n`;
      message += `${statusEmoji[feedback.status]} <b>Статус:</b> ${this.translateStatus(feedback.status)}\n`;

      if (feedback.extension_version) {
        message += `📦 <b>Версия:</b> ${feedback.extension_version}\n`;
      }

      if (feedback.browser) {
        message += `🌐 <b>Браузер:</b> ${feedback.browser}\n`;
      }

      if (feedback.page_url) {
        message += `🔗 <b>Страница:</b> ${feedback.page_url}\n`;
      }

      message += `\n💬 <b>Сообщение:</b>\n${validators.sanitizeHtml(feedback.message)}`;

      if (feedback.admin_notes) {
        message += `\n\n📝 <b>Заметки админа:</b>\n${validators.sanitizeHtml(feedback.admin_notes)}`;
      }

      const keyboard = [
        [
          { text: '🔄 В работу', callback_data: `admin_status_${id}_in_progress` },
          { text: '✅ Решено', callback_data: `admin_status_${id}_resolved` }
        ],
        [
          { text: '🔒 Закрыть', callback_data: `admin_status_${id}_closed` }
        ],
        [{ text: '« Назад', callback_data: `admin_list_${feedback.status}` }]
      ];

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    } catch (error) {
      logger.error('Error in handleView', { error: error.message });
      await ctx.editMessageText('Произошла ошибка при загрузке обращения');
    }
  }

  /**
   * Изменение статуса
   */
  async handleStatusChange(ctx, id, status) {
    try {
      await this.feedbackService.updateStatus(id, status);

      await ctx.answerCbQuery(`✅ Статус изменен на "${this.translateStatus(status)}"`);

      // Обновить просмотр
      await this.handleView(ctx, id);

      logger.info('Status changed', { id, status, adminId: ctx.from.id });
    } catch (error) {
      logger.error('Error in handleStatusChange', { error: error.message });
      await ctx.answerCbQuery('Ошибка при изменении статуса');
    }
  }

  /**
   * Перевод типа
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
   * Перевод статуса
   */
  translateStatus(status) {
    const translations = {
      new: 'Новое',
      in_progress: 'В работе',
      resolved: 'Решено',
      closed: 'Закрыто'
    };

    return translations[status] || status;
  }
}

export default AdminHandler;

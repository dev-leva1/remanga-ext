/**
 * UserHandler - обработка flow пользователя
 */

import FeedbackService from '../services/FeedbackService.js';
import NotificationService from '../services/NotificationService.js';
import { logger } from '../utils/logger.js';
import { validators } from '../utils/validators.js';

class UserHandler {
  constructor(bot) {
    this.bot = bot;
    this.feedbackService = new FeedbackService();
    this.notificationService = new NotificationService(bot);
    this.sessions = new Map(); // { userId: { step, data } }
  }

  /**
   * Команда /start
   */
  async handleStart(ctx) {
    try {
      const userId = ctx.from.id;
      const startPayload = ctx.startPayload;

      // Deep link с контекстом
      if (startPayload) {
        try {
          const context = this.decodeContext(startPayload);

          this.sessions.set(userId, {
            step: 'type',
            data: {
              extension_version: context.v || null,
              browser: context.b || null,
              page_url: context.u || null
            }
          });

          await ctx.reply(
            'Выберите тип обращения:',
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🐛 Сообщить о баге', callback_data: 'feedback_type_bug' }],
                  [{ text: '💡 Предложить функцию', callback_data: 'feedback_type_feature' }],
                  [{ text: '❓ Задать вопрос', callback_data: 'feedback_type_question' }],
                  [{ text: '📝 Другое', callback_data: 'feedback_type_other' }]
                ]
              }
            }
          );

          logger.info('User started with context', { userId, context });
        } catch (error) {
          logger.error('Error decoding context', { error: error.message });
          await this.showTypeSelection(ctx);
        }
      } else {
        // Обычный старт
        await this.showTypeSelection(ctx);
      }
    } catch (error) {
      logger.error('Error in handleStart', { error: error.message });
      await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
  }

  /**
   * Показать выбор типа
   */
  async showTypeSelection(ctx) {
    const userId = ctx.from.id;

    this.sessions.set(userId, {
      step: 'type',
      data: {}
    });

    await ctx.reply(
      'Выберите тип обращения:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🐛 Сообщить о баге', callback_data: 'feedback_type_bug' }],
            [{ text: '💡 Предложить функцию', callback_data: 'feedback_type_feature' }],
            [{ text: '❓ Задать вопрос', callback_data: 'feedback_type_question' }],
            [{ text: '📝 Другое', callback_data: 'feedback_type_other' }]
          ]
        }
      }
    );
  }

  /**
   * Обработка callback_query
   */
  async handleCallback(ctx) {
    try {
      const userId = ctx.from.id;
      const data = ctx.callbackQuery.data;

      if (data.startsWith('feedback_type_')) {
        const type = data.replace('feedback_type_', '');
        await this.handleTypeSelection(ctx, type);
      } else if (data === 'feedback_add_context') {
        await this.handleAddContext(ctx);
      } else if (data === 'feedback_skip_context') {
        await this.handleSkipContext(ctx);
      }
    } catch (error) {
      logger.error('Error in handleCallback', { error: error.message });
      await ctx.answerCbQuery('Произошла ошибка');
    }
  }

  /**
   * Обработка выбора типа
   */
  async handleTypeSelection(ctx, type) {
    const userId = ctx.from.id;
    const session = this.sessions.get(userId) || { data: {} };

    session.data.type = type;

    // Если контекст уже есть (deep link), сразу запрашиваем сообщение
    if (session.data.extension_version || session.data.browser || session.data.page_url) {
      session.step = 'message';
      this.sessions.set(userId, session);

      await ctx.editMessageText('Опишите вашу проблему или предложение:');
      await ctx.answerCbQuery();
    } else {
      // Иначе предлагаем добавить контекст
      session.step = 'context';
      this.sessions.set(userId, session);

      await ctx.editMessageText(
        'Хотите добавить технические данные (версия расширения, браузер, страница)?',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Да, добавить', callback_data: 'feedback_add_context' }],
              [{ text: '⏭ Пропустить', callback_data: 'feedback_skip_context' }]
            ]
          }
        }
      );

      await ctx.answerCbQuery();
    }
  }

  /**
   * Пропуск контекста
   */
  async handleSkipContext(ctx) {
    const userId = ctx.from.id;
    const session = this.sessions.get(userId);

    if (!session) {
      await ctx.answerCbQuery('Сессия истекла. Начните заново с /start');
      return;
    }

    session.step = 'message';
    this.sessions.set(userId, session);

    await ctx.editMessageText('Опишите вашу проблему или предложение:');
    await ctx.answerCbQuery();
  }

  /**
   * Добавление контекста вручную
   */
  async handleAddContext(ctx) {
    const userId = ctx.from.id;
    const session = this.sessions.get(userId);

    if (!session) {
      await ctx.answerCbQuery('Сессия истекла. Начните заново с /start');
      return;
    }

    await ctx.editMessageText(
      'Отправьте технические данные в формате:\n\n' +
      'Версия: 1.6.4\n' +
      'Браузер: Chrome\n' +
      'Страница: https://remanga.org/manga/...\n\n' +
      'Или отправьте только те данные, которые хотите указать.'
    );

    session.step = 'context_input';
    this.sessions.set(userId, session);

    await ctx.answerCbQuery();
  }

  /**
   * Обработка текстового сообщения
   */
  async handleText(ctx) {
    try {
      const userId = ctx.from.id;
      const session = this.sessions.get(userId);

      if (!session) {
        await ctx.reply('Начните с команды /start');
        return;
      }

      if (session.step === 'context_input') {
        // Парсинг контекста из текста
        const text = ctx.message.text;
        const lines = text.split('\n');

        for (const line of lines) {
          const versionMatch = line.match(/версия[:\s]+([0-9.]+)/i);
          const browserMatch = line.match(/браузер[:\s]+(\w+)/i);
          const urlMatch = line.match(/(https?:\/\/[^\s]+)/i);

          if (versionMatch) session.data.extension_version = versionMatch[1];
          if (browserMatch) session.data.browser = browserMatch[1].toLowerCase();
          if (urlMatch) session.data.page_url = urlMatch[1];
        }

        session.step = 'message';
        this.sessions.set(userId, session);

        await ctx.reply('Опишите вашу проблему или предложение:');
      } else if (session.step === 'message') {
        session.data.message = ctx.message.text;

        // Создание обращения
        const feedback = await this.feedbackService.createFeedback({
          telegram_user_id: userId,
          username: ctx.from.username,
          ...session.data
        });

        // Уведомление пользователя
        await ctx.reply(
          `✅ Ваше обращение отправлено!\n\n` +
          `ID обращения: #${feedback.id}\n` +
          `Тип: ${this.translateType(feedback.type)}\n\n` +
          `Мы рассмотрим его в ближайшее время.`
        );

        // Уведомление админов
        await this.notificationService.notifyAdmins(feedback);

        // Очистка сессии
        this.sessions.delete(userId);

        logger.info('Feedback submitted', { userId, feedbackId: feedback.id });
      }
    } catch (error) {
      logger.error('Error in handleText', { error: error.message });

      if (error.message.includes('короткое') || error.message.includes('длинное')) {
        await ctx.reply(`❌ ${error.message}`);
      } else {
        await ctx.reply('Произошла ошибка при отправке обращения. Попробуйте позже.');
      }
    }
  }

  /**
   * Декодирование контекста из deep link
   */
  decodeContext(payload) {
    try {
      // base64url decode
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = Buffer.from(base64, 'base64').toString('utf-8');
      const parsed = JSON.parse(json);

      // Валидация структуры
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Невалидный контекст');
      }

      // Валидация и санитизация полей
      return {
        v: validators.validateVersion(parsed.v),
        b: validators.validateBrowser(parsed.b),
        u: validators.validateUrl(parsed.u)
      };
    } catch (error) {
      throw new Error('Невалидный контекст');
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
}

export default UserHandler;

/**
 * Точка входа бота
 */

import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import AppConfig from './config/AppConfig.js';
import Database from './database/db.js';
import UserHandler from './handlers/UserHandler.js';
import AdminHandler from './handlers/AdminHandler.js';
import { logger } from './utils/logger.js';

// Загрузка переменных окружения
dotenv.config();

let appConfig;
try {
  appConfig = AppConfig.fromEnv(process.env);
  Database.configure(appConfig.database);
} catch (error) {
  logger.error('Invalid application config', { error: error.message });
  process.exit(1);
}

// Инициализация бота
const bot = new Telegraf(appConfig.botToken);

// Инициализация handlers
const userHandler = new UserHandler(bot, { adminIds: appConfig.adminIds });
const adminHandler = new AdminHandler(bot, { adminIds: appConfig.adminIds });

// Middleware для логирования
bot.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  logger.debug('Request processed', {
    updateType: ctx.updateType,
    userId: ctx.from?.id,
    duration
  });
});

// Обработка ошибок
bot.catch((err, ctx) => {
  logger.error('Bot error', {
    error: err.message,
    updateType: ctx.updateType,
    userId: ctx.from?.id
  });
});

// Команды
bot.start((ctx) => userHandler.handleStart(ctx));
bot.command('feedback', (ctx) => userHandler.handleStart(ctx));
bot.command('admin', (ctx) => adminHandler.handleAdminPanel(ctx));

// Callback queries
bot.action(/^feedback_/, (ctx) => userHandler.handleCallback(ctx));
bot.action(/^admin_/, (ctx) => adminHandler.handleCallback(ctx));

// Текстовые сообщения
bot.on('text', (ctx) => userHandler.handleText(ctx));

// Запуск бота
async function start() {
  try {
    // Проверка подключения к БД
    const db = Database.getInstance();
    await db.query('SELECT 1');
    logger.info('Database connected');

    // Запуск бота
    await bot.launch();
    logger.info('Bot started successfully');

    // Graceful shutdown
    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error('Failed to start bot', { error: error.message });
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);

  try {
    bot.stop(signal);
    const db = Database.getInstance();
    await db.close();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
}

start();

/**
 * FeedbackService - бизнес-логика обращений
 */

import Database from '../database/db.js';
import { validators } from '../utils/validators.js';
import { logger } from '../utils/logger.js';

class FeedbackService {
  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Создание обращения
   */
  async createFeedback(data) {
    try {
      // Валидация
      const telegramUserId = validators.sanitizeTelegramUserId(data.telegram_user_id);
      const type = validators.validateFeedbackType(data.type);
      const message = validators.validateMessage(data.message);
      const version = validators.validateVersion(data.extension_version);
      const browser = validators.validateBrowser(data.browser);
      const pageUrl = validators.validateUrl(data.page_url);
      const username = validators.validateTelegramUsername(data.username);

      // Вставка в БД
      const query = `
        INSERT INTO feedbacks (
          telegram_user_id, username, type, message,
          extension_version, browser, page_url, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'new')
        RETURNING *
      `;

      const values = [
        telegramUserId,
        username,
        type,
        message,
        version,
        browser,
        pageUrl
      ];

      const result = await this.db.query(query, values);
      const feedback = result.rows[0];

      logger.info('Feedback created', { id: feedback.id, type, userId: telegramUserId });

      return feedback;
    } catch (error) {
      logger.error('Error creating feedback', { error: error.message });
      throw error;
    }
  }

  /**
   * Получение обращения по ID
   */
  async getFeedbackById(id) {
    try {
      const query = 'SELECT * FROM feedbacks WHERE id = $1';
      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting feedback', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Получение списка обращений с фильтрами
   */
  async getFeedbackList(filters = {}, pagination = { limit: 10, offset: 0 }) {
    try {
      let query = 'SELECT * FROM feedbacks WHERE 1=1';
      const values = [];
      let paramIndex = 1;

      // Фильтр по статусу
      if (filters.status) {
        validators.validateStatus(filters.status);
        query += ` AND status = $${paramIndex}`;
        values.push(filters.status);
        paramIndex++;
      }

      // Фильтр по типу
      if (filters.type) {
        validators.validateFeedbackType(filters.type);
        query += ` AND type = $${paramIndex}`;
        values.push(filters.type);
        paramIndex++;
      }

      // Фильтр по пользователю
      if (filters.telegram_user_id) {
        validators.sanitizeTelegramUserId(filters.telegram_user_id);
        query += ` AND telegram_user_id = $${paramIndex}`;
        values.push(filters.telegram_user_id);
        paramIndex++;
      }

      // Сортировка
      query += ' ORDER BY created_at DESC';

      // Пагинация с валидацией
      const parsedLimit = Number(String(pagination.limit).trim());
      const parsedOffset = Number(String(pagination.offset).trim());
      const limit = Number.isInteger(parsedLimit) ? Math.max(1, Math.min(100, parsedLimit)) : 10;
      const offset = Number.isInteger(parsedOffset) ? Math.max(0, parsedOffset) : 0;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      values.push(limit, offset);

      const result = await this.db.query(query, values);

      return result.rows;
    } catch (error) {
      logger.error('Error getting feedback list', { error: error.message });
      throw error;
    }
  }

  /**
   * Обновление статуса
   */
  async updateStatus(id, status) {
    try {
      const validStatus = validators.validateStatus(status);

      const query = `
        UPDATE feedbacks
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await this.db.query(query, [validStatus, id]);

      if (result.rows.length === 0) {
        throw new Error('Обращение не найдено');
      }

      logger.info('Feedback status updated', { id, status: validStatus });

      return result.rows[0];
    } catch (error) {
      logger.error('Error updating status', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Добавление заметки админа
   */
  async addAdminNote(id, note) {
    try {
      const validNote = validators.validateAdminNote(note);

      const query = `
        UPDATE feedbacks
        SET admin_notes = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await this.db.query(query, [validNote, id]);

      if (result.rows.length === 0) {
        throw new Error('Обращение не найдено');
      }

      logger.info('Admin note added', { id });

      return result.rows[0];
    } catch (error) {
      logger.error('Error adding admin note', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Получение статистики
   */
  async getStatistics() {
    try {
      const query = `
        SELECT
          status,
          COUNT(*) as count
        FROM feedbacks
        GROUP BY status
      `;

      const result = await this.db.query(query);

      const stats = {
        new: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
        total: 0
      };

      result.rows.forEach(row => {
        const count = Number(row.count);
        stats[row.status] = Number.isInteger(count) ? count : 0;
        stats.total += stats[row.status];
      });

      return stats;
    } catch (error) {
      logger.error('Error getting statistics', { error: error.message });
      throw error;
    }
  }
}

export default FeedbackService;

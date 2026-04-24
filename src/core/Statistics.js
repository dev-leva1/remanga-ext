/**
 * Менеджер статистики (Singleton)
 * Учет действий пользователя через расширение
 */

class Statistics {
  static instance = null;

  constructor() {
    if (Statistics.instance) {
      return Statistics.instance;
    }

    this.stats = {
      chaptersRead: 0,
      chaptersLiked: 0,
      installDate: null
    };

    this.saveQueue = Promise.resolve();

    Statistics.instance = this;
  }

  /**
   * Загрузка статистики из хранилища
   */
  async load() {
    try {
      const stored = await GM.getValue('statistics', null);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Невалидная структура статистики');
        }

        const validRead = parseInt(parsed.chaptersRead);
        const validLiked = parseInt(parsed.chaptersLiked);

        this.stats = {
          chaptersRead: (Number.isInteger(validRead) && validRead >= 0) ? validRead : 0,
          chaptersLiked: (Number.isInteger(validLiked) && validLiked >= 0) ? validLiked : 0,
          installDate: parsed.installDate || new Date().toISOString()
        };
      } else {
        this.stats.installDate = new Date().toISOString();
        await this.save();
      }

      logger.info('Статистика загружена:', this.stats);
      return this.stats;
    } catch (error) {
      logger.error('Ошибка загрузки статистики:', error);
      this.stats.installDate = new Date().toISOString();
      return this.stats;
    }
  }

  /**
   * Сохранение статистики
   */
  async save() {
    this.saveQueue = this.saveQueue.then(async () => {
      try {
        await GM.setValue('statistics', JSON.stringify(this.stats));
        logger.debug('Статистика сохранена');
      } catch (error) {
        logger.error('Ошибка сохранения статистики:', error);
      }
    });
    return this.saveQueue;
  }

  /**
   * Увеличить счетчик прочитанных глав
   */
  async incrementReads(count = 1) {
    const validCount = parseInt(count);
    if (!Number.isInteger(validCount) || validCount < 0) {
      throw new Error(`Невалидное значение count: ${count}`);
    }
    this.stats.chaptersRead += validCount;
    await this.save();
  }

  /**
   * Увеличить счетчик лайкнутых глав
   */
  async incrementLikes(count = 1) {
    const validCount = parseInt(count);
    if (!Number.isInteger(validCount) || validCount < 0) {
      throw new Error(`Невалидное значение count: ${count}`);
    }
    this.stats.chaptersLiked += validCount;
    await this.save();
  }

  /**
   * Получить статистику
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Сброс статистики
   */
  async reset() {
    this.stats = {
      chaptersRead: 0,
      chaptersLiked: 0,
      installDate: new Date().toISOString()
    };
    await this.save();
    logger.info('Статистика сброшена');
  }
}

/**
 * Менеджер работы с главами
 * Бизнес-логика для операций с главами
 */

class ChapterManager {
  constructor(apiClient, config, notifications) {
    this.api = apiClient;
    this.config = config;
    this.notifications = notifications;
    this.processingQueue = [];
  }

  /**
   * Отметка одной главы как прочитанной
   */
  async markAsRead(chapterId) {
    try {
      await this.api.markChapterAsRead(chapterId);
      logger.debug(`Глава ${chapterId} отмечена как прочитанная`);
      this.updateReadButton(chapterId);
      return true;
    } catch (error) {
      logger.error(`Ошибка отметки главы ${chapterId}:`, error);
      return false;
    }
  }

  /**
   * Массовая отметка глав как прочитанных
   */
  async markMultipleAsRead(chapterIds, onProgress = null) {
    const total = chapterIds.length;
    let completed = 0;
    let failed = 0;

    logger.info(`Начало массовой отметки ${total} глав`);

    for (const chapterId of chapterIds) {
      try {
        await this.api.markChapterAsRead(chapterId);
        completed++;
        this.updateReadButton(chapterId);

        if (onProgress) {
          onProgress(completed, total);
        }

        await this.delay(300);
      } catch (error) {
        logger.error(`Ошибка отметки главы ${chapterId}:`, error);
        failed++;
      }
    }

    logger.info(`Массовая отметка завершена: ${completed} успешно, ${failed} ошибок`);

    return {
      total,
      completed,
      failed
    };
  }

  /**
   * Лайк одной главы
   */
  async likeChapter(chapterId) {
    try {
      await this.api.likeChapters([chapterId]);
      logger.debug(`Глава ${chapterId} лайкнута`);
      this.updateLikeButton(chapterId);
      return true;
    } catch (error) {
      logger.error(`Ошибка лайка главы ${chapterId}:`, error);
      return false;
    }
  }

  /**
   * Массовый лайк глав (батчами по 10)
   */
  async likeMultiple(chapterIds, onProgress = null) {
    const batchSize = 10;
    const total = chapterIds.length;
    let completed = 0;
    let failed = 0;

    logger.info(`Начало массового лайка ${total} глав`);

    for (let i = 0; i < chapterIds.length; i += batchSize) {
      const batch = chapterIds.slice(i, i + batchSize);

      try {
        await this.api.likeChapters(batch);
        completed += batch.length;

        batch.forEach(id => this.updateLikeButton(id));

        if (onProgress) {
          onProgress(completed, total);
        }

        if (i + batchSize < chapterIds.length) {
          await this.delay(500);
        }
      } catch (error) {
        logger.error(`Ошибка лайка батча:`, error);
        failed += batch.length;
      }
    }

    logger.info(`Массовый лайк завершен: ${completed} успешно, ${failed} ошибок`);

    return {
      total,
      completed,
      failed
    };
  }

  /**
   * Обновление UI кнопки "прочитано"
   */
  updateReadButton(chapterId) {
    const button = domUtils.findReadButton(chapterId);
    if (button) {
      button.classList.add('remanga-ext-read');
      button.style.opacity = '0.5';
    }
  }

  /**
   * Обновление UI кнопки лайка
   */
  updateLikeButton(chapterId) {
    const button = domUtils.findLikeButton(chapterId);
    if (button) {
      button.classList.add('remanga-ext-liked');
      const icon = button.querySelector('svg');
      if (icon) {
        icon.style.fill = '#ef4444';
      }
    }
  }

  /**
   * Загрузка всех глав через скролл страницы
   */
  async loadAllChaptersByScroll(onProgress = null) {
    logger.info('Начало загрузки глав через скролл');

    let previousCount = 0;
    let stableCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 100;

    while (scrollAttempts < maxScrollAttempts) {
      const currentIds = this.getChapterIdsFromPage();
      const currentCount = currentIds.length;

      if (onProgress) {
        onProgress(currentCount);
      }

      // Если количество глав не изменилось 3 раза подряд - все загружено
      if (currentCount === previousCount) {
        stableCount++;
        if (stableCount >= 3) {
          logger.info(`Загрузка завершена: ${currentCount} глав`);
          break;
        }
      } else {
        stableCount = 0;
      }

      previousCount = currentCount;

      // Скроллим вниз
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });

      // Ждем подгрузки
      await this.delay(500);

      scrollAttempts++;
    }

    // Возвращаемся наверх
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    await this.delay(300);

    const finalIds = this.getChapterIdsFromPage();
    logger.info(`Итого загружено глав: ${finalIds.length}`);
    return finalIds;
  }

  /**
   * Получение всех ID глав на текущей странице
   */
  getChapterIdsFromPage() {
    return domUtils.extractChapterIdsFromPage();
  }

  /**
   * Получение ID текущей главы
   */
  getCurrentChapterId() {
    return domUtils.extractChapterIdFromUrl();
  }

  /**
   * Задержка
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Проверка, прочитана ли глава
   */
  isChapterRead(chapterId) {
    const button = domUtils.findReadButton(chapterId);
    if (!button) return false;

    return button.classList.contains('remanga-ext-read') ||
           button.style.opacity === '0.5';
  }

  /**
   * Проверка, лайкнута ли глава
   */
  isChapterLiked(chapterId) {
    const button = domUtils.findLikeButton(chapterId);
    if (!button) return false;

    return button.classList.contains('remanga-ext-liked');
  }
}

/**
 * Менеджер работы с главами
 * Бизнес-логика для операций с главами
 */

class ChapterManager {
  constructor(apiClient, config, notifications, statistics) {
    this.api = apiClient;
    this.config = config;
    this.notifications = notifications;
    this.statistics = statistics;
    this.processingQueue = [];
    this.operationTimes = [];
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
    const skipProcessed = this.config.get('skipProcessed');
    let filteredIds = chapterIds;

    if (skipProcessed) {
      filteredIds = chapterIds.filter(id => !this.isChapterRead(id));
      const skipped = chapterIds.length - filteredIds.length;
      if (skipped > 0) {
        logger.info(`Пропущено ${skipped} уже прочитанных глав`);
      }
    }

    if (filteredIds.length === 0) {
      return { total: chapterIds.length, completed: 0, failed: 0, skipped: chapterIds.length };
    }

    const total = filteredIds.length;
    let completed = 0;
    let failed = 0;
    this.operationTimes = [];

    logger.info(`Начало массовой отметки ${total} глав`);

    for (const chapterId of filteredIds) {
      const startTime = Date.now();

      try {
        await this.api.markChapterAsRead(chapterId);
        completed++;
        this.updateReadButton(chapterId);

        const operationTime = Date.now() - startTime;
        this.operationTimes.push(operationTime);
        if (this.operationTimes.length > 10) {
          this.operationTimes.shift();
        }

        if (onProgress) {
          const eta = this.calculateETA(completed, total);
          onProgress(completed, total, eta);
        }

        await this.delay(300);
      } catch (error) {
        logger.error(`Ошибка отметки главы ${chapterId}:`, error);
        failed++;
      }
    }

    await this.statistics.incrementReads(completed);
    logger.info(`Массовая отметка завершена: ${completed} успешно, ${failed} ошибок`);

    return {
      total: chapterIds.length,
      completed,
      failed,
      skipped: chapterIds.length - filteredIds.length
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
   * Массовый лайк глав (батчами)
   */
  async likeMultiple(chapterIds, onProgress = null) {
    const skipProcessed = this.config.get('skipProcessed');
    let filteredIds = chapterIds;

    if (skipProcessed) {
      filteredIds = chapterIds.filter(id => !this.isChapterLiked(id));
      const skipped = chapterIds.length - filteredIds.length;
      if (skipped > 0) {
        logger.info(`Пропущено ${skipped} уже лайкнутых глав`);
      }
    }

    if (filteredIds.length === 0) {
      return { total: chapterIds.length, completed: 0, failed: 0, skipped: chapterIds.length };
    }

    const batchSize = this.config.get('batchSize');
    const total = filteredIds.length;
    let completed = 0;
    let failed = 0;
    this.operationTimes = [];

    logger.info(`Начало массового лайка ${total} глав (batch: ${batchSize})`);

    for (let i = 0; i < filteredIds.length; i += batchSize) {
      const batch = filteredIds.slice(i, i + batchSize);
      const startTime = Date.now();

      try {
        await this.api.likeChapters(batch);
        completed += batch.length;

        batch.forEach(id => this.updateLikeButton(id));

        const operationTime = Date.now() - startTime;
        this.operationTimes.push(operationTime);
        if (this.operationTimes.length > 10) {
          this.operationTimes.shift();
        }

        if (onProgress) {
          const eta = this.calculateETA(completed, total);
          onProgress(completed, total, eta);
        }

        if (i + batchSize < filteredIds.length) {
          await this.delay(500);
        }
      } catch (error) {
        logger.error('Ошибка лайка батча:', error);
        failed += batch.length;
      }
    }

    await this.statistics.incrementLikes(completed);
    logger.info(`Массовый лайк завершен: ${completed} успешно, ${failed} ошибок`);

    return {
      total: chapterIds.length,
      completed,
      failed,
      skipped: chapterIds.length - filteredIds.length
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

    const expectedCount = this.getExpectedChapterCount();
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
    if (expectedCount && finalIds.length < expectedCount) {
      const message = `Загружено ${finalIds.length} из ${expectedCount} глав. Возможна неполная загрузка.`;
      logger.warn(message);
      this.notifications.warning(message);
    }

    logger.info(`Итого загружено глав: ${finalIds.length}`);
    return finalIds;
  }

  getExpectedChapterCount() {
    const candidates = Array.from(document.querySelectorAll('a, button, span, div'));

    for (const element of candidates) {
      const text = element.textContent ? element.textContent.trim() : '';
      const match = text.match(/^главы?\s*\(?(\d{1,5})\)?$/i);
      if (match) {
        const count = Number(match[1]);
        if (Number.isInteger(count) && count > 0) {
          return count;
        }
      }
    }

    return null;
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
    if (!button) {
      return false;
    }

    const isNativeRead = button.style.opacity === '0.5' ||
                         button.disabled === true ||
                         button.classList.contains('opacity-50') ||
                         button.hasAttribute('disabled');

    const isExtensionRead = button.classList.contains('remanga-ext-read');

    return isNativeRead || isExtensionRead;
  }

  /**
   * Проверка, лайкнута ли глава
   */
  isChapterLiked(chapterId) {
    const button = domUtils.findLikeButton(chapterId);
    if (!button) {
      return false;
    }

    const icon = button.querySelector('svg');
    const isNativeLiked = icon && (
      icon.style.fill === 'rgb(239, 68, 68)' ||
      icon.style.fill === '#ef4444' ||
      icon.classList.contains('text-red-500') ||
      button.classList.contains('text-red-500') ||
      button.getAttribute('aria-pressed') === 'true'
    );

    const isExtensionLiked = button.classList.contains('remanga-ext-liked');

    return isNativeLiked || isExtensionLiked;
  }

  /**
   * Расчет ETA (примерное оставшееся время)
   */
  calculateETA(completed, total) {
    if (this.operationTimes.length === 0 || completed === 0) {
      return null;
    }

    const avgTime = this.operationTimes.reduce((a, b) => a + b, 0) / this.operationTimes.length;
    const remaining = total - completed;
    const etaMs = remaining * avgTime;

    const minutes = Math.floor(etaMs / 60000);
    const seconds = Math.floor((etaMs % 60000) / 1000);

    return { minutes, seconds, totalSeconds: Math.floor(etaMs / 1000) };
  }
}

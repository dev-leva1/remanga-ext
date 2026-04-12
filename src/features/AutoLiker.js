/**
 * Автолайк глав при открытии
 */

class AutoLiker {
  constructor(chapterManager, config, notifications) {
    this.chapterManager = chapterManager;
    this.config = config;
    this.notifications = notifications;
    this.likedChapters = new Set();
  }

  /**
   * Инициализация автолайка
   */
  async init() {
    if (!this.config.get('autoLike')) {
      logger.debug('Автолайк отключен');
      return;
    }

    const chapterId = this.chapterManager.getCurrentChapterId();
    if (!chapterId) {
      logger.warn('Не удалось определить ID главы');
      return;
    }

    if (this.likedChapters.has(chapterId)) {
      logger.debug(`Глава ${chapterId} уже была лайкнута в этой сессии`);
      return;
    }

    await this.likeCurrentChapter(chapterId);
  }

  /**
   * Лайк текущей главы
   */
  async likeCurrentChapter(chapterId) {
    try {
      logger.info(`Автолайк главы ${chapterId}`);

      // Проверяем, не лайкнута ли глава уже
      if (this.chapterManager.isChapterLiked(chapterId)) {
        logger.debug(`Глава ${chapterId} уже лайкнута, пропускаем`);
        return;
      }

      const success = await this.chapterManager.likeChapter(chapterId);

      if (success) {
        this.likedChapters.add(chapterId);
        this.notifications.success('Глава автоматически лайкнута');
        logger.debug(`Глава ${chapterId} успешно лайкнута`);
      }
    } catch (error) {
      logger.error('Ошибка автолайка:', error);
    }
  }

  /**
   * Проверка, была ли глава лайкнута в этой сессии
   */
  wasLikedInSession(chapterId) {
    return this.likedChapters.has(chapterId);
  }

  /**
   * Очистка истории лайков
   */
  clearHistory() {
    this.likedChapters.clear();
  }
}

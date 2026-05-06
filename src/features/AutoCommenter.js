class CommentRateLimiter {
  constructor(storageKey = 'autoCommentRateLimitTimestamps', maxActions = 4, windowMs = 60000) {
    this.storageKey = storageKey;
    this.maxActions = maxActions;
    this.windowMs = windowMs;
    this.timestamps = [];
    this.loaded = false;
  }

  async load() {
    if (this.loaded) {
      return;
    }

    try {
      const stored = await GM.getValue(this.storageKey, '[]');
      const parsed = JSON.parse(stored);
      this.timestamps = this.normalizeTimestamps(parsed);
      this.loaded = true;
    } catch (error) {
      logger.warn('Не удалось загрузить лимит автокомментариев:', error);
      this.timestamps = [];
      this.loaded = true;
      await this.save();
    }
  }

  normalizeTimestamps(values) {
    if (!Array.isArray(values)) {
      return [];
    }

    const now = Date.now();
    return values
      .map(value => Number(String(value).trim()))
      .filter(value => Number.isInteger(value) && value > 0 && now - value < this.windowMs)
      .sort((a, b) => a - b);
  }

  getRecent(now = Date.now()) {
    return this.timestamps.filter(timestamp => now - timestamp < this.windowMs);
  }

  async save() {
    await GM.setValue(this.storageKey, JSON.stringify(this.timestamps));
  }

  async tryReserve() {
    await this.load();

    const now = Date.now();
    this.timestamps = this.getRecent(now);

    if (this.timestamps.length >= this.maxActions) {
      await this.save();
      return false;
    }

    this.timestamps.push(now);
    await this.save();
    return true;
  }

  getRetryAfterMs() {
    const now = Date.now();
    const recent = this.getRecent(now);

    if (recent.length < this.maxActions) {
      return 0;
    }

    return Math.max(0, recent[0] + this.windowMs - now);
  }
}

class AutoCommenter {
  constructor(chapterManager, apiClient, config, notifications, statistics, rateLimiter = new CommentRateLimiter()) {
    this.chapterManager = chapterManager;
    this.api = apiClient;
    this.config = config;
    this.notifications = notifications;
    this.statistics = statistics;
    this.rateLimiter = rateLimiter;
    this.storageKey = 'autoCommentedChapters';
    this.commentedChapters = new Set();
    this.currentChapterId = null;
    this.commentText = '';
    this.initialized = false;
    this.commenting = false;
    this.bottomTimer = null;
    this.retryTimer = null;
    this.scrollHandler = this.handleScroll.bind(this);
  }

  async init() {
    this.cleanup();

    if (!this.config.get('autoCommentEnabled')) {
      logger.debug('Автокомментарии отключены');
      return;
    }

    try {
      this.commentText = validators.sanitizeCommentText(this.config.get('autoCommentText'));
      this.currentChapterId = validators.sanitizeChapterId(this.chapterManager.getCurrentChapterId());
      await this.loadCommentedChapters();

      if (this.commentedChapters.has(this.currentChapterId)) {
        logger.debug(`Глава ${this.currentChapterId} уже была прокомментирована`);
        return;
      }

      this.initialized = true;
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
      window.addEventListener('resize', this.scrollHandler, { passive: true });
      this.handleScroll();
    } catch (error) {
      logger.warn('Автокомментарии не инициализированы:', error);
    }
  }

  async loadCommentedChapters() {
    try {
      const stored = await GM.getValue(this.storageKey, '[]');
      const parsed = JSON.parse(stored);
      const ids = Array.isArray(parsed)
        ? parsed
          .filter(value => validators.isChapterId(value))
          .map(value => validators.sanitizeChapterId(value))
        : [];

      this.commentedChapters = new Set(ids);
    } catch (error) {
      logger.warn('Не удалось загрузить историю автокомментариев:', error);
      this.commentedChapters = new Set();
      await this.saveCommentedChapters();
    }
  }

  async saveCommentedChapters() {
    await GM.setValue(this.storageKey, JSON.stringify([...this.commentedChapters]));
  }

  handleScroll() {
    if (!this.initialized || this.commenting || !domUtils.isAtPageBottom(300)) {
      return;
    }

    if (this.bottomTimer) {
      clearTimeout(this.bottomTimer);
    }

    this.bottomTimer = setTimeout(() => {
      this.bottomTimer = null;
      this.tryComment();
    }, 800);
  }

  async tryComment() {
    if (!this.initialized || this.commenting || !domUtils.isAtPageBottom(300)) {
      return;
    }

    if (this.commentedChapters.has(this.currentChapterId)) {
      this.cleanup();
      return;
    }

    this.commenting = true;

    try {
      const reserved = await this.rateLimiter.tryReserve();

      if (!reserved) {
        const retryAfterMs = this.rateLimiter.getRetryAfterMs();
        this.notifications.warning('Лимит автокомментариев: максимум 4 комментария в минуту');
        this.scheduleRetry(retryAfterMs);
        return;
      }

      await this.api.commentChapter(this.currentChapterId, this.commentText);
      this.commentedChapters.add(this.currentChapterId);
      await this.saveCommentedChapters();
      await this.statistics.incrementComments(1);
      this.notifications.success('Глава автоматически прокомментирована');
      this.cleanup();
    } catch (error) {
      logger.error('Ошибка автокомментария:', error);
      this.notifications.error('Не удалось автоматически отправить комментарий');
    } finally {
      this.commenting = false;
    }
  }

  scheduleRetry(delayMs) {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    const safeDelay = Math.max(1000, Number(String(delayMs).trim()) || 1000);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.tryComment();
    }, safeDelay);
  }

  cleanup() {
    window.removeEventListener('scroll', this.scrollHandler);
    window.removeEventListener('resize', this.scrollHandler);

    if (this.bottomTimer) {
      clearTimeout(this.bottomTimer);
      this.bottomTimer = null;
    }

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    this.initialized = false;
    this.commenting = false;
    this.currentChapterId = null;
    this.commentText = '';
  }
}

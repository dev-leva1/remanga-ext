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

class CommentSectionDetector {
  constructor(onReached) {
    if (typeof onReached !== 'function') {
      throw new Error('CommentSectionDetector требует callback');
    }

    this.onReached = onReached;
    this.selectors = [
      'button[data-testid="comment_input"]',
      '.cs-comment-input-section',
      '.cs-comment-button-trigger'
    ];
    this.mutationObserver = null;
    this.scrollHandler = this.handleViewportChange.bind(this);
  }

  start() {
    this.stop();
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    window.addEventListener('resize', this.scrollHandler, { passive: true });

    if (document.body) {
      this.mutationObserver = new MutationObserver(() => this.handleViewportChange());
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    this.handleViewportChange();
  }

  stop() {
    window.removeEventListener('scroll', this.scrollHandler);
    window.removeEventListener('resize', this.scrollHandler);

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  handleViewportChange() {
    if (this.isReached()) {
      this.onReached();
    }
  }

  isReached() {
    const candidates = this.getCandidates();

    if (candidates.length === 0) {
      return domUtils.isAtPageBottom(300);
    }

    return candidates.some(element => this.isElementReached(element));
  }

  getCandidates() {
    const elements = new Set();

    this.selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => elements.add(element));
    });

    return [...elements];
  }

  isElementReached(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    if (rect.width <= 0 || rect.height <= 0 || viewportHeight <= 0 || viewportWidth <= 0) {
      return false;
    }

    const topLimit = -Math.min(120, viewportHeight * 0.2);
    const bottomLimit = viewportHeight * 0.9;

    return rect.top >= topLimit &&
      rect.top <= bottomLimit &&
      rect.bottom > 0 &&
      rect.left < viewportWidth &&
      rect.right > 0;
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
    this.pendingChapters = new Set();
    this.currentUserId = null;
    this.currentUserLoaded = false;
    this.currentChapterId = null;
    this.commentText = '';
    this.initialized = false;
    this.commenting = false;
    this.triggerTimer = null;
    this.retryTimer = null;
    this.commentSectionDetector = new CommentSectionDetector(() => this.handleCommentSectionReached());
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

      if (this.hasHandledChapter(this.currentChapterId)) {
        logger.debug(`Глава ${this.currentChapterId} уже была прокомментирована`);
        return;
      }

      if (await this.hasVisibleOwnComment(this.currentChapterId, this.commentText)) {
        await this.markChapterCommented(this.currentChapterId);
        logger.debug(`Глава ${this.currentChapterId} уже содержит автокомментарий текущего пользователя`);
        return;
      }

      this.initialized = true;
      this.commentSectionDetector.start();
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

  hasHandledChapter(chapterId) {
    const validId = validators.sanitizeChapterId(chapterId);
    return this.commentedChapters.has(validId) || this.pendingChapters.has(validId);
  }

  async markChapterCommented(chapterId) {
    const validId = validators.sanitizeChapterId(chapterId);
    this.commentedChapters.add(validId);
    await this.saveCommentedChapters();
  }

  async hasVisibleOwnComment(chapterId, commentText) {
    validators.sanitizeChapterId(chapterId);
    const validText = validators.sanitizeCommentText(commentText);
    const currentUserId = await this.getCurrentUserId();

    if (!currentUserId) {
      return false;
    }

    return this.findVisibleOwnComment(currentUserId, validText);
  }

  async getCurrentUserId() {
    if (this.currentUserLoaded) {
      return this.currentUserId;
    }

    this.currentUserLoaded = true;

    try {
      const user = await this.api.getCurrentUser();
      const userId = this.extractCurrentUserId(user);
      this.currentUserId = userId;
      return userId;
    } catch (error) {
      logger.warn('Не удалось определить текущего пользователя для проверки автокомментария:', error);
      this.currentUserId = null;
      return null;
    }
  }

  extractCurrentUserId(user) {
    const value = user?.id ?? user?.user?.id ?? user?.data?.id;
    const userId = Number(String(value).trim());

    if (!Number.isInteger(userId) || userId <= 0 || userId >= Number.MAX_SAFE_INTEGER) {
      throw new Error(`Невалидный ID текущего пользователя: ${value}`);
    }

    return userId;
  }

  findVisibleOwnComment(userId, commentText) {
    const validUserId = this.sanitizeUserId(userId);
    const normalizedText = this.normalizeCommentText(commentText);
    const comments = Array.from(document.querySelectorAll('.cs-comment-item'));

    return comments.some(comment => {
      const authorLink = comment.querySelector(`a[href="/user/${validUserId}/about"], a[href^="/user/${validUserId}/about?"]`);
      if (!authorLink) {
        return false;
      }

      return this.getCommentTextCandidates(comment).some(text => this.normalizeCommentText(text) === normalizedText);
    });
  }

  getCommentTextCandidates(commentElement) {
    if (!(commentElement instanceof Element)) {
      return [];
    }

    const selectors = [
      '[data-sentry-component="ActivityItemContent"]',
      '[data-sentry-component="SpoiledText"]',
      '.break-words'
    ];
    const values = new Set();

    selectors.forEach(selector => {
      commentElement.querySelectorAll(selector).forEach(element => {
        const text = element.textContent ? element.textContent.trim() : '';
        if (text) {
          values.add(text);
        }
      });
    });

    return [...values];
  }

  normalizeCommentText(value) {
    return validators.sanitizeCommentText(value).replace(/\s+/g, ' ');
  }

  sanitizeUserId(value) {
    const userId = Number(String(value).trim());

    if (!Number.isInteger(userId) || userId <= 0 || userId >= Number.MAX_SAFE_INTEGER) {
      throw new Error(`Невалидный ID пользователя: ${value}`);
    }

    return userId;
  }

  handleCommentSectionReached() {
    if (!this.initialized || this.commenting || this.retryTimer) {
      return;
    }

    if (this.triggerTimer) {
      clearTimeout(this.triggerTimer);
    }

    this.triggerTimer = setTimeout(() => {
      this.triggerTimer = null;
      this.tryComment();
    }, 150);
  }

  async tryComment() {
    if (!this.initialized || this.commenting || this.retryTimer || !this.commentSectionDetector.isReached()) {
      return;
    }

    const chapterId = validators.sanitizeChapterId(this.currentChapterId);
    const commentText = validators.sanitizeCommentText(this.commentText);

    if (this.hasHandledChapter(chapterId)) {
      this.cleanup();
      return;
    }

    this.commenting = true;
    this.pendingChapters.add(chapterId);

    try {
      if (await this.hasVisibleOwnComment(chapterId, commentText)) {
        await this.markChapterCommented(chapterId);
        this.cleanup();
        return;
      }

      const reserved = await this.rateLimiter.tryReserve();

      if (!reserved) {
        this.pendingChapters.delete(chapterId);
        const retryAfterMs = this.rateLimiter.getRetryAfterMs();
        if (this.scheduleRetry(retryAfterMs)) {
          this.notifications.warning('Лимит автокомментариев: максимум 4 комментария в минуту');
        }
        return;
      }

      await this.api.commentChapter(chapterId, commentText);
      await this.markChapterCommented(chapterId);
      await this.statistics.incrementComments(1);
      this.notifications.success('Глава автоматически прокомментирована');
      this.cleanup();
    } catch (error) {
      logger.error('Ошибка автокомментария:', error);
      this.notifications.error('Не удалось автоматически отправить комментарий');
    } finally {
      this.pendingChapters.delete(chapterId);
      this.commenting = false;
    }
  }

  scheduleRetry(delayMs) {
    if (this.retryTimer) {
      return false;
    }

    const safeDelay = Math.max(1000, Number(String(delayMs).trim()) || 1000);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.tryComment();
    }, safeDelay);

    return true;
  }

  cleanup() {
    this.commentSectionDetector.stop();

    if (this.triggerTimer) {
      clearTimeout(this.triggerTimer);
      this.triggerTimer = null;
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

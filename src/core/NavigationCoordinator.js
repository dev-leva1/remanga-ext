class NavigationCoordinator {
  constructor(routeHandler) {
    if (!routeHandler || typeof routeHandler.handleUrlChange !== 'function') {
      throw new Error('NavigationCoordinator требует routeHandler.handleUrlChange');
    }

    this.routeHandler = routeHandler;
    this.lastUrl = location.href;
    this.originalPushState = null;
    this.originalReplaceState = null;
    this.patchedPushState = null;
    this.patchedReplaceState = null;
    this.isStarted = false;
    this.boundCheckUrlChange = this.checkUrlChange.bind(this);
  }

  start() {
    if (this.isStarted) {
      return;
    }

    const activeCoordinator = window.__remangaNavigationCoordinator;
    if (activeCoordinator && activeCoordinator !== this && typeof activeCoordinator.stop === 'function') {
      activeCoordinator.stop();
    }

    this.originalPushState = history.pushState;
    this.originalReplaceState = history.replaceState;

    const coordinator = this;

    this.patchedPushState = function(...args) {
      const result = coordinator.originalPushState.apply(this, args);
      coordinator.checkUrlChange();
      return result;
    };

    this.patchedReplaceState = function(...args) {
      const result = coordinator.originalReplaceState.apply(this, args);
      coordinator.checkUrlChange();
      return result;
    };

    history.pushState = this.patchedPushState;
    history.replaceState = this.patchedReplaceState;
    window.addEventListener('popstate', this.boundCheckUrlChange);
    window.__remangaNavigationCoordinator = this;
    this.isStarted = true;

    logger.info('Navigation listener активирован');
  }

  checkUrlChange() {
    const currentUrl = location.href;
    if (currentUrl === this.lastUrl) {
      return;
    }

    const previousUrl = this.lastUrl;
    this.lastUrl = currentUrl;
    this.routeHandler.handleUrlChange(currentUrl, previousUrl);
  }

  stop() {
    if (!this.isStarted) {
      return;
    }

    if (history.pushState === this.patchedPushState) {
      history.pushState = this.originalPushState;
    }

    if (history.replaceState === this.patchedReplaceState) {
      history.replaceState = this.originalReplaceState;
    }

    window.removeEventListener('popstate', this.boundCheckUrlChange);

    if (window.__remangaNavigationCoordinator === this) {
      window.__remangaNavigationCoordinator = null;
    }

    this.originalPushState = null;
    this.originalReplaceState = null;
    this.patchedPushState = null;
    this.patchedReplaceState = null;
    this.isStarted = false;

    logger.info('Navigation listener остановлен');
  }
}

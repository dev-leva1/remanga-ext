class TitleCoverPreview {
  constructor(config) {
    this.config = config;
    this.overlay = null;
    this.coverElement = null;
    this.coverWrapper = null;
    this.hoverBadge = null;
    this.observer = null;
    this.listenersAttached = false;
    this.boundHandleCoverClick = this.handleCoverClick.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleMouseEnter = this.handleMouseEnter.bind(this);
    this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);
    this.boundHandleFocus = this.handleMouseEnter.bind(this);
    this.boundHandleBlur = this.handleMouseLeave.bind(this);
  }

  init() {
    if (!this.config.get('titleCoverPreviewEnabled') || !this.isTitlePage()) {
      this.cleanup();
      return;
    }

    this.ensureBinding();

    if (this.observer) {
      return;
    }

    let debounceTimer = null;

    this.observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!this.isTitlePage() || !this.config.get('titleCoverPreviewEnabled')) {
          this.cleanup();
          return;
        }

        this.ensureBinding();
      }, 100);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    logger.info('TitleCoverPreview инициализирован');
  }

  cleanup() {
    this.close();
    this.detachCoverHandler();
    this.removeHoverBadge();

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  close() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    document.removeEventListener('keydown', this.boundHandleKeyDown, true);
    document.body.style.removeProperty('overflow');
  }

  isTitlePage() {
    const path = window.location.pathname;
    return /^\/manga\/[^/]+(?:\/main)?\/?$/.test(path);
  }

  ensureBinding() {
    const coverElement = this.findCoverElement();

    if (!coverElement) {
      this.detachCoverHandler();
      return;
    }

    if (this.coverElement === coverElement) {
      return;
    }

    this.detachCoverHandler();
    this.coverElement = coverElement;
    this.coverWrapper = this.coverElement.parentElement;
    this.coverElement.style.cursor = 'zoom-in';
    this.coverElement.setAttribute('title', 'Увеличить обложку');
    this.coverElement.addEventListener('click', this.boundHandleCoverClick);
    this.coverElement.addEventListener('mouseenter', this.boundHandleMouseEnter);
    this.coverElement.addEventListener('mouseleave', this.boundHandleMouseLeave);
    this.coverElement.addEventListener('focus', this.boundHandleFocus);
    this.coverElement.addEventListener('blur', this.boundHandleBlur);
    this.listenersAttached = true;
    this.ensureHoverBadge();
  }

  detachCoverHandler() {
    if (this.coverElement && this.listenersAttached) {
      this.coverElement.removeEventListener('click', this.boundHandleCoverClick);
      this.coverElement.removeEventListener('mouseenter', this.boundHandleMouseEnter);
      this.coverElement.removeEventListener('mouseleave', this.boundHandleMouseLeave);
      this.coverElement.removeEventListener('focus', this.boundHandleFocus);
      this.coverElement.removeEventListener('blur', this.boundHandleBlur);
    }

    this.coverElement = null;
    this.coverWrapper = null;
    this.listenersAttached = false;
  }

  ensureHoverBadge() {
    if (!this.coverWrapper || this.hoverBadge) {
      return;
    }

    const wrapperStyle = window.getComputedStyle(this.coverWrapper);
    if (wrapperStyle.position === 'static') {
      this.coverWrapper.style.position = 'relative';
    }

    const badge = document.createElement('div');
    badge.textContent = 'Увеличить';
    badge.style.cssText = `
      position: absolute;
      right: 10px;
      bottom: 10px;
      z-index: 2;
      padding: 6px 10px;
      border-radius: ${DESIGN_TOKENS.radius.pill};
      background: rgba(0, 0, 0, 0.72);
      color: ${DESIGN_TOKENS.colors.text.primary};
      font-family: ${DESIGN_TOKENS.typography.fontFamily};
      font-size: ${DESIGN_TOKENS.typography.fontSize.sm};
      font-weight: ${DESIGN_TOKENS.typography.fontWeight.semibold};
      opacity: 0;
      transform: translateY(4px);
      transition: opacity ${DESIGN_TOKENS.transitions.fast}, transform ${DESIGN_TOKENS.transitions.fast};
      pointer-events: none;
      backdrop-filter: blur(4px);
      box-shadow: ${DESIGN_TOKENS.shadows.sm};
    `;

    this.coverWrapper.appendChild(badge);
    this.hoverBadge = badge;
  }

  removeHoverBadge() {
    if (this.hoverBadge) {
      this.hoverBadge.remove();
      this.hoverBadge = null;
    }
  }

  handleMouseEnter() {
    if (this.hoverBadge) {
      this.hoverBadge.style.opacity = '1';
      this.hoverBadge.style.transform = 'translateY(0)';
    }
  }

  handleMouseLeave() {
    if (this.hoverBadge) {
      this.hoverBadge.style.opacity = '0';
      this.hoverBadge.style.transform = 'translateY(4px)';
    }
  }

  findCoverElement() {
    const selectors = [
      'main img[alt][src*="/media/titles/"]',
      'main picture img[src*="/media/titles/"]',
      'main [class*="aspect-[2/3]"] img',
      'main [class*="rounded-sm"] img[src*="/media/titles/"]'
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);

      for (const element of elements) {
        if (!(element instanceof HTMLImageElement)) {
          continue;
        }

        if (!element.offsetWidth || !element.offsetHeight) {
          continue;
        }

        if (element.alt === 'Обои') {
          continue;
        }

        if (element.closest('[class*="z-[-1]"]')) {
          continue;
        }

        const ratio = element.offsetHeight / element.offsetWidth;
        if (ratio < 1.3) {
          continue;
        }

        if (element.offsetWidth < 120 || element.offsetHeight < 160) {
          continue;
        }

        return element;
      }
    }

    return null;
  }

  getPreviewDimensions() {
    if (!this.coverElement) {
      return {
        maxWidth: '92vw',
        maxHeight: '96vh'
      };
    }

    const naturalWidth = this.coverElement.naturalWidth || this.coverElement.offsetWidth;
    const naturalHeight = this.coverElement.naturalHeight || this.coverElement.offsetHeight;
    const ratio = naturalWidth > 0 ? naturalHeight / naturalWidth : 1.5;

    if (ratio >= 1.3) {
      return {
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 24px)'
      };
    }

    return {
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 24px)'
    };
  }

  getPreviewImageUrl() {
    return this.extractImageUrl();
  }

  extractImageUrl() {
    if (!this.coverElement) {
      return null;
    }

    const candidates = [
      this.coverElement.currentSrc,
      this.coverElement.src,
      this.coverElement.dataset?.src
    ];

    for (const candidate of candidates) {
      const validated = this.validateImageUrl(candidate);
      if (validated) {
        return validated;
      }
    }

    return null;
  }

  getDisplayImageUrl() {
    const previewUrl = this.getPreviewImageUrl();
    if (previewUrl) {
      return previewUrl;
    }

    return this.extractImageUrl();
  }

  validateImageUrl(value) {
    if (typeof value !== 'string' || !value.trim()) {
      return null;
    }

    try {
      const url = new URL(value, window.location.origin);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
      }
      return url.toString();
    } catch (error) {
      logger.warn('Невалидный URL обложки:', value);
      return null;
    }
  }

  handleCoverClick(event) {
    const imageUrl = this.getDisplayImageUrl();

    if (!imageUrl) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.open(imageUrl);
  }

  open(imageUrl) {
    this.close();

    const dimensions = this.getPreviewDimensions();
    const overlay = document.createElement('div');
    overlay.id = 'remanga-ext-title-cover-preview';
    overlay.style.cssText = overlayStyles() + `
      background: rgba(0, 0, 0, 0.88);
      padding: 12px;
      cursor: pointer;
    `;

    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = this.coverElement?.alt || 'Обложка тайтла';
    image.style.cssText = `
      display: block;
      max-width: ${dimensions.maxWidth};
      max-height: ${dimensions.maxHeight};
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: ${DESIGN_TOKENS.radius.lg};
      box-shadow: ${DESIGN_TOKENS.shadows.md};
      cursor: default;
    `;

    overlay.appendChild(image);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        this.close();
      }
    });

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', this.boundHandleKeyDown, true);
    this.overlay = overlay;
  }

  handleKeyDown(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }
}

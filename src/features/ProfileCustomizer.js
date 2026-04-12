/**
 * Кастомизация профиля
 * Блокировка кастомных тем и скрытие блоков профиля
 */

class ProfileCustomizer {
  constructor(config) {
    this.config = config;
    this.observer = null;
    this.styleElement = null;
  }

  /**
   * Инициализация
   */
  init() {
    this.blockCustomThemes();
    this.hideProfileBlocks();
    this.startObserver();
    logger.info('ProfileCustomizer инициализирован');
  }

  /**
   * Блокировка кастомных тем
   */
  blockCustomThemes() {
    const blockThemes = this.config.get('blockCustomThemes');

    if (!blockThemes) {
      return;
    }

    const styleTags = document.querySelectorAll('style:not([id^="remanga-"]):not([data-styled]):not([data-emotion])');
    styleTags.forEach(tag => {
      const content = tag.textContent || '';
      if (content.includes('background') || content.includes('color')) {
        tag.setAttribute('data-blocked-by-remanga', 'true');
        tag.textContent = '';
        logger.debug('Заблокирован кастомный style тег');
      }
    });

    const elementsWithInlineStyles = document.querySelectorAll('[style*="background"], [style*="color"]');
    elementsWithInlineStyles.forEach(el => {
      if (!el.id || !el.id.startsWith('remanga-')) {
        const style = el.getAttribute('style') || '';
        const cleanedStyle = style
          .split(';')
          .filter(rule => {
            const prop = rule.trim().split(':')[0];
            return prop && !prop.includes('background') && !prop.includes('color');
          })
          .join(';');

        if (cleanedStyle) {
          el.setAttribute('style', cleanedStyle);
        } else {
          el.removeAttribute('style');
        }
      }
    });

    logger.info('Кастомные темы заблокированы');
  }

  /**
   * Скрытие блоков профиля
   */
  hideProfileBlocks() {
    const hideBlocks = this.config.get('hideProfileBlocks');

    if (!hideBlocks || typeof hideBlocks !== 'object') {
      return;
    }

    const blockTexts = {
      statistics: ['Просмотры', 'Лайки', 'Посты', 'Комменты'],
      badges: ['Бейджи'],
      achievements: ['Ачивки'],
      favoriteCards: ['Избранные карточки'],
      publishers: ['Паблишеры'],
      guilds: ['Гильдии'],
      friends: ['Друзья'],
      followers: ['Подписчики'],
      comments: ['Комментарии']
    };

    Object.keys(hideBlocks).forEach(blockKey => {
      if (hideBlocks[blockKey] && blockTexts[blockKey]) {
        if (blockKey === 'statistics') {
          const statsBlock = document.querySelector('ul.cs-layout-stats-root');
          if (statsBlock && !statsBlock.hasAttribute('data-hidden-by-remanga')) {
            statsBlock.style.display = 'none';
            statsBlock.setAttribute('data-hidden-by-remanga', blockKey);
            logger.debug(`Скрыт блок: ${blockKey}`);
          }
        } else {
          blockTexts[blockKey].forEach(text => {
            const headers = Array.from(document.querySelectorAll('h2, h3, h4'));
            headers.forEach(header => {
              const headerText = header.textContent.trim();
              if (headerText === text) {
                let blockElement = header.closest('section');

                if (!blockElement) {
                  let parent = header.parentElement;
                  for (let i = 0; i < 3 && parent && parent !== document.body; i++) {
                    const hasMultipleChildren = parent.children.length > 2;
                    const hasMinHeight = parent.offsetHeight > 100;

                    if (hasMultipleChildren && hasMinHeight) {
                      blockElement = parent;
                      break;
                    }
                    parent = parent.parentElement;
                  }
                }

                if (blockElement &&
                    blockElement !== document.body &&
                    !blockElement.hasAttribute('data-hidden-by-remanga') &&
                    !blockElement.querySelector('header') &&
                    blockElement.offsetHeight > 50) {
                  blockElement.style.display = 'none';
                  blockElement.setAttribute('data-hidden-by-remanga', blockKey);
                  logger.debug(`Скрыт блок: ${blockKey} (${text})`);
                }
              }
            });
          });
        }
      }
    });

    logger.info('Блоки профиля скрыты:', Object.keys(hideBlocks).filter(k => hideBlocks[k]));
  }

  /**
   * Запуск MutationObserver
   */
  startObserver() {
    const blockThemes = this.config.get('blockCustomThemes');
    const hideBlocks = this.config.get('hideProfileBlocks');

    if (!blockThemes && (!hideBlocks || typeof hideBlocks !== 'object')) {
      return;
    }

    this.observer = new MutationObserver(mutations => {
      let shouldHideBlocks = false;

      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (blockThemes) {
              if (node.tagName === 'STYLE' &&
                  !node.id?.startsWith('remanga-') &&
                  !node.hasAttribute('data-styled') &&
                  !node.hasAttribute('data-emotion')) {
                const content = node.textContent || '';
                if (content.includes('background') || content.includes('color')) {
                  node.setAttribute('data-blocked-by-remanga', 'true');
                  node.textContent = '';
                  logger.debug('MutationObserver: заблокирован добавленный style тег');
                }
              }

              if (node.hasAttribute && node.hasAttribute('style')) {
                const style = node.getAttribute('style') || '';
                if ((style.includes('background') || style.includes('color')) &&
                    (!node.id || !node.id.startsWith('remanga-'))) {
                  const cleanedStyle = style
                    .split(';')
                    .filter(rule => {
                      const prop = rule.trim().split(':')[0];
                      return prop && !prop.includes('background') && !prop.includes('color');
                    })
                    .join(';');

                  if (cleanedStyle) {
                    node.setAttribute('style', cleanedStyle);
                  } else {
                    node.removeAttribute('style');
                  }
                  logger.debug('MutationObserver: очищены inline стили');
                }
              }
            }

            if (hideBlocks && typeof hideBlocks === 'object') {
              if (node.tagName === 'H2' || node.tagName === 'H3' || node.tagName === 'SECTION' || node.tagName === 'DIV') {
                shouldHideBlocks = true;
              }
            }
          }
        });
      });

      if (shouldHideBlocks) {
        this.hideProfileBlocks();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });

    logger.info('MutationObserver запущен');
  }

  /**
   * Обновление при изменении настроек
   */
  update() {
    this.cleanup();
    this.init();
  }

  /**
   * Очистка
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      logger.info('MutationObserver остановлен');
    }

    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
      logger.info('ProfileCustomizer стили удалены');
    }

    const hiddenElements = document.querySelectorAll('[data-hidden-by-remanga]');
    hiddenElements.forEach(el => {
      el.style.display = '';
      el.removeAttribute('data-hidden-by-remanga');
    });
  }
}

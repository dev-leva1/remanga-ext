/**
 * API клиент для взаимодействия с remanga.org API
 */

class ApiClient {
  constructor() {
    this.baseURL = 'https://api.remanga.org';
    this.token = null;
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }

  /**
   * Извлечение токена из cookie
   */
  extractToken() {
    const match = document.cookie.match(/token=([^;]+)/);
    if (!match) {
      throw new Error('Пользователь не авторизован');
    }

    const token = match[1];
    if (!validators.isValidToken(token)) {
      throw new Error('Невалидный токен авторизации');
    }

    return token;
  }

  /**
   * Инициализация клиента
   */
  init() {
    try {
      this.token = this.extractToken();
      logger.info('API клиент инициализирован');
    } catch (error) {
      logger.error('Ошибка инициализации API клиента:', error);
      throw error;
    }
  }

  /**
   * Rate limiting - задержка между запросами
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = 300;

    if (timeSinceLastRequest < minDelay) {
      const delay = minDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Базовый метод для выполнения запросов
   */
  async request(endpoint, options = {}) {
    if (typeof endpoint !== 'string' || !endpoint.startsWith('/')) {
      throw new Error('Невалидный API endpoint');
    }

    if (typeof options !== 'object' || options === null || Array.isArray(options)) {
      throw new Error('Невалидные параметры API запроса');
    }

    const responseType = options.responseType || 'json';
    if (!['json', 'text'].includes(responseType)) {
      throw new Error('Невалидный responseType');
    }

    await this.rateLimit();

    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';

    return new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: method,
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          ...options.headers
        },
        data: options.body ? JSON.stringify(options.body) : undefined,
        timeout: 15000,
        onload: (response) => {
          if (response.status >= 200 && response.status < 300) {
            try {
              resolve(this.parseResponse(response, responseType));
            } catch (error) {
              reject(error);
            }
          } else {
            const error = this.createApiError(response);
            logger.error('API ошибка:', error.message);
            reject(error);
          }
        },
        onerror: (error) => {
          logger.error('Сетевая ошибка:', error);
          reject(new Error('Сетевая ошибка'));
        },
        ontimeout: () => {
          logger.error('Таймаут запроса');
          reject(new Error('Таймаут запроса'));
        }
      });
    });
  }

  parseResponse(response, responseType) {
    if (response.status === 204 || response.responseText === '') {
      return null;
    }

    if (responseType === 'text') {
      return response.responseText;
    }

    try {
      return JSON.parse(response.responseText);
    } catch (error) {
      throw new Error(`API вернул невалидный JSON: ${this.sanitizeResponseBody(response.responseText)}`);
    }
  }

  createApiError(response) {
    const body = this.sanitizeResponseBody(response.responseText);
    const suffix = body ? `: ${body}` : '';
    return new Error(`API ошибка ${response.status}${suffix}`);
  }

  sanitizeResponseBody(body) {
    if (typeof body !== 'string') {
      return '';
    }

    return body
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 500);
  }

  /**
   * Отметка главы как прочитанной
   */
  async markChapterAsRead(chapterId) {
    const validId = validators.sanitizeChapterId(chapterId);
    logger.debug(`Отметка главы ${validId} как прочитанной`);

    return this.request('/api/activity/views/', {
      method: 'POST',
      body: { chapter: validId }
    });
  }

  /**
   * Лайк глав (поддерживает массовую операцию)
   */
  async likeChapters(chapterIds) {
    const validIds = validators.sanitizeChapterIds(chapterIds);
    logger.debug('Лайк глав:', validIds);

    return this.request('/api/activity/votes/', {
      method: 'POST',
      body: { chapter_ids: validIds }
    });
  }

  /**
   * Получение информации о главах
   */
  async getChapters(branchId, page = 1) {
    const validBranchId = validators.sanitizeChapterId(branchId);
    const validPage = Number(String(page).trim());

    if (!Number.isInteger(validPage) || validPage < 1 || validPage > 9999) {
      throw new Error(`Невалидная страница глав: ${page}`);
    }

    const params = new URLSearchParams({
      branch_id: validBranchId.toString(),
      user_data: '1',
      ordering: '-index',
      page: validPage.toString()
    });

    return this.request(`/api/v2/titles/chapters/?${params.toString()}`);
  }

  /**
   * Получение текущего пользователя
   */
  async getCurrentUser() {
    return this.request('/api/v2/users/current/');
  }

  async getCatalogPage(page = 1, count = 1) {
    const validPage = Number(String(page).trim());
    const validCount = Number(String(count).trim());

    if (!Number.isInteger(validPage) || validPage < 1 || validPage > 999) {
      throw new Error(`Невалидная страница каталога: ${page}`);
    }

    if (!Number.isInteger(validCount) || validCount < 1 || validCount > 30) {
      throw new Error(`Невалидный размер страницы каталога: ${count}`);
    }

    const params = new URLSearchParams({
      count: validCount.toString(),
      ordering: '-score',
      page: validPage.toString(),
      unstrict_search_fields: 'genres'
    });

    params.append('unstrict_search_fields', 'categories');

    return this.request(`/api/v2/search/catalog/?${params.toString()}`);
  }

  async getRandomTitle() {
    const maxPage = 999;
    const minPage = 1;

    for (let attempt = 0; attempt < 5; attempt++) {
      const randomPage = Math.floor(Math.random() * (maxPage - minPage + 1)) + minPage;
      try {
        const data = await this.getCatalogPage(randomPage, 1);
        const title = Array.isArray(data?.results) ? data.results[0] : null;

        if (title && !title.is_forbidden && typeof title.dir === 'string' && title.dir.trim()) {
          return title;
        }
      } catch (error) {
        logger.warn(`Не удалось получить случайный тайтл со страницы ${randomPage}:`, error);
      }
    }

    const fallbackData = await this.getCatalogPage(1, 30);
    const titles = Array.isArray(fallbackData?.results)
      ? fallbackData.results.filter(title => !title.is_forbidden && typeof title.dir === 'string' && title.dir.trim())
      : [];

    if (titles.length === 0) {
      throw new Error('Каталог не вернул доступные тайтлы');
    }

    const randomIndex = Math.floor(Math.random() * titles.length);
    return titles[randomIndex];
  }

  /**
   * Статистика запросов
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime
    };
  }
}

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
            if (response.status === 204) {
              resolve(null);
            } else {
              try {
                const data = JSON.parse(response.responseText);
                resolve(data);
              } catch (e) {
                resolve(response.responseText);
              }
            }
          } else {
            logger.error(`API ошибка ${response.status}:`, response.statusText);
            reject(new Error(`API ошибка: ${response.status}`));
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
    const params = new URLSearchParams({
      branch_id: branchId,
      user_data: '1',
      ordering: '-index',
      page: page.toString()
    });

    return this.request(`/api/v2/titles/chapters/?${params.toString()}`);
  }

  /**
   * Получение текущего пользователя
   */
  async getCurrentUser() {
    return this.request('/api/v2/users/current/');
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

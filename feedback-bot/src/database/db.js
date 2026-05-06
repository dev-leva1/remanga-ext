/**
 * Database connection (Singleton)
 */

import pg from 'pg';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

class Database {
  static instance = null;
  static config = null;

  constructor(config = Database.config) {
    if (Database.instance) {
      return Database.instance;
    }

    if (!config || typeof config !== 'object') {
      throw new Error('Database config is not initialized');
    }

    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected database error', { error: err.message });
    });

    Database.instance = this;
  }

  static configure(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid database config');
    }

    if (Database.instance) {
      throw new Error('Database is already initialized');
    }

    Database.config = config;
  }

  static getInstance(config = null) {
    if (config) {
      Database.configure(config);
    }

    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Query error', { text, error: error.message });
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  async close() {
    await this.pool.end();
    logger.info('Database pool closed');
  }
}

export default Database;

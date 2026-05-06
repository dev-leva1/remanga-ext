import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

class MigrationRunner {
  constructor(database, migrationsDirectory = MigrationRunner.defaultMigrationsDirectory()) {
    if (!database || typeof database.getClient !== 'function') {
      throw new Error('MigrationRunner requires a database instance');
    }

    this.database = database;
    this.migrationsDirectory = migrationsDirectory;
  }

  static defaultMigrationsDirectory() {
    const currentFile = fileURLToPath(import.meta.url);
    return path.join(path.dirname(currentFile), 'migrations');
  }

  async run() {
    const client = await this.database.getClient();

    try {
      await client.query('BEGIN');
      await this.ensureMigrationTable(client);

      const migrationFiles = await this.getMigrationFiles();
      let appliedCount = 0;

      for (const migrationFile of migrationFiles) {
        if (await this.applyMigration(client, migrationFile)) {
          appliedCount++;
        }
      }

      await client.query('COMMIT');
      logger.info('Database migrations completed', { applied: appliedCount, total: migrationFiles.length });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Database migration failed', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  async ensureMigrationTable(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  }

  async getMigrationFiles() {
    const entries = await fs.readdir(this.migrationsDirectory, { withFileTypes: true });

    return entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.sql'))
      .map(entry => entry.name)
      .sort((left, right) => left.localeCompare(right));
  }

  async applyMigration(client, migrationFile) {
    const alreadyApplied = await client.query(
      'SELECT 1 FROM schema_migrations WHERE name = $1',
      [migrationFile]
    );

    if (alreadyApplied.rowCount > 0) {
      return false;
    }

    const migrationPath = path.join(this.migrationsDirectory, migrationFile);
    const sql = await fs.readFile(migrationPath, 'utf8');

    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (name) VALUES ($1)',
      [migrationFile]
    );

    logger.info('Database migration applied', { migration: migrationFile });
    return true;
  }
}

export default MigrationRunner;

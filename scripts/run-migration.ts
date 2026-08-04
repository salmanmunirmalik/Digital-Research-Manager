/**
 * Run Database Migration Script
 * Executes the user_ai_content migration
 */

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const projectRoot = join(__dirname, '..');
const envPath = join(projectRoot, '.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0 && !key.startsWith('#')) {
      const value = values.join('=').trim();
      if (value && !process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (error) {
  // .env file not found, use defaults
}

const buildConfig = () => {
  if (process.env.MYSQL_URL) {
    return { uri: process.env.MYSQL_URL };
  }

  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DB || 'digital_research_manager',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || ''
  };
};

async function runMigration() {
  const config = buildConfig();
  const connection = config.uri
    ? await mysql.createConnection(config.uri)
    : await mysql.createConnection(config);

  try {
    const migrationPath = process.env.MIGRATION_FILE
      ? join(projectRoot, process.env.MIGRATION_FILE)
      : join(projectRoot, 'database/migrations/mysql_migration.sql');

    console.log(`🔄 Starting migration: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing migration SQL...');
    await connection.query('START TRANSACTION');
    await connection.query(migrationSQL);
    await connection.query('COMMIT');

    console.log('✅ Migration completed successfully!');
  } catch (error: any) {
    await connection.query('ROLLBACK').catch(() => {});
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration().catch(console.error);


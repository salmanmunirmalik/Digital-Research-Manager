/**
 * Simple Migration Runner using Node.js (CommonJS)
 * Reads MySQL config from environment and runs a migration file.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const buildConfig = () => {
  if (process.env.MYSQL_URL) {
    return { uri: process.env.MYSQL_URL };
  }

  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DB || 'digital_research_manager',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    socketPath: process.env.MYSQL_SOCKET || undefined,
    multipleStatements: true
  };
};

async function runMigration() {
  const config = buildConfig();
  const connection = config.uri
    ? await mysql.createConnection(config.uri)
    : await mysql.createConnection(config);

  try {
    const migrationPath = process.env.MIGRATION_FILE
      ? path.resolve(process.env.MIGRATION_FILE)
      : path.join(__dirname, '../database/migrations/mysql_migration.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exitCode = 1;
      return;
    }

    console.log(`🔄 Starting migration: ${migrationPath}`);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    await connection.query('START TRANSACTION');
    await connection.query(migrationSQL);
    await connection.query('COMMIT');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    await connection.query('ROLLBACK').catch(() => {});
    console.error('❌ Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

runMigration().catch(console.error);

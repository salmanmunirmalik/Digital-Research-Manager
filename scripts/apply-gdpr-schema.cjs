#!/usr/bin/env node
/**
 * Apply GDPR MySQL compliance schema alignment idempotently.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 AS ok FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function ensureColumn(conn, table, column, definition) {
  if (!(await columnExists(conn, table, column))) {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`  + ${table}.${column}`);
  }
}

async function main() {
  const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'researchlab',
    multipleStatements: true,
    socketPath: process.env.MYSQL_SOCKET || undefined
  };

  console.log(`Connecting to MySQL ${config.database}@${config.host}...`);
  const conn = await mysql.createConnection(config);

  const migrationPath = path.join(
    __dirname,
    '..',
    'database',
    'migrations',
    'mysql_gdpr_compliance_alignment.sql'
  );
  let sql = fs.readFileSync(migrationPath, 'utf8');

  // Strip fragile ALTER ADD COLUMN block; apply those idempotently below
  sql = sql.replace(
    /-- Expand audit_logs[\s\S]*?ALTER TABLE audit_logs ADD COLUMN timestamp DATETIME NULL;\n/,
    '-- audit_logs columns applied separately\n'
  );

  await conn.query(sql);
  console.log('Core GDPR migration applied.');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NULL,
      action VARCHAR(255) NULL,
      entity_type VARCHAR(255) NULL,
      entity_id VARCHAR(64) NULL,
      details TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensureColumn(conn, 'audit_logs', 'event_type', 'VARCHAR(100) NULL');
  await ensureColumn(conn, 'audit_logs', 'severity', 'VARCHAR(50) NULL');
  await ensureColumn(conn, 'audit_logs', 'agent_type', 'VARCHAR(100) NULL');
  await ensureColumn(conn, 'audit_logs', 'target', 'VARCHAR(255) NULL');
  await ensureColumn(conn, 'audit_logs', 'target_id', 'VARCHAR(64) NULL');
  await ensureColumn(conn, 'audit_logs', 'status', 'VARCHAR(50) NULL');
  await ensureColumn(conn, 'audit_logs', 'metadata', 'TEXT NULL');
  await ensureColumn(conn, 'audit_logs', 'performance', 'TEXT NULL');
  await ensureColumn(conn, 'audit_logs', 'security', 'TEXT NULL');
  await ensureColumn(conn, 'audit_logs', 'timestamp', 'DATETIME NULL');

  await conn.end();
  console.log('GDPR compliance schema ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

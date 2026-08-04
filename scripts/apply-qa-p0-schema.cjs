/**
 * Safely apply P0 schema alignment against live MySQL.
 * Adds missing columns/tables without IF NOT EXISTS (unsupported on some MySQL builds).
 */
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const buildConfig = () => {
  if (process.env.MYSQL_URL) return { uri: process.env.MYSQL_URL, multipleStatements: true };
  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DB || 'digital_research_manager',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    multipleStatements: true,
  };
};

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].c > 0;
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows[0].c > 0;
}

async function addColumn(conn, table, column, definition) {
  if (await columnExists(conn, table, column)) {
    console.log(`  skip ${table}.${column}`);
    return;
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`  add  ${table}.${column}`);
}

async function run() {
  const config = buildConfig();
  const conn = config.uri
    ? await mysql.createConnection(config.uri)
    : await mysql.createConnection(config);

  console.log('Applying P0 schema alignment...');

  // Labs
  await addColumn(conn, 'labs', 'description', 'TEXT');
  await addColumn(conn, 'labs', 'principal_researcher_id', 'VARCHAR(64)');
  await addColumn(conn, 'labs', 'contact_email', 'VARCHAR(255)');
  await addColumn(conn, 'labs', 'contact_phone', 'VARCHAR(100)');
  await addColumn(conn, 'labs', 'address', 'TEXT');
  await addColumn(conn, 'labs', 'website_url', 'TEXT');
  await addColumn(conn, 'labs', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  // Users
  for (const [col, def] of [
    ['phone', 'VARCHAR(50)'],
    ['department', 'VARCHAR(255)'],
    ['specialization', 'VARCHAR(255)'],
    ['bio', 'TEXT'],
    ['current_position', 'VARCHAR(255)'],
    ['current_institution', 'VARCHAR(255)'],
    ['location', 'VARCHAR(255)'],
    ['timezone', 'VARCHAR(100)'],
    ['profile_visibility', "VARCHAR(100) DEFAULT 'lab'"],
    ['show_email', 'TINYINT(1) DEFAULT 0'],
    ['show_phone', 'TINYINT(1) DEFAULT 0'],
    ['show_location', 'TINYINT(1) DEFAULT 0'],
  ]) {
    await addColumn(conn, 'users', col, def);
  }

  // Inventory
  for (const [col, def] of [
    ['lab_id', 'VARCHAR(64)'],
    ['description', 'TEXT'],
    ['category', 'VARCHAR(255)'],
    ['quantity', 'DECIMAL(12,4)'],
    ['min_quantity', 'DECIMAL(12,4) DEFAULT 0'],
    ['unit', 'VARCHAR(50)'],
    ['expiry_date', 'DATE'],
    ['cost_per_unit', 'DECIMAL(12,2)'],
    ['supplier_contact', 'TEXT'],
    ['storage_conditions', 'TEXT'],
    ['notes', 'TEXT'],
    ['created_by', 'VARCHAR(64)'],
  ]) {
    await addColumn(conn, 'inventory_items', col, def);
  }

  // Instruments
  for (const [col, def] of [
    ['lab_id', 'VARCHAR(64)'],
    ['description', 'TEXT'],
    ['model', 'VARCHAR(255)'],
    ['manufacturer', 'VARCHAR(255)'],
  ]) {
    await addColumn(conn, 'instruments', col, def);
  }

  // Experiments
  for (const [col, def] of [
    ['title', 'VARCHAR(255)'],
    ['description', 'TEXT'],
    ['hypothesis', 'TEXT'],
    ['objectives', 'TEXT'],
    ['methodology', 'TEXT'],
    ['expected_outcomes', 'TEXT'],
    ['status', "VARCHAR(100) DEFAULT 'planning'"],
    ['priority', "VARCHAR(100) DEFAULT 'medium'"],
    ['category', 'VARCHAR(255)'],
    ['estimated_duration', 'INT'],
    ['actual_duration', 'INT DEFAULT 0'],
    ['start_date', 'DATE'],
    ['end_date', 'DATE'],
    ['due_date', 'DATE'],
    ['lab_id', 'VARCHAR(64)'],
    ['researcher_id', 'VARCHAR(64)'],
    ['collaborators', 'TEXT'],
    ['equipment', 'TEXT'],
    ['materials', 'TEXT'],
    ['reagents', 'TEXT'],
    ['safety_requirements', 'TEXT'],
    ['budget', 'DECIMAL(12,2) DEFAULT 0'],
    ['tags', 'TEXT'],
    ['notes', 'TEXT'],
    ['template_id', 'VARCHAR(64)'],
    ['actual_cost', 'DECIMAL(12,2) DEFAULT 0'],
    ['updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
  ]) {
    await addColumn(conn, 'experiments', col, def);
  }

  await conn.query(`UPDATE experiments SET title = name WHERE (title IS NULL OR title = '') AND name IS NOT NULL`);
  // Legacy schema required project_id; tracker creates personal experiments without projects
  try {
    const [cols] = await conn.query("SHOW COLUMNS FROM experiments LIKE 'project_id'");
    if (cols[0] && cols[0].Null === 'NO') {
      await conn.query('ALTER TABLE experiments MODIFY project_id VARCHAR(64) NULL');
      console.log('  project_id nullable');
    }
  } catch (e) { console.log('  project_id check skipped', e.message); }

  const ddl = {
    experiment_templates: `
      CREATE TABLE experiment_templates (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        description TEXT,
        methodology TEXT,
        estimated_duration INT,
        equipment TEXT,
        materials TEXT,
        reagents TEXT,
        safety_requirements TEXT,
        created_by VARCHAR(64),
        is_public TINYINT(1) DEFAULT 1,
        usage_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    experiment_milestones: `
      CREATE TABLE experiment_milestones (
        id VARCHAR(64) PRIMARY KEY,
        experiment_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATE,
        status VARCHAR(100) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_exp_milestones_exp (experiment_id)
      )`,
    experiment_progress_logs: `
      CREATE TABLE experiment_progress_logs (
        id VARCHAR(64) PRIMARY KEY,
        experiment_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        status VARCHAR(100),
        notes TEXT,
        duration_logged INT DEFAULT 0,
        cost_logged DECIMAL(12,2) DEFAULT 0,
        attachments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_exp_progress_exp (experiment_id)
      )`,
    legal_policies: `
      CREATE TABLE legal_policies (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT,
        version VARCHAR(50) DEFAULT '1.0',
        language VARCHAR(10) DEFAULT 'en',
        effective_date DATE,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_legal_policies_type (type, language, is_active)
      )`,
    consents: `
      CREATE TABLE consents (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        anonymous_id VARCHAR(128),
        policy_type VARCHAR(50) NOT NULL,
        policy_id VARCHAR(64),
        granted TINYINT(1) DEFAULT 0,
        source VARCHAR(100),
        ip_address VARCHAR(64),
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_consents_user (user_id)
      )`,
    cookie_consents: `
      CREATE TABLE cookie_consents (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        anonymous_id VARCHAR(128),
        necessary TINYINT(1) DEFAULT 1,
        analytics TINYINT(1) DEFAULT 0,
        marketing TINYINT(1) DEFAULT 0,
        preferences TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
    gdpr_requests: `
      CREATE TABLE gdpr_requests (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        email VARCHAR(255),
        request_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        verification_token VARCHAR(128),
        verified_at DATETIME,
        processed_by_id VARCHAR(64),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
    retention_policies: `
      CREATE TABLE retention_policies (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        data_type VARCHAR(100) NOT NULL,
        retention_period INT NOT NULL,
        action VARCHAR(50) NOT NULL,
        legal_basis VARCHAR(255),
        description TEXT,
        is_active TINYINT(1) DEFAULT 1,
        last_executed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    platform_activities: `
      CREATE TABLE platform_activities (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        activity_type VARCHAR(100) NOT NULL,
        activity_title VARCHAR(255),
        activity_description TEXT,
        activity_data TEXT,
        skills_demonstrated TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_platform_activities_user (user_id)
      )`,
    user_ai_content: `
      CREATE TABLE user_ai_content (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        source_type VARCHAR(100) NOT NULL,
        source_id VARCHAR(64) NOT NULL,
        content_text LONGTEXT,
        processed TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_ai_content_user (user_id),
        INDEX idx_user_ai_content_source (source_type, source_id)
      )`,
  };

  for (const [name, sql] of Object.entries(ddl)) {
    if (await tableExists(conn, name)) {
      console.log(`  skip table ${name}`);
      continue;
    }
    await conn.query(sql);
    console.log(`  create table ${name}`);
  }

  // Seed policies
  const [cookieRows] = await conn.query(
    `SELECT id FROM legal_policies WHERE type = 'cookies' AND language = 'en' AND is_active = 1 LIMIT 1`
  );
  if (cookieRows.length === 0) {
    await conn.query(
      `INSERT INTO legal_policies (id, type, title, content, version, language, effective_date, is_active)
       VALUES (?, 'cookies', 'Cookie Policy', ?, '1.0', 'en', CURDATE(), 1)`,
      [crypto.randomUUID(), 'We use necessary cookies to run Digital Research Manager. Analytics and marketing cookies are optional.']
    );
    console.log('  seed cookies policy');
  }
  const [privacyRows] = await conn.query(
    `SELECT id FROM legal_policies WHERE type = 'privacy' AND language = 'en' AND is_active = 1 LIMIT 1`
  );
  if (privacyRows.length === 0) {
    await conn.query(
      `INSERT INTO legal_policies (id, type, title, content, version, language, effective_date, is_active)
       VALUES (?, 'privacy', 'Privacy Policy', ?, '1.0', 'en', CURDATE(), 1)`,
      [crypto.randomUUID(), 'Digital Research Manager processes account and research data to provide lab collaboration features.']
    );
    console.log('  seed privacy policy');
  }

  console.log('✅ P0 schema alignment complete');
  await conn.end();
}

run().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});

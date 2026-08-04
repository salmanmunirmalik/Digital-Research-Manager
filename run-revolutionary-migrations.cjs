/**
 * Run Revolutionary Features Database Migrations (MySQL)
 * Executes the migration files for revolutionary features.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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

const migrations = [
  '20250121_scientist_passport_enhancement.sql',
  '20250121_service_provider_marketplace.sql',
  '20250121_negative_results_database.sql',
  '20250121_enhanced_project_management_pi_review.sql'
];

async function runMigrations() {
  const config = buildConfig();
  const connection = config.uri
    ? await mysql.createConnection(config.uri)
    : await mysql.createConnection(config);

  console.log('🚀 Starting Revolutionary Features Migrations...\n');

  try {
    await connection.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    for (const migrationFile of migrations) {
      const filePath = path.join(__dirname, 'database', 'migrations', migrationFile);

      console.log(`📄 Running migration: ${migrationFile}`);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ Migration file not found: ${filePath}`);
        continue;
      }

      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await connection.query(sql);
        console.log(`✅ Migration completed: ${migrationFile}\n`);
      } catch (error) {
        console.error(`❌ Migration failed: ${migrationFile}`);
        console.error(`Error: ${error.message}\n`);

        if (error.message.includes('exists')) {
          console.log('⚠️  Tables may already exist, continuing...\n');
        } else {
          throw error;
        }
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration run failed:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

runMigrations();

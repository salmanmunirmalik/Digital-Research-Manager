/**
 * Run Database Migration Script
 * Executes the user_ai_content migration
 */

import { Pool } from 'pg';
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

// Create pool with proper config
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'digital_research_manager'}`,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting migration: user_ai_content...');
    
    // Check if pgvector extension exists
    console.log('📦 Checking for pgvector extension...');
    let hasVector = false;
    try {
      const extResult = await client.query('SELECT * FROM pg_extension WHERE extname = $1', ['vector']);
      hasVector = extResult.rows.length > 0;
      if (!hasVector) {
        // Try to create it
        try {
          await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
          hasVector = true;
          console.log('✅ pgvector extension created');
        } catch (createError: any) {
          console.log('⚠️  pgvector extension not available, using JSONB fallback');
        }
      } else {
        console.log('✅ pgvector extension found');
      }
    } catch (error) {
      console.log('⚠️  Could not check pgvector, using JSONB fallback');
    }
    
    // Read appropriate migration file
    let migrationSQL: string;
    if (hasVector) {
      const migrationPath = join(projectRoot, 'database/migrations/20250125_user_ai_content.sql');
      migrationSQL = readFileSync(migrationPath, 'utf-8');
    } else {
      const migrationPath = join(projectRoot, 'database/migrations/20250125_user_ai_content_fallback.sql');
      migrationSQL = readFileSync(migrationPath, 'utf-8');
    }
    
    // Run migration
    console.log('📝 Executing migration SQL...');
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_ai_content', 'user_content_relationships', 'provider_capabilities')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    // Check provider capabilities
    const providersResult = await client.query('SELECT provider, provider_name FROM provider_capabilities ORDER BY provider');
    console.log('\n🤖 Provider capabilities loaded:');
    providersResult.rows.forEach(row => {
      console.log(`   ✅ ${row.provider_name} (${row.provider})`);
    });
    
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Migration failed:', error.message);
    if (error.code === '28P01') {
      console.error('\n💡 Tip: Check your database credentials in .env file');
    }
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);


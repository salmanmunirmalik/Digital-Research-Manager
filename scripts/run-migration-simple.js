/**
 * Simple Migration Runner using Node.js
 * Reads database config from environment and runs migration
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'digital_research_manager'}`,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting migration: user_ai_content...');
    
    // Read migration file (use fallback version with JSONB)
    const migrationPath = path.join(__dirname, '../database/migrations/20250125_user_ai_content_fallback.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Check if pgvector extension exists
    console.log('📦 Checking for pgvector extension...');
    let hasVector = false;
    try {
      await client.query('SELECT * FROM pg_extension WHERE extname = $1', ['vector']);
      const result = await client.query('SELECT * FROM pg_extension WHERE extname = $1', ['vector']);
      hasVector = result.rows.length > 0;
    } catch (error) {
      hasVector = false;
    }
    
    if (hasVector) {
      console.log('✅ pgvector extension found - using VECTOR type');
      // Use original migration with VECTOR
      const originalPath = path.join(__dirname, '../database/migrations/20250125_user_ai_content.sql');
      const originalSQL = fs.readFileSync(originalPath, 'utf-8');
      await client.query('BEGIN');
      await client.query(originalSQL);
      await client.query('COMMIT');
    } else {
      console.log('⚠️  pgvector not found - using JSONB for embeddings');
      await client.query('BEGIN');
      await client.query(migrationSQL);
      await client.query('COMMIT');
    }
    
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
    const providersResult = await client.query('SELECT provider, provider_name FROM provider_capabilities');
    console.log('\n🤖 Provider capabilities loaded:');
    providersResult.rows.forEach(row => {
      console.log(`   ✅ ${row.provider_name} (${row.provider})`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Migration failed:', error.message);
    if (error.code === '28P01') {
      console.error('\n💡 Tip: Check your database credentials in .env file');
      console.error('   Required: DATABASE_URL or DB_USER, DB_PASSWORD, DB_HOST, DB_NAME');
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);


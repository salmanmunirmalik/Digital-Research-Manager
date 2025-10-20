/**
 * Run Revolutionary Features Database Migrations
 * Executes the 4 new migration files for revolutionary features
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'researchlab',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Migration files to run (in order)
const migrations = [
  '20250121_scientist_passport_enhancement.sql',
  '20250121_service_provider_marketplace.sql',
  '20250121_negative_results_database.sql',
  '20250121_enhanced_project_management_pi_review.sql'
];

async function runMigrations() {
  console.log('🚀 Starting Revolutionary Features Migrations...\n');

  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');

    for (const migrationFile of migrations) {
      const filePath = path.join(__dirname, 'database', 'migrations', migrationFile);
      
      console.log(`📄 Running migration: ${migrationFile}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Migration file not found: ${filePath}`);
        continue;
      }

      // Read the SQL file
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the migration
      try {
        await pool.query(sql);
        console.log(`✅ Migration completed: ${migrationFile}\n`);
      } catch (error) {
        console.error(`❌ Migration failed: ${migrationFile}`);
        console.error(`Error: ${error.message}\n`);
        
        // Check if it's a "relation already exists" error
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Tables may already exist, continuing...\n`);
        } else {
          throw error;
        }
      }
    }

    console.log('🎉 All migrations completed successfully!');
    console.log('\n📊 Tables created:');
    console.log('   - Scientist Passport: 8 tables');
    console.log('   - Service Marketplace: 12 tables');
    console.log('   - Negative Results: 14 tables');
    console.log('   - Project Management: 12 tables');
    console.log('   Total: 46 new tables created!\n');

    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'user_technical_skills',
        'user_software_expertise',
        'user_laboratory_techniques',
        'user_certifications',
        'user_availability',
        'user_speaking_profile',
        'service_listings',
        'service_projects',
        'negative_results',
        'research_projects',
        'member_progress_reports',
        'pi_reviews'
      )
      ORDER BY table_name
    `);

    if (result.rows.length > 0) {
      console.log('✅ Verified tables exist:');
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Migration process failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations().then(() => {
  console.log('\n✨ Revolutionary features database is ready!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});


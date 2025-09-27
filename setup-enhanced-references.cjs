// Database setup script for Enhanced Reference System
// Run this script to create the necessary tables

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'researchlab',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function setupEnhancedReferenceSystem() {
  try {
    console.log('🚀 Setting up Enhanced Reference System database tables...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../database/simple_reference_system.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schemaSQL);
    
    console.log('✅ Enhanced Reference System database setup completed successfully!');
    
    // Verify tables were created
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'reference_collections', 
        'platform_activities', 
        'platform_references', 
        'user_reference_stats', 
        'job_applications', 
        'reference_templates'
      )
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Insert some sample reference templates
    const templates = [
      {
        context_type: 'conference',
        template_text: 'I had the pleasure of meeting {name} at {conference_name} where they presented their work on {research_area}. Their presentation demonstrated strong technical skills and clear communication abilities. I would recommend them for positions requiring expertise in {skills_mentioned}.'
      },
      {
        context_type: 'colleague',
        template_text: 'I worked closely with {name} on {project_description} for {duration}. They showed excellent {skills_mentioned} and contributed significantly to our team\'s success. Their {working_relationship} approach and technical expertise make them a valuable team member.'
      },
      {
        context_type: 'professor',
        template_text: 'I supervised {name} during their {academic_level} studies focusing on {research_area}. They demonstrated exceptional {skills_mentioned} and showed great potential for advanced research. Their work ethic and analytical skills are commendable.'
      },
      {
        context_type: 'boss',
        template_text: 'I managed {name} in my role as {manager_title} at {company_name}. They consistently delivered high-quality work in {skills_mentioned} and showed strong leadership potential. Their {working_relationship} approach and technical expertise make them an asset to any organization.'
      }
    ];
    
    for (const template of templates) {
      await pool.query(`
        INSERT INTO reference_templates (context_type, template_text)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [template.context_type, template.template_text]);
    }
    
    console.log('📝 Sample reference templates inserted');
    
  } catch (error) {
    console.error('❌ Error setting up Enhanced Reference System:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the setup
if (require.main === module) {
  setupEnhancedReferenceSystem()
    .then(() => {
      console.log('🎉 Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupEnhancedReferenceSystem };

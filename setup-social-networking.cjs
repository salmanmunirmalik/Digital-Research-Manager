// Database setup script for Social Networking System
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

async function setupSocialNetworking() {
  try {
    console.log('🚀 Setting up Social Networking System database tables...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../database/social_networking_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schemaSQL);
    
    console.log('✅ Social Networking System database setup completed successfully!');
    
    // Verify tables were created
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'user_social_profiles', 
        'user_connections', 
        'user_follows', 
        'profile_shares', 
        'profile_share_views',
        'networking_events',
        'event_participants',
        'social_activities',
        'activity_likes',
        'activity_comments',
        'user_notifications',
        'user_blocks',
        'user_privacy_settings'
      )
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Create sample networking events
    const sampleEvents = [
      {
        organizer_id: '00000000-0000-0000-0000-000000000001', // Demo user ID
        event_name: 'AI Research Meetup 2024',
        event_description: 'Join us for an exciting meetup on the latest developments in AI research',
        event_type: 'meetup',
        location: 'San Francisco, CA',
        is_virtual: false,
        start_date: new Date('2024-03-15T18:00:00Z'),
        end_date: new Date('2024-03-15T21:00:00Z'),
        is_public: true,
        max_participants: 100,
        registration_required: true
      },
      {
        organizer_id: '00000000-0000-0000-0000-000000000001',
        event_name: 'Machine Learning Conference 2024',
        event_description: 'Annual conference showcasing cutting-edge ML research',
        event_type: 'conference',
        location: 'Virtual',
        is_virtual: true,
        start_date: new Date('2024-06-10T09:00:00Z'),
        end_date: new Date('2024-06-12T17:00:00Z'),
        is_public: true,
        max_participants: 1000,
        registration_required: true
      }
    ];
    
    for (const event of sampleEvents) {
      await pool.query(`
        INSERT INTO networking_events (
          organizer_id, event_name, event_description, event_type, location,
          is_virtual, start_date, end_date, is_public, max_participants, registration_required
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `, [
        event.organizer_id, event.event_name, event.event_description, event.event_type,
        event.location, event.is_virtual, event.start_date, event.end_date,
        event.is_public, event.max_participants, event.registration_required
      ]);
    }
    
    console.log('📅 Sample networking events created');
    
    // Create default privacy settings for existing users
    await pool.query(`
      INSERT INTO user_privacy_settings (user_id)
      SELECT id FROM users
      WHERE id NOT IN (SELECT user_id FROM user_privacy_settings)
    `);
    
    console.log('🔒 Default privacy settings created for existing users');
    
  } catch (error) {
    console.error('❌ Error setting up Social Networking System:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the setup
if (require.main === module) {
  setupSocialNetworking()
    .then(() => {
      console.log('🎉 Social Networking setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Social Networking setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupSocialNetworking };

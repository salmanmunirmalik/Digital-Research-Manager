import pool from './config';
import bcrypt from 'bcrypt';

interface SeedData {
  users: any[];
  labs: any[];
  protocols: any[];
  tasks: any[];
  calendarEvents: any[];
}

class DatabaseSeeder {
  private seedData: SeedData = {
    users: [
      {
        email: 'admin@researchlab.com',
        username: 'admin',
        password_hash: '',
        first_name: 'System',
        last_name: 'Administrator',
        role: 'admin',
        status: 'active',
        email_verified: true
      },
      {
        email: 'dr.smith@university.edu',
        username: 'drsmith',
        password_hash: '',
        first_name: 'Dr. Sarah',
        last_name: 'Smith',
        role: 'principal_researcher',
        status: 'active',
        email_verified: true,
        bio: 'Principal Investigator in Molecular Biology',
        research_interests: ['Molecular Biology', 'Genetics', 'Cell Biology']
      },
      {
        email: 'jane.doe@university.edu',
        username: 'janedoe',
        password_hash: '',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'researcher',
        status: 'active',
        email_verified: true,
        bio: 'Postdoctoral Researcher',
        research_interests: ['Biochemistry', 'Protein Structure']
      },
      {
        email: 'mike.wilson@university.edu',
        username: 'mikewilson',
        password_hash: '',
        first_name: 'Mike',
        last_name: 'Wilson',
        role: 'student',
        status: 'active',
        email_verified: true,
        bio: 'PhD Student in Neuroscience',
        research_interests: ['Neuroscience', 'Electrophysiology']
      }
    ],
    labs: [
      {
        name: 'Molecular Biology Lab',
        description: 'Advanced research in molecular biology and genetics',
        institution: 'University of Science',
        department: 'Department of Biology',
        contact_email: 'molbio@university.edu',
        contact_phone: '+1-555-0123',
        address: '123 Science Building, University Campus'
      },
      {
        name: 'Neuroscience Research Lab',
        description: 'Cutting-edge research in brain function and disorders',
        institution: 'University of Science',
        department: 'Department of Neuroscience',
        contact_email: 'neuro@university.edu',
        contact_phone: '+1-555-0124',
        address: '456 Brain Building, University Campus'
      }
    ],
    protocols: [
      {
        title: 'PCR Amplification Protocol',
        description: 'Standard protocol for polymerase chain reaction',
        category: 'Molecular Biology',
        content: '1. Prepare reaction mix\n2. Add template DNA\n3. Run PCR cycles\n4. Analyze results',
        materials: ['Taq polymerase', 'dNTPs', 'Primers', 'Template DNA'],
        equipment: ['Thermal cycler', 'Microcentrifuge', 'Pipettes'],
        safety_notes: 'Wear gloves and lab coat',
        estimated_duration: 180,
        difficulty_level: 'Beginner',
        tags: ['PCR', 'DNA', 'Amplification'],
        privacy_level: 'lab'
      },
      {
        title: 'Western Blot Protocol',
        description: 'Protein detection and analysis protocol',
        category: 'Biochemistry',
        content: '1. Protein extraction\n2. SDS-PAGE\n3. Transfer to membrane\n4. Antibody incubation\n5. Detection',
        materials: ['SDS-PAGE gel', 'Transfer buffer', 'Primary antibody', 'Secondary antibody'],
        equipment: ['Electrophoresis apparatus', 'Transfer apparatus', 'Imaging system'],
        safety_notes: 'Handle chemicals with care',
        estimated_duration: 480,
        difficulty_level: 'Intermediate',
        tags: ['Protein', 'Western Blot', 'Antibody'],
        privacy_level: 'lab'
      }
    ],
    tasks: [
      {
        title: 'Review PCR results',
        description: 'Analyze and document PCR amplification results',
        priority: 'high',
        status: 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        tags: ['PCR', 'analysis', 'documentation']
      },
      {
        title: 'Prepare lab presentation',
        description: 'Create slides for weekly lab meeting',
        priority: 'medium',
        status: 'in_progress',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        tags: ['presentation', 'meeting', 'slides']
      }
    ],
    calendarEvents: [
      {
        title: 'Weekly Lab Meeting',
        description: 'Discuss progress and plan next steps',
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
        all_day: false,
        event_type: 'meeting',
        location: 'Conference Room A',
        reminder_minutes: 15
      },
      {
        title: 'Equipment Maintenance',
        description: 'Monthly maintenance for PCR machines',
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 7 days + 2 hours
        all_day: false,
        event_type: 'maintenance',
        location: 'Lab B',
        reminder_minutes: 30
      }
    ]
  };

  async seed() {
    try {
      console.log('🌱 Starting database seeding...');
      
      // Hash passwords for users
      for (const user of this.seedData.users) {
        if (user.username === 'admin') {
          user.password_hash = await bcrypt.hash('admin123', 10);
        } else {
          user.password_hash = await bcrypt.hash('password123', 10);
        }
      }

      // Insert users
      console.log('👥 Seeding users...');
      const userIds: string[] = [];
      for (const user of this.seedData.users) {
        // Check if user already exists
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [user.email]
        );
        
        if (existingUser.rows.length > 0) {
          console.log(`⏭️  User ${user.email} already exists, skipping...`);
          userIds.push(existingUser.rows[0].id);
          continue;
        }
        
        const result = await pool.query(`
          INSERT INTO users (email, username, password_hash, first_name, last_name, role, status, email_verified, bio, research_interests)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `, [
          user.email, user.username, user.password_hash, user.first_name, user.last_name,
          user.role, user.status, user.email_verified, user.bio || null, user.research_interests || null
        ]);
        userIds.push(result.rows[0].id);
      }

      // Insert labs
      console.log('🏢 Seeding labs...');
      const labIds: string[] = [];
      for (const lab of this.seedData.labs) {
        const result = await pool.query(`
          INSERT INTO labs (name, description, institution, department, principal_researcher_id, contact_email, contact_phone, address)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [
          lab.name, lab.description, lab.institution, lab.department, userIds[1], // Dr. Smith as PI
          lab.contact_email, lab.contact_phone, lab.address
        ]);
        labIds.push(result.rows[0].id);
      }

      // Add lab members
      console.log('👥 Adding lab members...');
      await pool.query(`
        INSERT INTO lab_members (lab_id, user_id, role, permissions)
        VALUES ($1, $2, $3, $4)
      `, [labIds[0], userIds[1], 'principal_researcher', '{}']);
      
      await pool.query(`
        INSERT INTO lab_members (lab_id, user_id, role, permissions)
        VALUES ($1, $2, $3, $4)
      `, [labIds[0], userIds[2], 'researcher', '{}']);

      // Insert protocols
      console.log('🧪 Seeding protocols...');
      for (const protocol of this.seedData.protocols) {
        await pool.query(`
          INSERT INTO protocols (title, description, category, content, materials, equipment, safety_notes, estimated_duration, difficulty_level, tags, privacy_level, author_id, lab_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          protocol.title, protocol.description, protocol.category, protocol.content,
          protocol.materials, protocol.equipment, protocol.safety_notes, protocol.estimated_duration,
          protocol.difficulty_level, protocol.tags, protocol.privacy_level, userIds[1], labIds[0]
        ]);
      }

      // Insert tasks
      console.log('📋 Seeding tasks...');
      for (const task of this.seedData.tasks) {
        await pool.query(`
          INSERT INTO tasks (title, description, user_id, priority, status, due_date, tags)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          task.title, task.description, userIds[2], task.priority, task.status, task.due_date, task.tags
        ]);
      }

      // Insert calendar events
      console.log('📅 Seeding calendar events...');
      for (const event of this.seedData.calendarEvents) {
        await pool.query(`
          INSERT INTO calendar_events (user_id, title, description, start_time, end_time, all_day, event_type, location, reminder_minutes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          userIds[1], event.title, event.description, event.start_time, event.end_time,
          event.all_day, event.event_type, event.location, event.reminder_minutes
        ]);
      }

      console.log('🎉 Database seeding completed successfully!');
      console.log(`📊 Seeded ${this.seedData.users.length} users, ${this.seedData.labs.length} labs, ${this.seedData.protocols.length} protocols`);
      
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  async close() {
    await pool.end();
  }
}

// CLI usage
const seeder = new DatabaseSeeder();

seeder.seed()
  .then(() => {
    console.log('🚀 Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await seeder.close();
  });

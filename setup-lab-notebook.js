const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/researchlab',
});

async function setupLabNotebook() {
  try {
    console.log('🔧 Setting up Lab Notebook database...');

    // Create lab_notebook_entries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lab_notebook_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('experiment', 'observation', 'protocol', 'analysis', 'idea', 'meeting')),
        status VARCHAR(50) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold', 'failed')),
        priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        objectives TEXT,
        methodology TEXT,
        results TEXT,
        conclusions TEXT,
        next_steps TEXT,
        lab_id UUID NOT NULL,
        project_id UUID,
        tags TEXT[] DEFAULT '{}',
        privacy_level VARCHAR(50) NOT NULL DEFAULT 'lab' CHECK (privacy_level IN ('private', 'lab', 'institution', 'public')),
        author_id UUID NOT NULL,
        estimated_duration INTEGER DEFAULT 0,
        actual_duration INTEGER DEFAULT 0,
        cost DECIMAL(10,2) DEFAULT 0.00,
        equipment_used TEXT[] DEFAULT '{}',
        materials_used TEXT[] DEFAULT '{}',
        safety_notes TEXT,
        references TEXT[] DEFAULT '{}',
        attachments TEXT[] DEFAULT '{}',
        collaborators TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created lab_notebook_entries table');

    // Create lab_notebook_comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lab_notebook_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entry_id UUID NOT NULL,
        user_id UUID NOT NULL,
        comment_text TEXT NOT NULL,
        parent_comment_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created lab_notebook_comments table');

    // Create lab_notebook_milestones table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lab_notebook_milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entry_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATE,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created lab_notebook_milestones table');

    // Create lab_notebook_tags table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lab_notebook_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created lab_notebook_tags table');

    // Insert sample tags
    await pool.query(`
      INSERT INTO lab_notebook_tags (name, description, color) VALUES
        ('PCR', 'Polymerase Chain Reaction experiments', '#EF4444'),
        ('Microscopy', 'Microscopy and imaging studies', '#10B981'),
        ('Data Analysis', 'Statistical and computational analysis', '#3B82F6'),
        ('Protocol', 'Experimental protocols and procedures', '#8B5CF6'),
        ('Results', 'Experimental results and findings', '#F59E0B'),
        ('Ideas', 'Research ideas and hypotheses', '#EC4899'),
        ('Meetings', 'Lab meetings and discussions', '#6B7280')
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Inserted sample tags');

    // Insert sample lab notebook entries
    const sampleEntries = [
      {
        title: 'PCR Optimization for Gene X',
        content: 'Testing different annealing temperatures and primer concentrations to optimize PCR amplification of Gene X.',
        entry_type: 'experiment',
        status: 'completed',
        priority: 'high',
        objectives: 'Find optimal PCR conditions for Gene X amplification',
        methodology: 'PCR with varying annealing temperatures (50-65°C) and primer concentrations (0.1-1.0 μM)',
        results: 'Best results at 58°C annealing temperature with 0.5 μM primer concentration',
        conclusions: 'PCR conditions optimized successfully',
        next_steps: 'Apply optimized conditions to all future Gene X amplifications',
        lab_id: '550e8400-e29b-41d4-a716-446655440000', // Use a valid UUID
        author_id: 'demo-user-123',
        tags: ['PCR', 'Protocol'],
        estimated_duration: 8,
        actual_duration: 6,
        cost: 45.50
      },
      {
        title: 'Microscopy Analysis of Cell Cultures',
        content: 'Analyzing cell morphology and viability using fluorescence microscopy after treatment with compound Y.',
        entry_type: 'observation',
        status: 'in_progress',
        priority: 'medium',
        objectives: 'Assess cell health and morphology post-treatment',
        methodology: 'Fluorescence microscopy with DAPI and live/dead staining',
        results: 'Preliminary results show 85% cell viability, morphology appears normal',
        conclusions: 'Compound Y does not appear to cause significant cell damage',
        next_steps: 'Complete analysis of remaining samples and prepare report',
        lab_id: '550e8400-e29b-41d4-a716-446655440000',
        author_id: 'demo-user-123',
        tags: ['Microscopy', 'Results'],
        estimated_duration: 12,
        actual_duration: 8,
        cost: 120.00
      },
      {
        title: 'New Research Direction: CRISPR Screening',
        content: 'Exploring the possibility of implementing CRISPR screening to identify novel drug targets.',
        entry_type: 'idea',
        status: 'planning',
        priority: 'low',
        objectives: 'Research feasibility and design pilot study',
        methodology: 'Literature review and consultation with CRISPR experts',
        results: 'CRISPR screening appears feasible with our current infrastructure',
        conclusions: 'Worth pursuing as a future research direction',
        next_steps: 'Design pilot study and seek funding',
        lab_id: '550e8400-e29b-41d4-a716-446655440000',
        author_id: 'demo-user-123',
        tags: ['Ideas', 'Protocol'],
        estimated_duration: 40,
        actual_duration: 0,
        cost: 0
      }
    ];

    for (const entry of sampleEntries) {
      await pool.query(`
        INSERT INTO lab_notebook_entries (
          title, content, entry_type, status, priority, objectives, methodology,
          results, conclusions, next_steps, lab_id, author_id, tags,
          estimated_duration, actual_duration, cost
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        entry.title, entry.content, entry.entry_type, entry.status, entry.priority,
        entry.objectives, entry.methodology, entry.results, entry.conclusions,
        entry.next_steps, entry.lab_id, entry.author_id, entry.tags,
        entry.estimated_duration, entry.actual_duration, entry.cost
      ]);
    }
    console.log('✅ Inserted sample lab notebook entries');

    console.log('🎉 Lab Notebook setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up Lab Notebook:', error);
  } finally {
    await pool.end();
  }
}

setupLabNotebook();

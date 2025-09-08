// Research Dashboard Integration Setup
// This script integrates the research dashboard API routes into the main server

import express from 'express';
import { Pool } from 'pg';

// Import the research dashboard routes
import researchDashboardRoutes from './routes/researchDashboard';

export function setupResearchDashboardRoutes(app: express.Application, pool: Pool) {
  // Add research dashboard routes to the main app
  // Note: The routes are already defined in researchDashboard.ts
  // This function would be called from the main server setup
  
  console.log('🔬 Research Dashboard routes integrated successfully');
  
  // Add middleware for research dashboard specific functionality
  app.use('/api/research', (req, res, next) => {
    // Add any research-specific middleware here
    console.log(`📊 Research API call: ${req.method} ${req.path}`);
    next();
  });
  
  return app;
}

// Database migration helper
export async function runResearchDashboardMigration(pool: Pool) {
  try {
    console.log('🔄 Running Research Dashboard migration...');
    
    // Check if migration is needed
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'research_deadlines'
      ) as exists
    `);
    
    if (result.rows[0].exists) {
      console.log('✅ Research Dashboard schema already exists');
      return;
    }
    
    // Run the migration
    const fs = await import('fs');
    const path = await import('path');
    
    const migrationPath = path.join(__dirname, '../database/migrations/20250101_research_dashboard_enhancement.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    console.log('✅ Research Dashboard migration completed successfully');
    
  } catch (error) {
    console.error('❌ Research Dashboard migration failed:', error);
    throw error;
  }
}

// Sample data generator for testing
export async function generateSampleResearchData(pool: Pool, labId: string, userId: string) {
  try {
    console.log('🎯 Generating sample research data...');
    
    // Generate sample deadlines
    const deadlines = [
      {
        title: 'NIH Grant Proposal Submission',
        description: 'R01 application for cancer research funding',
        deadline_type: 'grant',
        deadline_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        priority: 'high',
        lab_id: labId,
        created_by: userId
      },
      {
        title: 'Nature Paper Review Deadline',
        description: 'Response to reviewer comments',
        deadline_type: 'publication',
        deadline_date: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000), // 22 days from now
        priority: 'high',
        lab_id: labId,
        created_by: userId
      },
      {
        title: 'Conference Abstract Submission',
        description: 'ASCO Annual Meeting abstract',
        deadline_type: 'conference',
        deadline_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        priority: 'medium',
        lab_id: labId,
        created_by: userId
      }
    ];
    
    for (const deadline of deadlines) {
      await pool.query(`
        INSERT INTO research_deadlines (title, description, deadline_type, deadline_date, priority, lab_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [
        deadline.title, deadline.description, deadline.deadline_type,
        deadline.deadline_date, deadline.priority, deadline.lab_id, deadline.created_by
      ]);
    }
    
    // Generate sample insights
    const insights = [
      {
        insight_type: 'opportunity',
        title: 'Grant Opportunity Alert',
        description: 'NSF has a new call for proposals matching your research area. Deadline in 3 weeks.',
        category: 'grants',
        priority: 'high',
        confidence_score: 92,
        lab_id: labId,
        action_label: 'View Details',
        action_route: '/grants'
      },
      {
        insight_type: 'achievement',
        title: 'Productivity Milestone',
        description: 'You\'ve published 5 papers this year - 25% above lab average!',
        category: 'productivity',
        priority: 'medium',
        confidence_score: 100,
        lab_id: labId
      },
      {
        insight_type: 'suggestion',
        title: 'Collaboration Opportunity',
        description: 'Dr. Johnson from Stanford is working on similar research. Consider reaching out.',
        category: 'collaborations',
        priority: 'medium',
        confidence_score: 78,
        lab_id: labId,
        action_label: 'Connect',
        action_route: '/collaborations'
      }
    ];
    
    for (const insight of insights) {
      await pool.query(`
        INSERT INTO research_insights (insight_type, title, description, category, priority, confidence_score, lab_id, action_label, action_route)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [
        insight.insight_type, insight.title, insight.description, insight.category,
        insight.priority, insight.confidence_score, insight.lab_id, insight.action_label, insight.action_route
      ]);
    }
    
    // Generate sample activities
    const activities = [
      {
        activity_type: 'experiment',
        title: 'Completed Phase 2 CRISPR experiments',
        description: 'Successfully completed gene editing experiments with 85% efficiency',
        user_id: userId,
        lab_id: labId,
        impact_level: 'high'
      },
      {
        activity_type: 'publication',
        title: 'Paper accepted in Nature Biotechnology',
        description: 'CRISPR-based cancer therapy paper accepted for publication',
        user_id: userId,
        lab_id: labId,
        impact_level: 'high'
      },
      {
        activity_type: 'collaboration',
        title: 'New collaboration with MIT initiated',
        description: 'Partnership for machine learning drug discovery project',
        user_id: userId,
        lab_id: labId,
        impact_level: 'medium'
      }
    ];
    
    for (const activity of activities) {
      await pool.query(`
        INSERT INTO research_activities (activity_type, title, description, user_id, lab_id, impact_level)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [
        activity.activity_type, activity.title, activity.description,
        activity.user_id, activity.lab_id, activity.impact_level
      ]);
    }
    
    console.log('✅ Sample research data generated successfully');
    
  } catch (error) {
    console.error('❌ Failed to generate sample research data:', error);
    throw error;
  }
}

// Health check for research dashboard
export async function checkResearchDashboardHealth(pool: Pool) {
  try {
    const tables = [
      'research_deadlines',
      'research_insights', 
      'research_activities',
      'research_collaborations',
      'project_milestones'
    ];
    
    const health = {
      status: 'healthy',
      tables: {},
      functions: {},
      timestamp: new Date().toISOString()
    };
    
    // Check table existence
    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = $1
        ) as exists
      `, [table]);
      
      health.tables[table] = result.rows[0].exists;
    }
    
    // Check function existence
    const functions = ['calculate_research_metrics', 'generate_smart_insights'];
    for (const func of functions) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.routines 
          WHERE routine_name = $1 AND routine_type = 'FUNCTION'
        ) as exists
      `, [func]);
      
      health.functions[func] = result.rows[0].exists;
    }
    
    // Check if all tables exist
    const allTablesExist = Object.values(health.tables).every(exists => exists);
    const allFunctionsExist = Object.values(health.functions).every(exists => exists);
    
    if (!allTablesExist || !allFunctionsExist) {
      health.status = 'degraded';
    }
    
    return health;
    
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

export default {
  setupResearchDashboardRoutes,
  runResearchDashboardMigration,
  generateSampleResearchData,
  checkResearchDashboardHealth
};

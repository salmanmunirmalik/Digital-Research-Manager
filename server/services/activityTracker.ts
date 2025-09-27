// Platform Activity Integration Hooks
// Automatically track user activities for reference generation

import { pool } from '../index';

// Activity tracking service
export class ActivityTracker {
  
  // Track lab notebook entry
  static async trackLabNotebookEntry(userId: string, entryData: any) {
    try {
      const activityData = {
        entryId: entryData.id,
        title: entryData.title,
        content: entryData.content,
        tags: entryData.tags,
        attachments: entryData.attachments?.length || 0,
        wordCount: entryData.content?.length || 0
      };
      
      const skillsDemonstrated = this.extractSkillsFromContent(entryData.content);
      
      await pool.query(`
        INSERT INTO platform_activities (
          user_id, activity_type, activity_title, activity_description,
          activity_data, skills_demonstrated
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userId,
        'lab_notebook_entry',
        entryData.title || 'Lab Notebook Entry',
        `Lab notebook entry with ${activityData.wordCount} words`,
        JSON.stringify(activityData),
        skillsDemonstrated
      ]);
      
      console.log(`Tracked lab notebook entry for user ${userId}`);
    } catch (error) {
      console.error('Error tracking lab notebook entry:', error);
    }
  }
  
  // Track protocol creation
  static async trackProtocolCreation(userId: string, protocolData: any) {
    try {
      const activityData = {
        protocolId: protocolData.id,
        title: protocolData.title,
        steps: protocolData.steps?.length || 0,
        materials: protocolData.materials?.length || 0,
        complexity: protocolData.complexity || 'medium'
      };
      
      const skillsDemonstrated = this.extractSkillsFromProtocol(protocolData);
      
      await pool.query(`
        INSERT INTO platform_activities (
          user_id, activity_type, activity_title, activity_description,
          activity_data, skills_demonstrated
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userId,
        'protocol_created',
        protocolData.title || 'Protocol Creation',
        `Created protocol with ${activityData.steps} steps and ${activityData.materials} materials`,
        JSON.stringify(activityData),
        skillsDemonstrated
      ]);
      
      console.log(`Tracked protocol creation for user ${userId}`);
    } catch (error) {
      console.error('Error tracking protocol creation:', error);
    }
  }
  
  // Track experiment completion
  static async trackExperimentCompletion(userId: string, experimentData: any) {
    try {
      const activityData = {
        experimentId: experimentData.id,
        title: experimentData.title,
        duration: experimentData.duration,
        results: experimentData.results,
        success: experimentData.success
      };
      
      const skillsDemonstrated = this.extractSkillsFromExperiment(experimentData);
      
      await pool.query(`
        INSERT INTO platform_activities (
          user_id, activity_type, activity_title, activity_description,
          activity_data, skills_demonstrated
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userId,
        'experiment_completed',
        experimentData.title || 'Experiment Completion',
        `Completed experiment with ${experimentData.success ? 'successful' : 'unsuccessful'} results`,
        JSON.stringify(activityData),
        skillsDemonstrated
      ]);
      
      console.log(`Tracked experiment completion for user ${userId}`);
    } catch (error) {
      console.error('Error tracking experiment completion:', error);
    }
  }
  
  // Track collaboration activity
  static async trackCollaboration(userId: string, collaborationData: any) {
    try {
      const activityData = {
        collaborationId: collaborationData.id,
        type: collaborationData.type,
        participants: collaborationData.participants?.length || 0,
        duration: collaborationData.duration,
        outcome: collaborationData.outcome
      };
      
      const skillsDemonstrated = ['collaboration', 'communication', 'teamwork'];
      
      await pool.query(`
        INSERT INTO platform_activities (
          user_id, activity_type, activity_title, activity_description,
          activity_data, skills_demonstrated
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userId,
        'collaboration',
        collaborationData.title || 'Collaboration Activity',
        `Collaborated with ${activityData.participants} participants`,
        JSON.stringify(activityData),
        skillsDemonstrated
      ]);
      
      console.log(`Tracked collaboration for user ${userId}`);
    } catch (error) {
      console.error('Error tracking collaboration:', error);
    }
  }
  
  // Track paper/publication
  static async trackPublication(userId: string, publicationData: any) {
    try {
      const activityData = {
        publicationId: publicationData.id,
        title: publicationData.title,
        journal: publicationData.journal,
        authors: publicationData.authors?.length || 0,
        impactFactor: publicationData.impactFactor,
        status: publicationData.status
      };
      
      const skillsDemonstrated = ['scientific_writing', 'research', 'data_analysis', 'publication'];
      
      await pool.query(`
        INSERT INTO platform_activities (
          user_id, activity_type, activity_title, activity_description,
          activity_data, skills_demonstrated
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userId,
        'paper_published',
        publicationData.title || 'Research Publication',
        `Published paper in ${publicationData.journal || 'journal'}`,
        JSON.stringify(activityData),
        skillsDemonstrated
      ]);
      
      console.log(`Tracked publication for user ${userId}`);
    } catch (error) {
      console.error('Error tracking publication:', error);
    }
  }
  
  // Extract skills from content using simple keyword matching
  static extractSkillsFromContent(content: string): string[] {
    if (!content) return [];
    
    const skillKeywords = {
      'python': ['python', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch'],
      'machine_learning': ['machine learning', 'ml', 'neural network', 'deep learning', 'ai'],
      'data_analysis': ['data analysis', 'statistical analysis', 'regression', 'correlation'],
      'statistics': ['statistics', 'statistical', 'hypothesis', 'p-value', 'significance'],
      'programming': ['code', 'programming', 'algorithm', 'function', 'variable'],
      'research': ['research', 'study', 'investigation', 'experiment', 'hypothesis'],
      'writing': ['writing', 'documentation', 'report', 'paper', 'manuscript'],
      'collaboration': ['collaboration', 'team', 'group', 'meeting', 'discussion'],
      'leadership': ['leadership', 'lead', 'manage', 'supervise', 'coordinate'],
      'problem_solving': ['problem solving', 'solution', 'troubleshoot', 'debug', 'fix']
    };
    
    const contentLower = content.toLowerCase();
    const detectedSkills: string[] = [];
    
    Object.entries(skillKeywords).forEach(([skill, keywords]) => {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        detectedSkills.push(skill);
      }
    });
    
    return detectedSkills;
  }
  
  // Extract skills from protocol
  static extractSkillsFromProtocol(protocolData: any): string[] {
    const skills = ['protocol_design', 'methodology', 'experimental_design'];
    
    if (protocolData.steps && protocolData.steps.length > 10) {
      skills.push('complex_protocols');
    }
    
    if (protocolData.materials && protocolData.materials.length > 5) {
      skills.push('material_management');
    }
    
    return skills;
  }
  
  // Extract skills from experiment
  static extractSkillsFromExperiment(experimentData: any): string[] {
    const skills = ['experimental_execution', 'data_collection'];
    
    if (experimentData.results) {
      skills.push('data_analysis');
    }
    
    if (experimentData.success) {
      skills.push('problem_solving');
    }
    
    return skills;
  }
  
  // Generate activity summary for user
  static async generateActivitySummary(userId: string, periodMonths: number = 12) {
    try {
      const query = `
        SELECT 
          activity_type,
          COUNT(*) as count,
          AVG(complexity_score + innovation_score + collaboration_score + documentation_quality) / 4 as avg_score,
          array_agg(DISTINCT unnest(skills_demonstrated)) as skills
        FROM platform_activities
        WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '${periodMonths} months'
        GROUP BY activity_type
        ORDER BY count DESC
      `;
      
      const result = await pool.query(query, [userId]);
      
      return {
        period: `${periodMonths} months`,
        totalActivities: result.rows.reduce((sum: number, row: any) => sum + parseInt(row.count), 0),
        activityBreakdown: result.rows,
        topSkills: [...new Set(result.rows.flatMap((row: any) => row.skills))].slice(0, 10),
        averageScore: result.rows.reduce((sum: number, row: any) => sum + parseFloat(row.avg_score), 0) / result.rows.length
      };
    } catch (error) {
      console.error('Error generating activity summary:', error);
      return null;
    }
  }
}

// Middleware to automatically track activities
export const trackActivityMiddleware = (activityType: string) => {
  return (req: any, res: any, next: any) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      // Track activity after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        if (userId) {
          switch (activityType) {
            case 'lab_notebook_entry':
              ActivityTracker.trackLabNotebookEntry(userId, req.body);
              break;
            case 'protocol_created':
              ActivityTracker.trackProtocolCreation(userId, req.body);
              break;
            case 'experiment_completed':
              ActivityTracker.trackExperimentCompletion(userId, req.body);
              break;
            case 'collaboration':
              ActivityTracker.trackCollaboration(userId, req.body);
              break;
            case 'paper_published':
              ActivityTracker.trackPublication(userId, req.body);
              break;
          }
        }
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

export default ActivityTracker;

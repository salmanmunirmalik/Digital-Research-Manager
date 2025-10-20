import express from 'express';
import cors from 'cors';
import pool from '../database/config.js';
import AIPresentationService from './aiPresentationService.js';
import AdvancedStatisticalService from './advancedStatsService.js';
import AdvancedAIPresentationService from './advancedAIPresentationService.js';
import EnhancedAIGenerationService from './enhancedAIGenerationService.js';

const app = express();
const PORT = process.env.PORT || 5002;

// CORS setup
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Initialize services
const aiPresentationService = new AIPresentationService();
const advancedStatsService = new AdvancedStatisticalService();
const advancedAIPresentationService = new AdvancedAIPresentationService();
const enhancedAIGenerationService = new EnhancedAIGenerationService();

// Basic authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Basic API endpoints
app.get('/api/data/results', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM research_data LIMIT 10');
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lab Notebook API endpoints
app.get('/api/lab-notebooks', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lab_notebook_entries ORDER BY created_at DESC LIMIT 10');
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/lab-notebooks', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const result = await pool.query(
      'INSERT INTO lab_notebook_entries (title, content, category, tags, user_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [title, content, category, JSON.stringify(tags || []), req.user.user_id]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/lab-notebooks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags } = req.body;
    const result = await pool.query(
      'UPDATE lab_notebook_entries SET title = $1, content = $2, category = $3, tags = $4, updated_at = NOW() WHERE id = $5 AND user_id = $6 RETURNING *',
      [title, content, category, JSON.stringify(tags || []), id, req.user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/lab-notebooks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM lab_notebook_entries WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Presentation endpoints
app.get('/api/presentations/ai/health', authenticateToken, async (req, res) => {
  try {
    const healthStatus = await aiPresentationService.healthCheck();
    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai-presentations/generate', authenticateToken, async (req, res) => {
  try {
    const { prompt, slides } = req.body;
    const presentation = await aiPresentationService.generatePresentation(prompt, slides);
    res.json(presentation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Advanced Stats endpoints
app.get('/api/advanced-stats/health', authenticateToken, async (req, res) => {
  try {
    const healthStatus = await advancedStatsService.healthCheck();
    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advanced-stats/analyze', authenticateToken, async (req, res) => {
  try {
    const { data, analysisType, options } = req.body;
    const result = await advancedStatsService.performAnalysis(data, analysisType, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ADVANCED AI PRESENTATION ROUTES ---

// Get available themes
app.get('/api/presentations/ai/themes', authenticateToken, async (req, res) => {
  try {
    const result = await advancedAIPresentationService.getAvailableThemes();
    res.json(result);
  } catch (error) {
    console.error('Error getting themes:', error);
    res.status(500).json({
      error: 'Failed to get available themes',
      details: error.message
    });
  }
});

// Generate presentation outline
app.post('/api/presentations/ai/outline', authenticateToken, async (req, res) => {
  try {
    const { topic, context, slides = 8, audience = 'research' } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required and must be a string' });
    }

    if (slides < 3 || slides > 20) {
      return res.status(400).json({ error: 'Number of slides must be between 3 and 20' });
    }

    const result = await advancedAIPresentationService.generatePresentationOutline(
      topic, 
      context || '', 
      slides, 
      audience
    );

    res.json(result);
  } catch (error) {
    console.error('Presentation outline generation error:', error);
    res.status(500).json({
      error: 'Failed to generate presentation outline',
      details: error.message
    });
  }
});

// Generate full presentation
app.post('/api/presentations/ai/generate-full', authenticateToken, async (req, res) => {
  try {
    const { topic, context, slides = 8, theme = 'research-professional', audience = 'research' } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required and must be a string' });
    }

    if (slides < 3 || slides > 20) {
      return res.status(400).json({ error: 'Number of slides must be between 3 and 20' });
    }

    const result = await advancedAIPresentationService.generateFullPresentation(
      topic,
      context || '',
      slides,
      theme,
      audience
    );

    res.json(result);
  } catch (error) {
    console.error('Full presentation generation error:', error);
    res.status(500).json({
      error: 'Failed to generate full presentation',
      details: error.message
    });
  }
});

// Improve slide content
app.post('/api/presentations/ai/improve-slide', authenticateToken, async (req, res) => {
  try {
    const { slideId, currentContent, feedback, improvementType = 'general' } = req.body;

    if (!slideId || !currentContent || !feedback) {
      return res.status(400).json({ 
        error: 'slideId, currentContent, and feedback are required' 
      });
    }

    const result = await advancedAIPresentationService.improveSlideContent(
      slideId,
      currentContent,
      feedback,
      improvementType
    );

    res.json(result);
  } catch (error) {
    console.error('Slide content improvement error:', error);
    res.status(500).json({
      error: 'Failed to improve slide content',
      details: error.message
    });
  }
});

// --- ENHANCED AI GENERATION ROUTES ---

// Generate presentation with images
app.post('/api/presentations/ai/generate-with-images', authenticateToken, async (req, res) => {
  try {
    const { topic, context, slides = 8, theme = 'research-professional', audience = 'research' } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required and must be a string' });
    }

    const result = await enhancedAIGenerationService.generatePresentationWithImages(
      topic,
      context || '',
      slides,
      theme,
      audience
    );

    res.json(result);
  } catch (error) {
    console.error('Enhanced presentation generation error:', error);
    res.status(500).json({
      error: 'Failed to generate presentation with images',
      details: error.message
    });
  }
});

// Generate slide image
app.post('/api/presentations/ai/generate-slide-image', authenticateToken, async (req, res) => {
  try {
    const { slideTitle, slideContent, theme = 'research-professional' } = req.body;

    if (!slideTitle || typeof slideTitle !== 'string') {
      return res.status(400).json({ error: 'Slide title is required and must be a string' });
    }

    const result = await enhancedAIGenerationService.generateSlideImage(
      slideTitle,
      slideContent || '',
      theme
    );

    res.json(result);
  } catch (error) {
    console.error('Slide image generation error:', error);
    res.status(500).json({
      error: 'Failed to generate slide image',
      details: error.message
    });
  }
});

// Enhance slide with AI
app.post('/api/presentations/ai/enhance-slide', authenticateToken, async (req, res) => {
  try {
    const { slideTitle, slideContent, enhancementType = 'content' } = req.body;

    if (!slideTitle || !slideContent) {
      return res.status(400).json({ error: 'Slide title and content are required' });
    }

    const result = await enhancedAIGenerationService.enhanceSlideWithAI(
      slideTitle,
      slideContent,
      enhancementType
    );

    res.json(result);
  } catch (error) {
    console.error('Slide enhancement error:', error);
    res.status(500).json({
      error: 'Failed to enhance slide',
      details: error.message
    });
  }
});

// Generate slide variations
app.post('/api/presentations/ai/slide-variations', authenticateToken, async (req, res) => {
  try {
    const { slideTitle, slideContent, variationType = 'alternative' } = req.body;

    if (!slideTitle || !slideContent) {
      return res.status(400).json({ error: 'Slide title and content are required' });
    }

    const result = await enhancedAIGenerationService.generateSlideVariations(
      slideTitle,
      slideContent,
      variationType
    );

    res.json(result);
  } catch (error) {
    console.error('Slide variation generation error:', error);
    res.status(500).json({
      error: 'Failed to generate slide variations',
      details: error.message
    });
  }
});

// Analyze presentation quality
app.post('/api/presentations/ai/analyze-quality', authenticateToken, async (req, res) => {
  try {
    const { presentation } = req.body;

    if (!presentation) {
      return res.status(400).json({ error: 'Presentation data is required' });
    }

    const result = await enhancedAIGenerationService.analyzePresentationQuality(presentation);

    res.json(result);
  } catch (error) {
    console.error('Presentation analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze presentation quality',
      details: error.message
    });
  }
});

// --- ENHANCED STATISTICAL ANALYSIS WORKFLOW ROUTES ---

// Execute workflow
app.post('/api/advanced-stats/execute-workflow', authenticateToken, async (req, res) => {
  try {
    const { nodes, connections, dataSets } = req.body;

    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json({ error: 'Workflow nodes are required' });
    }

    const result = await advancedStatsService.executeWorkflow(nodes, connections, dataSets);

    res.json(result);
  } catch (error) {
    console.error('Workflow execution error:', error);
    res.status(500).json({
      error: 'Failed to execute workflow',
      details: error.message
    });
  }
});

// Save workflow
app.post('/api/advanced-stats/save-workflow', authenticateToken, async (req, res) => {
  try {
    const { name, nodes, connections, metadata } = req.body;

    if (!name || !nodes || !connections) {
      return res.status(400).json({ error: 'Workflow name, nodes, and connections are required' });
    }

    // Save to database (implement as needed)
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Here you would typically save to your database
    console.log('Saving workflow:', { workflowId, name, nodes, connections, metadata });

    res.json({
      success: true,
      workflowId: workflowId,
      message: 'Workflow saved successfully'
    });
  } catch (error) {
    console.error('Workflow save error:', error);
    res.status(500).json({
      error: 'Failed to save workflow',
      details: error.message
    });
  }
});

// Load workflow
app.get('/api/advanced-stats/load-workflow/:workflowId', authenticateToken, async (req, res) => {
  try {
    const { workflowId } = req.params;

    if (!workflowId) {
      return res.status(400).json({ error: 'Workflow ID is required' });
    }

    // Load from database (implement as needed)
    // For now, return a placeholder
    res.json({
      success: true,
      workflow: {
        id: workflowId,
        name: 'Sample Workflow',
        nodes: [],
        connections: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Workflow load error:', error);
    res.status(500).json({
      error: 'Failed to load workflow',
      details: error.message
    });
  }
});

// Export results
app.post('/api/advanced-stats/export-results', authenticateToken, async (req, res) => {
  try {
    const { results, format } = req.body;

    if (!results || !format) {
      return res.status(400).json({ error: 'Results and format are required' });
    }

    let exportData;
    let contentType;
    let filename;

    switch (format) {
      case 'csv':
        exportData = await advancedStatsService.exportResultsToCSV(results);
        contentType = 'text/csv';
        filename = 'analysis_results.csv';
        break;
      case 'excel':
        exportData = await advancedStatsService.exportResultsToExcel(results);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = 'analysis_results.xlsx';
        break;
      case 'json':
        exportData = JSON.stringify(results, null, 2);
        contentType = 'application/json';
        filename = 'analysis_results.json';
        break;
      default:
        return res.status(400).json({ error: 'Unsupported export format' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Failed to export results',
      details: error.message
    });
  }
});

// Get workflow templates
app.get('/api/advanced-stats/workflow-templates', authenticateToken, async (req, res) => {
  try {
    const templates = [
      {
        id: 'basic_analysis',
        name: 'Basic Statistical Analysis',
        description: 'A simple workflow for basic descriptive statistics and visualization',
        nodes: [
          {
            id: 'csv_file_1',
            widgetId: 'csv_file',
            position: { x: 100, y: 100 },
            inputs: { filePath: 'sample_data.csv' },
            outputs: {},
            status: 'idle'
          },
          {
            id: 'data_info_1',
            widgetId: 'data_info',
            position: { x: 300, y: 100 },
            inputs: {},
            outputs: {},
            status: 'idle'
          },
          {
            id: 'descriptive_stats_1',
            widgetId: 'descriptive_stats',
            position: { x: 500, y: 100 },
            inputs: {},
            outputs: {},
            status: 'idle'
          }
        ],
        connections: [
          {
            id: 'conn_1',
            fromNode: 'csv_file_1',
            fromOutput: 'data',
            toNode: 'data_info_1',
            toInput: 'data'
          },
          {
            id: 'conn_2',
            fromNode: 'csv_file_1',
            fromOutput: 'data',
            toNode: 'descriptive_stats_1',
            toInput: 'data'
          }
        ]
      },
      {
        id: 'regression_analysis',
        name: 'Linear Regression Analysis',
        description: 'Complete workflow for linear regression analysis with visualization',
        nodes: [
          {
            id: 'csv_file_2',
            widgetId: 'csv_file',
            position: { x: 100, y: 100 },
            inputs: { filePath: 'regression_data.csv' },
            outputs: {},
            status: 'idle'
          },
          {
            id: 'select_columns_1',
            widgetId: 'select_columns',
            position: { x: 300, y: 100 },
            inputs: { columns: ['feature1', 'feature2', 'target'] },
            outputs: {},
            status: 'idle'
          },
          {
            id: 'linear_regression_1',
            widgetId: 'linear_regression',
            position: { x: 500, y: 100 },
            inputs: { targetColumn: 'target', featureColumns: ['feature1', 'feature2'] },
            outputs: {},
            status: 'idle'
          },
          {
            id: 'scatter_plot_1',
            widgetId: 'scatter_plot',
            position: { x: 700, y: 100 },
            inputs: { xColumn: 'feature1', yColumn: 'target' },
            outputs: {},
            status: 'idle'
          }
        ],
        connections: [
          {
            id: 'conn_3',
            fromNode: 'csv_file_2',
            fromOutput: 'data',
            toNode: 'select_columns_1',
            toInput: 'data'
          },
          {
            id: 'conn_4',
            fromNode: 'select_columns_1',
            fromOutput: 'data',
            toNode: 'linear_regression_1',
            toInput: 'data'
          },
          {
            id: 'conn_5',
            fromNode: 'select_columns_1',
            fromOutput: 'data',
            toNode: 'scatter_plot_1',
            toInput: 'data'
          }
        ]
      }
    ];

    res.json({
      success: true,
      templates: templates
    });
  } catch (error) {
    console.error('Template loading error:', error);
    res.status(500).json({
      error: 'Failed to load workflow templates',
      details: error.message
    });
  }
});

// =================================
// REVOLUTIONARY FEATURES API ROUTES
// =================================

// Import new route modules
import scientistPassportRoutes from './routes/scientistPassport.js';
import serviceMarketplaceRoutes from './routes/serviceMarketplace.js';
import negativeResultsRoutes from './routes/negativeResults.js';

// Simple auth middleware for demo
const demoAuth = (req, res, next) => {
  req.user = {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'demo@researchlab.com',
    username: 'demo_user',
    first_name: 'Demo',
    last_name: 'User',
    role: 'researcher'
  };
  next();
};

// Test endpoint to verify database connection
app.get('/api/test-revolutionary', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM service_categories');
    res.json({ success: true, count: result.rows[0].count, message: 'Revolutionary features database connected!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mount the revolutionary feature routes
app.use('/api/scientist-passport', demoAuth, scientistPassportRoutes);
app.use('/api/services', demoAuth, serviceMarketplaceRoutes);
app.use('/api/negative-results', demoAuth, negativeResultsRoutes);

console.log('✨ Revolutionary features API routes registered:');
console.log('   - /api/scientist-passport');
console.log('   - /api/services');
console.log('   - /api/negative-results');

app.listen(PORT, () => {
  console.log(`Working server running on port ${PORT}`);
  console.log(`✨ Revolutionary Features API available!`);
});

/**
 * AI Training API Routes
 * Personalized AI training for each scientist using RAG
 */

import express from 'express';
import { Pool } from 'pg';
import authenticateToken from '../middleware/auth';
import axios from 'axios';
import { getUserApiKey, getUserDefaultProvider } from './aiProviderKeys';

const router = express.Router();

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

interface OpenAIEmbeddingRequest {
  input: string;
  model: string;
}

interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
}

// Generate embedding using OpenAI or user's provider
async function generateEmbedding(text: string, userId?: string): Promise<number[]> {
  try {
    // Check if user has their own API key
    let apiKey = process.env.OPENAI_API_KEY;
    let endpoint = 'https://api.openai.com/v1/embeddings';
    let model = 'text-embedding-3-small';
    
    if (userId) {
      const defaultProvider = await getUserDefaultProvider(userId, 'embedding');
      const userApiKey = await getUserApiKey(userId, defaultProvider);
      
      if (userApiKey) {
        apiKey = userApiKey;
        
        // Set provider-specific endpoints
        if (defaultProvider === 'google_gemini') {
          endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent';
          model = 'embedding-001';
        }
      }
    }
    
    // For OpenAI
    if (defaultProvider === 'openai' || !userApiKey) {
      const response = await axios.post(
        endpoint,
        {
          input: text,
          model: model
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data[0].embedding;
    }
    
    // For Google Gemini
    if (defaultProvider === 'google_gemini') {
      const response = await axios.post(
        endpoint,
        {
          model: model,
          content: { parts: [{ text: text }] }
        },
        {
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.embedding.values;
    }
    
    throw new Error('Unsupported provider');
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Extract training data from user's content
router.post('/extract-training-data', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { sourceType, content } = req.body;
    
    // Generate embedding
    const embedding = await generateEmbedding(content);
    
    // Store in database
    const result = await pool.query(
      `INSERT INTO ai_training_data (
        user_id, source_type, content, embedding, processed
      ) VALUES ($1, $2, $3, $4, true)
      RETURNING id`,
      [userId, sourceType, content, JSON.stringify(embedding)]
    );
    
    res.json({ 
      success: true,
      id: result.rows[0].id 
    });
  } catch (error) {
    console.error('Error extracting training data:', error);
    res.status(500).json({ error: 'Failed to extract training data' });
  }
});

// Train AI with user's existing data
router.post('/train', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's API key preference
    const defaultProvider = await getUserDefaultProvider(userId, 'embedding');
    const userApiKey = await getUserApiKey(userId, defaultProvider);
    
    if (!userApiKey && !process.env.OPENAI_API_KEY) {
      return res.status(400).json({ 
        error: 'No API key available. Please add your API key in settings.' 
      });
    }
    
    // Get user's content from various sources
    const [papers, notebooks, protocols, researchData] = await Promise.all([
      // Papers
      pool.query(
        `SELECT id, title, abstract, ai_summary 
         FROM papers 
         WHERE user_id = $1 AND (abstract IS NOT NULL OR ai_summary IS NOT NULL)`,
        [userId]
      ),
      
      // Lab notebook entries
      pool.query(
        `SELECT id, title, content, methodology, results, conclusions
         FROM lab_notebook_entries 
         WHERE user_id = $1 AND content IS NOT NULL`,
        [userId]
      ),
      
      // Protocols
      pool.query(
        `SELECT id, title, description, content
         FROM protocols 
         WHERE author_id = $1 AND content IS NOT NULL`,
        [userId]
      ),
      
      // Research data
      pool.query(
        `SELECT id, title, description, methodology, results
         FROM research_data 
         WHERE user_id = $1 AND description IS NOT NULL`,
        [userId]
      )
    ]);
    
    let processedCount = 0;
    
    // Process papers
    for (const paper of papers.rows) {
      const content = [
        paper.title,
        paper.abstract || '',
        paper.ai_summary || ''
      ].filter(Boolean).join('\n\n');
      
      if (content.length > 50) {
        const embedding = await generateEmbedding(content, userId);
        await pool.query(
          `INSERT INTO ai_training_data (
            user_id, source_type, source_id, title, content, embedding, processed
          ) VALUES ($1, 'paper', $2, $3, $4, $5, true)
          ON CONFLICT DO NOTHING`,
          [userId, paper.id, paper.title, content, JSON.stringify(embedding)]
        );
        processedCount++;
      }
    }
    
    // Process notebooks
    for (const entry of notebooks.rows) {
      const content = [
        entry.title,
        entry.content || '',
        entry.methodology || '',
        entry.results || '',
        entry.conclusions || ''
      ].filter(Boolean).join('\n\n');
      
      if (content.length > 50) {
        const embedding = await generateEmbedding(content, userId);
        await pool.query(
          `INSERT INTO ai_training_data (
            user_id, source_type, source_id, title, content, embedding, processed
          ) VALUES ($1, 'notebook_entry', $2, $3, $4, $5, true)
          ON CONFLICT DO NOTHING`,
          [userId, entry.id, entry.title, content, JSON.stringify(embedding)]
        );
        processedCount++;
      }
    }
    
    // Process protocols
    for (const protocol of protocols.rows) {
      const content = [
        protocol.title,
        protocol.description || '',
        protocol.content || ''
      ].filter(Boolean).join('\n\n');
      
      if (content.length > 50) {
        const embedding = await generateEmbedding(content, userId);
        await pool.query(
          `INSERT INTO ai_training_data (
            user_id, source_type, source_id, title, content, embedding, processed
          ) VALUES ($1, 'protocol', $2, $3, $4, $5, true)
          ON CONFLICT DO NOTHING`,
          [userId, protocol.id, protocol.title, content, JSON.stringify(embedding)]
        );
        processedCount++;
      }
    }
    
    // Process research data
    for (const data of researchData.rows) {
      const content = [
        data.title,
        data.description || '',
        data.methodology || '',
        data.results || ''
      ].filter(Boolean).join('\n\n');
      
      if (content.length > 50) {
        const embedding = await generateEmbedding(content, userId);
        await pool.query(
          `INSERT INTO ai_training_data (
            user_id, source_type, source_id, title, content, embedding, processed
          ) VALUES ($1, 'research_data', $2, $3, $4, $5, true)
          ON CONFLICT DO NOTHING`,
          [userId, data.id, data.title, content, JSON.stringify(embedding)]
        );
        processedCount++;
      }
    }
    
    res.json({ 
      success: true,
      processed: processedCount,
      message: `Successfully trained AI with ${processedCount} documents`,
      provider: defaultProvider
    });
  } catch (error) {
    console.error('Error training AI:', error);
    res.status(500).json({ error: 'Failed to train AI' });
  }
});

// Chat with personalized AI
router.post('/chat', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { question, include_context = true } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    let contextText = '';
    
    if (include_context) {
      // Generate embedding for question
      const questionEmbedding = await generateEmbedding(question);
      
      // Find similar content in user's training data
      const trainingData = await pool.query(
        `SELECT id, title, content, embedding
         FROM ai_training_data
         WHERE user_id = $1 AND processed = true
         LIMIT 100`,
        [userId]
      );
      
      // Calculate similarities
      const similarities = trainingData.rows.map(row => ({
        ...row,
        similarity: cosineSimilarity(
          questionEmbedding,
          JSON.parse(row.embedding)
        )
      })).sort((a, b) => b.similarity - a.similarity);
      
      // Get top 5 most relevant contexts
      const topContexts = similarities.slice(0, 5).filter(c => c.similarity > 0.3);
      
      if (topContexts.length > 0) {
        contextText = '\n\n--- Relevant Context from Your Research ---\n\n' +
          topContexts.map(ctx => `Title: ${ctx.title}\n${ctx.content}`).join('\n\n---\n\n');
      }
      
      // Log context retrieval
      await pool.query(
        `INSERT INTO ai_context_logs (
          user_id, question, retrieved_contexts
        ) VALUES ($1, $2, $3)`,
        [userId, question, topContexts.map(c => c.id)]
      );
    }
    
    // Generate AI response (simulated for now)
    // In production, you would call OpenAI's API here
    const systemPrompt = `You are a personalized AI research assistant for a scientist. 
Provide detailed, accurate answers based on the user's research context when available.
Be thorough yet concise.`;

    const userPrompt = contextText 
      ? `${question}\n\n${contextText}`
      : question;

    // For now, return a simulated response
    // TODO: Integrate with actual OpenAI API
    const response = `Based on your question: "${question}"

${contextText ? 'I found relevant information from your research documents above. ' : ''}Here's a comprehensive answer:

This is a simulated AI response. In production, this would integrate with OpenAI's GPT-4 API to provide personalized answers based on your research data.

Key points to consider:
• Research methodology
• Relevant literature
• Best practices
• Common pitfalls to avoid

Would you like me to elaborate on any specific aspect?`;

    // Save conversation
    await pool.query(
      `INSERT INTO ai_training_sessions (
        user_id, training_data
      ) VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE SET
        training_data = jsonb_insert(
          ai_training_sessions.training_data,
          '{-1}',
          $2
        ),
        total_questions = ai_training_sessions.total_questions + 1`,
      [userId, JSON.stringify({ question, response })]
    );
    
    res.json({ 
      answer: response,
      context_used: contextText.length > 0
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Get training status
router.get('/training-status', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const [trainingData, sessions] = await Promise.all([
      pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN source_type = 'paper' THEN 1 END) as papers,
          COUNT(CASE WHEN source_type = 'notebook_entry' THEN 1 END) as notebooks,
          COUNT(CASE WHEN source_type = 'protocol' THEN 1 END) as protocols,
          COUNT(CASE WHEN source_type = 'research_data' THEN 1 END) as research_data,
          COUNT(CASE WHEN source_type = 'negative_result' THEN 1 END) as negative_results
         FROM ai_training_data
         WHERE user_id = $1 AND processed = true`,
        [userId]
      ),
      
      pool.query(
        `SELECT COUNT(*) as total_questions
         FROM ai_training_sessions
         WHERE user_id = $1`,
        [userId]
      )
    ]);
    
    res.json({
      trained: trainingData.rows[0].total > 0,
      documents: {
        total: parseInt(trainingData.rows[0].total),
        papers: parseInt(trainingData.rows[0].papers),
        notebooks: parseInt(trainingData.rows[0].notebooks),
        protocols: parseInt(trainingData.rows[0].protocols),
        research_data: parseInt(trainingData.rows[0].research_data),
        negative_results: parseInt(trainingData.rows[0].negative_results)
      },
      conversations: parseInt(sessions.rows[0].total_questions)
    });
  } catch (error) {
    console.error('Error getting training status:', error);
    res.status(500).json({ error: 'Failed to get training status' });
  }
});

// Clear training data
router.delete('/clear-training', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    await pool.query(
      `DELETE FROM ai_training_data WHERE user_id = $1`,
      [userId]
    );
    
    res.json({ 
      success: true,
      message: 'Training data cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing training data:', error);
    res.status(500).json({ error: 'Failed to clear training data' });
  }
});

export default router;


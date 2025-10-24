/**
 * Auto-Indexing Utility for AI Learning
 * Automatically indexes user content for AI training
 */

import { Pool } from 'pg';
import axios from 'axios';
import { getUserApiKey, getUserDefaultProvider } from '../routes/aiProviderKeys.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Generate embedding using OpenAI or user's provider
async function generateEmbedding(text: string, userId?: string): Promise<number[]> {
  try {
    let apiKey = process.env.OPENAI_API_KEY;
    let endpoint = 'https://api.openai.com/v1/embeddings';
    let model = 'text-embedding-3-small';
    let defaultProvider = 'openai';
    
    if (userId) {
      try {
        defaultProvider = await getUserDefaultProvider(userId, 'embedding') || 'openai';
        const userApiKey = await getUserApiKey(userId, defaultProvider);
        
        if (userApiKey) {
          apiKey = userApiKey;
          
          if (defaultProvider === 'google_gemini') {
            endpoint = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${apiKey}`;
            model = 'embedding-001';
          }
        }
      } catch (error) {
        console.log('Using default embedding provider');
      }
    }
    
    // For OpenAI
    if (defaultProvider === 'openai' || defaultProvider === null) {
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

// Extract content from different data types
function extractContent(data: any, dataType: string): string {
  switch (dataType) {
    case 'lab_notebook_entry':
      return [
        data.title,
        data.content || '',
        data.objectives || '',
        data.methodology || '',
        data.results || '',
        data.conclusions || '',
        data.next_steps || ''
      ].filter(Boolean).join('\n\n');
    
    case 'protocol':
      return [
        data.title,
        data.description || '',
        data.content || ''
      ].filter(Boolean).join('\n\n');
    
    case 'paper':
      return [
        data.title,
        data.abstract || '',
        data.ai_summary || ''
      ].filter(Boolean).join('\n\n');
    
    case 'research_data':
      return [
        data.title,
        data.description || '',
        data.methodology || '',
        data.results || ''
      ].filter(Boolean).join('\n\n');
    
    case 'negative_result':
      return [
        data.title,
        data.description || '',
        data.expected_outcome || '',
        data.actual_outcome || '',
        data.lessons_learned || ''
      ].filter(Boolean).join('\n\n');
    
    default:
      return data.title || data.content || '';
  }
}

/**
 * Auto-index content for AI learning
 */
export async function autoIndexContent(
  userId: string,
  sourceType: string,
  sourceId: string,
  data: any
): Promise<void> {
  try {
    // Check if already indexed
    const existing = await pool.query(
      `SELECT id FROM ai_training_data WHERE user_id = $1 AND source_type = $2 AND source_id = $3`,
      [userId, sourceType, sourceId]
    );
    
    if (existing.rows.length > 0) {
      console.log(`Content already indexed: ${sourceType} ${sourceId}`);
      return;
    }
    
    // Extract content
    const content = extractContent(data, sourceType);
    
    if (!content || content.length < 50) {
      console.log(`Content too short to index: ${sourceType} ${sourceId}`);
      return;
    }
    
    // Generate embedding
    const embedding = await generateEmbedding(content, userId);
    
    // Store in database
    await pool.query(
      `INSERT INTO ai_training_data (
        user_id, source_type, source_id, title, content, embedding, processed
      ) VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT DO NOTHING`,
      [
        userId,
        sourceType,
        sourceId,
        data.title || `Untitled ${sourceType}`,
        content,
        JSON.stringify(embedding)
      ]
    );
    
    console.log(`✅ Auto-indexed: ${sourceType} ${sourceId}`);
  } catch (error) {
    console.error(`Error auto-indexing ${sourceType} ${sourceId}:`, error);
    // Don't throw - just log the error
  }
}

/**
 * Auto-index multiple content items
 */
export async function autoIndexMultiple(
  userId: string,
  sourceType: string,
  items: Array<{ id: string; data: any }>
): Promise<void> {
  for (const item of items) {
    await autoIndexContent(userId, sourceType, item.id, item.data);
  }
}

export default { autoIndexContent, autoIndexMultiple };


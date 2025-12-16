/**
 * AI Provider API Keys Management Routes
 * Allow users to add their own API keys for OpenAI, Gemini, CoPilot, Perplexity, etc.
 */

import express, { type Router } from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const router: Router = express.Router();

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Encryption key (should be in environment variables)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

// Encrypt API key
function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// Decrypt API key
function decryptApiKey(encryptedData: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Get user's API keys
router.get('/keys', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT 
        k.id,
        k.provider,
        k.provider_name,
        k.is_active,
        k.last_used_at,
        k.created_at,
        c.embedding_endpoint,
        c.chat_endpoint
      FROM ai_provider_keys k
      LEFT JOIN ai_provider_configs c ON k.provider = c.provider
      WHERE k.user_id = $1
      ORDER BY k.created_at DESC`,
      [userId]
    );
    
    res.json({ keys: result.rows });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Get supported providers
router.get('/providers', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        provider,
        provider_name,
        supports_embeddings,
        supports_chat,
        embedding_price_per_million,
        chat_price_per_million,
        max_context_length
      FROM ai_provider_configs
      WHERE is_active = true
      ORDER BY provider_name`
    );
    
    res.json({ providers: result.rows });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Add API key
router.post('/keys', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { provider, provider_name, apiKey } = req.body;
    
    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and API key are required' });
    }
    
    // Check if provider config exists, if not create a basic one
    const configCheck = await pool.query(
      'SELECT provider_name FROM ai_provider_configs WHERE provider = $1',
      [provider]
    );
    
    let finalProviderName = provider_name;
    if (configCheck.rows.length === 0) {
      // Provider not in config, insert a basic config
      await pool.query(
        `INSERT INTO ai_provider_configs (provider, provider_name, supports_embeddings, supports_chat, max_context_length)
         VALUES ($1, $2, true, true, 4096)
         ON CONFLICT (provider) DO NOTHING`,
        [provider, provider_name || provider]
      );
      finalProviderName = provider_name || provider;
    } else {
      finalProviderName = configCheck.rows[0].provider_name || provider_name || provider;
    }
    
    // Encrypt API key
    const encryptedKey = encryptApiKey(apiKey);
    
    // Insert or update API key (UPSERT to handle UNIQUE constraint)
    const result = await pool.query(
      `INSERT INTO ai_provider_keys (user_id, provider, provider_name, encrypted_api_key, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (user_id, provider) 
       DO UPDATE SET 
         encrypted_api_key = EXCLUDED.encrypted_api_key,
         provider_name = EXCLUDED.provider_name,
         is_active = true,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, provider, provider_name, is_active, created_at`,
      [userId, provider, finalProviderName, encryptedKey]
    );
    
    res.status(201).json({ key: result.rows[0] });
  } catch (error: any) {
    console.error('Error adding API key:', error);
    res.status(500).json({ error: 'Failed to add API key', details: error.message });
  }
});

// Update API key
router.put('/keys/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { apiKey, is_active } = req.body;
    
    // Verify ownership
    const keyCheck = await pool.query(
      'SELECT id FROM ai_provider_keys WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (keyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    let encryptedKey = null;
    if (apiKey) {
      encryptedKey = encryptApiKey(apiKey);
    }
    
    const result = await pool.query(
      `UPDATE ai_provider_keys 
      SET 
        ${encryptedKey ? 'encrypted_api_key = $1,' : ''}
        is_active = COALESCE($2, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND user_id = $4
      RETURNING id, provider, provider_name, is_active`,
      encryptedKey ? [encryptedKey, is_active, id, userId] : [is_active, id, userId]
    );
    
    res.json({ 
      success: true,
      key: result.rows[0],
      message: 'API key updated successfully'
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// Delete API key
router.delete('/keys/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM ai_provider_keys WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json({ 
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Get user preferences
router.get('/preferences', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM ai_provider_preferences WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create default preferences
      await pool.query(
        `INSERT INTO ai_provider_preferences (user_id) VALUES ($1)`,
        [userId]
      );
      
      const newResult = await pool.query(
        'SELECT * FROM ai_provider_preferences WHERE user_id = $1',
        [userId]
      );
      
      return res.json({ preferences: newResult.rows[0] });
    }
    
    res.json({ preferences: result.rows[0] });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { default_embedding_provider, default_chat_provider, use_platform_default_if_no_key, max_tokens_per_request } = req.body;
    
    const result = await pool.query(
      `UPDATE ai_provider_preferences 
      SET 
        default_embedding_provider = COALESCE($1, default_embedding_provider),
        default_chat_provider = COALESCE($2, default_chat_provider),
        use_platform_default_if_no_key = COALESCE($3, use_platform_default_if_no_key),
        max_tokens_per_request = COALESCE($4, max_tokens_per_request),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $5
      RETURNING *`,
      [default_embedding_provider, default_chat_provider, use_platform_default_if_no_key, max_tokens_per_request, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preferences not found' });
    }
    
    res.json({ 
      success: true,
      preferences: result.rows[0],
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get user's API key for a specific provider
export async function getUserApiKey(userId: string, provider: string): Promise<string | null> {
  try {
    const result = await pool.query(
      'SELECT encrypted_api_key FROM ai_provider_keys WHERE user_id = $1 AND provider = $2 AND is_active = true',
      [userId, provider]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return decryptApiKey(result.rows[0].encrypted_api_key);
  } catch (error) {
    console.error('Error getting user API key:', error);
    return null;
  }
}

// Get user's default provider
export async function getUserDefaultProvider(userId: string, type: 'embedding' | 'chat'): Promise<string> {
  try {
    const result = await pool.query(
      `SELECT 
        default_embedding_provider, 
        default_chat_provider,
        use_platform_default_if_no_key
      FROM ai_provider_preferences WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return 'openai'; // Default to OpenAI
    }
    
    const preferences = result.rows[0];
    const provider = type === 'embedding' ? preferences.default_embedding_provider : preferences.default_chat_provider;
    
    // Check if user has API key for this provider
    const hasKey = await pool.query(
      'SELECT id FROM ai_provider_keys WHERE user_id = $1 AND provider = $2 AND is_active = true',
      [userId, provider]
    );
    
    if (hasKey.rows.length === 0 && preferences.use_platform_default_if_no_key) {
      return 'openai'; // Fallback to platform default
    }
    
    return provider;
  } catch (error) {
    console.error('Error getting user default provider:', error);
    return 'openai';
  }
}

export default router;


-- AI Provider API Keys Management
-- Allow users to add their own API keys for OpenAI, Gemini, CoPilot, Perplexity, etc.

-- AI Provider API Keys Table
CREATE TABLE IF NOT EXISTS ai_provider_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Provider details
    provider VARCHAR(50) NOT NULL, -- 'openai', 'google_gemini', 'anthropic_claude', 'azure_copilot', 'perplexity'
    provider_name VARCHAR(100) NOT NULL,
    
    -- Encrypted API key
    encrypted_api_key TEXT NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, provider)
);

-- AI Provider Usage Log
CREATE TABLE IF NOT EXISTS ai_provider_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    
    -- Usage details
    request_type VARCHAR(50) NOT NULL, -- 'embedding', 'chat', 'completion'
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,6) DEFAULT 0,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Provider Preferences
CREATE TABLE IF NOT EXISTS ai_provider_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Default provider preferences
    default_embedding_provider VARCHAR(50) DEFAULT 'openai',
    default_chat_provider VARCHAR(50) DEFAULT 'openai',
    
    -- Fallback settings
    use_platform_default_if_no_key BOOLEAN DEFAULT true,
    
    -- Rate limiting
    max_tokens_per_request INTEGER DEFAULT 2000,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_provider_keys_user_id ON ai_provider_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_provider_keys_provider ON ai_provider_keys(provider);
CREATE INDEX IF NOT EXISTS idx_ai_provider_keys_active ON ai_provider_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_user_id ON ai_provider_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_provider ON ai_provider_usage(provider);
CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_created_at ON ai_provider_usage(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_provider_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_provider_keys_updated_at BEFORE UPDATE ON ai_provider_keys
    FOR EACH ROW EXECUTE FUNCTION update_ai_provider_updated_at();

CREATE TRIGGER update_ai_provider_preferences_updated_at BEFORE UPDATE ON ai_provider_preferences
    FOR EACH ROW EXECUTE FUNCTION update_ai_provider_updated_at();

-- Supported providers with their configurations
CREATE TABLE IF NOT EXISTS ai_provider_configs (
    provider VARCHAR(50) PRIMARY KEY,
    provider_name VARCHAR(100) NOT NULL,
    
    -- API endpoints
    embedding_endpoint VARCHAR(255),
    chat_endpoint VARCHAR(255),
    
    -- Model information
    default_embedding_model VARCHAR(100),
    default_chat_model VARCHAR(100),
    
    -- Pricing (per 1M tokens)
    embedding_price_per_million DECIMAL(10,2),
    chat_price_per_million DECIMAL(10,2),
    
    -- Features
    supports_embeddings BOOLEAN DEFAULT true,
    supports_chat BOOLEAN DEFAULT true,
    max_context_length INTEGER DEFAULT 4096,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default provider configurations
INSERT INTO ai_provider_configs (
    provider, provider_name, 
    embedding_endpoint, chat_endpoint,
    default_embedding_model, default_chat_model,
    embedding_price_per_million, chat_price_per_million,
    supports_embeddings, supports_chat, max_context_length
) VALUES
    ('openai', 'OpenAI', 
     'https://api.openai.com/v1/embeddings', 'https://api.openai.com/v1/chat/completions',
     'text-embedding-3-small', 'gpt-4',
     0.02, 30.00,
     true, true, 8192),
    
    ('google_gemini', 'Google Gemini',
     'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent', 
     'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
     'embedding-001', 'gemini-pro',
     0.10, 0.50,
     true, true, 32000),
    
    ('anthropic_claude', 'Anthropic Claude',
     NULL, 'https://api.anthropic.com/v1/messages',
     NULL, 'claude-3-opus',
     0.00, 15.00,
     false, true, 200000),
    
    ('azure_copilot', 'Microsoft Azure CoPilot',
     'https://openai.api.azure.com/openai/deployments/text-embedding-ada-002/embeddings',
     'https://openai.api.azure.com/openai/deployments/gpt-4/chat/completions',
     'text-embedding-ada-002', 'gpt-4',
     0.02, 30.00,
     true, true, 8192),
    
    ('perplexity', 'Perplexity AI',
     NULL, 'https://api.perplexity.ai/chat/completions',
     NULL, 'llama-3.1-sonar-large-128k-online',
     0.00, 0.50,
     false, true, 128000)
ON CONFLICT (provider) DO NOTHING;


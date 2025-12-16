-- User Profile AI-Ready Content System (Fallback - without pgvector)
-- Task 57 & 89: Create system to structure user data for AI consumption
-- Uses JSONB for embeddings if pgvector extension is not available

-- User AI Content Table
CREATE TABLE IF NOT EXISTS user_ai_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content identification
    source_type VARCHAR(50) NOT NULL, -- 'paper', 'notebook', 'protocol', 'experiment', 'data'
    source_id UUID NOT NULL, -- ID of the source record
    
    -- Content data
    title VARCHAR(500),
    content TEXT NOT NULL,
    summary TEXT, -- AI-generated summary
    keywords TEXT[], -- Extracted keywords
    metadata JSONB, -- Additional structured data
    
    -- AI-ready features (using JSONB instead of VECTOR for compatibility)
    embedding JSONB, -- Embedding vector stored as JSON array
    embedding_model VARCHAR(100), -- Model used for embedding
    embedding_provider VARCHAR(50), -- Provider used (openai, google_gemini, etc.)
    
    -- Content relationships
    related_content_ids UUID[], -- IDs of related content
    tags TEXT[], -- User or AI-generated tags
    
    -- Processing status
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    UNIQUE(user_id, source_type, source_id)
);

-- Indexes for semantic search and filtering
CREATE INDEX IF NOT EXISTS idx_user_ai_content_user_id ON user_ai_content(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_content_source_type ON user_ai_content(source_type);
CREATE INDEX IF NOT EXISTS idx_user_ai_content_source_id ON user_ai_content(source_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_content_processed ON user_ai_content(processed);
CREATE INDEX IF NOT EXISTS idx_user_ai_content_tags ON user_ai_content USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_ai_content_keywords ON user_ai_content USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_user_ai_content_embedding ON user_ai_content USING GIN(embedding);

-- Content Relationships Table (for mapping connections)
CREATE TABLE IF NOT EXISTS user_content_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES user_ai_content(id) ON DELETE CASCADE,
    related_content_id UUID REFERENCES user_ai_content(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50), -- 'references', 'cites', 'uses', 'extends', 'similar'
    strength FLOAT DEFAULT 1.0, -- Relationship strength (0-1)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(content_id, related_content_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_content_relationships_content_id ON user_content_relationships(content_id);
CREATE INDEX IF NOT EXISTS idx_content_relationships_related_id ON user_content_relationships(related_content_id);

-- Provider Capabilities Table
-- Task 88: Store AI provider capabilities and best-use cases
CREATE TABLE IF NOT EXISTS provider_capabilities (
    provider VARCHAR(50) PRIMARY KEY,
    provider_name VARCHAR(200) NOT NULL,
    
    -- Capabilities
    supports_chat BOOLEAN DEFAULT true,
    supports_embeddings BOOLEAN DEFAULT false,
    supports_image_generation BOOLEAN DEFAULT false,
    
    -- Strengths (JSON array)
    strengths TEXT[],
    
    -- Best for tasks (JSON array)
    best_for_tasks TEXT[],
    
    -- Technical specs
    max_context_length INTEGER,
    default_chat_model VARCHAR(100),
    default_embedding_model VARCHAR(100),
    
    -- Performance metrics
    speed VARCHAR(20), -- 'fast', 'medium', 'slow'
    cost_tier VARCHAR(20), -- 'low', 'medium', 'high'
    quality_tier VARCHAR(20), -- 'high', 'medium', 'low'
    
    -- Pricing (per million tokens)
    chat_price_per_million DECIMAL(10, 4),
    embedding_price_per_million DECIMAL(10, 4),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default provider capabilities
INSERT INTO provider_capabilities (provider, provider_name, supports_chat, supports_embeddings, supports_image_generation, strengths, best_for_tasks, max_context_length, default_chat_model, default_embedding_model, speed, cost_tier, quality_tier, chat_price_per_million, embedding_price_per_million) VALUES
    ('openai', 'OpenAI', true, true, true, 
     ARRAY['writing', 'code', 'analysis'], 
     ARRAY['content_writing', 'abstract_writing', 'code_generation'],
     128000, 'gpt-4', 'text-embedding-3-small',
     'medium', 'high', 'high', 30.00, 0.13),
    
    ('google_gemini', 'Google Gemini', true, true, false,
     ARRAY['reasoning', 'multimodal', 'research'],
     ARRAY['paper_finding', 'data_analysis', 'idea_generation'],
     1000000, 'gemini-pro', 'embedding-001',
     'fast', 'medium', 'high', 1.25, 0.10),
    
    ('anthropic_claude', 'Anthropic Claude', true, false, false,
     ARRAY['reasoning', 'analysis', 'long_context'],
     ARRAY['proposal_writing', 'data_analysis', 'paper_generation'],
     200000, 'claude-3-opus-20240229', NULL,
     'medium', 'high', 'high', 15.00, NULL),
    
    ('perplexity', 'Perplexity AI', true, false, false,
     ARRAY['search', 'real_time', 'research'],
     ARRAY['paper_finding', 'research', 'summarization'],
     100000, 'llama-3.1-sonar-large-128k-online', NULL,
     'fast', 'medium', 'high', 1.00, NULL)
ON CONFLICT (provider) DO NOTHING;

-- Updated_at trigger for provider_capabilities
CREATE OR REPLACE FUNCTION update_provider_capabilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_provider_capabilities_updated_at_trigger ON provider_capabilities;
CREATE TRIGGER update_provider_capabilities_updated_at_trigger 
    BEFORE UPDATE ON provider_capabilities
    FOR EACH ROW EXECUTE FUNCTION update_provider_capabilities_updated_at();


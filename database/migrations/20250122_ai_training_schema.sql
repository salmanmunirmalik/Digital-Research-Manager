-- AI Training Database Schema
-- Personalized AI training for each scientist using RAG (Retrieval Augmented Generation)

-- AI Training Data Table
CREATE TABLE IF NOT EXISTS ai_training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content source
    source_type VARCHAR(50) NOT NULL, -- 'paper', 'notebook_entry', 'protocol', 'research_data', 'manual_note'
    source_id UUID, -- ID of the source document
    
    -- Content
    title VARCHAR(500),
    content TEXT NOT NULL,
    
    -- Metadata
    category VARCHAR(100),
    tags TEXT[],
    keywords TEXT[],
    
    -- AI-specific
    embedding TEXT, -- Store embedding as JSON string (1536 dimensions from OpenAI)
    processed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Training Sessions (conversations)
CREATE TABLE IF NOT EXISTS ai_training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session data
    session_name VARCHAR(255),
    training_data JSONB, -- Store Q&A pairs
    
    -- Stats
    total_questions INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Context Retrieval Log
CREATE TABLE IF NOT EXISTS ai_context_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    question TEXT NOT NULL,
    retrieved_contexts UUID[],
    response TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Training Preferences
CREATE TABLE IF NOT EXISTS ai_training_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Training settings
    auto_train BOOLEAN DEFAULT true, -- Auto-train when new content is added
    include_papers BOOLEAN DEFAULT true,
    include_notebook BOOLEAN DEFAULT true,
    include_protocols BOOLEAN DEFAULT true,
    include_research_data BOOLEAN DEFAULT true,
    
    -- Response settings
    context_samples INTEGER DEFAULT 5, -- Number of context chunks to use
    creativity_level DECIMAL(3,2) DEFAULT 0.7, -- 0.0 to 1.0
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_training_data_user_id ON ai_training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_source ON ai_training_data(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_category ON ai_training_data(category);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_processed ON ai_training_data(processed);

CREATE INDEX IF NOT EXISTS idx_ai_training_sessions_user_id ON ai_training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_logs_user_id ON ai_context_logs(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_training_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_training_data_updated_at BEFORE UPDATE ON ai_training_data
    FOR EACH ROW EXECUTE FUNCTION update_ai_training_updated_at();

CREATE TRIGGER update_ai_training_sessions_updated_at BEFORE UPDATE ON ai_training_sessions
    FOR EACH ROW EXECUTE FUNCTION update_ai_training_updated_at();

CREATE TRIGGER update_ai_training_preferences_updated_at BEFORE UPDATE ON ai_training_preferences
    FOR EACH ROW EXECUTE FUNCTION update_ai_training_updated_at();


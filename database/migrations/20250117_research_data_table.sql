-- Migration: Add research_data table
-- Date: 2025-01-17
-- Description: Add research_data table for Data & Results functionality

-- Research Data & Results table
CREATE TABLE IF NOT EXISTS research_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'experiment', 'analysis', 'image', 'document', 'protocol', 'code'
    category VARCHAR(50) NOT NULL, -- 'molecular_biology', 'cell_biology', 'biochemistry', 'microbiology', 'bioinformatics', 'other'
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived', 'under_review'
    summary TEXT,
    description TEXT,
    methodology TEXT,
    results TEXT,
    conclusions TEXT,
    tags TEXT[], -- Array of tags
    files JSONB, -- Store file information as JSON
    metadata JSONB, -- Store additional metadata as JSON
    privacy_level VARCHAR(20) DEFAULT 'lab', -- 'personal', 'team', 'lab', 'institution', 'global'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Research Data indexes
CREATE INDEX IF NOT EXISTS idx_research_data_user_id ON research_data(user_id);
CREATE INDEX IF NOT EXISTS idx_research_data_lab_id ON research_data(lab_id);
CREATE INDEX IF NOT EXISTS idx_research_data_type ON research_data(type);
CREATE INDEX IF NOT EXISTS idx_research_data_category ON research_data(category);
CREATE INDEX IF NOT EXISTS idx_research_data_status ON research_data(status);
CREATE INDEX IF NOT EXISTS idx_research_data_created_at ON research_data(created_at);
CREATE INDEX IF NOT EXISTS idx_research_data_tags ON research_data USING GIN(tags);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_research_data_updated_at ON research_data;
CREATE TRIGGER update_research_data_updated_at 
    BEFORE UPDATE ON research_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

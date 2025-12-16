-- Migration: Add lab_notebook_entries table
-- Date: 2025-01-17
-- Description: Add lab_notebook_entries table for Personal NoteBook functionality

-- Personal NoteBook Entries table
CREATE TABLE IF NOT EXISTS lab_notebook_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    entry_type VARCHAR(50) NOT NULL, -- 'experiment', 'observation', 'protocol', 'note', 'sample_management'
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'completed', 'archived'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    objectives TEXT,
    methodology TEXT,
    results TEXT,
    conclusions TEXT,
    next_steps TEXT,
    tags TEXT[], -- Array of tags
    privacy_level VARCHAR(20) DEFAULT 'lab', -- 'personal', 'team', 'lab', 'institution', 'global'
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes
    cost DECIMAL(10,2) DEFAULT 0,
    equipment_used TEXT[],
    materials_used TEXT[],
    safety_notes TEXT,
    references TEXT[],
    collaborators TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personal NoteBook Entries indexes
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_user_id ON lab_notebook_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_lab_id ON lab_notebook_entries(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_type ON lab_notebook_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_status ON lab_notebook_entries(status);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_created_at ON lab_notebook_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_tags ON lab_notebook_entries USING GIN(tags);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lab_notebook_entries_updated_at 
    BEFORE UPDATE ON lab_notebook_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
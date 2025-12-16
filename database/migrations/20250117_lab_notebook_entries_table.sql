-- Migration: Add lab_notebook_entries table
-- Date: 2025-01-17
-- Description: Add lab_notebook_entries table for Personal NoteBook functionality

-- Personal NoteBook Entries table
-- Note: Table may already exist from base schema with author_id column
-- This migration adds missing columns and indexes if they don't exist

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add user_id as alias for author_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_notebook_entries' AND column_name = 'user_id') THEN
        ALTER TABLE lab_notebook_entries ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
        -- Copy author_id to user_id for existing rows
        UPDATE lab_notebook_entries SET user_id = author_id WHERE user_id IS NULL;
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_notebook_entries' AND column_name = 'priority') THEN
        ALTER TABLE lab_notebook_entries ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_notebook_entries' AND column_name = 'objectives') THEN
        ALTER TABLE lab_notebook_entries ADD COLUMN objectives TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_notebook_entries' AND column_name = 'methodology') THEN
        ALTER TABLE lab_notebook_entries ADD COLUMN methodology TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_notebook_entries' AND column_name = 'estimated_duration') THEN
        ALTER TABLE lab_notebook_entries ADD COLUMN estimated_duration INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_notebook_entries' AND column_name = 'actual_duration') THEN
        ALTER TABLE lab_notebook_entries ADD COLUMN actual_duration INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_notebook_entries' AND column_name = 'cost') THEN
        ALTER TABLE lab_notebook_entries ADD COLUMN cost DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_notebook_entries' AND column_name = 'equipment_used') THEN
        ALTER TABLE lab_notebook_entries ADD COLUMN equipment_used TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_notebook_entries' AND column_name = 'materials_used') THEN
        ALTER TABLE lab_notebook_entries ADD COLUMN materials_used TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_notebook_entries' AND column_name = 'reference_list') THEN
        ALTER TABLE lab_notebook_entries ADD COLUMN reference_list TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_notebook_entries' AND column_name = 'collaborators') THEN
        ALTER TABLE lab_notebook_entries ADD COLUMN collaborators TEXT[];
    END IF;
END $$;

-- Personal NoteBook Entries indexes
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_user_id ON lab_notebook_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_author_id ON lab_notebook_entries(author_id);
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

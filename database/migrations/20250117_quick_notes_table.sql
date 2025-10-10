-- Migration: Add quick_notes table
-- Date: 2025-01-17
-- Description: Add quick_notes table for Lab Notebook quick notes functionality

-- Quick Notes table
CREATE TABLE IF NOT EXISTS quick_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    color VARCHAR(20) DEFAULT 'yellow',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quick Notes indexes
CREATE INDEX IF NOT EXISTS idx_quick_notes_user_id ON quick_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_notes_created_at ON quick_notes(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_quick_notes_updated_at ON quick_notes;
CREATE TRIGGER update_quick_notes_updated_at 
    BEFORE UPDATE ON quick_notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

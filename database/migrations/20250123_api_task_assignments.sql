-- API Task Assignments
-- Allow users to assign specific tasks to their configured APIs
-- This makes the system flexible - users control which API handles which task

-- API Task Assignments Table
CREATE TABLE IF NOT EXISTS api_task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES ai_provider_keys(id) ON DELETE CASCADE,
    
    -- Task assignment
    task_type VARCHAR(100) NOT NULL, -- 'paper_finding', 'abstract_writing', 'content_writing', 'image_creation', 'data_analysis', etc.
    task_name VARCHAR(200) NOT NULL, -- Human-readable name
    
    -- Priority (if multiple APIs assigned to same task, use highest priority)
    priority INTEGER DEFAULT 1,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, api_key_id, task_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_task_assignments_user_id ON api_task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_api_task_assignments_task_type ON api_task_assignments(task_type);
CREATE INDEX IF NOT EXISTS idx_api_task_assignments_api_key_id ON api_task_assignments(api_key_id);

-- Common task types (for reference)
-- paper_finding: Find research papers
-- abstract_writing: Write abstracts
-- content_writing: General content writing
-- idea_generation: Generate research ideas
-- proposal_writing: Write proposals
-- data_analysis: Analyze experimental data
-- image_creation: Create images/figures
-- paper_generation: Generate full papers
-- presentation_generation: Generate presentations
-- code_generation: Generate code
-- translation: Translate content
-- summarization: Summarize content


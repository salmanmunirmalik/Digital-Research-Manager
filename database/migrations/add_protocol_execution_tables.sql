-- Protocol Execution Tracking Tables
-- Stores execution data, analytics, and collaboration features

-- Protocol Executions Table
CREATE TABLE IF NOT EXISTS protocol_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
    protocol_title VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    total_duration_ms INTEGER,
    completed_steps JSONB DEFAULT '[]',
    notes JSONB DEFAULT '{}',
    photos JSONB DEFAULT '[]',
    deviations JSONB DEFAULT '{}',
    success BOOLEAN DEFAULT true,
    issues JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Protocol Execution Steps (detailed step tracking)
CREATE TABLE IF NOT EXISTS protocol_execution_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES protocol_executions(id) ON DELETE CASCADE,
    step_id INTEGER NOT NULL,
    step_title VARCHAR(255),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    step_duration_ms INTEGER,
    completed BOOLEAN DEFAULT false,
    notes TEXT,
    photos JSONB DEFAULT '[]',
    deviations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Protocol Comments (collaboration)
CREATE TABLE IF NOT EXISTS protocol_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES protocol_comments(id) ON DELETE CASCADE,
    step_id INTEGER, -- Optional: comment on specific step
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Protocol Versions (version control)
CREATE TABLE IF NOT EXISTS protocol_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
    version_number VARCHAR(20) NOT NULL,
    parent_version_id UUID REFERENCES protocol_versions(id),
    changelog TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(protocol_id, version_number)
);

-- Protocol Forks (user copies/adaptations)
CREATE TABLE IF NOT EXISTS protocol_forks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
    forked_protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
    forked_by UUID REFERENCES users(id),
    fork_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(original_protocol_id, forked_protocol_id)
);

-- Protocol Collaborators (real-time collaboration)
CREATE TABLE IF NOT EXISTS protocol_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'viewer', -- viewer, editor, admin
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP,
    UNIQUE(protocol_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_protocol_executions_protocol_id ON protocol_executions(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_executions_user_id ON protocol_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_protocol_execution_steps_execution_id ON protocol_execution_steps(execution_id);
CREATE INDEX IF NOT EXISTS idx_protocol_comments_protocol_id ON protocol_comments(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_versions_protocol_id ON protocol_versions(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_forks_original_id ON protocol_forks(original_protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_collaborators_protocol_id ON protocol_collaborators(protocol_id);

-- Add execution tracking columns to protocols table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'protocols' AND column_name = 'success_count') THEN
        ALTER TABLE protocols ADD COLUMN success_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'protocols' AND column_name = 'failure_count') THEN
        ALTER TABLE protocols ADD COLUMN failure_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'protocols' AND column_name = 'last_used_at') THEN
        ALTER TABLE protocols ADD COLUMN last_used_at TIMESTAMP;
    END IF;
END $$;


-- Personal NoteBook Database Schema
-- This schema supports comprehensive research documentation with full CRUD operations

-- Personal NoteBook Entries Table
CREATE TABLE IF NOT EXISTS lab_notebook_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('experiment', 'observation', 'protocol', 'analysis', 'idea', 'meeting')),
    status VARCHAR(50) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold', 'failed')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    objectives TEXT,
    methodology TEXT,
    results TEXT,
    conclusions TEXT,
    next_steps TEXT,
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    privacy_level VARCHAR(50) NOT NULL DEFAULT 'lab' CHECK (privacy_level IN ('private', 'lab', 'institution', 'public')),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    estimated_duration INTEGER DEFAULT 0, -- in hours
    actual_duration INTEGER DEFAULT 0, -- in hours
    cost DECIMAL(10,2) DEFAULT 0.00,
    equipment_used TEXT[] DEFAULT '{}',
    materials_used TEXT[] DEFAULT '{}',
    safety_notes TEXT,
    references TEXT[] DEFAULT '{}',
    attachments TEXT[] DEFAULT '{}',
    collaborators TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Personal NoteBook Comments Table
CREATE TABLE IF NOT EXISTS lab_notebook_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES lab_notebook_entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    parent_comment_id UUID REFERENCES lab_notebook_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Personal NoteBook Milestones Table
CREATE TABLE IF NOT EXISTS lab_notebook_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES lab_notebook_entries(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Personal NoteBook Attachments Table
CREATE TABLE IF NOT EXISTS lab_notebook_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES lab_notebook_entries(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Personal NoteBook Tags Table (for better tag management)
CREATE TABLE IF NOT EXISTS lab_notebook_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- hex color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Personal NoteBook Entry Tags Junction Table
CREATE TABLE IF NOT EXISTS lab_notebook_entry_tags (
    entry_id UUID NOT NULL REFERENCES lab_notebook_entries(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES lab_notebook_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (entry_id, tag_id)
);

-- Personal NoteBook Templates Table
CREATE TABLE IF NOT EXISTS lab_notebook_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Personal NoteBook Sharing Table
CREATE TABLE IF NOT EXISTS lab_notebook_sharing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES lab_notebook_entries(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with_lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    permission_level VARCHAR(50) NOT NULL DEFAULT 'read' CHECK (permission_level IN ('read', 'comment', 'edit', 'admin')),
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Personal NoteBook Activity Log Table
CREATE TABLE IF NOT EXISTS lab_notebook_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES lab_notebook_entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_lab_id ON lab_notebook_entries(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_author_id ON lab_notebook_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_status ON lab_notebook_entries(status);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_entry_type ON lab_notebook_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_priority ON lab_notebook_entries(priority);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_created_at ON lab_notebook_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_tags ON lab_notebook_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_privacy ON lab_notebook_entries(privacy_level);

CREATE INDEX IF NOT EXISTS idx_lab_notebook_comments_entry_id ON lab_notebook_comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_comments_user_id ON lab_notebook_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_comments_parent_id ON lab_notebook_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_lab_notebook_milestones_entry_id ON lab_notebook_milestones(entry_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_milestones_due_date ON lab_notebook_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_milestones_completed ON lab_notebook_milestones(completed);

CREATE INDEX IF NOT EXISTS idx_lab_notebook_attachments_entry_id ON lab_notebook_attachments(entry_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_attachments_uploaded_by ON lab_notebook_attachments(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_lab_notebook_sharing_entry_id ON lab_notebook_sharing(entry_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_sharing_shared_with_user ON lab_notebook_sharing(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_sharing_shared_with_lab ON lab_notebook_sharing(shared_with_lab_id);

CREATE INDEX IF NOT EXISTS idx_lab_notebook_activity_log_entry_id ON lab_notebook_activity_log(entry_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_activity_log_user_id ON lab_notebook_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_activity_log_created_at ON lab_notebook_activity_log(created_at);

-- Full-text search index for content
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_content_search ON lab_notebook_entries USING GIN(to_tsvector('english', title || ' ' || content || ' ' || COALESCE(objectives, '') || ' ' || COALESCE(methodology, '') || ' ' || COALESCE(results, '') || ' ' || COALESCE(conclusions, '')));

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lab_notebook_entries_updated_at BEFORE UPDATE ON lab_notebook_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_notebook_comments_updated_at BEFORE UPDATE ON lab_notebook_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_notebook_milestones_updated_at BEFORE UPDATE ON lab_notebook_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_notebook_templates_updated_at BEFORE UPDATE ON lab_notebook_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_lab_notebook_activity(
    p_entry_id UUID,
    p_user_id UUID,
    p_action VARCHAR(100),
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO lab_notebook_activity_log (entry_id, user_id, action, details, ip_address, user_agent)
    VALUES (p_entry_id, p_user_id, p_action, p_details, p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql;

-- Function to get entry with related data
CREATE OR REPLACE FUNCTION get_lab_notebook_entry_with_details(p_entry_id UUID)
RETURNS TABLE (
    entry_data JSONB,
    comments_data JSONB,
    milestones_data JSONB,
    attachments_data JSONB,
    tags_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT row_to_json(e.*) FROM lab_notebook_entries e WHERE e.id = p_entry_id)::JSONB as entry_data,
        (SELECT COALESCE(json_agg(row_to_json(c.*)), '[]'::JSON) FROM lab_notebook_comments c WHERE c.entry_id = p_entry_id)::JSONB as comments_data,
        (SELECT COALESCE(json_agg(row_to_json(m.*)), '[]'::JSON) FROM lab_notebook_milestones m WHERE m.entry_id = p_entry_id)::JSONB as milestones_data,
        (SELECT COALESCE(json_agg(row_to_json(a.*)), '[]'::JSON) FROM lab_notebook_attachments a WHERE a.entry_id = p_entry_id)::JSONB as attachments_data,
        (SELECT COALESCE(json_agg(row_to_json(t.*)), '[]'::JSON) FROM lab_notebook_tags t 
         INNER JOIN lab_notebook_entry_tags et ON t.id = et.tag_id 
         WHERE et.entry_id = p_entry_id)::JSONB as tags_data;
END;
$$ LANGUAGE plpgsql;

-- Function to search entries
CREATE OR REPLACE FUNCTION search_lab_notebook_entries(
    p_search_term TEXT,
    p_lab_id UUID DEFAULT NULL,
    p_entry_type VARCHAR(50) DEFAULT NULL,
    p_status VARCHAR(50) DEFAULT NULL,
    p_priority VARCHAR(50) DEFAULT NULL,
    p_privacy_level VARCHAR(50) DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    content TEXT,
    entry_type VARCHAR(50),
    status VARCHAR(50),
    priority VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    author_name TEXT,
    lab_name TEXT,
    tags TEXT[],
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.content,
        e.entry_type,
        e.status,
        e.priority,
        e.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        l.name as lab_name,
        e.tags,
        ts_rank(to_tsvector('english', e.title || ' ' || e.content || ' ' || COALESCE(e.objectives, '') || ' ' || COALESCE(e.methodology, '') || ' ' || COALESCE(e.results, '') || ' ' || COALESCE(e.conclusions, '')), plainto_tsquery('english', p_search_term)) as relevance_score
    FROM lab_notebook_entries e
    INNER JOIN users u ON e.author_id = u.id
    INNER JOIN labs l ON e.lab_id = l.id
    WHERE 
        (p_search_term IS NULL OR to_tsvector('english', e.title || ' ' || e.content || ' ' || COALESCE(e.objectives, '') || ' ' || COALESCE(e.methodology, '') || ' ' || COALESCE(e.results, '') || ' ' || COALESCE(e.conclusions, '')) @@ plainto_tsquery('english', p_search_term))
        AND (p_lab_id IS NULL OR e.lab_id = p_lab_id)
        AND (p_entry_type IS NULL OR e.entry_type = p_entry_type)
        AND (p_status IS NULL OR e.status = p_status)
        AND (p_priority IS NULL OR e.priority = p_priority)
        AND (p_privacy_level IS NULL OR e.privacy_level = p_privacy_level)
    ORDER BY relevance_score DESC NULLS LAST, e.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample tags
INSERT INTO lab_notebook_tags (name, description, color) VALUES
('PCR', 'Polymerase Chain Reaction experiments', '#EF4444'),
('Microscopy', 'Microscopy and imaging studies', '#10B981'),
('Data Analysis', 'Statistical and computational analysis', '#3B82F6'),
('Protocol', 'Experimental protocols and procedures', '#8B5CF6'),
('Results', 'Experimental results and findings', '#F59E0B'),
('Ideas', 'Research ideas and hypotheses', '#EC4899'),
('Meetings', 'Lab meetings and discussions', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;

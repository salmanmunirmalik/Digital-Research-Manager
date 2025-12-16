-- Lab Workspace Database Schema
-- ClickUp-inspired task management system for lab management
-- Hierarchical structure: Workspace > Spaces > Folders > Lists > Tasks

-- Task Priority Enum
CREATE TYPE task_priority AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);

-- Task Status Enum
CREATE TYPE task_status AS ENUM (
    'to_do',
    'in_progress',
    'in_review',
    'done',
    'cancelled'
);

-- View Type Enum
CREATE TYPE view_type AS ENUM (
    'list',
    'board',
    'calendar',
    'gantt',
    'table'
);

-- Lab Workspaces Table (one per lab)
CREATE TABLE IF NOT EXISTS lab_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Lab Workspace',
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1', -- Default indigo
    icon VARCHAR(50),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lab_id)
);

-- Workspace Spaces Table (e.g., "Research Projects", "Operations", "Equipment")
CREATE TABLE IF NOT EXISTS workspace_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES lab_workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50),
    position INTEGER DEFAULT 0, -- For ordering
    is_archived BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workspace Folders Table (optional organization level within spaces)
CREATE TABLE IF NOT EXISTS workspace_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES workspace_spaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#8b5cf6',
    position INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workspace Lists Table (task containers within folders/spaces)
CREATE TABLE IF NOT EXISTS workspace_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID REFERENCES workspace_folders(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES workspace_spaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#10b981',
    position INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workspace Tasks Table (core task management)
CREATE TABLE IF NOT EXISTS workspace_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES lab_workspaces(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES workspace_spaces(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES workspace_folders(id) ON DELETE SET NULL,
    list_id UUID NOT NULL REFERENCES workspace_lists(id) ON DELETE CASCADE,
    
    -- Basic task info
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'to_do',
    priority task_priority DEFAULT 'normal',
    due_date TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    
    -- Assignment
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Organization
    position INTEGER DEFAULT 0, -- For drag-drop ordering within list
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    
    -- Integration with existing systems
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    protocol_id UUID REFERENCES protocols(id) ON DELETE SET NULL,
    inventory_item_id UUID, -- Reference to inventory (no FK to keep flexible)
    instrument_id UUID, -- Reference to instruments (no FK to keep flexible)
    
    -- Progress tracking
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    time_estimated INTEGER, -- Estimated minutes
    time_tracked INTEGER DEFAULT 0, -- Tracked minutes
    
    -- Metadata
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workspace Subtasks Table
CREATE TABLE IF NOT EXISTS workspace_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES workspace_tasks(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    position INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task Assignees Table (many-to-many for multiple assignees)
CREATE TABLE IF NOT EXISTS task_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES workspace_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, user_id)
);

-- Task Comments Table (activity feed)
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES workspace_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE, -- For threaded comments
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task Attachments Table
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES workspace_tasks(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT, -- Size in bytes
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task Dependencies Table
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES workspace_tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES workspace_tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'blocks', -- 'blocks', 'waits_for', 'related_to'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (task_id != depends_on_task_id),
    UNIQUE(task_id, depends_on_task_id)
);

-- Workspace Views Table (saved views)
CREATE TABLE IF NOT EXISTS workspace_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES lab_workspaces(id) ON DELETE CASCADE,
    space_id UUID REFERENCES workspace_spaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    view_type view_type NOT NULL,
    filter_config JSONB DEFAULT '{}', -- Saved filter configuration
    sort_config JSONB DEFAULT '{}', -- Saved sort configuration
    group_by VARCHAR(50), -- Group by status, assignee, priority, etc.
    is_default BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workspace Filters Table (saved filter configurations)
CREATE TABLE IF NOT EXISTS workspace_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES lab_workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    filter_config JSONB NOT NULL, -- Filter criteria
    is_shared BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_spaces_workspace_id ON workspace_spaces(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_folders_space_id ON workspace_folders(space_id);
CREATE INDEX IF NOT EXISTS idx_workspace_lists_space_id ON workspace_lists(space_id);
CREATE INDEX IF NOT EXISTS idx_workspace_lists_folder_id ON workspace_lists(folder_id);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_workspace_id ON workspace_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_space_id ON workspace_tasks(space_id);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_list_id ON workspace_tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_assignee_id ON workspace_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_status ON workspace_tasks(status);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_priority ON workspace_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_due_date ON workspace_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_project_id ON workspace_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_workspace_subtasks_task_id ON workspace_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_workspace_views_workspace_id ON workspace_views(workspace_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_workspace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lab_workspaces_updated_at BEFORE UPDATE ON lab_workspaces
    FOR EACH ROW EXECUTE FUNCTION update_workspace_updated_at();

CREATE TRIGGER update_workspace_spaces_updated_at BEFORE UPDATE ON workspace_spaces
    FOR EACH ROW EXECUTE FUNCTION update_workspace_updated_at();

CREATE TRIGGER update_workspace_folders_updated_at BEFORE UPDATE ON workspace_folders
    FOR EACH ROW EXECUTE FUNCTION update_workspace_updated_at();

CREATE TRIGGER update_workspace_lists_updated_at BEFORE UPDATE ON workspace_lists
    FOR EACH ROW EXECUTE FUNCTION update_workspace_updated_at();

CREATE TRIGGER update_workspace_tasks_updated_at BEFORE UPDATE ON workspace_tasks
    FOR EACH ROW EXECUTE FUNCTION update_workspace_updated_at();

CREATE TRIGGER update_workspace_subtasks_updated_at BEFORE UPDATE ON workspace_subtasks
    FOR EACH ROW EXECUTE FUNCTION update_workspace_updated_at();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
    FOR EACH ROW EXECUTE FUNCTION update_workspace_updated_at();

CREATE TRIGGER update_workspace_views_updated_at BEFORE UPDATE ON workspace_views
    FOR EACH ROW EXECUTE FUNCTION update_workspace_updated_at();

CREATE TRIGGER update_workspace_filters_updated_at BEFORE UPDATE ON workspace_filters
    FOR EACH ROW EXECUTE FUNCTION update_workspace_updated_at();

-- Function to auto-create workspace when lab is created
CREATE OR REPLACE FUNCTION create_lab_workspace()
RETURNS TRIGGER AS $$
DECLARE
    workspace_id UUID;
BEGIN
    -- Create workspace for new lab
    INSERT INTO lab_workspaces (lab_id, name, created_by)
    VALUES (NEW.id, NEW.name || ' Workspace', NEW.principal_researcher_id)
    RETURNING id INTO workspace_id;
    
    -- Create default space
    INSERT INTO workspace_spaces (workspace_id, name, created_by, position)
    VALUES (workspace_id, 'General', NEW.principal_researcher_id, 0);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-create workspace
CREATE TRIGGER auto_create_workspace AFTER INSERT ON labs
    FOR EACH ROW EXECUTE FUNCTION create_lab_workspace();

-- Function to update task completion timestamp
CREATE OR REPLACE FUNCTION update_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'done' AND OLD.status != 'done' THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
        NEW.progress_percentage = 100;
    ELSIF NEW.status != 'done' AND OLD.status = 'done' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_completion_timestamp BEFORE UPDATE ON workspace_tasks
    FOR EACH ROW EXECUTE FUNCTION update_task_completion();



-- Research Dashboard Enhancement Schema
-- Additional tables needed for research-focused dashboard

-- Research Projects Enhancement
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS publications_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS citations_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS funding_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS funding_source VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS funding_end_date DATE;

-- Project Milestones Table
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Research Deadlines Table
CREATE TABLE IF NOT EXISTS research_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline_type VARCHAR(50) NOT NULL CHECK (deadline_type IN ('grant', 'conference', 'publication', 'experiment', 'thesis', 'review', 'milestone')),
    deadline_date DATE NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'submitted', 'completed', 'missed', 'cancelled')),
    related_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    related_lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    reminder_days INTEGER DEFAULT 7, -- Days before deadline to send reminder
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Research Activity Feed Table
CREATE TABLE IF NOT EXISTS research_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('experiment', 'publication', 'collaboration', 'milestone', 'grant', 'conference', 'deadline', 'insight')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    related_entity_type VARCHAR(50), -- 'project', 'deadline', 'collaboration', etc.
    related_entity_id UUID,
    impact_level VARCHAR(20) DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Research Insights Table
CREATE TABLE IF NOT EXISTS research_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('opportunity', 'warning', 'achievement', 'suggestion', 'trend')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('grants', 'collaborations', 'publications', 'productivity', 'trends', 'deadlines')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    action_label VARCHAR(100),
    action_route VARCHAR(255),
    action_type VARCHAR(20) DEFAULT 'navigate' CHECK (action_type IN ('navigate', 'modal', 'external')),
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL means lab-wide insight
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Research Collaborations Table
CREATE TABLE IF NOT EXISTS research_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    collaboration_type VARCHAR(50) NOT NULL CHECK (collaboration_type IN ('internal', 'external', 'industry', 'international')),
    status VARCHAR(50) NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'active', 'completed', 'on_hold', 'cancelled')),
    start_date DATE NOT NULL,
    end_date DATE,
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    lead_researcher_id UUID NOT NULL REFERENCES users(id),
    funding_amount DECIMAL(15,2) DEFAULT 0,
    publications_count INTEGER DEFAULT 0,
    outcomes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Collaboration Partners Table
CREATE TABLE IF NOT EXISTS collaboration_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaboration_id UUID NOT NULL REFERENCES research_collaborations(id) ON DELETE CASCADE,
    partner_name VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    role VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Research Metrics Table (for caching calculated metrics)
CREATE TABLE IF NOT EXISTS research_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('projects', 'experiments', 'publications', 'citations', 'collaboration_score', 'productivity_trend', 'funding')),
    metric_value DECIMAL(15,2) NOT NULL,
    metric_period VARCHAR(20) DEFAULT 'current' CHECK (metric_period IN ('current', 'monthly', 'yearly')),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Research Trends Table
CREATE TABLE IF NOT EXISTS research_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('methodology', 'technology', 'collaboration', 'funding', 'publication')),
    impact_level VARCHAR(20) NOT NULL CHECK (impact_level IN ('low', 'medium', 'high')),
    timeframe VARCHAR(20) NOT NULL CHECK (timeframe IN ('short', 'medium', 'long')),
    relevance_score INTEGER DEFAULT 50 CHECK (relevance_score >= 0 AND relevance_score <= 100),
    sources TEXT[],
    recommendations TEXT[],
    lab_id UUID REFERENCES labs(id) ON DELETE SET NULL, -- NULL means global trend
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_due_date ON project_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_research_deadlines_lab_id ON research_deadlines(lab_id);
CREATE INDEX IF NOT EXISTS idx_research_deadlines_deadline_date ON research_deadlines(deadline_date);
CREATE INDEX IF NOT EXISTS idx_research_deadlines_priority ON research_deadlines(priority);
CREATE INDEX IF NOT EXISTS idx_research_activities_lab_id ON research_activities(lab_id);
CREATE INDEX IF NOT EXISTS idx_research_activities_user_id ON research_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_research_activities_created_at ON research_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_research_insights_lab_id ON research_insights(lab_id);
CREATE INDEX IF NOT EXISTS idx_research_insights_priority ON research_insights(priority);
CREATE INDEX IF NOT EXISTS idx_research_insights_expires_at ON research_insights(expires_at);
CREATE INDEX IF NOT EXISTS idx_research_collaborations_lab_id ON research_collaborations(lab_id);
CREATE INDEX IF NOT EXISTS idx_research_collaborations_status ON research_collaborations(status);
CREATE INDEX IF NOT EXISTS idx_research_metrics_lab_id ON research_metrics(lab_id);
CREATE INDEX IF NOT EXISTS idx_research_metrics_type ON research_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_research_trends_category ON research_trends(category);
CREATE INDEX IF NOT EXISTS idx_research_trends_relevance ON research_trends(relevance_score);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_deadlines_updated_at BEFORE UPDATE ON research_deadlines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_insights_updated_at BEFORE UPDATE ON research_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_collaborations_updated_at BEFORE UPDATE ON research_collaborations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_trends_updated_at BEFORE UPDATE ON research_trends FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

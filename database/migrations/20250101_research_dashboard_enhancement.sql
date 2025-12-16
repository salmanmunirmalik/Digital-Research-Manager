-- Migration: Research Dashboard Enhancement
-- Apply research-focused database structures

-- Run this migration to add research dashboard functionality
-- Execute: psql -d researchlab -f database/research_dashboard_schema.sql

-- Check if migration has already been applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'research_deadlines') THEN
        RAISE NOTICE 'Research dashboard schema already exists. Skipping migration.';
        RETURN;
    END IF;
END $$;

-- Apply the research dashboard schema
-- Create tables for research dashboard functionality

-- Research Deadlines Table
CREATE TABLE IF NOT EXISTS research_deadlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline_type VARCHAR(50) NOT NULL, -- grant, publication, conference, etc.
    deadline_date DATE NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- high, medium, low
    status VARCHAR(50) DEFAULT 'upcoming', -- upcoming, passed, completed
    related_lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Research Insights Table
CREATE TABLE IF NOT EXISTS research_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_type VARCHAR(50) NOT NULL, -- opportunity, warning, suggestion, achievement
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- grants, productivity, collaborations, etc.
    priority VARCHAR(20) DEFAULT 'medium',
    confidence_score INTEGER DEFAULT 0, -- 0-100
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action_label VARCHAR(100),
    action_route VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Research Activities Table
CREATE TABLE IF NOT EXISTS research_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_type VARCHAR(50) NOT NULL, -- experiment, publication, collaboration, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id),
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    impact_level VARCHAR(20) DEFAULT 'medium', -- high, medium, low
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Research Collaborations Table
CREATE TABLE IF NOT EXISTS research_collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    collaboration_type VARCHAR(50) DEFAULT 'external', -- internal, external
    status VARCHAR(50) DEFAULT 'active', -- active, completed, on_hold
    start_date DATE,
    end_date DATE,
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    lead_researcher_id UUID REFERENCES users(id),
    funding_amount DECIMAL(15,2),
    publications_count INTEGER DEFAULT 0,
    outcomes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Collaboration Partners Table
CREATE TABLE IF NOT EXISTS collaboration_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collaboration_id UUID REFERENCES research_collaborations(id) ON DELETE CASCADE,
    partner_name VARCHAR(255),
    institution VARCHAR(255),
    role VARCHAR(100),
    contact_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Research Trends Table
CREATE TABLE IF NOT EXISTS research_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- technology, methodology, funding, etc.
    impact_level VARCHAR(20) DEFAULT 'medium',
    timeframe VARCHAR(50), -- short, medium, long
    relevance_score INTEGER DEFAULT 0, -- 0-100
    sources TEXT[],
    recommendations TEXT[],
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Project Milestones Table (if not exists)
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add progress column to projects if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'progress') THEN
        ALTER TABLE projects ADD COLUMN progress INTEGER DEFAULT 0;
        ALTER TABLE projects ADD COLUMN publications_count INTEGER DEFAULT 0;
        ALTER TABLE projects ADD COLUMN citations_count INTEGER DEFAULT 0;
        ALTER TABLE projects ADD COLUMN funding_amount DECIMAL(15,2);
    END IF;
END $$;

-- Insert sample data for testing (only if baseline lab/user data exists)
DO $SAMPLEDATA$
DECLARE
    labs_exist BOOLEAN;
    users_exist BOOLEAN;
    labs_has_data BOOLEAN;
    users_has_data BOOLEAN;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'labs') INTO labs_exist;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') INTO users_exist;
    
    IF labs_exist AND users_exist THEN
        -- Check if tables have data (using dynamic SQL to avoid parse errors)
        BEGIN
            PERFORM 1 FROM labs LIMIT 1;
            labs_has_data := FOUND;
        EXCEPTION WHEN OTHERS THEN
            labs_has_data := FALSE;
        END;
        
        IF labs_has_data THEN
            BEGIN
                PERFORM 1 FROM users LIMIT 1;
                users_has_data := FOUND;
            EXCEPTION WHEN OTHERS THEN
                users_has_data := FALSE;
            END;
            
            IF users_has_data THEN
        INSERT INTO research_deadlines (title, description, deadline_type, deadline_date, priority, related_lab_id, created_by)
        SELECT 'NIH Grant Proposal Submission', 'R01 application for cancer research funding', 'grant', '2024-04-15', 'high', l.id, u.id
        FROM labs l CROSS JOIN users u LIMIT 1;

        INSERT INTO research_deadlines (title, description, deadline_type, deadline_date, priority, related_lab_id, created_by)
        SELECT 'Nature Paper Review Deadline', 'Response to reviewer comments', 'publication', '2024-04-22', 'high', l.id, u.id
        FROM labs l CROSS JOIN users u LIMIT 1;

        INSERT INTO research_deadlines (title, description, deadline_type, deadline_date, priority, related_lab_id, created_by)
        SELECT 'Conference Abstract Submission', 'ASCO Annual Meeting abstract', 'conference', '2024-05-01', 'medium', l.id, u.id
        FROM labs l CROSS JOIN users u LIMIT 1;

        INSERT INTO research_insights (insight_type, title, description, category, priority, confidence_score, lab_id, action_label, action_route)
        SELECT 'opportunity', 'Grant Opportunity Alert', 'NSF has a new call for proposals matching your CRISPR research area. Deadline in 3 weeks.', 'grants', 'high', 92, l.id, 'View Details', '/grants'
        FROM labs l LIMIT 1;

        INSERT INTO research_insights (insight_type, title, description, category, priority, confidence_score, lab_id)
        SELECT 'achievement', 'Productivity Milestone', 'You''ve published 5 papers this year - 25% above lab average!', 'productivity', 'medium', 100, l.id
        FROM labs l LIMIT 1;

        INSERT INTO research_insights (insight_type, title, description, category, priority, confidence_score, lab_id, action_label, action_route)
        SELECT 'suggestion', 'Collaboration Opportunity', 'Consider reaching out to collaborators working in similar areas.', 'collaborations', 'medium', 78, l.id, 'Connect', '/collaborations'
        FROM labs l LIMIT 1;

        INSERT INTO research_activities (activity_type, title, description, user_id, lab_id, impact_level)
        SELECT 'experiment', 'Completed Phase 2 experiments', 'Successfully completed gene editing experiments with 85% efficiency', u.id, l.id, 'high'
        FROM users u CROSS JOIN labs l LIMIT 1;

        INSERT INTO research_activities (activity_type, title, description, user_id, lab_id, impact_level)
        SELECT 'publication', 'Paper accepted in Nature Biotechnology', 'CRISPR-based cancer therapy paper accepted for publication', u.id, l.id, 'high'
        FROM users u CROSS JOIN labs l LIMIT 1;

        INSERT INTO research_activities (activity_type, title, description, user_id, lab_id, impact_level)
        SELECT 'collaboration', 'New collaboration initiated', 'Partnership for machine learning drug discovery project', u.id, l.id, 'medium'
        FROM users u CROSS JOIN labs l LIMIT 1;

        INSERT INTO research_collaborations (title, description, collaboration_type, status, start_date, end_date, lab_id, lead_researcher_id, funding_amount, publications_count, outcomes)
        SELECT 'Flagship Collaboration', 'Multi-institutional collaboration for next-generation therapies', 'external', 'active', CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE + INTERVAL '365 days', l.id, u.id, 500000, 2, ARRAY['2 publications', '1 patent filed']
        FROM labs l CROSS JOIN users u LIMIT 1;

        INSERT INTO collaboration_partners (collaboration_id, partner_name, institution, role, contact_email)
        SELECT rc.id, 'Dr. Johnson', 'Stanford', 'Co-PI', 'johnson@example.com'
        FROM research_collaborations rc LIMIT 1;

        INSERT INTO research_trends (title, description, category, impact_level, timeframe, relevance_score, sources, recommendations, lab_id)
        SELECT 'AI-Driven Research', 'Machine learning approaches are revolutionizing discovery workflows', 'technology', 'high', 'medium', 95, ARRAY['Nature Reviews', 'Science'], ARRAY['Integrate AI tools', 'Explore funding'], l.id
        FROM labs l LIMIT 1;
            ELSE
                RAISE NOTICE 'Skipping research dashboard sample data (labs/users tables have no data).';
            END IF;
        ELSE
            RAISE NOTICE 'Skipping research dashboard sample data (labs table has no data).';
        END IF;
    ELSE
        RAISE NOTICE 'Skipping research dashboard sample data (labs/users tables not present).';
    END IF;
END $SAMPLEDATA$;

-- Update existing projects with research-specific fields (if progress column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'progress') THEN
        UPDATE projects SET 
            progress = CASE
                WHEN status = 'completed' THEN 100
                WHEN status = 'active' THEN 75
                WHEN status = 'on_hold' THEN 50
                ELSE 25
            END,
            priority = CASE 
                WHEN budget > 100000 THEN 'high'
                WHEN budget > 50000 THEN 'medium'
                ELSE 'low'
            END,
            publications_count = 0,
            citations_count = 0,
            funding_amount = COALESCE(budget, 0)
        WHERE EXISTS (SELECT 1 FROM labs WHERE labs.id = projects.lab_id);
    END IF;
END $$;

-- Add some sample milestones to existing projects (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_milestones') THEN
        INSERT INTO project_milestones (project_id, title, description, due_date, priority)
        SELECT 
            p.id,
            'Initial Research Phase',
            'Complete literature review and initial experiments',
            p.start_date + INTERVAL '1 month',
            'high'
        FROM projects p 
        WHERE EXISTS (SELECT 1 FROM labs WHERE labs.id = p.lab_id)
        LIMIT 3;

        INSERT INTO project_milestones (project_id, title, description, due_date, priority)
        SELECT 
            p.id,
            'Data Analysis Phase',
            'Complete data collection and preliminary analysis',
            p.start_date + INTERVAL '3 months',
            'medium'
        FROM projects p 
        WHERE EXISTS (SELECT 1 FROM labs WHERE labs.id = p.lab_id)
        LIMIT 3;

        INSERT INTO project_milestones (project_id, title, description, due_date, priority)
        SELECT 
            p.id,
            'Publication Phase',
            'Prepare manuscript for publication',
            p.end_date - INTERVAL '1 month',
            'high'
        FROM projects p 
        WHERE EXISTS (SELECT 1 FROM labs WHERE labs.id = p.lab_id)
        LIMIT 3;
    END IF;
END $$;

-- Create a function to calculate research metrics
CREATE OR REPLACE FUNCTION calculate_research_metrics(p_lab_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalProjects', (SELECT COUNT(*) FROM projects WHERE lab_id = p_lab_id),
        'activeExperiments', (SELECT COUNT(*) FROM lab_notebook_entries WHERE lab_id = p_lab_id AND entry_type = 'experiment' AND status = 'in_progress'),
        'publicationsThisYear', (SELECT COUNT(*) FROM results WHERE lab_id = p_lab_id AND data_type = 'publication' AND created_at >= DATE_TRUNC('year', CURRENT_DATE)),
        'citationsTotal', (SELECT COALESCE(SUM(CAST(metadata->>'citations' AS INTEGER)), 0) FROM results WHERE lab_id = p_lab_id AND data_type = 'publication'),
        'collaborationScore', LEAST(100, (SELECT COUNT(*) FROM research_collaborations WHERE lab_id = p_lab_id AND status = 'active') * 20),
        'productivityTrend', 'up',
        'fundingSecured', (SELECT COALESCE(SUM(funding_amount), 0) FROM research_collaborations WHERE lab_id = p_lab_id AND status = 'active'),
        'grantApplications', (SELECT COUNT(*) FROM research_deadlines WHERE related_lab_id = p_lab_id AND deadline_type = 'grant'),
        'conferencePresentations', (SELECT COUNT(*) FROM research_deadlines WHERE related_lab_id = p_lab_id AND deadline_type = 'conference')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate smart insights
CREATE OR REPLACE FUNCTION generate_smart_insights(p_lab_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    project_count INTEGER;
    deadline_count INTEGER;
    collaboration_count INTEGER;
BEGIN
    -- Count projects without recent activity
    SELECT COUNT(*) INTO project_count
    FROM projects p
    WHERE p.lab_id = p_lab_id 
    AND p.status = 'active'
    AND NOT EXISTS (
        SELECT 1 FROM research_activities ra 
        WHERE ra.project_id = p.id 
        AND ra.created_at > CURRENT_DATE - INTERVAL '30 days'
    );
    
    IF project_count > 0 THEN
        INSERT INTO research_insights (insight_type, title, description, category, priority, confidence_score, lab_id, user_id)
        VALUES ('warning', 'Inactive Projects Alert', project_count || ' projects have no recent activity. Consider updating project status or adding milestones.', 'productivity', 'medium', 85, p_lab_id, p_user_id);
    END IF;
    
    -- Count upcoming high-priority deadlines
    SELECT COUNT(*) INTO deadline_count
    FROM research_deadlines rd
    WHERE rd.related_lab_id = p_lab_id 
    AND rd.priority = 'high' 
    AND rd.status = 'upcoming'
    AND rd.deadline_date <= CURRENT_DATE + INTERVAL '7 days';
    
    IF deadline_count > 0 THEN
        INSERT INTO research_insights (insight_type, title, description, category, priority, confidence_score, lab_id, user_id)
        VALUES ('warning', 'Urgent Deadlines', deadline_count || ' high-priority deadlines are due within 7 days.', 'deadlines', 'high', 100, p_lab_id, p_user_id);
    END IF;
    
    -- Suggest collaboration opportunities
    SELECT COUNT(*) INTO collaboration_count
    FROM research_collaborations rc
    WHERE rc.lab_id = p_lab_id 
    AND rc.status = 'active';
    
    IF collaboration_count < 2 THEN
        INSERT INTO research_insights (insight_type, title, description, category, priority, confidence_score, lab_id, user_id, action_label, action_route)
        VALUES ('suggestion', 'Collaboration Opportunity', 'Consider expanding your collaboration network. Active collaborations can increase research impact and funding opportunities.', 'collaborations', 'medium', 75, p_lab_id, p_user_id, 'Explore Collaborations', '/collaborations');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a view for dashboard data
CREATE OR REPLACE VIEW research_dashboard_data AS
SELECT 
    l.id as lab_id,
    l.name as lab_name,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_projects,
    COUNT(DISTINCT CASE WHEN p.priority = 'high' THEN p.id END) as high_priority_projects,
    COUNT(DISTINCT rd.id) as total_deadlines,
    COUNT(DISTINCT CASE WHEN rd.priority = 'high' AND rd.status = 'upcoming' THEN rd.id END) as urgent_deadlines,
    COUNT(DISTINCT rc.id) as total_collaborations,
    COUNT(DISTINCT CASE WHEN rc.status = 'active' THEN rc.id END) as active_collaborations,
    COUNT(DISTINCT ra.id) as total_activities,
    COUNT(DISTINCT CASE WHEN ra.created_at > CURRENT_DATE - INTERVAL '7 days' THEN ra.id END) as recent_activities,
    COUNT(DISTINCT ri.id) as total_insights,
    COUNT(DISTINCT CASE WHEN ri.is_read = false THEN ri.id END) as unread_insights
FROM labs l
LEFT JOIN projects p ON l.id = p.lab_id
LEFT JOIN research_deadlines rd ON l.id = rd.related_lab_id
LEFT JOIN research_collaborations rc ON l.id = rc.lab_id
LEFT JOIN research_activities ra ON l.id = ra.lab_id
LEFT JOIN research_insights ri ON l.id = ri.lab_id
GROUP BY l.id, l.name;

-- Grant permissions
-- GRANT SELECT ON research_dashboard_data TO authenticated;
-- GRANT EXECUTE ON FUNCTION calculate_research_metrics(UUID) TO authenticated;
-- GRANT EXECUTE ON FUNCTION generate_smart_insights(UUID, UUID) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_lab_status ON projects(lab_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_lab_priority ON projects(lab_id, priority);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_lab_type_status ON lab_notebook_entries(lab_id, entry_type, status);
CREATE INDEX IF NOT EXISTS idx_results_lab_type_created ON results(lab_id, data_type, created_at);

COMMENT ON TABLE research_deadlines IS 'Research deadlines and important dates for grants, conferences, publications, etc.';
COMMENT ON TABLE research_insights IS 'AI-generated insights and recommendations for researchers';
COMMENT ON TABLE research_activities IS 'Activity feed tracking research progress and milestones';
COMMENT ON TABLE research_collaborations IS 'Research collaborations and partnerships';
COMMENT ON TABLE project_milestones IS 'Project milestones and deliverables';
COMMENT ON FUNCTION calculate_research_metrics(UUID) IS 'Calculate real-time research metrics for dashboard';
COMMENT ON FUNCTION generate_smart_insights(UUID, UUID) IS 'Generate smart insights based on lab activity and data';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Research Dashboard Enhancement migration completed successfully!';
    RAISE NOTICE 'Added tables: research_deadlines, research_insights, research_activities, research_collaborations, project_milestones';
    RAISE NOTICE 'Added functions: calculate_research_metrics(), generate_smart_insights()';
    RAISE NOTICE 'Added view: research_dashboard_data';
    RAISE NOTICE 'Sample data inserted for testing.';
END $$;

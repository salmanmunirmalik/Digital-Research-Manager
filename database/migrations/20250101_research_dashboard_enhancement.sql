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
\i database/research_dashboard_schema.sql

-- Insert sample data for testing
INSERT INTO research_deadlines (title, description, deadline_type, deadline_date, priority, lab_id, created_by) VALUES
('NIH Grant Proposal Submission', 'R01 application for cancer research funding', 'grant', '2024-04-15', 'high', 'c8ace470-5e21-4d3b-ab95-da6084311657', 'c8ace470-5e21-4d3b-ab95-da6084311657'),
('Nature Paper Review Deadline', 'Response to reviewer comments', 'publication', '2024-04-22', 'high', 'c8ace470-5e21-4d3b-ab95-da6084311657', 'c8ace470-5e21-4d3b-ab95-da6084311657'),
('Conference Abstract Submission', 'ASCO Annual Meeting abstract', 'conference', '2024-05-01', 'medium', 'c8ace470-5e21-4d3b-ab95-da6084311657', 'c8ace470-5e21-4d3b-ab95-da6084311657');

INSERT INTO research_insights (insight_type, title, description, category, priority, confidence_score, lab_id, action_label, action_route) VALUES
('opportunity', 'Grant Opportunity Alert', 'NSF has a new call for proposals matching your CRISPR research area. Deadline in 3 weeks.', 'grants', 'high', 92, 'c8ace470-5e21-4d3b-ab95-da6084311657', 'View Details', '/grants'),
('achievement', 'Productivity Milestone', 'You''ve published 5 papers this year - 25% above lab average!', 'productivity', 'medium', 100, 'c8ace470-5e21-4d3b-ab95-da6084311657', NULL, NULL),
('suggestion', 'Collaboration Opportunity', 'Dr. Johnson from Stanford is working on similar CRISPR research. Consider reaching out.', 'collaborations', 'medium', 78, 'c8ace470-5e21-4d3b-ab95-da6084311657', 'Connect', '/collaborations');

INSERT INTO research_activities (activity_type, title, description, user_id, lab_id, impact_level) VALUES
('experiment', 'Completed Phase 2 CRISPR experiments', 'Successfully completed gene editing experiments with 85% efficiency', 'c8ace470-5e21-4d3b-ab95-da6084311657', 'c8ace470-5e21-4d3b-ab95-da6084311657', 'high'),
('publication', 'Paper accepted in Nature Biotechnology', 'CRISPR-based cancer therapy paper accepted for publication', 'c8ace470-5e21-4d3b-ab95-da6084311657', 'c8ace470-5e21-4d3b-ab95-da6084311657', 'high'),
('collaboration', 'New collaboration with MIT initiated', 'Partnership for machine learning drug discovery project', 'c8ace470-5e21-4d3b-ab95-da6084311657', 'c8ace470-5e21-4d3b-ab95-da6084311657', 'medium');

INSERT INTO research_collaborations (title, description, collaboration_type, status, start_date, end_date, lab_id, lead_researcher_id, funding_amount, publications_count, outcomes) VALUES
('CRISPR Cancer Therapy Consortium', 'Multi-institutional collaboration for CRISPR-based cancer therapies', 'external', 'active', '2023-09-01', '2025-08-31', 'c8ace470-5e21-4d3b-ab95-da6084311657', 'c8ace470-5e21-4d3b-ab95-da6084311657', 500000, 2, ARRAY['2 publications', '1 patent filed', '3 conference presentations']),
('Industry Partnership - Drug Discovery', 'Collaborative drug discovery using machine learning approaches', 'industry', 'active', '2024-01-01', '2024-12-31', 'c8ace470-5e21-4d3b-ab95-da6084311657', 'c8ace470-5e21-4d3b-ab95-da6084311657', 200000, 0, ARRAY['1 patent application', '2 publications in progress']);

INSERT INTO collaboration_partners (collaboration_id, partner_name, institution, role, contact_email) VALUES
((SELECT id FROM research_collaborations WHERE title = 'CRISPR Cancer Therapy Consortium' LIMIT 1), 'Dr. Johnson', 'Stanford', 'Co-PI', 'johnson@stanford.edu'),
((SELECT id FROM research_collaborations WHERE title = 'CRISPR Cancer Therapy Consortium' LIMIT 1), 'Dr. Lee', 'MIT', 'Collaborator', 'lee@mit.edu'),
((SELECT id FROM research_collaborations WHERE title = 'Industry Partnership - Drug Discovery' LIMIT 1), 'Dr. Martinez', 'PharmaCorp', 'Industry Partner', 'martinez@pharmacorp.com');

INSERT INTO research_trends (title, description, category, impact_level, timeframe, relevance_score, sources, recommendations) VALUES
('AI-Driven Drug Discovery', 'Machine learning approaches are revolutionizing drug discovery with 40% faster lead identification', 'technology', 'high', 'medium', 95, ARRAY['Nature Reviews Drug Discovery', 'Science', 'Cell'], ARRAY['Consider integrating AI tools', 'Partner with ML experts', 'Apply for AI-focused grants']),
('CRISPR Clinical Trials', 'CRISPR therapies are entering Phase III trials with promising safety profiles', 'methodology', 'high', 'short', 88, ARRAY['New England Journal of Medicine', 'Nature Medicine'], ARRAY['Monitor clinical trial results', 'Consider translational research', 'Network with clinical researchers']);

-- Update existing projects with research-specific fields
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
WHERE lab_id = 'c8ace470-5e21-4d3b-ab95-da6084311657';

-- Add some sample milestones to existing projects
INSERT INTO project_milestones (project_id, title, description, due_date, priority)
SELECT 
    p.id,
    'Initial Research Phase',
    'Complete literature review and initial experiments',
    p.start_date + INTERVAL '1 month',
    'high'
FROM projects p 
WHERE p.lab_id = 'c8ace470-5e21-4d3b-ab95-da6084311657'
LIMIT 3;

INSERT INTO project_milestones (project_id, title, description, due_date, priority)
SELECT 
    p.id,
    'Data Analysis Phase',
    'Complete data collection and preliminary analysis',
    p.start_date + INTERVAL '3 months',
    'medium'
FROM projects p 
WHERE p.lab_id = 'c8ace470-5e21-4d3b-ab95-da6084311657'
LIMIT 3;

INSERT INTO project_milestones (project_id, title, description, due_date, priority)
SELECT 
    p.id,
    'Publication Phase',
    'Prepare manuscript for publication',
    p.end_date - INTERVAL '1 month',
    'high'
FROM projects p 
WHERE p.lab_id = 'c8ace470-5e21-4d3b-ab95-da6084311657'
LIMIT 3;

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
        'grantApplications', (SELECT COUNT(*) FROM research_deadlines WHERE lab_id = p_lab_id AND deadline_type = 'grant'),
        'conferencePresentations', (SELECT COUNT(*) FROM research_deadlines WHERE lab_id = p_lab_id AND deadline_type = 'conference')
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
    WHERE rd.lab_id = p_lab_id 
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
LEFT JOIN research_deadlines rd ON l.id = rd.lab_id
LEFT JOIN research_collaborations rc ON l.id = rc.lab_id
LEFT JOIN research_activities ra ON l.id = ra.lab_id
LEFT JOIN research_insights ri ON l.id = ri.lab_id
GROUP BY l.id, l.name;

-- Grant permissions
GRANT SELECT ON research_dashboard_data TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_research_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_smart_insights(UUID, UUID) TO authenticated;

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

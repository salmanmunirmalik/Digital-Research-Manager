-- PeerCred Reference System Database Schema
-- A sophisticated, fair, and transparent reference platform

-- Users table (extends existing users)
CREATE TABLE IF NOT EXISTS peercred_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_complete BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
    credibility_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
    total_references_given INTEGER DEFAULT 0,
    total_references_received INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work relationships verification
CREATE TABLE IF NOT EXISTS work_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID REFERENCES peercred_users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES peercred_users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    project_name VARCHAR(255),
    relationship_type VARCHAR(50) NOT NULL, -- colleague, manager, subordinate, client, collaborator
    start_date DATE NOT NULL,
    end_date DATE,
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
    verified_by_hr BOOLEAN DEFAULT FALSE,
    hr_contact_email VARCHAR(255),
    mutual_confirmation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id, company_name, project_name)
);

-- Reference requests
CREATE TABLE IF NOT EXISTS reference_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES peercred_users(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES peercred_users(id) ON DELETE CASCADE,
    work_relationship_id UUID REFERENCES work_relationships(id) ON DELETE CASCADE,
    position_applied_for VARCHAR(255) NOT NULL,
    company_applying_to VARCHAR(255),
    reference_type VARCHAR(50) NOT NULL, -- peer, manager, subordinate, client
    skills_to_evaluate TEXT[], -- Array of skills to be evaluated
    deadline DATE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, declined, expired
    is_blind_reference BOOLEAN DEFAULT TRUE, -- Hide the purpose initially
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reference responses
CREATE TABLE IF NOT EXISTS reference_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES reference_requests(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES peercred_users(id) ON DELETE CASCADE,
    
    -- Structured ratings (1-5 scale)
    technical_skills DECIMAL(3,2),
    communication_skills DECIMAL(3,2),
    leadership_skills DECIMAL(3,2),
    teamwork DECIMAL(3,2),
    problem_solving DECIMAL(3,2),
    reliability DECIMAL(3,2),
    adaptability DECIMAL(3,2),
    overall_performance DECIMAL(3,2),
    
    -- Written feedback
    strengths TEXT,
    areas_for_improvement TEXT,
    specific_examples TEXT,
    recommendation_strength VARCHAR(20), -- strong, moderate, weak
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(50), -- email, phone, linkedin, hr_verification
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Anti-bias measures
    bias_score DECIMAL(3,2), -- AI-calculated bias score
    language_analysis JSONB, -- Sentiment and bias analysis
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reference portfolios (compiled references for job applications)
CREATE TABLE IF NOT EXISTS reference_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES peercred_users(id) ON DELETE CASCADE,
    portfolio_name VARCHAR(255) NOT NULL,
    position_type VARCHAR(100), -- academic, industry, management, etc.
    industry VARCHAR(100),
    skills_focus TEXT[],
    references_included UUID[], -- Array of reference_response IDs
    overall_score DECIMAL(3,2),
    credibility_rating VARCHAR(20), -- high, medium, low
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bias detection and quality control
CREATE TABLE IF NOT EXISTS reference_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID REFERENCES reference_responses(id) ON DELETE CASCADE,
    
    -- Quality metrics
    length_score DECIMAL(3,2), -- Length appropriateness
    specificity_score DECIMAL(3,2), -- Use of specific examples
    balance_score DECIMAL(3,2), -- Balanced feedback
    professionalism_score DECIMAL(3,2), -- Professional language
    
    -- Bias detection
    gender_bias_score DECIMAL(3,2),
    age_bias_score DECIMAL(3,2),
    cultural_bias_score DECIMAL(3,2),
    overall_bias_score DECIMAL(3,2),
    
    -- AI analysis
    sentiment_analysis JSONB,
    keyword_analysis JSONB,
    anomaly_detection JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verification requests to HR/Companies
CREATE TABLE IF NOT EXISTS hr_verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_relationship_id UUID REFERENCES work_relationships(id) ON DELETE CASCADE,
    company_email VARCHAR(255) NOT NULL,
    hr_contact_name VARCHAR(255),
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
    verification_token VARCHAR(255) UNIQUE,
    verified_at TIMESTAMP,
    verification_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skills and competencies framework
CREATE TABLE IF NOT EXISTS skill_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    industry_relevance TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES skill_categories(id) ON DELETE CASCADE,
    description TEXT,
    verification_methods TEXT[], -- how this skill can be verified
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reference analytics and insights
CREATE TABLE IF NOT EXISTS reference_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES peercred_users(id) ON DELETE CASCADE,
    
    -- Performance metrics
    average_rating DECIMAL(3,2),
    rating_trend JSONB, -- Rating changes over time
    skill_development JSONB, -- Skill improvement tracking
    reference_consistency DECIMAL(3,2), -- Consistency across references
    
    -- Comparison metrics
    peer_comparison JSONB, -- How user compares to peers
    industry_benchmark JSONB, -- Industry-specific comparisons
    role_specific_scores JSONB, -- Scores for different role types
    
    -- Trust and credibility
    referee_credibility_avg DECIMAL(3,2),
    verification_rate DECIMAL(3,2), -- Percentage of verified references
    response_rate DECIMAL(3,2), -- How often referees respond
    
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_peercred_users_user_id ON peercred_users(user_id);
CREATE INDEX idx_work_relationships_users ON work_relationships(user1_id, user2_id);
CREATE INDEX idx_work_relationships_company ON work_relationships(company_name);
CREATE INDEX idx_reference_requests_status ON reference_requests(status);
CREATE INDEX idx_reference_responses_request ON reference_responses(request_id);
CREATE INDEX idx_reference_portfolios_user ON reference_portfolios(user_id);
CREATE INDEX idx_reference_quality_response ON reference_quality_metrics(response_id);

-- Triggers for automatic updates
CREATE OR REPLACE FUNCTION update_peercred_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_peercred_users_timestamp 
    BEFORE UPDATE ON peercred_users 
    FOR EACH ROW EXECUTE FUNCTION update_peercred_timestamp();

CREATE TRIGGER update_work_relationships_timestamp 
    BEFORE UPDATE ON work_relationships 
    FOR EACH ROW EXECUTE FUNCTION update_peercred_timestamp();

CREATE TRIGGER update_reference_requests_timestamp 
    BEFORE UPDATE ON reference_requests 
    FOR EACH ROW EXECUTE FUNCTION update_peercred_timestamp();

CREATE TRIGGER update_reference_portfolios_timestamp 
    BEFORE UPDATE ON reference_portfolios 
    FOR EACH ROW EXECUTE FUNCTION update_peercred_timestamp();

-- Views for common queries
CREATE VIEW reference_summary AS
SELECT 
    rr.id,
    rr.request_id,
    pu1.email as requester_email,
    pu2.email as referee_email,
    wr.company_name,
    wr.project_name,
    rr.overall_performance,
    rr.recommendation_strength,
    rr.submitted_at,
    rqm.overall_bias_score,
    rqm.professionalism_score
FROM reference_responses rr
JOIN reference_requests rq ON rr.request_id = rq.id
JOIN peercred_users pu1 ON rq.requester_id = pu1.id
JOIN peercred_users pu2 ON rr.referee_id = pu2.id
JOIN work_relationships wr ON rq.work_relationship_id = wr.id
LEFT JOIN reference_quality_metrics rqm ON rr.id = rqm.response_id;

-- Sample data for skill categories
INSERT INTO skill_categories (category_name, description, industry_relevance) VALUES
('Technical Skills', 'Programming, software development, technical expertise', ARRAY['Technology', 'Engineering', 'Research']),
('Communication', 'Written and verbal communication abilities', ARRAY['All Industries']),
('Leadership', 'Team management and leadership capabilities', ARRAY['Management', 'Academia', 'Industry']),
('Research', 'Research methodology and analytical skills', ARRAY['Academia', 'R&D', 'Consulting']),
('Project Management', 'Planning, execution, and delivery of projects', ARRAY['All Industries']),
('Collaboration', 'Teamwork and cross-functional collaboration', ARRAY['All Industries']);

-- Sample skills
INSERT INTO skills (skill_name, category_id, description, verification_methods) VALUES
('Python Programming', (SELECT id FROM skill_categories WHERE category_name = 'Technical Skills'), 'Proficiency in Python development', ARRAY['Code Review', 'Project Portfolio', 'Technical Interview']),
('Data Analysis', (SELECT id FROM skill_categories WHERE category_name = 'Research'), 'Statistical analysis and data interpretation', ARRAY['Research Papers', 'Project Results', 'Peer Review']),
('Team Leadership', (SELECT id FROM skill_categories WHERE category_name = 'Leadership'), 'Leading and managing teams effectively', ARRAY['Team Feedback', 'Project Outcomes', '360 Reviews']),
('Scientific Writing', (SELECT id FROM skill_categories WHERE category_name = 'Communication'), 'Writing research papers and technical documents', ARRAY['Publications', 'Document Review', 'Peer Assessment']),
('Project Planning', (SELECT id FROM skill_categories WHERE category_name = 'Project Management'), 'Planning and organizing project activities', ARRAY['Project Documentation', 'Timeline Analysis', 'Stakeholder Feedback']);

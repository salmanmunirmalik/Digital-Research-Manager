-- Simple Couchsurfing-Style Reference System
-- AI-Generated Reference Letters from Collected References

-- Reference collections (like Couchsurfing reviews)
CREATE TABLE IF NOT EXISTS reference_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reference_giver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Context of the relationship
    context_type VARCHAR(50) NOT NULL, -- conference, colleague, professor, boss, client, collaborator
    context_details VARCHAR(255), -- "ICML 2023", "Google Research", "PhD Supervisor"
    relationship_duration VARCHAR(50), -- "3 months", "2 years", "1 week"
    working_relationship TEXT, -- Brief description of how they worked together
    
    -- Reference content
    reference_text TEXT NOT NULL, -- The actual reference/review
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    
    -- Skills mentioned (for AI matching)
    skills_mentioned TEXT[], -- Array of skills mentioned in the reference
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(50), -- email, linkedin, conference_badge, etc.
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one reference per relationship
    UNIQUE(user_id, reference_giver_id, context_type, context_details)
);

-- Job applications and AI-generated reference letters
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Job details
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    job_description TEXT,
    required_skills TEXT[],
    job_type VARCHAR(50), -- academic, industry, startup, etc.
    
    -- AI matching results
    matched_references UUID[], -- Array of reference_collections IDs
    matched_platform_references UUID[], -- Array of platform_references IDs
    ai_generated_letter TEXT,
    platform_generated_letter TEXT, -- Separate letter based on platform activities
    combined_reference_letter TEXT, -- Combined letter from both sources
    
    -- Confidence scores
    peer_confidence_score DECIMAL(3,2), -- AI confidence in peer references
    platform_confidence_score DECIMAL(3,2), -- AI confidence in platform analysis
    overall_confidence_score DECIMAL(3,2), -- Combined confidence score
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, generated, submitted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reference templates for different contexts
CREATE TABLE IF NOT EXISTS reference_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context_type VARCHAR(50) NOT NULL,
    job_type VARCHAR(50),
    template_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform activity tracking for reference generation
CREATE TABLE IF NOT EXISTS platform_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- lab_notebook_entry, protocol_created, experiment_completed, paper_published, etc.
    activity_title VARCHAR(255) NOT NULL,
    activity_description TEXT,
    activity_data JSONB, -- Flexible data storage for different activity types
    
    -- Metrics
    complexity_score DECIMAL(3,2) DEFAULT 0.00, -- 0-5 scale
    innovation_score DECIMAL(3,2) DEFAULT 0.00, -- 0-5 scale
    collaboration_score DECIMAL(3,2) DEFAULT 0.00, -- 0-5 scale
    documentation_quality DECIMAL(3,2) DEFAULT 0.00, -- 0-5 scale
    
    -- Skills demonstrated
    skills_demonstrated TEXT[],
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform-generated references
CREATE TABLE IF NOT EXISTS platform_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Reference content
    reference_title VARCHAR(255) NOT NULL,
    reference_text TEXT NOT NULL,
    overall_score DECIMAL(3,2) NOT NULL, -- 0-5 scale
    
    -- Analysis details
    activities_analyzed UUID[], -- Array of platform_activities IDs
    analysis_period_start DATE,
    analysis_period_end DATE,
    
    -- Skills and competencies
    technical_skills TEXT[],
    soft_skills TEXT[],
    research_methodologies TEXT[],
    
    -- Platform metrics
    total_activities INTEGER,
    average_complexity DECIMAL(3,2),
    average_innovation DECIMAL(3,2),
    collaboration_frequency DECIMAL(3,2),
    documentation_consistency DECIMAL(3,2),
    
    -- AI analysis
    ai_confidence_score DECIMAL(3,2),
    analysis_metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User reference statistics
CREATE TABLE IF NOT EXISTS user_reference_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Statistics
    total_references INTEGER DEFAULT 0,
    total_platform_references INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    references_by_context JSONB, -- {"conference": 5, "colleague": 12, "professor": 3}
    top_mentioned_skills TEXT[],
    
    -- Platform activity metrics
    total_activities INTEGER DEFAULT 0,
    average_activity_score DECIMAL(3,2) DEFAULT 0.00,
    most_active_periods JSONB, -- {"2024-Q1": 15, "2024-Q2": 23}
    
    -- Trust metrics
    verification_rate DECIMAL(3,2) DEFAULT 0.00,
    response_rate DECIMAL(3,2) DEFAULT 0.00, -- How often they respond to reference requests
    
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reference requests (simplified)
CREATE TABLE IF NOT EXISTS reference_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reference_giver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Context
    context_type VARCHAR(50) NOT NULL,
    context_details VARCHAR(255),
    relationship_description TEXT,
    
    -- Request details
    message TEXT, -- Personal message from requester
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, declined
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_reference_collections_user ON reference_collections(user_id);
CREATE INDEX idx_reference_collections_giver ON reference_collections(reference_giver_id);
CREATE INDEX idx_reference_collections_context ON reference_collections(context_type);
CREATE INDEX idx_job_applications_user ON job_applications(user_id);
CREATE INDEX idx_reference_requests_status ON reference_requests(status);

-- Triggers for automatic updates
CREATE OR REPLACE FUNCTION update_reference_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reference_collections_timestamp 
    BEFORE UPDATE ON reference_collections 
    FOR EACH ROW EXECUTE FUNCTION update_reference_timestamp();

CREATE TRIGGER update_job_applications_timestamp 
    BEFORE UPDATE ON job_applications 
    FOR EACH ROW EXECUTE FUNCTION update_reference_timestamp();

CREATE TRIGGER update_reference_requests_timestamp 
    BEFORE UPDATE ON reference_requests 
    FOR EACH ROW EXECUTE FUNCTION update_reference_timestamp();

-- Function to update user reference stats
CREATE OR REPLACE FUNCTION update_user_reference_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats for the user who received the reference
    INSERT INTO user_reference_stats (user_id, total_references, average_rating, verification_rate)
    SELECT 
        NEW.user_id,
        COUNT(*),
        AVG(overall_rating),
        COUNT(CASE WHEN is_verified = true THEN 1 END)::DECIMAL / COUNT(*)
    FROM reference_collections 
    WHERE user_id = NEW.user_id
    ON CONFLICT (user_id) DO UPDATE SET
        total_references = EXCLUDED.total_references,
        average_rating = EXCLUDED.average_rating,
        verification_rate = EXCLUDED.verification_rate,
        last_updated = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stats_on_reference_insert
    AFTER INSERT ON reference_collections
    FOR EACH ROW EXECUTE FUNCTION update_user_reference_stats();

CREATE TRIGGER update_stats_on_reference_update
    AFTER UPDATE ON reference_collections
    FOR EACH ROW EXECUTE FUNCTION update_user_reference_stats();

-- Sample reference templates
INSERT INTO reference_templates (context_type, job_type, template_text) VALUES
('conference', 'academic', 'I had the pleasure of meeting [Name] at [Conference] where we collaborated on [Project]. Their expertise in [Skill] and ability to [Achievement] impressed me greatly. I would highly recommend them for [Position] roles.'),
('conference', 'industry', 'At [Conference], [Name] demonstrated exceptional [Skill] and [Achievement]. Their professional approach and [Quality] make them an ideal candidate for [Position] at [Company].'),
('colleague', 'academic', 'As a colleague at [Institution], I worked closely with [Name] on [Project]. Their [Skill] and [Achievement] were outstanding. I strongly recommend them for [Position].'),
('colleague', 'industry', 'Working alongside [Name] at [Company], I witnessed their [Skill] and [Achievement]. Their [Quality] and [Quality] make them perfect for [Position].'),
('professor', 'academic', 'As [Name]''s [Relationship] at [Institution], I can attest to their [Skill] and [Achievement]. Their [Quality] and [Quality] make them an excellent candidate for [Position].'),
('boss', 'industry', 'As [Name]''s supervisor at [Company], I observed their [Skill] and [Achievement]. Their [Quality] and [Quality] make them ideal for [Position].');

-- View for easy reference querying
CREATE VIEW reference_summary AS
SELECT 
    rc.id,
    rc.user_id,
    u1.email as user_email,
    u1.first_name as user_first_name,
    u1.last_name as user_last_name,
    rc.reference_giver_id,
    u2.email as giver_email,
    u2.first_name as giver_first_name,
    u2.last_name as giver_last_name,
    rc.context_type,
    rc.context_details,
    rc.relationship_duration,
    rc.reference_text,
    rc.overall_rating,
    rc.skills_mentioned,
    rc.is_verified,
    rc.created_at
FROM reference_collections rc
JOIN users u1 ON rc.user_id = u1.id
JOIN users u2 ON rc.reference_giver_id = u2.id;

-- Consolidated Database Schema for ResearchLab
-- Removes redundancy and consolidates related tables

-- ==============================================
-- CORE USER MANAGEMENT
-- ==============================================

-- Enhanced users table with all profile information
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
    
    -- Basic profile information
    phone VARCHAR(20),
    department VARCHAR(255),
    specialization VARCHAR(255),
    bio TEXT,
    
    -- Professional information
    current_position VARCHAR(255),
    current_institution VARCHAR(255),
    research_interests TEXT[],
    expertise_areas TEXT[],
    languages TEXT[],
    
    -- Social links
    website_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    twitter_url VARCHAR(500),
    orcid_id VARCHAR(50),
    google_scholar_url VARCHAR(500),
    
    -- Location
    location VARCHAR(255),
    timezone VARCHAR(50),
    
    -- Profile visibility settings
    profile_visibility VARCHAR(20) DEFAULT 'public',
    show_email BOOLEAN DEFAULT FALSE,
    show_phone BOOLEAN DEFAULT FALSE,
    show_location BOOLEAN DEFAULT TRUE,
    show_research_interests BOOLEAN DEFAULT TRUE,
    show_publications BOOLEAN DEFAULT TRUE,
    
    -- Social preferences
    allow_connection_requests BOOLEAN DEFAULT TRUE,
    allow_follow_requests BOOLEAN DEFAULT TRUE,
    allow_profile_sharing BOOLEAN DEFAULT TRUE,
    allow_reference_requests BOOLEAN DEFAULT TRUE,
    
    -- Social stats
    connections_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    profile_views_count INTEGER DEFAULT 0,
    
    -- Activity status
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE,
    
    -- System fields
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token UUID DEFAULT gen_random_uuid(),
    reset_password_token UUID,
    reset_password_expires TIMESTAMP WITH TIME ZONE
);

-- ==============================================
-- UNIFIED REFERENCE SYSTEM
-- ==============================================

-- Consolidated references table
CREATE TABLE IF NOT EXISTS unified_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Reference type and basic info
    type VARCHAR(20) NOT NULL, -- 'peer', 'platform', 'comprehensive'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Skills and context
    skills TEXT[],
    context VARCHAR(100), -- 'conference', 'colleague', 'platform_activity', etc.
    relationship VARCHAR(100), -- 'colleague', 'supervisor', 'collaborator', etc.
    duration VARCHAR(100),
    
    -- Scoring and verification
    score INTEGER DEFAULT 0, -- 0-100
    confidence INTEGER DEFAULT 0, -- 0-100
    verified BOOLEAN DEFAULT FALSE,
    
    -- Source information
    source_name VARCHAR(255), -- Name of person giving reference or 'AI Analysis'
    source_type VARCHAR(50), -- 'peer', 'ai', 'system'
    
    -- Job matching
    job_matches TEXT[], -- Array of job titles this reference applies to
    
    -- Activity tracking (for platform references)
    activity_period_start DATE,
    activity_period_end DATE,
    activities_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP -- For time-limited references
);

-- Reference requests
CREATE TABLE IF NOT EXISTS reference_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Request details
    context VARCHAR(100) NOT NULL,
    skills TEXT[],
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    
    -- Response
    response_message TEXT,
    response_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- SOCIAL NETWORKING (CONSOLIDATED)
-- ==============================================

-- User connections (LinkedIn-style)
CREATE TABLE IF NOT EXISTS user_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    connected_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Connection details
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    relationship_context VARCHAR(100), -- 'conference', 'colleague', 'collaborator', etc.
    connection_strength INTEGER DEFAULT 5, -- 1-10 scale
    
    -- Messages
    request_message TEXT,
    response_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    
    UNIQUE(user_id, connected_user_id)
);

-- User follows (Twitter-style)
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Follow type
    follow_type VARCHAR(20) DEFAULT 'general', -- 'general', 'research_updates', 'publications_only'
    
    -- Notification preferences
    notify_on_publications BOOLEAN DEFAULT TRUE,
    notify_on_activities BOOLEAN DEFAULT TRUE,
    notify_on_connections BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(follower_id, following_id)
);

-- Profile shares
CREATE TABLE IF NOT EXISTS profile_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Share details
    share_token VARCHAR(255) UNIQUE NOT NULL,
    share_type VARCHAR(20) DEFAULT 'public', -- 'public', 'password_protected', 'time_limited', 'view_limited'
    
    -- Restrictions
    password_hash VARCHAR(255),
    expires_at TIMESTAMP,
    max_views INTEGER,
    views_count INTEGER DEFAULT 0,
    
    -- Permissions
    show_email BOOLEAN DEFAULT FALSE,
    show_phone BOOLEAN DEFAULT FALSE,
    show_location BOOLEAN DEFAULT TRUE,
    show_research_interests BOOLEAN DEFAULT TRUE,
    show_publications BOOLEAN DEFAULT TRUE,
    show_connections BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP
);

-- ==============================================
-- RESEARCH PORTFOLIO (CONSOLIDATED)
-- ==============================================

-- Publications
CREATE TABLE IF NOT EXISTS publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Publication details
    title VARCHAR(500) NOT NULL,
    authors TEXT[],
    journal VARCHAR(255),
    year INTEGER,
    volume VARCHAR(50),
    issue VARCHAR(50),
    pages VARCHAR(50),
    doi VARCHAR(255),
    abstract TEXT,
    
    -- File attachments
    pdf_url VARCHAR(500),
    supplementary_files TEXT[],
    
    -- Metrics
    citations_count INTEGER DEFAULT 0,
    h_index INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'published', -- 'draft', 'submitted', 'published', 'rejected'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Research opportunities (consolidated from exchange and supervisor discovery)
CREATE TABLE IF NOT EXISTS research_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Creator/owner
    
    -- Opportunity details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'co_supervisor', 'research_exchange', 'collaboration', 'internship'
    
    -- Location and institution
    institution VARCHAR(255),
    location VARCHAR(255),
    country VARCHAR(100),
    
    -- Requirements and details
    requirements TEXT[],
    skills_required TEXT[],
    duration VARCHAR(100),
    start_date DATE,
    end_date DATE,
    
    -- Compensation and benefits
    funding_amount DECIMAL(10,2),
    funding_currency VARCHAR(3) DEFAULT 'USD',
    benefits TEXT[],
    
    -- Application details
    application_deadline DATE,
    max_applicants INTEGER,
    current_applicants INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed', 'cancelled'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opportunity applications
CREATE TABLE IF NOT EXISTS opportunity_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES research_opportunities(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Application details
    cover_letter TEXT,
    cv_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    
    -- Status
    status VARCHAR(20) DEFAULT 'submitted', -- 'submitted', 'reviewed', 'accepted', 'rejected'
    
    -- Review
    review_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(opportunity_id, applicant_id)
);

-- ==============================================
-- ACTIVITY TRACKING (CONSOLIDATED)
-- ==============================================

-- Platform activities (for generating platform references)
CREATE TABLE IF NOT EXISTS platform_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- 'lab_notebook_entry', 'protocol_creation', 'experiment_completion', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Content analysis
    skills_extracted TEXT[],
    complexity_score INTEGER DEFAULT 0, -- 1-10
    innovation_score INTEGER DEFAULT 0, -- 1-10
    collaboration_score INTEGER DEFAULT 0, -- 1-10
    documentation_score INTEGER DEFAULT 0, -- 1-10
    
    -- Metadata
    content_length INTEGER DEFAULT 0,
    attachments_count INTEGER DEFAULT 0,
    collaborators_count INTEGER DEFAULT 0,
    
    -- Timestamps
    activity_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- NOTIFICATIONS (CONSOLIDATED)
-- ==============================================

-- Unified notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(50) NOT NULL, -- 'connection_request', 'follow_request', 'reference_request', 'opportunity_match', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- Related entities
    related_user_id UUID REFERENCES users(id),
    related_entity_type VARCHAR(50), -- 'publication', 'opportunity', 'reference', etc.
    related_entity_id UUID,
    
    -- Status
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- Actions
    action_url VARCHAR(500),
    action_text VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_institution ON users(current_institution);
CREATE INDEX IF NOT EXISTS idx_users_research_interests ON users USING GIN(research_interests);

-- Reference indexes
CREATE INDEX IF NOT EXISTS idx_references_user_id ON unified_references(user_id);
CREATE INDEX IF NOT EXISTS idx_references_type ON unified_references(type);
CREATE INDEX IF NOT EXISTS idx_references_verified ON unified_references(verified);
CREATE INDEX IF NOT EXISTS idx_references_skills ON unified_references USING GIN(skills);

-- Social networking indexes
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON user_connections(status);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON user_follows(following_id);

-- Publication indexes
CREATE INDEX IF NOT EXISTS idx_publications_user_id ON publications(user_id);
CREATE INDEX IF NOT EXISTS idx_publications_year ON publications(year);
CREATE INDEX IF NOT EXISTS idx_publications_journal ON publications(journal);

-- Opportunity indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON research_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON research_opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON research_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_institution ON research_opportunities(institution);

-- Activity indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON platform_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON platform_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_date ON platform_activities(activity_date);

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

-- Research Data & Results table
CREATE TABLE IF NOT EXISTS research_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'experiment', 'analysis', 'image', 'document', 'protocol', 'code'
    category VARCHAR(50) NOT NULL, -- 'molecular_biology', 'cell_biology', 'biochemistry', 'microbiology', 'bioinformatics', 'other'
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived', 'under_review'
    summary TEXT,
    description TEXT,
    methodology TEXT,
    results TEXT,
    conclusions TEXT,
    tags TEXT[], -- Array of tags
    files JSONB, -- Store file information as JSON
    metadata JSONB, -- Store additional metadata as JSON
    privacy_level VARCHAR(20) DEFAULT 'lab', -- 'personal', 'team', 'lab', 'institution', 'global'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Research Data indexes
CREATE INDEX IF NOT EXISTS idx_research_data_user_id ON research_data(user_id);
CREATE INDEX IF NOT EXISTS idx_research_data_lab_id ON research_data(lab_id);
CREATE INDEX IF NOT EXISTS idx_research_data_type ON research_data(type);
CREATE INDEX IF NOT EXISTS idx_research_data_category ON research_data(category);
CREATE INDEX IF NOT EXISTS idx_research_data_status ON research_data(status);
CREATE INDEX IF NOT EXISTS idx_research_data_created_at ON research_data(created_at);
CREATE INDEX IF NOT EXISTS idx_research_data_tags ON research_data USING GIN(tags);

-- Lab Notebook Entries table
CREATE TABLE IF NOT EXISTS lab_notebook_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    entry_type VARCHAR(50) NOT NULL, -- 'experiment', 'observation', 'protocol', 'note', 'sample_management'
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'completed', 'archived'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    objectives TEXT,
    methodology TEXT,
    results TEXT,
    conclusions TEXT,
    next_steps TEXT,
    tags TEXT[], -- Array of tags
    privacy_level VARCHAR(20) DEFAULT 'lab', -- 'personal', 'team', 'lab', 'institution', 'global'
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes
    cost DECIMAL(10,2) DEFAULT 0,
    equipment_used TEXT[],
    materials_used TEXT[],
    safety_notes TEXT,
    references TEXT[],
    collaborators TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab Notebook Entries indexes
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_user_id ON lab_notebook_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_lab_id ON lab_notebook_entries(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_type ON lab_notebook_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_status ON lab_notebook_entries(status);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_created_at ON lab_notebook_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_lab_notebook_entries_tags ON lab_notebook_entries USING GIN(tags);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ==============================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'user_connections' THEN
        IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
            UPDATE users SET connections_count = connections_count + 1 WHERE id = NEW.user_id;
            UPDATE users SET connections_count = connections_count + 1 WHERE id = NEW.connected_user_id;
        ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
            UPDATE users SET connections_count = connections_count - 1 WHERE id = OLD.user_id;
            UPDATE users SET connections_count = connections_count - 1 WHERE id = OLD.connected_user_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'user_follows' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
            UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
            UPDATE users SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for user stats
CREATE TRIGGER trigger_update_connection_stats
    AFTER INSERT OR DELETE ON user_connections
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER trigger_update_follow_stats
    AFTER INSERT OR DELETE ON user_follows
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Function to calculate research compatibility
CREATE OR REPLACE FUNCTION calculate_research_compatibility(
    student_interests TEXT[],
    supervisor_domains TEXT[],
    supervisor_interests TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
    compatibility_score INTEGER := 0;
    domain_matches INTEGER := 0;
    interest_matches INTEGER := 0;
    total_domains INTEGER;
    total_interests INTEGER;
BEGIN
    -- Count domain matches
    SELECT COUNT(*) INTO domain_matches
    FROM unnest(student_interests) AS s_interest
    WHERE s_interest = ANY(supervisor_domains);
    
    -- Count interest matches
    SELECT COUNT(*) INTO interest_matches
    FROM unnest(student_interests) AS s_interest
    WHERE s_interest = ANY(supervisor_interests);
    
    -- Calculate compatibility score (0-100)
    total_domains := array_length(supervisor_domains, 1);
    total_interests := array_length(supervisor_interests, 1);
    
    IF total_domains > 0 THEN
        compatibility_score := compatibility_score + (domain_matches * 100 / total_domains) * 0.6;
    END IF;
    
    IF total_interests > 0 THEN
        compatibility_score := compatibility_score + (interest_matches * 100 / total_interests) * 0.4;
    END IF;
    
    RETURN LEAST(100, GREATEST(0, compatibility_score));
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- SAMPLE DATA (OPTIONAL)
-- ==============================================

-- Insert sample users for testing
INSERT INTO users (email, username, password_hash, first_name, last_name, role, status, bio, current_position, current_institution, research_interests, expertise_areas) VALUES
('admin@researchlab.com', 'admin', '$2b$10$example', 'Admin', 'User', 'admin', 'active', 'System administrator', 'Administrator', 'ResearchLab', ARRAY['research_management'], ARRAY['system_administration']),
('researcher@university.edu', 'researcher1', '$2b$10$example', 'Dr. Sarah', 'Johnson', 'principal_researcher', 'active', 'Leading researcher in molecular biology', 'Professor', 'University of Science', ARRAY['molecular_biology', 'genetics', 'biotechnology'], ARRAY['PCR', 'gene_editing', 'protein_analysis']),
('student@university.edu', 'student1', '$2b$10$example', 'John', 'Doe', 'student', 'active', 'PhD student in molecular biology', 'PhD Student', 'University of Science', ARRAY['molecular_biology', 'genetics'], ARRAY['PCR', 'cell_culture']);

-- Insert sample publications
INSERT INTO publications (user_id, title, authors, journal, year, doi, abstract) VALUES
((SELECT id FROM users WHERE email = 'researcher@university.edu'), 'Advances in Gene Editing Technology', ARRAY['Dr. Sarah Johnson', 'Dr. Michael Chen'], 'Nature Biotechnology', 2024, '10.1038/nbt.2024.001', 'This paper presents novel findings in CRISPR gene editing applications.'),
((SELECT id FROM users WHERE email = 'student@university.edu'), 'Optimization of PCR Protocols', ARRAY['John Doe', 'Dr. Sarah Johnson'], 'Journal of Molecular Biology', 2024, '10.1016/j.jmb.2024.001', 'This study optimizes PCR conditions for improved efficiency.');

-- Insert sample research opportunities
INSERT INTO research_opportunities (user_id, title, description, type, institution, location, requirements, skills_required, duration, funding_amount) VALUES
((SELECT id FROM users WHERE email = 'researcher@university.edu'), 'Postdoc Position in Molecular Biology', 'Join our cutting-edge research team', 'collaboration', 'University of Science', 'New York, NY', ARRAY['PhD in Biology', '2+ years experience'], ARRAY['PCR', 'gene_editing', 'data_analysis'], '2 years', 50000.00),
((SELECT id FROM users WHERE email = 'researcher@university.edu'), 'Research Exchange Program', 'International collaboration opportunity', 'research_exchange', 'University of Science', 'New York, NY', ARRAY['Graduate student', 'English proficiency'], ARRAY['molecular_biology', 'collaboration'], '6 months', 25000.00);

-- ==============================================
-- LAB MANAGEMENT QUICK ACTIONS TABLES
-- ==============================================

-- Meetings table for lab management
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    attendees TEXT[] DEFAULT '{}',
    location VARCHAR(255),
    agenda TEXT,
    lab_id VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Issues table for lab management
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    category VARCHAR(100),
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'open',
    attachments TEXT[] DEFAULT '{}',
    lab_id VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id)
);

-- Achievements table for lab management
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    impact_level VARCHAR(20) DEFAULT 'medium',
    tags TEXT[] DEFAULT '{}',
    lab_id VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMIT;

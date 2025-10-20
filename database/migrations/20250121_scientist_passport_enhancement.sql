-- Enhanced Scientist Passport Migration
-- Transforms basic user profiles into comprehensive "Scientist Passports"
-- Includes skills, certifications, availability, speaking experience, and service provider capabilities

-- ==============================================
-- TECHNICAL SKILLS & EXPERTISE
-- ==============================================

-- Technical Skills with proficiency levels
CREATE TABLE IF NOT EXISTS user_technical_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    skill_category VARCHAR(100), -- 'laboratory_technique', 'software', 'analytical_method', 'instrumentation'
    proficiency_level VARCHAR(50) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
    years_experience INTEGER DEFAULT 0,
    last_used DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id), -- Peer verification
    verified_at TIMESTAMP,
    endorsements_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_name)
);

-- Software & Tools Expertise
CREATE TABLE IF NOT EXISTS user_software_expertise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    software_name VARCHAR(255) NOT NULL,
    software_type VARCHAR(100), -- 'analysis', 'design', 'visualization', 'programming', 'modeling'
    proficiency_level VARCHAR(50) DEFAULT 'intermediate',
    version_used VARCHAR(50),
    certification_url VARCHAR(500),
    years_experience INTEGER DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, software_name)
);

-- Laboratory Techniques
CREATE TABLE IF NOT EXISTS user_laboratory_techniques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    technique_name VARCHAR(255) NOT NULL,
    technique_category VARCHAR(100), -- 'molecular_biology', 'cell_culture', 'microscopy', 'spectroscopy', 'chromatography'
    proficiency_level VARCHAR(50) DEFAULT 'intermediate',
    times_performed INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2), -- Percentage
    training_received BOOLEAN DEFAULT FALSE,
    can_train_others BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, technique_name)
);

-- Professional Certifications
CREATE TABLE IF NOT EXISTS user_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    certification_name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255),
    certification_type VARCHAR(100), -- 'safety', 'technical', 'regulatory', 'professional'
    issue_date DATE,
    expiry_date DATE,
    certification_number VARCHAR(100),
    verification_url VARCHAR(500),
    is_current BOOLEAN DEFAULT TRUE,
    credential_file_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skill Endorsements (peer validation)
CREATE TABLE IF NOT EXISTS skill_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID, -- References various skill tables
    skill_type VARCHAR(50), -- 'technical', 'software', 'laboratory', 'soft_skill'
    endorser_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endorsee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    relationship VARCHAR(100), -- 'colleague', 'supervisor', 'collaborator', 'mentee'
    endorsement_text TEXT,
    strength INTEGER DEFAULT 3 CHECK (strength BETWEEN 1 AND 5), -- 1-5 rating
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(skill_id, skill_type, endorser_id, endorsee_id)
);

-- ==============================================
-- AVAILABILITY & SERVICE OFFERINGS
-- ==============================================

-- Researcher Availability Status
CREATE TABLE IF NOT EXISTS user_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Collaboration availability
    open_for_collaboration BOOLEAN DEFAULT TRUE,
    collaboration_types TEXT[], -- 'research', 'consulting', 'review', 'mentoring'
    preferred_collaboration_duration VARCHAR(50), -- 'short_term', 'long_term', 'project_based'
    max_active_collaborations INTEGER DEFAULT 3,
    current_active_collaborations INTEGER DEFAULT 0,
    
    -- Speaking & Events
    available_as_keynote_speaker BOOLEAN DEFAULT FALSE,
    available_for_workshops BOOLEAN DEFAULT FALSE,
    available_for_panels BOOLEAN DEFAULT FALSE,
    preferred_event_types TEXT[], -- 'conference', 'symposium', 'workshop', 'webinar'
    
    -- Service Provider
    available_as_service_provider BOOLEAN DEFAULT FALSE,
    service_types TEXT[], -- 'data_analysis', 'consulting', 'training', 'protocol_development'
    
    -- Consulting
    available_as_consultant BOOLEAN DEFAULT FALSE,
    consulting_domains TEXT[],
    hourly_rate DECIMAL(10,2),
    rate_currency VARCHAR(10) DEFAULT 'USD',
    rate_negotiable BOOLEAN DEFAULT TRUE,
    
    -- General availability
    weekly_hours_available INTEGER,
    timezone VARCHAR(50),
    preferred_communication TEXT[], -- 'email', 'video_call', 'in_person', 'chat'
    response_time_hours INTEGER DEFAULT 24,
    
    -- Travel willingness
    travel_willingness VARCHAR(50) DEFAULT 'negotiable', -- 'local', 'national', 'international', 'negotiable', 'remote_only'
    travel_radius_km INTEGER,
    
    -- Status
    currently_available BOOLEAN DEFAULT TRUE,
    availability_notes TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- SPEAKING EXPERIENCE & KEYNOTE PROFILE
-- ==============================================

-- Speaking Profile
CREATE TABLE IF NOT EXISTS user_speaking_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Experience metrics
    total_keynotes_delivered INTEGER DEFAULT 0,
    total_conference_presentations INTEGER DEFAULT 0,
    total_invited_talks INTEGER DEFAULT 0,
    total_workshops_conducted INTEGER DEFAULT 0,
    total_webinars_hosted INTEGER DEFAULT 0,
    
    -- Profile information
    speaker_bio TEXT,
    speaking_topics TEXT[], -- Areas of expertise for speaking
    target_audience_levels TEXT[], -- 'undergraduate', 'graduate', 'professional', 'general_public', 'industry'
    speaking_languages TEXT[],
    
    -- Materials
    speaker_photo_url VARCHAR(500),
    sample_presentation_urls TEXT[],
    video_links TEXT[], -- TED talks, YouTube, etc.
    
    -- Preferences
    preferred_presentation_length VARCHAR(50), -- '15min', '30min', '45min', '60min', 'workshop'
    requires_speaker_fee BOOLEAN DEFAULT FALSE,
    speaker_fee_range_min DECIMAL(10,2),
    speaker_fee_range_max DECIMAL(10,2),
    fee_currency VARCHAR(10) DEFAULT 'USD',
    fee_negotiable BOOLEAN DEFAULT TRUE,
    
    -- Availability
    available_dates_notes TEXT,
    booking_lead_time_days INTEGER DEFAULT 30, -- Minimum notice required
    
    -- Ratings
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual Speaking Engagements
CREATE TABLE IF NOT EXISTS speaking_engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    event_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(100), -- 'keynote', 'invited_talk', 'conference_presentation', 'workshop', 'panel', 'webinar'
    event_date DATE NOT NULL,
    event_location VARCHAR(255),
    event_url VARCHAR(500),
    
    presentation_title VARCHAR(500),
    presentation_topic VARCHAR(255),
    audience_size INTEGER,
    audience_type VARCHAR(100),
    
    presentation_file_url VARCHAR(500),
    video_recording_url VARCHAR(500),
    
    organizer_name VARCHAR(255),
    organizer_contact VARCHAR(255),
    
    rating DECIMAL(3,2),
    feedback_text TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Speaker Testimonials
CREATE TABLE IF NOT EXISTS speaker_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    speaker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    testimonial_text TEXT NOT NULL,
    testimonial_author VARCHAR(255),
    author_title VARCHAR(255),
    author_organization VARCHAR(255),
    author_email VARCHAR(255),
    
    event_name VARCHAR(255),
    event_date DATE,
    
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- VERIFICATION & TRUST SCORES
-- ==============================================

-- Platform Activity Score (auto-calculated based on activities)
CREATE TABLE IF NOT EXISTS user_platform_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Activity metrics
    lab_notebook_entries_count INTEGER DEFAULT 0,
    protocols_created_count INTEGER DEFAULT 0,
    experiments_completed_count INTEGER DEFAULT 0,
    publications_count INTEGER DEFAULT 0,
    collaborations_count INTEGER DEFAULT 0,
    data_shared_count INTEGER DEFAULT 0,
    reviews_given_count INTEGER DEFAULT 0,
    
    -- Quality metrics
    average_protocol_rating DECIMAL(3,2) DEFAULT 0.00,
    average_collaboration_rating DECIMAL(3,2) DEFAULT 0.00,
    peer_endorsements_count INTEGER DEFAULT 0,
    verified_skills_count INTEGER DEFAULT 0,
    
    -- Engagement metrics
    help_forum_answers_count INTEGER DEFAULT 0,
    helpful_votes_received INTEGER DEFAULT 0,
    response_rate_percentage DECIMAL(5,2) DEFAULT 0.00,
    average_response_time_hours DECIMAL(8,2),
    
    -- Composite scores
    expertise_score INTEGER DEFAULT 0, -- 0-100 based on verified skills and endorsements
    activity_score INTEGER DEFAULT 0, -- 0-100 based on platform activity
    reliability_score INTEGER DEFAULT 0, -- 0-100 based on collaboration success
    overall_trust_score INTEGER DEFAULT 0, -- 0-100 composite score
    
    -- Badges & achievements
    badges_earned TEXT[], -- 'active_contributor', 'peer_reviewer', 'mentor', 'speaker', etc.
    
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Peer Endorsements (general professional endorsements)
CREATE TABLE IF NOT EXISTS peer_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endorsee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endorser_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    relationship VARCHAR(100), -- 'colleague', 'supervisor', 'collaborator', 'mentee', 'conference_contact'
    relationship_duration VARCHAR(50), -- 'less_than_1_year', '1-3_years', '3-5_years', 'more_than_5_years'
    work_context TEXT[], -- 'research_collaboration', 'teaching', 'conference', 'consulting_project'
    
    endorsement_text TEXT NOT NULL,
    
    -- Specific strengths
    technical_skills_rating INTEGER CHECK (technical_skills_rating BETWEEN 1 AND 5),
    collaboration_rating INTEGER CHECK (collaboration_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    reliability_rating INTEGER CHECK (reliability_rating BETWEEN 1 AND 5),
    innovation_rating INTEGER CHECK (innovation_rating BETWEEN 1 AND 5),
    
    would_collaborate_again BOOLEAN DEFAULT TRUE,
    would_recommend BOOLEAN DEFAULT TRUE,
    
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(endorsee_id, endorser_id)
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_user_technical_skills_user ON user_technical_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_technical_skills_category ON user_technical_skills(skill_category);
CREATE INDEX IF NOT EXISTS idx_user_technical_skills_proficiency ON user_technical_skills(proficiency_level);

CREATE INDEX IF NOT EXISTS idx_user_software_expertise_user ON user_software_expertise(user_id);
CREATE INDEX IF NOT EXISTS idx_user_software_expertise_type ON user_software_expertise(software_type);

CREATE INDEX IF NOT EXISTS idx_user_laboratory_techniques_user ON user_laboratory_techniques(user_id);
CREATE INDEX IF NOT EXISTS idx_user_laboratory_techniques_category ON user_laboratory_techniques(technique_category);

CREATE INDEX IF NOT EXISTS idx_user_certifications_user ON user_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_certifications_current ON user_certifications(is_current);

CREATE INDEX IF NOT EXISTS idx_user_availability_service ON user_availability(available_as_service_provider);
CREATE INDEX IF NOT EXISTS idx_user_availability_speaker ON user_availability(available_as_keynote_speaker);
CREATE INDEX IF NOT EXISTS idx_user_availability_consultant ON user_availability(available_as_consultant);

CREATE INDEX IF NOT EXISTS idx_speaking_engagements_user ON speaking_engagements(user_id);
CREATE INDEX IF NOT EXISTS idx_speaking_engagements_date ON speaking_engagements(event_date);

CREATE INDEX IF NOT EXISTS idx_peer_endorsements_endorsee ON peer_endorsements(endorsee_id);
CREATE INDEX IF NOT EXISTS idx_peer_endorsements_endorser ON peer_endorsements(endorser_id);

CREATE INDEX IF NOT EXISTS idx_user_platform_scores_trust ON user_platform_scores(overall_trust_score);
CREATE INDEX IF NOT EXISTS idx_user_platform_scores_expertise ON user_platform_scores(expertise_score);


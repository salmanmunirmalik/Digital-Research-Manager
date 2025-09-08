-- Researcher Portfolio and Co-Supervisor Ecosystem Schema
-- PostgreSQL Schema for AI-Powered Research Portfolio Management

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search and similarity

-- Research Domain Enum
CREATE TYPE research_domain AS ENUM (
    'biology',
    'chemistry',
    'physics',
    'mathematics',
    'computer_science',
    'engineering',
    'medicine',
    'psychology',
    'environmental_science',
    'materials_science',
    'biotechnology',
    'neuroscience',
    'genetics',
    'pharmacology',
    'other'
);

-- Publication Status Enum
CREATE TYPE publication_status AS ENUM (
    'published',
    'accepted',
    'submitted',
    'under_review',
    'in_preparation',
    'preprint'
);

-- Collaboration Type Enum
CREATE TYPE collaboration_type AS ENUM (
    'co_supervision',
    'research_exchange',
    'joint_project',
    'mentorship',
    'collaboration'
);

-- Availability Status Enum
CREATE TYPE availability_status AS ENUM (
    'available',
    'busy',
    'not_available',
    'limited'
);

-- Researcher Publications Table
CREATE TABLE researcher_publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    researcher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    abstract TEXT,
    authors TEXT[] NOT NULL,
    journal TEXT,
    publication_date DATE,
    doi VARCHAR(255),
    arxiv_id VARCHAR(255),
    pdf_url TEXT,
    pdf_content TEXT, -- Extracted text content from PDF
    keywords TEXT[],
    research_domains research_domain[],
    publication_status publication_status DEFAULT 'published',
    citation_count INTEGER DEFAULT 0,
    impact_factor DECIMAL(5,2),
    ai_summary TEXT, -- AI-generated summary
    ai_keywords TEXT[], -- AI-extracted keywords
    ai_research_areas TEXT[], -- AI-identified research areas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Researcher Profile Extensions
CREATE TABLE researcher_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution TEXT,
    department TEXT,
    position TEXT,
    research_interests TEXT[],
    expertise_areas TEXT[],
    research_domains research_domain[],
    years_of_experience INTEGER,
    h_index INTEGER DEFAULT 0,
    total_citations INTEGER DEFAULT 0,
    total_publications INTEGER DEFAULT 0,
    current_projects TEXT[],
    previous_institutions TEXT[],
    awards TEXT[],
    grants TEXT[],
    languages TEXT[],
    availability_status availability_status DEFAULT 'available',
    max_students INTEGER DEFAULT 5,
    current_students INTEGER DEFAULT 0,
    collaboration_preferences TEXT,
    research_philosophy TEXT,
    mentorship_style TEXT,
    lab_website TEXT,
    orcid_id VARCHAR(255),
    google_scholar_id VARCHAR(255),
    researchgate_id VARCHAR(255),
    linkedin_url TEXT,
    twitter_handle VARCHAR(255),
    ai_generated_bio TEXT, -- AI-generated professional bio
    ai_research_strengths TEXT[], -- AI-identified research strengths
    ai_collaboration_style TEXT, -- AI-analyzed collaboration style
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Co-Supervisor Matching Table
CREATE TABLE co_supervisor_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_score DECIMAL(5,2) NOT NULL, -- 0-100 compatibility score
    research_domain_match research_domain[],
    expertise_match TEXT[],
    interest_alignment DECIMAL(3,2), -- 0-1 scale
    availability_match BOOLEAN DEFAULT TRUE,
    collaboration_potential DECIMAL(3,2), -- 0-1 scale
    student_message TEXT,
    supervisor_response TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, active, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, supervisor_id)
);

-- Research Exchange Opportunities
CREATE TABLE research_exchange_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    host_researcher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    research_domains research_domain[] NOT NULL,
    required_expertise TEXT[],
    duration_weeks INTEGER,
    start_date DATE,
    end_date DATE,
    funding_available BOOLEAN DEFAULT FALSE,
    funding_amount DECIMAL(10,2),
    accommodation_provided BOOLEAN DEFAULT FALSE,
    visa_support BOOLEAN DEFAULT FALSE,
    application_deadline DATE,
    max_applicants INTEGER DEFAULT 1,
    current_applicants INTEGER DEFAULT 0,
    requirements TEXT[],
    benefits TEXT[],
    contact_email VARCHAR(255),
    application_url TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, closed, filled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exchange Applications
CREATE TABLE exchange_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES research_exchange_opportunities(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    motivation TEXT NOT NULL,
    relevant_experience TEXT,
    research_proposal TEXT,
    cv_url TEXT,
    recommendation_letter_url TEXT,
    status VARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, accepted, rejected
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(opportunity_id, applicant_id)
);

-- AI Analysis Results
CREATE TABLE ai_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    researcher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL, -- 'publication_analysis', 'profile_analysis', 'matching_analysis'
    input_data JSONB NOT NULL,
    analysis_results JSONB NOT NULL,
    confidence_score DECIMAL(3,2), -- 0-1 scale
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Collaboration History
CREATE TABLE collaboration_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    researcher1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    researcher2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collaboration_type collaboration_type NOT NULL,
    project_title TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- active, completed, terminated
    outcome TEXT,
    satisfaction_rating DECIMAL(2,1), -- 1-5 scale
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_researcher_publications_researcher_id ON researcher_publications(researcher_id);
CREATE INDEX idx_researcher_publications_domains ON researcher_publications USING GIN(research_domains);
CREATE INDEX idx_researcher_publications_keywords ON researcher_publications USING GIN(keywords);
CREATE INDEX idx_researcher_publications_title_search ON researcher_publications USING GIN(to_tsvector('english', title));
CREATE INDEX idx_researcher_publications_abstract_search ON researcher_publications USING GIN(to_tsvector('english', abstract));

CREATE INDEX idx_researcher_profiles_user_id ON researcher_profiles(user_id);
CREATE INDEX idx_researcher_profiles_domains ON researcher_profiles USING GIN(research_domains);
CREATE INDEX idx_researcher_profiles_interests ON researcher_profiles USING GIN(research_interests);
CREATE INDEX idx_researcher_profiles_availability ON researcher_profiles(availability_status);

CREATE INDEX idx_co_supervisor_matches_student ON co_supervisor_matches(student_id);
CREATE INDEX idx_co_supervisor_matches_supervisor ON co_supervisor_matches(supervisor_id);
CREATE INDEX idx_co_supervisor_matches_score ON co_supervisor_matches(match_score DESC);

CREATE INDEX idx_exchange_opportunities_domains ON research_exchange_opportunities USING GIN(research_domains);
CREATE INDEX idx_exchange_opportunities_status ON research_exchange_opportunities(status);
CREATE INDEX idx_exchange_opportunities_deadline ON research_exchange_opportunities(application_deadline);

CREATE INDEX idx_exchange_applications_opportunity ON exchange_applications(opportunity_id);
CREATE INDEX idx_exchange_applications_applicant ON exchange_applications(applicant_id);
CREATE INDEX idx_exchange_applications_status ON exchange_applications(status);

-- Create full-text search indexes
CREATE INDEX idx_researcher_publications_fulltext ON researcher_publications USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(abstract, '') || ' ' || COALESCE(array_to_string(keywords, ' '), ''))
);

-- Functions for AI-powered matching
CREATE OR REPLACE FUNCTION calculate_research_compatibility(
    student_interests TEXT[],
    supervisor_domains research_domain[],
    supervisor_interests TEXT[]
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    domain_score DECIMAL(5,2) := 0;
    interest_score DECIMAL(5,2) := 0;
    total_score DECIMAL(5,2);
BEGIN
    -- Calculate domain alignment (40% weight)
    IF supervisor_domains IS NOT NULL AND array_length(supervisor_domains, 1) > 0 THEN
        domain_score := 40.0;
    END IF;
    
    -- Calculate interest alignment (60% weight)
    IF supervisor_interests IS NOT NULL AND student_interests IS NOT NULL THEN
        interest_score := (
            SELECT COUNT(*) * 60.0 / GREATEST(array_length(supervisor_interests, 1), 1)
            FROM unnest(supervisor_interests) AS s_interest
            WHERE s_interest = ANY(student_interests)
        );
    END IF;
    
    total_score := domain_score + interest_score;
    RETURN LEAST(total_score, 100.0);
END;
$$ LANGUAGE plpgsql;

-- Function to extract research domains from publications
CREATE OR REPLACE FUNCTION extract_research_domains_from_publications(
    researcher_uuid UUID
) RETURNS research_domain[] AS $$
DECLARE
    domains research_domain[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT unnest(research_domains))
    INTO domains
    FROM researcher_publications
    WHERE researcher_id = researcher_uuid;
    
    RETURN COALESCE(domains, ARRAY[]::research_domain[]);
END;
$$ LANGUAGE plpgsql;

-- Function to generate AI-powered researcher summary
CREATE OR REPLACE FUNCTION generate_researcher_summary(
    researcher_uuid UUID
) RETURNS TEXT AS $$
DECLARE
    profile_record RECORD;
    publication_count INTEGER;
    total_citations INTEGER;
    recent_publications TEXT[];
    summary TEXT;
BEGIN
    -- Get researcher profile
    SELECT * INTO profile_record
    FROM researcher_profiles
    WHERE user_id = researcher_uuid;
    
    -- Get publication statistics
    SELECT COUNT(*), COALESCE(SUM(citation_count), 0)
    INTO publication_count, total_citations
    FROM researcher_publications
    WHERE researcher_id = researcher_uuid;
    
    -- Get recent publication titles (fixed syntax)
    SELECT ARRAY_AGG(title ORDER BY publication_date DESC)
    INTO recent_publications
    FROM (
        SELECT title FROM researcher_publications
        WHERE researcher_id = researcher_uuid
        AND publication_date IS NOT NULL
        ORDER BY publication_date DESC
        LIMIT 3
    ) AS recent_pubs;
    
    -- Generate summary
    summary := 'Dr. ' || COALESCE(profile_record.position, 'Researcher') || ' at ' || COALESCE(profile_record.institution, 'Unknown Institution') || 
               ' with expertise in ' || COALESCE(array_to_string(profile_record.expertise_areas, ', '), 'various fields') ||
               '. Published ' || publication_count || ' papers with ' || total_citations || ' total citations.';
    
    IF recent_publications IS NOT NULL AND array_length(recent_publications, 1) > 0 THEN
        summary := summary || ' Recent work includes: ' || array_to_string(recent_publications, '; ');
    END IF;
    
    RETURN summary;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update researcher profile statistics
CREATE OR REPLACE FUNCTION update_researcher_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE researcher_profiles
    SET 
        total_publications = (
            SELECT COUNT(*) FROM researcher_publications 
            WHERE researcher_id = NEW.researcher_id
        ),
        total_citations = (
            SELECT COALESCE(SUM(citation_count), 0) FROM researcher_publications 
            WHERE researcher_id = NEW.researcher_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.researcher_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_researcher_stats
    AFTER INSERT OR UPDATE OR DELETE ON researcher_publications
    FOR EACH ROW
    EXECUTE FUNCTION update_researcher_stats();

-- View for researcher matching dashboard
CREATE VIEW researcher_matching_dashboard AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    rp.institution,
    rp.position,
    rp.research_domains,
    rp.research_interests,
    rp.expertise_areas,
    rp.availability_status,
    rp.max_students,
    rp.current_students,
    rp.total_publications,
    rp.total_citations,
    rp.h_index,
    COUNT(DISTINCT rpubs.id) as recent_publications_count,
    ARRAY_AGG(rpubs.title ORDER BY rpubs.publication_date DESC) FILTER (WHERE rpubs.publication_date >= CURRENT_DATE - INTERVAL '2 years') as recent_titles
FROM users u
LEFT JOIN researcher_profiles rp ON u.id = rp.user_id
LEFT JOIN researcher_publications rpubs ON u.id = rpubs.researcher_id
WHERE u.role IN ('principal_researcher', 'co_supervisor', 'researcher')
GROUP BY u.id, u.first_name, u.last_name, u.email, rp.institution, rp.position, 
         rp.research_domains, rp.research_interests, rp.expertise_areas, 
         rp.availability_status, rp.max_students, rp.current_students,
         rp.total_publications, rp.total_citations, rp.h_index;

-- Grant permissions (using postgres user for now)
GRANT SELECT, INSERT, UPDATE, DELETE ON researcher_publications TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON researcher_profiles TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON co_supervisor_matches TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON research_exchange_opportunities TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON exchange_applications TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_analysis_results TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON collaboration_history TO postgres;
GRANT SELECT ON researcher_matching_dashboard TO postgres;

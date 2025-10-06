-- Research Data Bank Schema Migration
-- This migration creates tables for the Research Data Bank platform

-- Create ENUM types for the Research Data Bank
CREATE TYPE databank_org_type AS ENUM (
    'research_lab',
    'hospital', 
    'diagnostic_lab',
    'industry',
    'public_sector',
    'ngo',
    'individual'
);

CREATE TYPE databank_org_category AS ENUM (
    'healthcare',
    'research',
    'industry',
    'government',
    'nonprofit',
    'academic'
);

CREATE TYPE databank_data_type AS ENUM (
    'clinical',
    'epidemiological',
    'genomic',
    'environmental',
    'social',
    'economic',
    'demographic'
);

CREATE TYPE databank_population_type AS ENUM (
    'general',
    'pediatric',
    'adult',
    'elderly',
    'specific_condition'
);

CREATE TYPE databank_access_level AS ENUM (
    'open',
    'restricted',
    'collaboration_required'
);

CREATE TYPE databank_request_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'in_progress',
    'completed'
);

-- Organizations table
CREATE TABLE databank_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type databank_org_type NOT NULL,
    category databank_org_category NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    description TEXT NOT NULL,
    specializations TEXT[] NOT NULL DEFAULT '{}',
    verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.0,
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data offers table
CREATE TABLE databank_data_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES databank_organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    data_type databank_data_type NOT NULL,
    disease_focus TEXT[] DEFAULT '{}',
    population_type databank_population_type NOT NULL,
    sample_size INTEGER,
    geographic_coverage TEXT[] NOT NULL DEFAULT '{}',
    time_period VARCHAR(100) NOT NULL,
    access_level databank_access_level NOT NULL,
    requirements TEXT[] NOT NULL DEFAULT '{}',
    contact_person VARCHAR(255) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    request_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data requests table
CREATE TABLE databank_data_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_offer_id UUID NOT NULL REFERENCES databank_data_offers(id) ON DELETE CASCADE,
    requester_name VARCHAR(255) NOT NULL,
    requester_institution VARCHAR(255) NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    methodology TEXT,
    timeline VARCHAR(100),
    collaboration_proposed BOOLEAN DEFAULT FALSE,
    additional_notes TEXT,
    status databank_request_status DEFAULT 'pending',
    response TEXT,
    notes TEXT,
    submitted_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organization ratings table
CREATE TABLE databank_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES databank_organizations(id) ON DELETE CASCADE,
    rater_name VARCHAR(255) NOT NULL,
    rater_email VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organization verification table
CREATE TABLE databank_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES databank_organizations(id) ON DELETE CASCADE,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verification_notes TEXT,
    documents_provided TEXT[],
    verification_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data usage tracking table
CREATE TABLE databank_data_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_request_id UUID NOT NULL REFERENCES databank_data_requests(id) ON DELETE CASCADE,
    usage_type VARCHAR(50) NOT NULL, -- 'download', 'access', 'collaboration'
    usage_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_databank_orgs_type ON databank_organizations(type);
CREATE INDEX idx_databank_orgs_category ON databank_organizations(category);
CREATE INDEX idx_databank_orgs_country ON databank_organizations(country);
CREATE INDEX idx_databank_orgs_verified ON databank_organizations(verified);
CREATE INDEX idx_databank_orgs_rating ON databank_organizations(rating);
CREATE INDEX idx_databank_orgs_specializations ON databank_organizations USING GIN(specializations);

CREATE INDEX idx_databank_offers_org_id ON databank_data_offers(organization_id);
CREATE INDEX idx_databank_offers_data_type ON databank_data_offers(data_type);
CREATE INDEX idx_databank_offers_access_level ON databank_data_offers(access_level);
CREATE INDEX idx_databank_offers_disease_focus ON databank_data_offers USING GIN(disease_focus);
CREATE INDEX idx_databank_offers_geographic ON databank_data_offers USING GIN(geographic_coverage);

CREATE INDEX idx_databank_requests_offer_id ON databank_data_requests(data_offer_id);
CREATE INDEX idx_databank_requests_status ON databank_data_requests(status);
CREATE INDEX idx_databank_requests_submitted ON databank_data_requests(submitted_date);
CREATE INDEX idx_databank_requests_email ON databank_data_requests(requester_email);

CREATE INDEX idx_databank_ratings_org_id ON databank_ratings(organization_id);
CREATE INDEX idx_databank_verifications_org_id ON databank_verifications(organization_id);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_databank_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_databank_organizations_timestamp
    BEFORE UPDATE ON databank_organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_databank_timestamp();

CREATE TRIGGER update_databank_data_offers_timestamp
    BEFORE UPDATE ON databank_data_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_databank_timestamp();

CREATE TRIGGER update_databank_data_requests_timestamp
    BEFORE UPDATE ON databank_data_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_databank_timestamp();

-- Create view for organization statistics
CREATE VIEW databank_organization_stats AS
SELECT 
    o.id,
    o.name,
    o.type,
    o.category,
    o.country,
    o.verified,
    o.rating,
    COUNT(d.id) as data_offer_count,
    SUM(d.request_count) as total_requests,
    AVG(r.rating) as avg_rating,
    COUNT(r.id) as rating_count,
    o.joined_date,
    o.last_active
FROM databank_organizations o
LEFT JOIN databank_data_offers d ON o.id = d.organization_id
LEFT JOIN databank_ratings r ON o.id = r.organization_id
GROUP BY o.id, o.name, o.type, o.category, o.country, o.verified, o.rating, o.joined_date, o.last_active;

-- Create view for data offer statistics
CREATE VIEW databank_data_offer_stats AS
SELECT 
    d.id,
    d.title,
    d.data_type,
    d.access_level,
    d.request_count,
    o.name as organization_name,
    o.country as organization_country,
    o.verified as organization_verified,
    COUNT(dr.id) as request_count_actual,
    COUNT(dr.id) FILTER (WHERE dr.status = 'approved') as approved_requests,
    d.last_updated
FROM databank_data_offers d
JOIN databank_organizations o ON d.organization_id = o.id
LEFT JOIN databank_data_requests dr ON d.id = dr.data_offer_id
GROUP BY d.id, d.title, d.data_type, d.access_level, d.request_count, o.name, o.country, o.verified, d.last_updated;

-- Insert sample data for testing
INSERT INTO databank_organizations (
    name, type, category, country, region, contact_email, website, description, specializations, verified, rating
) VALUES 
(
    'Global Health Research Institute',
    'research_lab',
    'research',
    'United States',
    'North America',
    'data@ghri.org',
    'https://ghri.org',
    'Leading research institute focused on global health challenges, infectious diseases, and epidemiological studies.',
    ARRAY['HIV/AIDS', 'Malaria', 'Tuberculosis', 'Epidemiology', 'Public Health'],
    true,
    4.8
),
(
    'Central Hospital - Infectious Diseases Unit',
    'hospital',
    'healthcare',
    'Kenya',
    'East Africa',
    'research@centralhospital.ke',
    NULL,
    'Major teaching hospital with comprehensive infectious diseases surveillance and treatment programs.',
    ARRAY['HIV/AIDS', 'Tuberculosis', 'Malaria', 'Hepatitis', 'Clinical Research'],
    true,
    4.6
),
(
    'WHO Global HIV/AIDS Programme',
    'ngo',
    'government',
    'Switzerland',
    'Europe',
    'data@who.int',
    'https://who.int',
    'World Health Organization program providing global HIV/AIDS surveillance, prevention, and treatment data.',
    ARRAY['HIV/AIDS', 'Global Health', 'Surveillance', 'Policy', 'Guidelines'],
    true,
    4.9
);

-- Insert sample data offers
INSERT INTO databank_data_offers (
    organization_id, title, description, data_type, disease_focus, population_type, sample_size, 
    geographic_coverage, time_period, access_level, requirements, contact_person, request_count
) VALUES 
(
    (SELECT id FROM databank_organizations WHERE name = 'Global Health Research Institute'),
    'HIV Prevalence Data - Sub-Saharan Africa (2020-2024)',
    'Comprehensive HIV prevalence data from 15 countries in Sub-Saharan Africa, including demographic breakdowns, risk factors, and treatment outcomes.',
    'epidemiological',
    ARRAY['HIV/AIDS'],
    'general',
    50000,
    ARRAY['Kenya', 'Uganda', 'Tanzania', 'South Africa', 'Nigeria'],
    '2020-2024',
    'collaboration_required',
    ARRAY['IRB approval', 'Data use agreement', 'Collaboration proposal'],
    'Dr. Sarah Johnson',
    23
),
(
    (SELECT id FROM databank_organizations WHERE name = 'Central Hospital - Infectious Diseases Unit'),
    'HIV Treatment Outcomes - Nairobi Region',
    'Clinical data on HIV treatment outcomes, adherence patterns, and resistance profiles from 10,000+ patients.',
    'clinical',
    ARRAY['HIV/AIDS'],
    'adult',
    12500,
    ARRAY['Nairobi', 'Kiambu'],
    '2019-2024',
    'restricted',
    ARRAY['Ethics committee approval', 'Data sharing agreement', 'Research proposal'],
    'Dr. Michael Kimani',
    15
),
(
    (SELECT id FROM databank_organizations WHERE name = 'WHO Global HIV/AID Programme'),
    'Global HIV Statistics - 2024',
    'Official WHO HIV/AIDS statistics including prevalence, incidence, treatment coverage, and mortality data from 194 countries.',
    'epidemiological',
    ARRAY['HIV/AIDS'],
    'general',
    1000000,
    ARRAY['Global'],
    '2024',
    'open',
    ARRAY['Registration', 'Data use agreement'],
    'Dr. Meg Doherty',
    156
);

-- Insert sample ratings
INSERT INTO databank_ratings (organization_id, rater_name, rater_email, rating, review) VALUES 
(
    (SELECT id FROM databank_organizations WHERE name = 'Global Health Research Institute'),
    'Dr. John Smith',
    'john.smith@university.edu',
    5,
    'Excellent data quality and very responsive to collaboration requests.'
),
(
    (SELECT id FROM databank_organizations WHERE name = 'Central Hospital - Infectious Diseases Unit'),
    'Dr. Maria Garcia',
    'maria.garcia@research.org',
    4,
    'High-quality clinical data with comprehensive documentation.'
),
(
    (SELECT id FROM databank_organizations WHERE name = 'WHO Global HIV/AIDS Programme'),
    'Prof. David Lee',
    'david.lee@institute.edu',
    5,
    'Authoritative global data with excellent accessibility and documentation.'
);

-- Update organization ratings based on actual ratings
UPDATE databank_organizations 
SET rating = (
    SELECT AVG(rating)::DECIMAL(3,2)
    FROM databank_ratings 
    WHERE organization_id = databank_organizations.id
)
WHERE id IN (SELECT DISTINCT organization_id FROM databank_ratings);

COMMENT ON TABLE databank_organizations IS 'Organizations participating in the Research Data Bank';
COMMENT ON TABLE databank_data_offers IS 'Data offers made by organizations in the Research Data Bank';
COMMENT ON TABLE databank_data_requests IS 'Requests for data access submitted by researchers';
COMMENT ON TABLE databank_ratings IS 'Ratings and reviews for organizations by data users';
COMMENT ON TABLE databank_verifications IS 'Organization verification records by platform administrators';
COMMENT ON TABLE databank_data_usage IS 'Tracking of actual data usage after access is granted';

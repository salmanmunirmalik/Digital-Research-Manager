-- Journals Directory Migration
-- Creates comprehensive scientific journals database with metrics and filtering

-- Publishers table
CREATE TABLE IF NOT EXISTS publishers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    country VARCHAR(100),
    website VARCHAR(255),
    description TEXT,
    established_year INTEGER,
    is_open_access BOOLEAN DEFAULT false,
    peer_review_policy TEXT,
    ethical_policies TEXT,
    contact_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Journal categories/subject areas
CREATE TABLE IF NOT EXISTS journal_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES journal_categories(id),
    scimago_category VARCHAR(255), -- Official SCIMago subject category
    color VARCHAR(7), -- Hex color for UI
    icon VARCHAR(50), -- Icon name for UI
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Journals table
CREATE TABLE IF NOT EXISTS journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publisher_id UUID REFERENCES publishers(id),
    title VARCHAR(500) NOT NULL,
    abbreviation VARCHAR(100),
    issn_print VARCHAR(20),
    issn_online VARCHAR(20),
    eissn VARCHAR(20),
    doi_prefix VARCHAR(50),
    description TEXT,
    aims_scope TEXT,
    
    -- Publication details
    publication_frequency VARCHAR(50), -- Monthly, Quarterly, etc.
    language VARCHAR(100) DEFAULT 'English',
    supported_languages TEXT[],
    hybrid_model BOOLEAN DEFAULT false,
    open_access_option BOOLEAN DEFAULT false,
    fully_open_access BOOLEAN DEFAULT false,
    
    -- Journal metrics
    impact_factor DECIMAL(6,3),
    impact_factor_year INTEGER,
    cite_score DECIMAL(6,2),
    sjmr_quartile INTEGER CHECK (sjmr_quartile >= 1 AND sjmr_quartile <= 4),
    h_index INTEGER DEFAULT 0,
    total_citations INTEGER DEFAULT 0,
    documents_per_year INTEGER DEFAULT 0,
    
    -- Publication costs
    article_processing_charge DECIMAL(10,2), -- APC
    apc_currency VARCHAR(3) DEFAULT 'USD',
    submission_fee DECIMAL(10,2) DEFAULT 0,
    page_charges DECIMAL(10,2) DEFAULT 0,
    color_figure_charges DECIMAL(10,2) DEFAULT 0,
    
    -- Review process
    review_type VARCHAR(50), -- Single-blind, Double-blind, Open peer review
    average_review_time INTEGER, -- Days
    acceptance_rate DECIMAL(5,2), -- Percentage
    
    -- Website and contact
    website VARCHAR(255),
    submission_url VARCHAR(255),
    editorial_board_link VARCHAR(255),
    contact_email VARCHAR(255),
    
    -- Status and verification
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, discontinued
    verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many relationship: Journals to Categories
CREATE TABLE IF NOT EXISTS journal_categories_mapping (
    journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES journal_categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    PRIMARY KEY (journal_id, category_id)
);

-- Journal metrics history for tracking changes over time
CREATE TABLE IF NOT EXISTS journal_metrics_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    impact_factor DECIMAL(6,3),
    cite_score DECIMAL(6,2),
    sjmr_quartile INTEGER CHECK (sjmr_quartile >= 1 AND sjmr_quartile <= 4),
    h_index INTEGER DEFAULT 0,
    total_citations INTEGER DEFAULT 0,
    documents_per_year INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User's journal recommendations and favorites
CREATE TABLE IF NOT EXISTS user_journal_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
    preference_type VARCHAR(20) NOT NULL, -- favorite, reviewed, recommended, avoided
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, journal_id)
);

-- Journal reviews/comments by researchers
CREATE TABLE IF NOT EXISTS journal_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_title VARCHAR(255),
    review_text TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- Detailed ratings
    review_process_rating INTEGER CHECK (review_process_rating >= 1 AND review_process_rating <= 5),
    publication_speed_rating INTEGER CHECK (publication_speed_rating >= 1 AND publication_speed_rating <= 5),
    editorial_quality_rating INTEGER CHECK (editorial_quality_rating >= 1 AND editorial_quality_rating <= 5),
    journal_prestige_rating INTEGER CHECK (journal_prestige_rating >= 1 AND journal_prestige_rating <= 5),
    
    -- Review metadata
    publication_experience TEXT, -- New author, experienced author, etc.
    review_date DATE, -- When they published in this journal
    verified_publication BOOLEAN DEFAULT false,
    
    -- Engagement metrics
    helpful_votes INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'active', -- active, hidden, flagged
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_journals_title ON journals(title);
CREATE INDEX IF NOT EXISTS idx_journals_issn_print ON journals(issn_print);
CREATE INDEX IF NOT EXISTS idx_journals_issn_online ON journals(issn_online);
CREATE INDEX IF NOT EXISTS idx_journals_impact_factor ON journals(impact_factor);
CREATE INDEX IF NOT EXISTS idx_journals_h_index ON journals(h_index);
CREATE INDEX IF NOT EXISTS idx_journals_apc ON journals(article_processing_charge);
CREATE INDEX IF NOT EXISTS idx_journals_open_access ON journals(fully_open_access);
CREATE INDEX IF NOT EXISTS idx_journals_sjmr_quartile ON journals(sjmr_quartile);
CREATE INDEX IF NOT EXISTS idx_journals_publisher ON journals(publisher_id);
CREATE INDEX IF NOT EXISTS idx_journal_categories_mapping_journal ON journal_categories_mapping(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_categories_mapping_category ON journal_categories_mapping(category_id);
CREATE INDEX IF NOT EXISTS idx_journal_metrics_history_journal ON journal_metrics_history(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_metrics_history_year ON journal_metrics_history(year);
CREATE INDEX IF NOT EXISTS idx_user_journal_preferences_user ON user_journal_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journal_preferences_type ON user_journal_preferences(preference_type);
CREATE INDEX IF NOT EXISTS idx_journal_reviews_journal ON journal_reviews(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_reviews_user ON journal_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_reviews_rating ON journal_reviews(rating);

-- Triggers for updated_at
CREATE TRIGGER update_journals_updated_at BEFORE UPDATE ON journals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publishers_updated_at BEFORE UPDATE ON publishers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_journal_preferences_updated_at BEFORE UPDATE ON user_journal_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_reviews_updated_at BEFORE UPDATE ON journal_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample publishers
INSERT INTO publishers (name, short_name, country, website, is_open_access) VALUES
('Nature Publishing Group', 'NPG', 'United Kingdom', 'https://www.nature.com', false),
('Elsevier', 'Elsevier', 'Netherlands', 'https://www.elsevier.com', false),
('Wiley-Blackwell', 'Wiley', 'United States', 'https://onlinelibrary.wiley.com', false),
('PLOS', 'PLOS', 'United States', 'https://journals.plos.org', true),
('BioMed Central', 'BMC', 'United Kingdom', 'https://www.biomedcentral.com', true),
('Frontiers Media', 'Frontiers', 'Switzerland', 'https://www.frontiersin.org', true);

-- Insert sample journal categories
INSERT INTO journal_categories (name, description, scimago_category, color, icon) VALUES
('Biology', 'General and specialized biology journals', 'General Biology', '#4CAF50', 'DnaIcon'),
('Biochemistry', 'Molecular biochemistry and enzymology', 'Biochemistry', '#2196F3', 'FlaskIcon'),
('Cell Biology', 'Cellular processes and mechanisms', 'Cell Biology', '#FF9800', 'MicroscopeIcon'),
('Microbiology', 'Microorganisms and infectious diseases', 'Microbiology', '#9C27B0', 'ShieldIcon'),
('Genetics', 'Heredity and genomics', 'Genetics', '#3F51B5', 'CodeIcon'),
('Medicine', 'Clinical medicine and translational research', 'General Medicine', '#F44336', 'HeartIcon'),
('Neuroscience', 'Brain and nervous system research', 'Neuroscience', '#607D8B', 'BrainCircuitIcon'),
('Immunology', 'Immune system and disorders', 'Immunology', '#795548', 'ShieldCheckIcon'),
('Ecology', 'Environmental and ecosystem science', 'Ecology', '#4CAF50', 'TreeIcon'),
('Engineering', 'Biomedical and biotechnology engineering', 'Biotechnology', '#FF5722', 'SettingsIcon');

-- Insert sample journals
INSERT INTO journals (publisher_id, title, abbreviation, issn_print, issn_online, impact_factor, h_index, open_access_option, fully_open_access, article_processing_charge, apc_currency, language, status) VALUES
((SELECT id FROM publishers WHERE name = 'Nature Publishing Group'), 'Nature', 'Nature', '0028-0836', '1476-4687', 69.504, 945, false, false, 0, 'USD', 'English', 'active'),
((SELECT id FROM publishers WHERE name = 'PLOS'), 'PLOS ONE', 'PLOS ONE', '1932-6203', '1932-6203', 3.752, 485, true, true, 1350, 'USD', 'English', 'active'),
((SELECT id FROM publishers WHERE name = 'Elsevier'), 'Cell', 'Cell', '0092-8674', '1097-4172', 66.850, 920, false, false, 0, 'USD', 'English', 'active'),
((SELECT id FROM publishers WHERE name = 'BioMed Central'), 'BMC Biology', 'BMC Biol', '1741-7007', '1741-7007', 6.527, 167, true, true, 1990, 'USD', 'English', 'active'),
((SELECT id FROM publishers WHERE name = 'Frontiers Media'), 'Frontiers in Immunology', 'Front Immunol', '1664-3224', '1664-3224', 7.561, 123, true, true, 2950, 'USD', 'English', 'active');

-- Map journals to categories
INSERT INTO journal_categories_mapping (journal_id, category_id, is_primary) 
SELECT j.id, c.id, true
FROM journals j, journal_categories c 
WHERE j.title = 'Nature' AND c.name = 'Biology';

INSERT INTO journal_categories_mapping (journal_id, category_id, is_primary) 
SELECT j.id, c.id, true
FROM journals j, journal_categories c 
WHERE j.title = 'Cell' AND c.name = 'Cell Biology';

INSERT INTO journal_categories_mapping (journal_id, category_id, is_primary) 
SELECT j.id, c.id, true
FROM journals j, journal_categories c 
WHERE j.title = 'BMC Biology' AND c.name = 'Biology';

INSERT INTO journal_categories_mapping (journal_id, category_id, is_primary) 
SELECT j.id, c.id, true
FROM journals j, journal_categories c 
WHERE j.title = 'Frontiers in Immunology' AND c.name = 'Immunology';

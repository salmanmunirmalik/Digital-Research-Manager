-- Science For All Journal (SFAJ) Migration
-- Community-powered, open-access scientific journal

-- Drop old tables if they exist
DROP TABLE IF EXISTS scientist_first_citations CASCADE;
DROP TABLE IF EXISTS scientist_first_likes CASCADE;
DROP TABLE IF EXISTS scientist_first_reviews CASCADE;
DROP TABLE IF EXISTS scientist_first_articles CASCADE;

-- Journal articles table
CREATE TABLE IF NOT EXISTS sfaj_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Article details
    title VARCHAR(500) NOT NULL,
    abstract TEXT NOT NULL,
    full_text TEXT,
    
    -- Authors
    authors TEXT[] NOT NULL,
    corresponding_author_email VARCHAR(255),
    author_affiliations TEXT[],
    
    -- Publication metadata
    keywords TEXT[],
    research_domain VARCHAR(100),
    article_type VARCHAR(50) DEFAULT 'research_article', -- research_article, review, case_study, method, opinion
    doi VARCHAR(255) UNIQUE,
    
    -- File attachments
    manuscript_url VARCHAR(500),
    supplementary_files TEXT[],
    figures TEXT[],
    tables TEXT[],
    
    -- Submission and review
    submitted_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    review_status VARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, revision_requested, accepted, rejected, published
    review_model VARCHAR(50) DEFAULT 'double_blind', -- double_blind, open_review, community_review
    review_comments TEXT,
    
    -- Publication details
    publication_date DATE,
    volume INTEGER,
    issue INTEGER,
    article_number VARCHAR(50),
    pages VARCHAR(50),
    
    -- Open access compliance
    creative_commons_license VARCHAR(50) DEFAULT 'CC-BY',
    is_open_access BOOLEAN DEFAULT true,
    
    -- Metrics
    views_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    citations_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, archived, withdrawn
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Volunteer roles and contributions
CREATE TABLE IF NOT EXISTS sfaj_volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Role information
    role VARCHAR(50) NOT NULL, -- reviewer, editor, proofreader, layout_designer, translator, mentor
    specialization TEXT[], -- Areas of expertise
    availability_status VARCHAR(50) DEFAULT 'available', -- available, busy, inactive
    
    -- Qualifications
    educational_background TEXT,
    research_experience_years INTEGER,
    previous_journal_experience TEXT,
    
    -- Impact tracking
    total_reviews INTEGER DEFAULT 0,
    total_edits INTEGER DEFAULT 0,
    impact_points INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    is_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role)
);

-- Article reviews/comments by reviewers
CREATE TABLE IF NOT EXISTS sfaj_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES sfaj_articles(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Review details
    review_type VARCHAR(50) DEFAULT 'peer_review', -- peer_review, community_comment
    review_text TEXT NOT NULL,
    decision VARCHAR(50), -- accept, minor_revision, major_revision, reject
    
    -- Review criteria ratings (1-5)
    novelty_rating INTEGER CHECK (novelty_rating >= 1 AND novelty_rating <= 5),
    methodology_rating INTEGER CHECK (methodology_rating >= 1 AND methodology_rating <= 5),
    clarity_rating INTEGER CHECK (clarity_rating >= 1 AND clarity_rating <= 5),
    significance_rating INTEGER CHECK (significance_rating >= 1 AND significance_rating <= 5),
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    
    -- Review status
    status VARCHAR(20) DEFAULT 'active', -- active, hidden
    is_public BOOLEAN DEFAULT false,
    
    -- For community reviews
    is_anonymous BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Article likes/bookmarks
CREATE TABLE IF NOT EXISTS sfaj_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES sfaj_articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, user_id)
);

-- Article citations
CREATE TABLE IF NOT EXISTS sfaj_citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citing_article_id UUID NOT NULL REFERENCES sfaj_articles(id) ON DELETE CASCADE,
    cited_article_id UUID NOT NULL REFERENCES sfaj_articles(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(citing_article_id, cited_article_id)
);

-- Open Science Badges
CREATE TABLE IF NOT EXISTS sfaj_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Badge information
    badge_type VARCHAR(50) NOT NULL, -- reviewer, editor, mentor, translator, contributor
    badge_level VARCHAR(50) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Contribution details
    contribution_count INTEGER DEFAULT 0,
    description TEXT,
    
    UNIQUE(user_id, badge_type, badge_level)
);

-- Impact Points Log
CREATE TABLE IF NOT EXISTS sfaj_impact_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Points details
    points INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL, -- review_completed, edit_completed, article_published, etc.
    related_article_id UUID REFERENCES sfaj_articles(id) ON DELETE SET NULL,
    
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sfaj_articles_user_id ON sfaj_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_sfaj_articles_status ON sfaj_articles(status);
CREATE INDEX IF NOT EXISTS idx_sfaj_articles_review_status ON sfaj_articles(review_status);
CREATE INDEX IF NOT EXISTS idx_sfaj_articles_publication_date ON sfaj_articles(publication_date);
CREATE INDEX IF NOT EXISTS idx_sfaj_articles_research_domain ON sfaj_articles(research_domain);
CREATE INDEX IF NOT EXISTS idx_sfaj_articles_keywords ON sfaj_articles USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_sfaj_reviews_article_id ON sfaj_reviews(article_id);
CREATE INDEX IF NOT EXISTS idx_sfaj_likes_article_id ON sfaj_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_sfaj_likes_user_id ON sfaj_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_sfaj_volunteers_user_id ON sfaj_volunteers(user_id);
CREATE INDEX IF NOT EXISTS idx_sfaj_volunteers_role ON sfaj_volunteers(role);
CREATE INDEX IF NOT EXISTS idx_sfaj_badges_user_id ON sfaj_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_sfaj_impact_points_user_id ON sfaj_impact_points(user_id);

-- Seed data: Insert "Science For All Journal" info
INSERT INTO journals (id, title, abbreviation, issn_print, issn_online, description, website, fully_open_access, impact_factor, status, verified)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Science For All Journal',
    'SFAJ',
    NULL,
    NULL,
    'A community-powered, open-access scientific journal enabling free knowledge creation, review, and publishing. No APCs, no barriers - science belongs to humanity.',
    'https://digital-research-manager.onrender.com/journal',
    true,
    0.00,
    'active',
    true
)
ON CONFLICT DO NOTHING;


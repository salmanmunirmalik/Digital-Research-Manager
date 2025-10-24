-- The Scientist First Journal Migration
-- Creates comprehensive journal for publishing scientific articles

-- Journal articles table
CREATE TABLE IF NOT EXISTS scientist_first_articles (
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
    review_comments TEXT,
    
    -- Publication details
    publication_date DATE,
    volume INTEGER,
    issue INTEGER,
    article_number VARCHAR(50),
    pages VARCHAR(50),
    
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

-- Article reviews/comments by reviewers
CREATE TABLE IF NOT EXISTS scientist_first_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES scientist_first_articles(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Review details
    review_type VARCHAR(50) DEFAULT 'peer_review', -- peer_review, public_comment
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Article likes/bookmarks
CREATE TABLE IF NOT EXISTS scientist_first_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES scientist_first_articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, user_id)
);

-- Article citations
CREATE TABLE IF NOT EXISTS scientist_first_citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citing_article_id UUID NOT NULL REFERENCES scientist_first_articles(id) ON DELETE CASCADE,
    cited_article_id UUID NOT NULL REFERENCES scientist_first_articles(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(citing_article_id, cited_article_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scientist_first_articles_user_id ON scientist_first_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_scientist_first_articles_status ON scientist_first_articles(status);
CREATE INDEX IF NOT EXISTS idx_scientist_first_articles_review_status ON scientist_first_articles(review_status);
CREATE INDEX IF NOT EXISTS idx_scientist_first_articles_publication_date ON scientist_first_articles(publication_date);
CREATE INDEX IF NOT EXISTS idx_scientist_first_articles_research_domain ON scientist_first_articles(research_domain);
CREATE INDEX IF NOT EXISTS idx_scientist_first_articles_keywords ON scientist_first_articles USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_scientist_first_reviews_article_id ON scientist_first_reviews(article_id);
CREATE INDEX IF NOT EXISTS idx_scientist_first_likes_article_id ON scientist_first_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_scientist_first_likes_user_id ON scientist_first_likes(user_id);

-- Seed data: Insert "The Scientist First" journal info
INSERT INTO journals (id, title, abbreviation, issn_print, issn_online, description, website, fully_open_access, impact_factor, status, verified)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'The Scientist First',
    'TSF',
    NULL,
    NULL,
    'An open-access journal dedicated to advancing scientific knowledge and supporting researchers worldwide. Focused on rapid publication and open peer review.',
    'https://digital-research-manager.onrender.com/journal',
    true,
    0.00,
    'active',
    true
)
ON CONFLICT DO NOTHING;


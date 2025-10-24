-- Science For All Journal (SFAJ) Migration for SQLite
-- Community-powered, open-access scientific journal

-- Drop old tables if they exist
DROP TABLE IF EXISTS scientist_first_citations;
DROP TABLE IF EXISTS scientist_first_likes;
DROP TABLE IF EXISTS scientist_first_reviews;
DROP TABLE IF EXISTS scientist_first_articles;

-- Journal articles table
CREATE TABLE IF NOT EXISTS sfaj_articles (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    
    -- Article details
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    full_text TEXT,
    
    -- Authors
    authors TEXT NOT NULL, -- JSON array stored as string
    corresponding_author_email TEXT,
    author_affiliations TEXT, -- JSON array stored as string
    
    -- Publication metadata
    keywords TEXT, -- JSON array stored as string
    research_domain TEXT,
    article_type TEXT DEFAULT 'research_article',
    doi TEXT UNIQUE,
    
    -- File attachments
    manuscript_url TEXT,
    supplementary_files TEXT, -- JSON array stored as string
    figures TEXT, -- JSON array stored as string
    tables TEXT, -- JSON array stored as string
    
    -- Submission and review
    submitted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    review_status TEXT DEFAULT 'submitted',
    review_model TEXT DEFAULT 'double_blind',
    review_comments TEXT,
    
    -- Publication details
    publication_date DATE,
    volume INTEGER,
    issue INTEGER,
    article_number TEXT,
    pages TEXT,
    
    -- Open access compliance
    creative_commons_license TEXT DEFAULT 'CC-BY',
    is_open_access INTEGER DEFAULT 1,
    
    -- Metrics
    views_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    citations_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'active',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Volunteer roles and contributions
CREATE TABLE IF NOT EXISTS sfaj_volunteers (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    
    -- Role information
    role TEXT NOT NULL,
    specialization TEXT, -- JSON array stored as string
    availability_status TEXT DEFAULT 'available',
    
    -- Qualifications
    educational_background TEXT,
    research_experience_years INTEGER,
    previous_journal_experience TEXT,
    
    -- Impact tracking
    total_reviews INTEGER DEFAULT 0,
    total_edits INTEGER DEFAULT 0,
    impact_points INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'active',
    is_verified INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, role)
);

-- Article reviews/comments by reviewers
CREATE TABLE IF NOT EXISTS sfaj_reviews (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    reviewer_id TEXT,
    
    -- Review details
    review_type TEXT DEFAULT 'peer_review',
    review_text TEXT NOT NULL,
    decision TEXT,
    
    -- Review criteria ratings (1-5)
    novelty_rating INTEGER,
    methodology_rating INTEGER,
    clarity_rating INTEGER,
    significance_rating INTEGER,
    overall_rating INTEGER,
    
    -- Review status
    status TEXT DEFAULT 'active',
    is_public INTEGER DEFAULT 0,
    
    -- For community reviews
    is_anonymous INTEGER DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES sfaj_articles(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- Article likes/bookmarks
CREATE TABLE IF NOT EXISTS sfaj_likes (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES sfaj_articles(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(article_id, user_id)
);

-- Article citations
CREATE TABLE IF NOT EXISTS sfaj_citations (
    id TEXT PRIMARY KEY,
    citing_article_id TEXT NOT NULL,
    cited_article_id TEXT NOT NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (citing_article_id) REFERENCES sfaj_articles(id),
    FOREIGN KEY (cited_article_id) REFERENCES sfaj_articles(id),
    UNIQUE(citing_article_id, cited_article_id)
);

-- Open Science Badges
CREATE TABLE IF NOT EXISTS sfaj_badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    
    -- Badge information
    badge_type TEXT NOT NULL,
    badge_level TEXT DEFAULT 'bronze',
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Contribution details
    contribution_count INTEGER DEFAULT 0,
    description TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, badge_type, badge_level)
);

-- Impact Points Log
CREATE TABLE IF NOT EXISTS sfaj_impact_points (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    
    -- Points details
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    related_article_id TEXT,
    
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (related_article_id) REFERENCES sfaj_articles(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sfaj_articles_user_id ON sfaj_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_sfaj_articles_status ON sfaj_articles(status);
CREATE INDEX IF NOT EXISTS idx_sfaj_articles_review_status ON sfaj_articles(review_status);
CREATE INDEX IF NOT EXISTS idx_sfaj_articles_publication_date ON sfaj_articles(publication_date);
CREATE INDEX IF NOT EXISTS idx_sfaj_articles_research_domain ON sfaj_articles(research_domain);
CREATE INDEX IF NOT EXISTS idx_sfaj_reviews_article_id ON sfaj_reviews(article_id);
CREATE INDEX IF NOT EXISTS idx_sfaj_likes_article_id ON sfaj_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_sfaj_likes_user_id ON sfaj_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_sfaj_volunteers_user_id ON sfaj_volunteers(user_id);
CREATE INDEX IF NOT EXISTS idx_sfaj_volunteers_role ON sfaj_volunteers(role);
CREATE INDEX IF NOT EXISTS idx_sfaj_badges_user_id ON sfaj_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_sfaj_impact_points_user_id ON sfaj_impact_points(user_id);


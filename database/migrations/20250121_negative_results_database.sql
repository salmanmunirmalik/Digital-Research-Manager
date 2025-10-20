-- Negative Results Database Migration
-- Revolutionary feature: Document and share failed experiments to save community time and resources
-- Give researchers credit for transparency and help others avoid repeating failures

-- ==============================================
-- NEGATIVE RESULTS & FAILED EXPERIMENTS
-- ==============================================

-- Failed Experiment Entries
CREATE TABLE IF NOT EXISTS negative_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    researcher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lab_id UUID REFERENCES labs(id) ON DELETE SET NULL,
    
    -- Experiment identification
    experiment_title VARCHAR(500) NOT NULL,
    experiment_code VARCHAR(50), -- Internal lab code
    research_field VARCHAR(255),
    research_domain TEXT[],
    keywords TEXT[],
    
    -- Original hypothesis & expectations
    original_hypothesis TEXT NOT NULL,
    expected_outcome TEXT NOT NULL,
    theoretical_basis TEXT, -- Why did you think this would work?
    literature_citations TEXT[], -- Papers that suggested this approach
    
    -- What actually happened
    actual_outcome TEXT NOT NULL,
    unexpected_observations TEXT,
    
    -- Failure analysis
    failure_type VARCHAR(100), -- 'no_effect', 'opposite_effect', 'inconclusive', 'technical_failure', 'contamination', 'unexpected_interaction'
    primary_reason TEXT NOT NULL,
    secondary_reasons TEXT[],
    contributing_factors TEXT[],
    
    -- Reproducibility information
    reproduction_attempts INTEGER DEFAULT 1,
    consistent_failure BOOLEAN DEFAULT TRUE,
    variations_tested TEXT[], -- Different conditions/parameters tried
    
    -- Experimental details
    methodology_description TEXT NOT NULL,
    protocol_used_id UUID REFERENCES protocols(id),
    materials_used TEXT[],
    equipment_used TEXT[],
    key_parameters JSONB, -- Important parameters that might have affected outcome
    
    -- Environmental/contextual factors
    experimental_conditions JSONB, -- Temperature, pH, timing, etc.
    batch_information TEXT,
    potential_confounders TEXT[],
    
    -- Lessons learned
    lessons_learned TEXT NOT NULL,
    recommendations_for_others TEXT NOT NULL,
    alternative_approaches_suggested TEXT[],
    what_would_you_try_instead TEXT,
    
    -- Data & evidence
    has_supporting_data BOOLEAN DEFAULT FALSE,
    data_files_urls TEXT[],
    images_urls TEXT[],
    charts_urls TEXT[],
    raw_data_url VARCHAR(500),
    
    -- Cost impact
    estimated_cost_usd DECIMAL(10,2),
    time_spent_hours DECIMAL(8,2),
    resources_consumed TEXT,
    
    -- Sharing & visibility
    sharing_status VARCHAR(50) DEFAULT 'private', -- 'private', 'lab_only', 'institution', 'public'
    is_publicly_searchable BOOLEAN DEFAULT FALSE,
    allow_citations BOOLEAN DEFAULT TRUE,
    anonymous_sharing BOOLEAN DEFAULT FALSE, -- Share without revealing identity
    
    -- Attribution & credit
    citation_count INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    saved_someone_votes INTEGER DEFAULT 0, -- "This saved me time/money" votes
    views_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    
    -- Related work
    related_successful_experiments TEXT[], -- IDs of experiments that did work with modifications
    related_negative_results TEXT[], -- IDs of similar failures by others
    
    -- Metadata
    experiment_date DATE,
    submitted_date DATE DEFAULT CURRENT_DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Publication status
    published_in_journal BOOLEAN DEFAULT FALSE,
    publication_doi VARCHAR(255),
    journal_name VARCHAR(255),
    
    -- Moderation & quality
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    quality_score INTEGER DEFAULT 0, -- Auto-calculated based on completeness and detail
    completeness_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Tags for discovery
    tags TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Variation Attempts (specific variations of the failed experiment)
CREATE TABLE IF NOT EXISTS negative_result_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negative_result_id UUID REFERENCES negative_results(id) ON DELETE CASCADE,
    
    variation_number INTEGER NOT NULL,
    variation_description TEXT NOT NULL,
    parameters_changed JSONB,
    
    -- Outcome of this variation
    outcome TEXT NOT NULL,
    success_level VARCHAR(50), -- 'complete_failure', 'partial_success', 'inconclusive', 'different_failure'
    
    -- Details
    observations TEXT,
    data_url VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(negative_result_id, variation_number)
);

-- Comments & Discussion on Negative Results
CREATE TABLE IF NOT EXISTS negative_result_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negative_result_id UUID REFERENCES negative_results(id) ON DELETE CASCADE,
    commenter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES negative_result_comments(id), -- For threaded discussions
    
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(50), -- 'question', 'suggestion', 'similar_experience', 'explanation', 'support'
    
    -- If commenter had similar experience
    had_similar_failure BOOLEAN DEFAULT FALSE,
    found_solution BOOLEAN DEFAULT FALSE,
    solution_description TEXT,
    
    -- Helpful tracking
    helpful_votes INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved Negative Results (bookmark for reference)
CREATE TABLE IF NOT EXISTS saved_negative_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    negative_result_id UUID REFERENCES negative_results(id) ON DELETE CASCADE,
    
    -- Why saved
    save_reason VARCHAR(100), -- 'planning_similar', 'teaching', 'reference', 'research_review'
    notes TEXT,
    
    -- Outcome tracking
    avoided_repeating_mistake BOOLEAN,
    estimated_time_saved_hours DECIMAL(8,2),
    estimated_cost_saved_usd DECIMAL(10,2),
    
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, negative_result_id)
);

-- Citations of Negative Results (when others reference these failures)
CREATE TABLE IF NOT EXISTS negative_result_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negative_result_id UUID REFERENCES negative_results(id) ON DELETE CASCADE,
    citing_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Citation context
    cited_in VARCHAR(100), -- 'paper', 'protocol', 'lab_notebook', 'presentation', 'grant_proposal'
    citation_context TEXT,
    citation_url VARCHAR(500),
    
    -- Impact
    how_it_helped VARCHAR(255), -- Brief description
    impact_type VARCHAR(100), -- 'avoided_failure', 'informed_design', 'supported_hypothesis', 'educational'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- FAILURE PATTERNS & ANALYSIS
-- ==============================================

-- Common Failure Patterns (community-identified patterns)
CREATE TABLE IF NOT EXISTS failure_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    pattern_name VARCHAR(255) NOT NULL,
    pattern_description TEXT NOT NULL,
    
    -- Pattern identification
    research_fields TEXT[],
    common_techniques TEXT[],
    common_materials TEXT[],
    typical_symptoms TEXT[],
    
    -- Root causes
    typical_causes TEXT[],
    
    -- Solutions/workarounds
    known_solutions TEXT[],
    prevention_strategies TEXT[],
    
    -- Evidence
    related_negative_results_count INTEGER DEFAULT 0,
    first_identified_date DATE,
    
    -- Community validation
    votes_count INTEGER DEFAULT 0,
    is_validated BOOLEAN DEFAULT FALSE,
    validated_by_experts TEXT[], -- User IDs of expert validators
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link negative results to failure patterns
CREATE TABLE IF NOT EXISTS negative_result_patterns (
    negative_result_id UUID REFERENCES negative_results(id) ON DELETE CASCADE,
    pattern_id UUID REFERENCES failure_patterns(id) ON DELETE CASCADE,
    confidence_score DECIMAL(3,2), -- How well does this match the pattern
    
    PRIMARY KEY (negative_result_id, pattern_id)
);

-- ==============================================
-- ALTERNATIVE APPROACHES & SOLUTIONS
-- ==============================================

-- Successful Alternatives (what worked instead)
CREATE TABLE IF NOT EXISTS successful_alternatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_negative_result_id UUID REFERENCES negative_results(id) ON DELETE CASCADE,
    researcher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Alternative approach
    alternative_title VARCHAR(255) NOT NULL,
    alternative_description TEXT NOT NULL,
    key_differences TEXT[], -- What was changed from the failed attempt
    
    -- Success metrics
    success_level VARCHAR(50), -- 'partial_success', 'full_success', 'better_than_expected'
    outcome_description TEXT NOT NULL,
    
    -- Details
    methodology TEXT,
    protocol_url VARCHAR(500),
    data_url VARCHAR(500),
    
    -- Community value
    helpful_votes INTEGER DEFAULT 0,
    tried_by_others_count INTEGER DEFAULT 0,
    success_rate_by_others DECIMAL(5,2),
    
    -- Publication
    published BOOLEAN DEFAULT FALSE,
    publication_doi VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- RESEARCHER REPUTATION FOR TRANSPARENCY
-- ==============================================

-- Negative Results Contribution Score
CREATE TABLE IF NOT EXISTS negative_results_contributor_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    researcher_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Contribution metrics
    total_negative_results_shared INTEGER DEFAULT 0,
    public_negative_results_count INTEGER DEFAULT 0,
    private_negative_results_count INTEGER DEFAULT 0,
    
    -- Impact metrics
    total_citations INTEGER DEFAULT 0,
    total_helpful_votes INTEGER DEFAULT 0,
    total_saved_someone_votes INTEGER DEFAULT 0,
    estimated_community_time_saved_hours DECIMAL(10,2) DEFAULT 0.00,
    estimated_community_cost_saved_usd DECIMAL(12,2) DEFAULT 0.00,
    
    -- Quality metrics
    average_quality_score DECIMAL(5,2) DEFAULT 0.00,
    average_completeness DECIMAL(5,2) DEFAULT 0.00,
    
    -- Engagement
    total_comments_received INTEGER DEFAULT 0,
    total_alternatives_provided INTEGER DEFAULT 0,
    
    -- Recognition
    transparency_badges TEXT[], -- 'open_science_advocate', 'failure_pioneer', 'teaching_contributor'
    featured_negative_results_count INTEGER DEFAULT 0,
    
    -- Rankings
    global_transparency_rank INTEGER,
    field_transparency_rank INTEGER,
    
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- SEARCH & DISCOVERY
-- ==============================================

-- Negative Results Search Log (to improve recommendations)
CREATE TABLE IF NOT EXISTS negative_results_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    searcher_id UUID REFERENCES users(id),
    
    search_query TEXT NOT NULL,
    search_filters JSONB,
    results_found INTEGER,
    
    -- User interaction
    results_clicked TEXT[], -- IDs of negative results clicked
    results_saved TEXT[], -- IDs of negative results saved
    
    -- Outcome
    found_useful BOOLEAN,
    avoided_experiment BOOLEAN,
    
    search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- GAMIFICATION & INCENTIVES
-- ==============================================

-- Rewards for Sharing Negative Results
CREATE TABLE IF NOT EXISTS negative_results_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    researcher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    negative_result_id UUID REFERENCES negative_results(id) ON DELETE CASCADE,
    
    reward_type VARCHAR(100), -- 'transparency_points', 'citation_credit', 'impact_badge', 'feature_highlight'
    reward_value INTEGER,
    reward_description TEXT,
    
    -- Context
    awarded_for VARCHAR(255), -- '100th helpful vote', 'most cited failure of month', 'comprehensive documentation'
    
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_negative_results_researcher ON negative_results(researcher_id);
CREATE INDEX IF NOT EXISTS idx_negative_results_field ON negative_results(research_field);
CREATE INDEX IF NOT EXISTS idx_negative_results_sharing ON negative_results(sharing_status);
CREATE INDEX IF NOT EXISTS idx_negative_results_public ON negative_results(is_publicly_searchable);
CREATE INDEX IF NOT EXISTS idx_negative_results_date ON negative_results(experiment_date);
CREATE INDEX IF NOT EXISTS idx_negative_results_citations ON negative_results(citation_count DESC);
CREATE INDEX IF NOT EXISTS idx_negative_results_helpful ON negative_results(helpful_votes DESC);

CREATE INDEX IF NOT EXISTS idx_negative_result_comments_result ON negative_result_comments(negative_result_id);
CREATE INDEX IF NOT EXISTS idx_negative_result_comments_user ON negative_result_comments(commenter_id);

CREATE INDEX IF NOT EXISTS idx_saved_negative_results_user ON saved_negative_results(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_negative_results_result ON saved_negative_results(negative_result_id);

CREATE INDEX IF NOT EXISTS idx_negative_result_citations_result ON negative_result_citations(negative_result_id);
CREATE INDEX IF NOT EXISTS idx_negative_result_citations_user ON negative_result_citations(citing_user_id);

CREATE INDEX IF NOT EXISTS idx_failure_patterns_validated ON failure_patterns(is_validated);
CREATE INDEX IF NOT EXISTS idx_failure_patterns_votes ON failure_patterns(votes_count DESC);

CREATE INDEX IF NOT EXISTS idx_successful_alternatives_original ON successful_alternatives(original_negative_result_id);
CREATE INDEX IF NOT EXISTS idx_successful_alternatives_researcher ON successful_alternatives(researcher_id);

-- Full-text search index for negative results
CREATE INDEX IF NOT EXISTS idx_negative_results_search ON negative_results USING gin(
    to_tsvector('english', 
        coalesce(experiment_title, '') || ' ' ||
        coalesce(original_hypothesis, '') || ' ' ||
        coalesce(actual_outcome, '') || ' ' ||
        coalesce(lessons_learned, '')
    )
);


-- Service Provider Marketplace Migration
-- Enables researchers to offer professional services like data analysis, consulting, training
-- Implements work packages, deliverables, and project-based service delivery

-- ==============================================
-- SERVICE LISTINGS & OFFERINGS
-- ==============================================

-- Service Categories & Types
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(100),
    parent_category_id UUID REFERENCES service_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual Service Listings
CREATE TABLE IF NOT EXISTS service_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Service details
    service_title VARCHAR(255) NOT NULL,
    service_description TEXT NOT NULL,
    category_id UUID REFERENCES service_categories(id),
    service_type VARCHAR(100), -- 'data_analysis', 'statistical_consulting', 'protocol_development', 'training', 'troubleshooting', 'peer_review', 'manuscript_editing'
    
    -- Expertise & capabilities
    expertise_areas TEXT[],
    techniques_offered TEXT[],
    software_tools TEXT[],
    equipment_access TEXT[],
    
    -- Pricing models
    pricing_model VARCHAR(50), -- 'hourly', 'project_based', 'per_sample', 'subscription', 'custom'
    base_price DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USD',
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    price_negotiable BOOLEAN DEFAULT TRUE,
    
    -- Delivery information
    typical_turnaround_days INTEGER,
    rush_service_available BOOLEAN DEFAULT FALSE,
    rush_service_multiplier DECIMAL(4,2) DEFAULT 1.5, -- Price multiplier for rush orders
    
    -- Availability
    currently_accepting_projects BOOLEAN DEFAULT TRUE,
    max_concurrent_projects INTEGER DEFAULT 3,
    current_project_count INTEGER DEFAULT 0,
    next_available_date DATE,
    
    -- Requirements & deliverables
    requirements_description TEXT, -- What client needs to provide
    deliverables_description TEXT, -- What will be delivered
    revision_rounds_included INTEGER DEFAULT 2,
    
    -- Quality metrics
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    total_projects_completed INTEGER DEFAULT 0,
    success_rate_percentage DECIMAL(5,2) DEFAULT 100.00,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 100.00,
    
    -- Visibility
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    inquiries_count INTEGER DEFAULT 0,
    
    -- SEO & discovery
    tags TEXT[],
    search_keywords TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Portfolio Items (examples of previous work)
CREATE TABLE IF NOT EXISTS service_portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES service_listings(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(100),
    
    -- Project details
    challenge_description TEXT,
    solution_description TEXT,
    results_description TEXT,
    techniques_used TEXT[],
    tools_used TEXT[],
    
    -- Media
    thumbnail_url VARCHAR(500),
    image_urls TEXT[],
    document_urls TEXT[],
    
    -- Metrics
    project_duration_days INTEGER,
    client_satisfaction INTEGER CHECK (client_satisfaction BETWEEN 1 AND 5),
    
    -- Privacy
    client_name VARCHAR(255), -- Can be anonymized
    is_public BOOLEAN DEFAULT TRUE,
    
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- SERVICE REQUESTS & PROJECTS
-- ==============================================

-- Service Inquiries/Requests
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES service_listings(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Request details
    project_title VARCHAR(255) NOT NULL,
    project_description TEXT NOT NULL,
    project_type VARCHAR(100),
    
    -- Requirements
    specific_requirements TEXT,
    sample_count INTEGER,
    data_volume_description VARCHAR(255),
    preferred_methods TEXT[],
    
    -- Timeline & budget
    desired_start_date DATE,
    desired_completion_date DATE,
    urgency_level VARCHAR(50), -- 'low', 'medium', 'high', 'urgent'
    budget_range_min DECIMAL(10,2),
    budget_range_max DECIMAL(10,2),
    budget_currency VARCHAR(10) DEFAULT 'USD',
    budget_flexible BOOLEAN DEFAULT TRUE,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'under_review', 'proposal_sent', 'negotiating', 'accepted', 'declined', 'cancelled'
    provider_response TEXT,
    provider_responded_at TIMESTAMP,
    
    -- Files
    attachment_urls TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Proposals (provider's response to request)
CREATE TABLE IF NOT EXISTS service_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Proposal details
    proposal_title VARCHAR(255),
    proposed_approach TEXT NOT NULL,
    methodology_description TEXT,
    expected_outcomes TEXT,
    
    -- Pricing
    quoted_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    pricing_breakdown JSONB, -- Detailed cost breakdown
    
    -- Timeline
    estimated_duration_days INTEGER NOT NULL,
    proposed_start_date DATE,
    proposed_completion_date DATE,
    milestone_dates JSONB,
    
    -- Deliverables
    deliverables TEXT[] NOT NULL,
    revision_rounds_included INTEGER DEFAULT 2,
    
    -- Terms
    payment_terms TEXT,
    payment_schedule VARCHAR(50), -- 'upfront', '50_50', 'milestone_based', 'upon_completion'
    cancellation_policy TEXT,
    
    -- Files
    proposal_document_url VARCHAR(500),
    attachment_urls TEXT[],
    
    -- Status
    status VARCHAR(50) DEFAULT 'sent', -- 'draft', 'sent', 'under_review', 'accepted', 'declined', 'revised'
    client_feedback TEXT,
    
    -- Validity
    valid_until DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- WORK PACKAGES & PROJECT MANAGEMENT
-- ==============================================

-- Active Service Projects
CREATE TABLE IF NOT EXISTS service_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES service_requests(id),
    proposal_id UUID REFERENCES service_proposals(id),
    service_id UUID REFERENCES service_listings(id),
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Project information
    project_title VARCHAR(255) NOT NULL,
    project_description TEXT,
    project_code VARCHAR(50) UNIQUE, -- e.g., "DA-2025-001"
    
    -- Contract details
    agreed_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'refunded'
    amount_paid DECIMAL(10,2) DEFAULT 0,
    
    -- Timeline
    start_date DATE NOT NULL,
    expected_completion_date DATE NOT NULL,
    actual_completion_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'pending_start', 'active', 'on_hold', 'completed', 'cancelled'
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Communication
    last_update_from_provider TIMESTAMP,
    last_update_from_client TIMESTAMP,
    next_scheduled_update DATE,
    
    -- Files & data
    shared_workspace_url VARCHAR(500),
    project_files_folder_url VARCHAR(500),
    
    -- Ratings (post-completion)
    client_rating INTEGER CHECK (client_rating BETWEEN 1 AND 5),
    client_review TEXT,
    provider_rating_of_client INTEGER CHECK (provider_rating_of_client BETWEEN 1 AND 5),
    provider_review_of_client TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Packages (breaking projects into manageable chunks)
CREATE TABLE IF NOT EXISTS work_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES service_projects(id) ON DELETE CASCADE,
    
    -- Package details
    package_number INTEGER NOT NULL,
    package_title VARCHAR(255) NOT NULL,
    package_description TEXT,
    
    -- Dependencies
    depends_on_package_id UUID REFERENCES work_packages(id),
    blocking_packages TEXT[], -- IDs of packages that depend on this one
    
    -- Timeline
    start_date DATE,
    due_date DATE,
    completion_date DATE,
    
    -- Effort estimation
    estimated_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'review', 'completed', 'blocked'
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Assigned resources
    assigned_to UUID REFERENCES users(id), -- Could be team member if provider has a team
    
    -- Priority
    priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(project_id, package_number)
);

-- Deliverables (specific outputs from work packages)
CREATE TABLE IF NOT EXISTS project_deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES service_projects(id) ON DELETE CASCADE,
    work_package_id UUID REFERENCES work_packages(id) ON DELETE CASCADE,
    
    -- Deliverable details
    deliverable_number INTEGER NOT NULL,
    deliverable_title VARCHAR(255) NOT NULL,
    deliverable_description TEXT,
    deliverable_type VARCHAR(100), -- 'report', 'dataset', 'code', 'protocol', 'presentation', 'analysis'
    
    -- Timeline
    due_date DATE,
    submitted_date DATE,
    approved_date DATE,
    
    -- Files
    file_urls TEXT[],
    file_size_mb DECIMAL(10,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'submitted', 'under_review', 'revision_requested', 'approved'
    
    -- Review
    client_feedback TEXT,
    revision_count INTEGER DEFAULT 0,
    revision_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(project_id, deliverable_number)
);

-- Project Milestones
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES service_projects(id) ON DELETE CASCADE,
    
    milestone_title VARCHAR(255) NOT NULL,
    milestone_description TEXT,
    milestone_date DATE NOT NULL,
    
    -- Payment linkage
    payment_percentage DECIMAL(5,2), -- Percentage of total payment due at this milestone
    payment_amount DECIMAL(10,2),
    payment_received BOOLEAN DEFAULT FALSE,
    payment_received_date DATE,
    
    -- Status
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date DATE,
    completion_notes TEXT,
    
    -- Associated deliverables
    required_deliverable_ids TEXT[],
    
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- REVIEWS & REPUTATION
-- ==============================================

-- Service Reviews
CREATE TABLE IF NOT EXISTS service_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES service_listings(id) ON DELETE CASCADE,
    project_id UUID REFERENCES service_projects(id),
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Overall rating
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    
    -- Detailed ratings
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    timeliness_rating INTEGER CHECK (timeliness_rating BETWEEN 1 AND 5),
    professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
    value_for_money_rating INTEGER CHECK (value_for_money_rating BETWEEN 1 AND 5),
    
    -- Written review
    review_title VARCHAR(255),
    review_text TEXT NOT NULL,
    
    -- Context
    project_type VARCHAR(100),
    project_budget_range VARCHAR(50), -- For privacy, show range not exact amount
    project_duration VARCHAR(50),
    
    -- Recommendations
    would_hire_again BOOLEAN,
    would_recommend_to_others BOOLEAN,
    
    -- Provider response
    provider_response TEXT,
    provider_responded_at TIMESTAMP,
    
    -- Moderation
    is_verified BOOLEAN DEFAULT FALSE, -- Verified that project actually happened
    is_featured BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_reason TEXT,
    
    helpful_votes_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(project_id, reviewer_id)
);

-- Service Provider Statistics (auto-calculated)
CREATE TABLE IF NOT EXISTS service_provider_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Project metrics
    total_projects_completed INTEGER DEFAULT 0,
    total_projects_active INTEGER DEFAULT 0,
    total_projects_cancelled INTEGER DEFAULT 0,
    
    -- Revenue metrics
    total_revenue DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    average_project_value DECIMAL(10,2) DEFAULT 0,
    
    -- Quality metrics
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    five_star_reviews INTEGER DEFAULT 0,
    four_star_reviews INTEGER DEFAULT 0,
    three_star_reviews INTEGER DEFAULT 0,
    two_star_reviews INTEGER DEFAULT 0,
    one_star_reviews INTEGER DEFAULT 0,
    
    -- Performance metrics
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 100.00,
    client_satisfaction_rate DECIMAL(5,2) DEFAULT 100.00,
    repeat_client_rate DECIMAL(5,2) DEFAULT 0.00,
    average_turnaround_days DECIMAL(6,2),
    
    -- Engagement metrics
    response_rate_percentage DECIMAL(5,2) DEFAULT 100.00,
    average_response_time_hours DECIMAL(8,2),
    total_inquiries INTEGER DEFAULT 0,
    inquiry_to_project_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Badges
    badges_earned TEXT[], -- 'top_rated', 'rising_star', 'reliable_provider', 'fast_delivery', 'excellent_communication'
    
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_service_listings_provider ON service_listings(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_listings_category ON service_listings(category_id);
CREATE INDEX IF NOT EXISTS idx_service_listings_type ON service_listings(service_type);
CREATE INDEX IF NOT EXISTS idx_service_listings_active ON service_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_service_listings_rating ON service_listings(average_rating DESC);

CREATE INDEX IF NOT EXISTS idx_service_requests_provider ON service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_client ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);

CREATE INDEX IF NOT EXISTS idx_service_projects_provider ON service_projects(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_projects_client ON service_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_service_projects_status ON service_projects(status);

CREATE INDEX IF NOT EXISTS idx_work_packages_project ON work_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_work_packages_status ON work_packages(status);

CREATE INDEX IF NOT EXISTS idx_project_deliverables_project ON project_deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_project_deliverables_status ON project_deliverables(status);

CREATE INDEX IF NOT EXISTS idx_service_reviews_service ON service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_provider ON service_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_rating ON service_reviews(overall_rating);


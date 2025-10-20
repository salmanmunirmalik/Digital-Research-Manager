-- Enhanced Project Management & PI Review System Migration
-- Implements team hierarchy tree, work packages, member progress tracking, and PI review workflow
-- Enables presentation-ready progress reports with notification system

-- ==============================================
-- TEAM HIERARCHY & STRUCTURE
-- ==============================================

-- Enhanced Lab Team Members with Hierarchical Relationships
CREATE TABLE IF NOT EXISTS lab_team_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    member_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Hierarchical structure
    reports_to UUID REFERENCES users(id), -- Their supervisor/PI
    position_level INTEGER DEFAULT 0, -- 0=PI, 1=PostDoc/CoPI, 2=PhD, 3=Masters, 4=RA, 5=Undergrad
    
    -- Role details
    role VARCHAR(100), -- 'principal_investigator', 'co_investigator', 'postdoc', 'phd_student', 'masters_student', 'research_assistant', 'technician', 'visiting_researcher'
    position_title VARCHAR(255),
    specialization VARCHAR(255),
    
    -- Contract/appointment details
    appointment_type VARCHAR(50), -- 'permanent', 'fixed_term', 'student', 'visiting'
    start_date DATE NOT NULL,
    end_date DATE,
    fte_percentage DECIMAL(5,2) DEFAULT 100.00, -- Full-time equivalent
    
    -- Responsibilities
    primary_responsibilities TEXT[],
    secondary_responsibilities TEXT[],
    authorized_equipment TEXT[],
    budget_authority DECIMAL(12,2) DEFAULT 0,
    
    -- Supervision
    supervises_count INTEGER DEFAULT 0,
    can_approve_experiments BOOLEAN DEFAULT FALSE,
    can_approve_purchases BOOLEAN DEFAULT FALSE,
    can_access_all_projects BOOLEAN DEFAULT FALSE,
    
    -- Contact & availability
    office_location VARCHAR(255),
    desk_number VARCHAR(50),
    internal_phone VARCHAR(50),
    preferred_contact_method VARCHAR(50),
    typical_working_hours VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_on_leave BOOLEAN DEFAULT FALSE,
    leave_start_date DATE,
    leave_end_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(lab_id, member_id)
);

-- Team Member Skills & Expertise (for team composition)
CREATE TABLE IF NOT EXISTS team_member_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID REFERENCES lab_team_hierarchy(id) ON DELETE CASCADE,
    
    skill_name VARCHAR(255) NOT NULL,
    skill_category VARCHAR(100),
    proficiency_level VARCHAR(50),
    can_teach BOOLEAN DEFAULT FALSE,
    willing_to_help_others BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(team_member_id, skill_name)
);

-- ==============================================
-- ENHANCED PROJECT MANAGEMENT WITH WORK PACKAGES
-- ==============================================

-- Research Projects (enhanced version)
CREATE TABLE IF NOT EXISTS research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    
    -- Project identification
    project_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., "PROJ-2025-001"
    project_title VARCHAR(500) NOT NULL,
    project_description TEXT,
    
    -- Leadership
    principal_investigator_id UUID REFERENCES users(id),
    co_investigators TEXT[], -- Array of user IDs
    project_manager_id UUID REFERENCES users(id),
    
    -- Classification
    project_type VARCHAR(100), -- 'basic_research', 'applied_research', 'clinical_trial', 'collaboration', 'contract_research'
    research_field VARCHAR(255),
    research_domains TEXT[],
    
    -- Funding
    funding_source VARCHAR(255),
    grant_number VARCHAR(100),
    total_budget DECIMAL(12,2),
    budget_currency VARCHAR(10) DEFAULT 'USD',
    budget_spent DECIMAL(12,2) DEFAULT 0,
    budget_committed DECIMAL(12,2) DEFAULT 0,
    budget_remaining DECIMAL(12,2),
    
    -- Timeline
    planned_start_date DATE,
    actual_start_date DATE,
    planned_end_date DATE,
    estimated_end_date DATE,
    actual_end_date DATE,
    
    -- Milestones
    major_milestones JSONB,
    next_milestone VARCHAR(255),
    next_milestone_date DATE,
    
    -- Progress
    status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'active', 'on_hold', 'at_risk', 'completed', 'cancelled'
    overall_progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    progress_notes TEXT,
    
    -- Risk management
    risk_level VARCHAR(50) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    identified_risks JSONB,
    mitigation_strategies TEXT,
    
    -- Deliverables
    expected_deliverables TEXT[],
    deliverables_completed TEXT[],
    
    -- Collaboration
    collaborating_institutions TEXT[],
    external_partners TEXT[],
    
    -- Publications & outputs
    target_publication_count INTEGER DEFAULT 0,
    actual_publication_count INTEGER DEFAULT 0,
    patent_applications INTEGER DEFAULT 0,
    
    -- Resources
    dedicated_equipment TEXT[],
    required_facilities TEXT[],
    
    -- Privacy & sharing
    is_confidential BOOLEAN DEFAULT FALSE,
    sharing_restrictions TEXT,
    embargo_until DATE,
    
    -- Metadata
    tags TEXT[],
    keywords TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Packages (breaking projects into manageable units)
CREATE TABLE IF NOT EXISTS project_work_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
    
    -- Package identification
    package_code VARCHAR(50) NOT NULL, -- e.g., "WP1", "WP2"
    package_title VARCHAR(255) NOT NULL,
    package_description TEXT,
    
    -- Hierarchy
    parent_package_id UUID REFERENCES project_work_packages(id),
    package_level INTEGER DEFAULT 1, -- 1=main package, 2=sub-package, etc.
    display_order INTEGER DEFAULT 0,
    
    -- Assignment
    lead_researcher_id UUID REFERENCES users(id),
    team_members TEXT[], -- Array of user IDs
    
    -- Dependencies
    depends_on_packages TEXT[], -- IDs of packages that must complete first
    blocks_packages TEXT[], -- IDs of packages waiting for this one
    
    -- Scope
    objectives TEXT[],
    deliverables TEXT[],
    success_criteria TEXT[],
    
    -- Timeline
    start_date DATE,
    planned_end_date DATE,
    estimated_end_date DATE,
    actual_end_date DATE,
    duration_weeks INTEGER,
    
    -- Effort
    estimated_person_hours DECIMAL(10,2),
    actual_person_hours DECIMAL(10,2),
    
    -- Budget
    allocated_budget DECIMAL(10,2),
    spent_budget DECIMAL(10,2),
    
    -- Progress
    status VARCHAR(50) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'under_review', 'revision_needed', 'completed', 'cancelled', 'blocked'
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Quality & review
    requires_pi_approval BOOLEAN DEFAULT TRUE,
    requires_peer_review BOOLEAN DEFAULT FALSE,
    quality_check_status VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(project_id, package_code)
);

-- ==============================================
-- MEMBER PROGRESS TRACKING & PORTFOLIOS
-- ==============================================

-- Individual Member Progress Reports
CREATE TABLE IF NOT EXISTS member_progress_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    member_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES research_projects(id),
    work_package_id UUID REFERENCES project_work_packages(id),
    
    -- Report metadata
    report_title VARCHAR(255) NOT NULL,
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    report_type VARCHAR(50), -- 'weekly', 'monthly', 'quarterly', 'milestone', 'annual', 'ad_hoc'
    
    -- Content
    summary TEXT NOT NULL,
    objectives_this_period TEXT[],
    accomplishments TEXT[] NOT NULL,
    experiments_conducted TEXT[],
    data_generated TEXT[],
    
    -- Detailed sections
    methodology_notes TEXT,
    results_summary TEXT,
    challenges_encountered TEXT[],
    solutions_implemented TEXT[],
    
    -- Next steps
    planned_next_steps TEXT[],
    upcoming_milestones TEXT[],
    resource_needs TEXT[],
    support_required TEXT[],
    
    -- Time tracking
    hours_worked DECIMAL(6,2),
    time_allocation JSONB, -- Breakdown by activity type
    
    -- Attachments
    data_files_urls TEXT[],
    figures_urls TEXT[],
    presentations_urls TEXT[],
    notebook_entry_ids TEXT[], -- Links to lab notebook entries
    
    -- Status
    submission_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'under_review', 'revision_requested', 'approved', 'archived'
    submitted_at TIMESTAMP,
    
    -- Auto-generated content flags
    has_linked_experiments BOOLEAN DEFAULT FALSE,
    has_linked_data BOOLEAN DEFAULT FALSE,
    has_figures BOOLEAN DEFAULT FALSE,
    completeness_score DECIMAL(5,2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- PI REVIEW SYSTEM
-- ==============================================

-- PI Reviews & Feedback
CREATE TABLE IF NOT EXISTS pi_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    progress_report_id UUID REFERENCES member_progress_reports(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE, -- PI or supervisor
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Review content
    overall_assessment TEXT NOT NULL,
    strengths TEXT[],
    areas_for_improvement TEXT[],
    specific_feedback JSONB, -- Section-by-section feedback
    
    -- Ratings
    progress_rating INTEGER CHECK (progress_rating BETWEEN 1 AND 5),
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    independence_rating INTEGER CHECK (independence_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    
    -- Decisions
    approval_status VARCHAR(50) NOT NULL, -- 'approved', 'approved_with_comments', 'revision_requested', 'needs_discussion', 'not_approved'
    requires_resubmission BOOLEAN DEFAULT FALSE,
    resubmission_deadline DATE,
    resubmission_requirements TEXT[],
    
    -- Guidance
    recommended_actions TEXT[],
    suggested_resources TEXT[],
    training_recommendations TEXT[],
    
    -- Meeting request
    meeting_requested BOOLEAN DEFAULT FALSE,
    meeting_urgency VARCHAR(50), -- 'routine', 'important', 'urgent'
    preferred_meeting_topics TEXT[],
    
    -- Follow-up
    follow_up_items TEXT[],
    follow_up_deadline DATE,
    
    -- Metadata
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_spent_minutes INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resubmissions (tracking revision cycles)
CREATE TABLE IF NOT EXISTS report_resubmissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_report_id UUID REFERENCES member_progress_reports(id) ON DELETE CASCADE,
    original_review_id UUID REFERENCES pi_reviews(id),
    
    resubmission_number INTEGER NOT NULL,
    
    -- Changes made
    changes_summary TEXT NOT NULL,
    addressed_comments TEXT[],
    additional_data TEXT[],
    
    -- New submission
    resubmitted_report_id UUID REFERENCES member_progress_reports(id),
    resubmitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(original_report_id, resubmission_number)
);

-- ==============================================
-- NOTIFICATIONS & ALERTS
-- ==============================================

-- Progress Report Notifications
CREATE TABLE IF NOT EXISTS progress_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    notification_type VARCHAR(50) NOT NULL, -- 'report_submitted', 'review_completed', 'revision_requested', 'approval_granted', 'meeting_requested', 'deadline_approaching'
    
    -- Recipients
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    
    -- Related entities
    report_id UUID REFERENCES member_progress_reports(id),
    review_id UUID REFERENCES pi_reviews(id),
    project_id UUID REFERENCES research_projects(id),
    
    -- Notification content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_required VARCHAR(255),
    action_url VARCHAR(500),
    
    -- Priority & timing
    priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    deadline DATE,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- Delivery
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP,
    in_app_displayed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Email notifications
    email_on_report_submission BOOLEAN DEFAULT TRUE,
    email_on_review_completion BOOLEAN DEFAULT TRUE,
    email_on_revision_request BOOLEAN DEFAULT TRUE,
    email_on_approval BOOLEAN DEFAULT TRUE,
    email_on_meeting_request BOOLEAN DEFAULT TRUE,
    email_on_deadline BOOLEAN DEFAULT TRUE,
    
    -- In-app notifications
    inapp_on_report_submission BOOLEAN DEFAULT TRUE,
    inapp_on_review_completion BOOLEAN DEFAULT TRUE,
    inapp_on_revision_request BOOLEAN DEFAULT TRUE,
    inapp_on_approval BOOLEAN DEFAULT TRUE,
    
    -- Digest preferences
    daily_digest BOOLEAN DEFAULT FALSE,
    weekly_digest BOOLEAN DEFAULT TRUE,
    
    -- Reminder preferences
    deadline_reminder_days INTEGER DEFAULT 3, -- Days before deadline to send reminder
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- MEETINGS & DISCUSSIONS
-- ==============================================

-- Team Meetings
CREATE TABLE IF NOT EXISTS team_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    project_id UUID REFERENCES research_projects(id),
    
    -- Meeting details
    meeting_title VARCHAR(255) NOT NULL,
    meeting_type VARCHAR(100), -- 'lab_meeting', 'project_meeting', 'one_on_one', 'progress_review', 'planning', 'troubleshooting'
    
    -- Participants
    organizer_id UUID REFERENCES users(id),
    required_attendees TEXT[], -- User IDs
    optional_attendees TEXT[],
    actual_attendees TEXT[],
    
    -- Schedule
    scheduled_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location VARCHAR(255),
    meeting_url VARCHAR(500), -- For virtual meetings
    
    -- Agenda
    agenda_items JSONB,
    
    -- Meeting notes
    notes TEXT,
    decisions_made TEXT[],
    action_items JSONB, -- [{assignee, task, deadline}, ...]
    
    -- Follow-up
    next_meeting_date TIMESTAMP,
    
    -- Attachments
    presentation_urls TEXT[],
    document_urls TEXT[],
    recording_url VARCHAR(500),
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meeting Action Items Tracking
CREATE TABLE IF NOT EXISTS meeting_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES team_meetings(id) ON DELETE CASCADE,
    
    action_description TEXT NOT NULL,
    assigned_to UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    
    priority VARCHAR(50) DEFAULT 'medium',
    deadline DATE,
    
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'blocked', 'cancelled'
    completion_date DATE,
    completion_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- PERFORMANCE METRICS & ANALYTICS
-- ==============================================

-- Member Performance Metrics
CREATE TABLE IF NOT EXISTS member_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lab_id UUID REFERENCES labs(id),
    
    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Productivity metrics
    reports_submitted INTEGER DEFAULT 0,
    reports_approved INTEGER DEFAULT 0,
    reports_requiring_revision INTEGER DEFAULT 0,
    experiments_completed INTEGER DEFAULT 0,
    protocols_developed INTEGER DEFAULT 0,
    
    -- Quality metrics
    average_review_rating DECIMAL(3,2),
    on_time_submission_rate DECIMAL(5,2),
    first_time_approval_rate DECIMAL(5,2),
    
    -- Collaboration metrics
    team_meetings_attended INTEGER DEFAULT 0,
    presentations_given INTEGER DEFAULT 0,
    peer_reviews_provided INTEGER DEFAULT 0,
    
    -- Output metrics
    publications_count INTEGER DEFAULT 0,
    datasets_generated INTEGER DEFAULT 0,
    
    -- Development metrics
    new_skills_acquired TEXT[],
    training_completed TEXT[],
    certifications_earned TEXT[],
    
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_lab_team_hierarchy_lab ON lab_team_hierarchy(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_team_hierarchy_member ON lab_team_hierarchy(member_id);
CREATE INDEX IF NOT EXISTS idx_lab_team_hierarchy_reports_to ON lab_team_hierarchy(reports_to);

CREATE INDEX IF NOT EXISTS idx_research_projects_lab ON research_projects(lab_id);
CREATE INDEX IF NOT EXISTS idx_research_projects_pi ON research_projects(principal_investigator_id);
CREATE INDEX IF NOT EXISTS idx_research_projects_status ON research_projects(status);

CREATE INDEX IF NOT EXISTS idx_project_work_packages_project ON project_work_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_work_packages_lead ON project_work_packages(lead_researcher_id);
CREATE INDEX IF NOT EXISTS idx_project_work_packages_status ON project_work_packages(status);

CREATE INDEX IF NOT EXISTS idx_member_progress_reports_member ON member_progress_reports(member_id);
CREATE INDEX IF NOT EXISTS idx_member_progress_reports_project ON member_progress_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_member_progress_reports_status ON member_progress_reports(submission_status);

CREATE INDEX IF NOT EXISTS idx_pi_reviews_report ON pi_reviews(progress_report_id);
CREATE INDEX IF NOT EXISTS idx_pi_reviews_reviewer ON pi_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_pi_reviews_reviewee ON pi_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_pi_reviews_status ON pi_reviews(approval_status);

CREATE INDEX IF NOT EXISTS idx_progress_notifications_recipient ON progress_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_progress_notifications_type ON progress_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_progress_notifications_unread ON progress_notifications(is_read) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_team_meetings_lab ON team_meetings(lab_id);
CREATE INDEX IF NOT EXISTS idx_team_meetings_project ON team_meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_team_meetings_date ON team_meetings(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_member_performance_metrics_member ON member_performance_metrics(member_id);
CREATE INDEX IF NOT EXISTS idx_member_performance_metrics_period ON member_performance_metrics(period_start, period_end);


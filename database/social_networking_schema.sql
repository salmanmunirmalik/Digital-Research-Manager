-- Social Networking Ecosystem for ResearchLab
-- Comprehensive social features: connections, follows, profile sharing, networking

-- ==============================================
-- USER PROFILES & SOCIAL SETTINGS
-- ==============================================

-- Enhanced user profiles for social networking
CREATE TABLE IF NOT EXISTS user_social_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Profile visibility settings
    profile_visibility VARCHAR(20) DEFAULT 'public', -- public, connections_only, private
    show_email BOOLEAN DEFAULT FALSE,
    show_phone BOOLEAN DEFAULT FALSE,
    show_location BOOLEAN DEFAULT TRUE,
    show_research_interests BOOLEAN DEFAULT TRUE,
    show_publications BOOLEAN DEFAULT TRUE,
    show_connections_count BOOLEAN DEFAULT TRUE,
    
    -- Social networking preferences
    allow_connection_requests BOOLEAN DEFAULT TRUE,
    allow_follow_requests BOOLEAN DEFAULT TRUE,
    allow_profile_sharing BOOLEAN DEFAULT TRUE,
    allow_reference_requests BOOLEAN DEFAULT TRUE,
    
    -- Profile customization
    bio TEXT,
    profile_picture_url VARCHAR(500),
    cover_photo_url VARCHAR(500),
    website_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    twitter_url VARCHAR(500),
    orcid_id VARCHAR(50),
    google_scholar_url VARCHAR(500),
    
    -- Location and timezone
    location VARCHAR(255),
    timezone VARCHAR(50),
    
    -- Professional info
    current_position VARCHAR(255),
    current_institution VARCHAR(255),
    research_interests TEXT[],
    expertise_areas TEXT[],
    languages TEXT[],
    
    -- Social stats
    connections_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    profile_views_count INTEGER DEFAULT 0,
    
    -- Activity status
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- CONNECTION SYSTEM (LinkedIn-style)
-- ==============================================

-- User connections (mutual professional relationships)
CREATE TABLE IF NOT EXISTS user_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Connection details
    connection_type VARCHAR(50) DEFAULT 'professional', -- professional, academic, industry, personal
    relationship_context VARCHAR(255), -- "Worked together at Google", "Met at ICML 2023"
    connection_strength INTEGER DEFAULT 1, -- 1-5 scale
    
    -- Status and workflow
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, blocked
    request_message TEXT,
    response_message TEXT,
    
    -- Mutual confirmation
    is_mutual BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique connections
    UNIQUE(requester_id, receiver_id),
    CHECK(requester_id != receiver_id)
);

-- ==============================================
-- FOLLOW SYSTEM (Twitter-style)
-- ==============================================

-- User follows (one-way following)
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Follow settings
    follow_type VARCHAR(50) DEFAULT 'general', -- general, research_updates, publications_only
    notifications_enabled BOOLEAN DEFAULT TRUE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, muted, blocked
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique follows
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

-- ==============================================
-- PROFILE SHARING SYSTEM
-- ==============================================

-- Profile sharing links and permissions
CREATE TABLE IF NOT EXISTS profile_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Share details
    share_token VARCHAR(100) UNIQUE NOT NULL,
    share_type VARCHAR(50) DEFAULT 'public', -- public, password_protected, time_limited, one_time
    password_hash VARCHAR(255), -- For password-protected shares
    expires_at TIMESTAMP, -- For time-limited shares
    max_views INTEGER, -- For view-limited shares
    current_views INTEGER DEFAULT 0,
    
    -- Share permissions
    allow_profile_view BOOLEAN DEFAULT TRUE,
    allow_publications_view BOOLEAN DEFAULT TRUE,
    allow_connections_view BOOLEAN DEFAULT FALSE,
    allow_contact_info BOOLEAN DEFAULT FALSE,
    allow_reference_request BOOLEAN DEFAULT TRUE,
    
    -- Custom message
    custom_message TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profile share views tracking
CREATE TABLE IF NOT EXISTS profile_share_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID REFERENCES profile_shares(id) ON DELETE CASCADE,
    viewer_ip VARCHAR(45),
    viewer_user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- NETWORKING EVENTS & INTERACTIONS
-- ==============================================

-- Networking events (conferences, meetups, etc.)
CREATE TABLE IF NOT EXISTS networking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Event details
    event_name VARCHAR(255) NOT NULL,
    event_description TEXT,
    event_type VARCHAR(50), -- conference, meetup, workshop, webinar
    event_url VARCHAR(500),
    
    -- Location and timing
    location VARCHAR(255),
    is_virtual BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    
    -- Event settings
    is_public BOOLEAN DEFAULT TRUE,
    max_participants INTEGER,
    registration_required BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled, completed
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event participants
CREATE TABLE IF NOT EXISTS event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES networking_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Participation details
    participation_type VARCHAR(50) DEFAULT 'attendee', -- attendee, speaker, organizer, sponsor
    registration_status VARCHAR(20) DEFAULT 'registered', -- registered, confirmed, cancelled
    
    -- Networking preferences
    looking_for_connections BOOLEAN DEFAULT TRUE,
    open_to_collaboration BOOLEAN DEFAULT TRUE,
    networking_goals TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(event_id, user_id)
);

-- ==============================================
-- SOCIAL INTERACTIONS & ACTIVITY FEED
-- ==============================================

-- Social activity feed
CREATE TABLE IF NOT EXISTS social_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- publication, connection, follow, profile_update, event_join
    activity_title VARCHAR(255) NOT NULL,
    activity_description TEXT,
    activity_data JSONB, -- Flexible data storage
    
    -- Visibility
    visibility VARCHAR(20) DEFAULT 'public', -- public, connections_only, private
    target_audience TEXT[], -- Specific user IDs or groups
    
    -- Engagement
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity likes
CREATE TABLE IF NOT EXISTS activity_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES social_activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(activity_id, user_id)
);

-- Activity comments
CREATE TABLE IF NOT EXISTS activity_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES social_activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    comment_text TEXT NOT NULL,
    parent_comment_id UUID REFERENCES activity_comments(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- NOTIFICATIONS SYSTEM
-- ==============================================

-- User notifications
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    notification_type VARCHAR(50) NOT NULL, -- connection_request, follow, message, activity_like, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    
    -- Source information
    source_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    source_entity_type VARCHAR(50), -- connection, follow, activity, etc.
    source_entity_id UUID,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- PRIVACY & BLOCKING SYSTEM
-- ==============================================

-- User blocks
CREATE TABLE IF NOT EXISTS user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Block details
    block_reason VARCHAR(100),
    block_type VARCHAR(50) DEFAULT 'user', -- user, content, spam
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(blocker_id, blocked_id),
    CHECK(blocker_id != blocked_id)
);

-- Privacy settings
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Profile visibility
    profile_visibility VARCHAR(20) DEFAULT 'public',
    show_online_status BOOLEAN DEFAULT TRUE,
    show_last_seen BOOLEAN DEFAULT TRUE,
    
    -- Connection settings
    allow_connection_requests BOOLEAN DEFAULT TRUE,
    allow_follow_requests BOOLEAN DEFAULT TRUE,
    require_approval_for_follows BOOLEAN DEFAULT FALSE,
    
    -- Activity visibility
    show_activities_to_connections BOOLEAN DEFAULT TRUE,
    show_activities_to_followers BOOLEAN DEFAULT TRUE,
    show_activities_to_public BOOLEAN DEFAULT TRUE,
    
    -- Contact settings
    allow_messages_from_connections BOOLEAN DEFAULT TRUE,
    allow_messages_from_followers BOOLEAN DEFAULT FALSE,
    allow_messages_from_public BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- User connections indexes
CREATE INDEX idx_user_connections_requester ON user_connections(requester_id);
CREATE INDEX idx_user_connections_receiver ON user_connections(receiver_id);
CREATE INDEX idx_user_connections_status ON user_connections(status);

-- User follows indexes
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_user_follows_status ON user_follows(status);

-- Profile shares indexes
CREATE INDEX idx_profile_shares_user ON profile_shares(user_id);
CREATE INDEX idx_profile_shares_token ON profile_shares(share_token);
CREATE INDEX idx_profile_shares_active ON profile_shares(is_active);

-- Social activities indexes
CREATE INDEX idx_social_activities_user ON social_activities(user_id);
CREATE INDEX idx_social_activities_type ON social_activities(activity_type);
CREATE INDEX idx_social_activities_created ON social_activities(created_at);

-- Notifications indexes
CREATE INDEX idx_user_notifications_user ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_read ON user_notifications(is_read);
CREATE INDEX idx_user_notifications_type ON user_notifications(notification_type);

-- User blocks indexes
CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_id);

-- ==============================================
-- TRIGGERS FOR AUTOMATIC COUNTERS
-- ==============================================

-- Update connection counts
CREATE OR REPLACE FUNCTION update_connection_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
        UPDATE user_social_profiles 
        SET connections_count = connections_count + 1 
        WHERE user_id = NEW.requester_id;
        
        UPDATE user_social_profiles 
        SET connections_count = connections_count + 1 
        WHERE user_id = NEW.receiver_id;
    END IF;
    
    IF TG_OP = 'UPDATE' AND OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
        UPDATE user_social_profiles 
        SET connections_count = connections_count + 1 
        WHERE user_id = NEW.requester_id;
        
        UPDATE user_social_profiles 
        SET connections_count = connections_count + 1 
        WHERE user_id = NEW.receiver_id;
    END IF;
    
    IF TG_OP = 'UPDATE' AND OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
        UPDATE user_social_profiles 
        SET connections_count = connections_count - 1 
        WHERE user_id = NEW.requester_id;
        
        UPDATE user_social_profiles 
        SET connections_count = connections_count - 1 
        WHERE user_id = NEW.receiver_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_connection_counts
    AFTER INSERT OR UPDATE ON user_connections
    FOR EACH ROW EXECUTE FUNCTION update_connection_counts();

-- Update follow counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE user_social_profiles 
        SET followers_count = followers_count + 1 
        WHERE user_id = NEW.following_id;
        
        UPDATE user_social_profiles 
        SET following_count = following_count + 1 
        WHERE user_id = NEW.follower_id;
    END IF;
    
    IF TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active' THEN
        UPDATE user_social_profiles 
        SET followers_count = followers_count + 1 
        WHERE user_id = NEW.following_id;
        
        UPDATE user_social_profiles 
        SET following_count = following_count + 1 
        WHERE user_id = NEW.follower_id;
    END IF;
    
    IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active' THEN
        UPDATE user_social_profiles 
        SET followers_count = followers_count - 1 
        WHERE user_id = NEW.following_id;
        
        UPDATE user_social_profiles 
        SET following_count = following_count - 1 
        WHERE user_id = NEW.follower_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follow_counts
    AFTER INSERT OR UPDATE ON user_follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Update activity engagement counts
CREATE OR REPLACE FUNCTION update_activity_likes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE social_activities 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.activity_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE social_activities 
        SET likes_count = likes_count - 1 
        WHERE id = OLD.activity_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_activity_likes
    AFTER INSERT OR DELETE ON activity_likes
    FOR EACH ROW EXECUTE FUNCTION update_activity_likes();

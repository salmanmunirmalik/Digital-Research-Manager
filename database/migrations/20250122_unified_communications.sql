-- Unified Communications Hub Schema
-- Centralized communication system for lab members, networks, researchers, etc.

-- Communication Types Enum
CREATE TYPE communication_type AS ENUM (
    'lab_message',      -- Lab team messaging
    'connection_request', -- Network connection requests
    'network_message',  -- Network messages
    'event_message',    -- Event-based communications
    'forum_discussion', -- Help forum discussions
    'reference_request', -- Reference requests
    'profile_share',    -- Profile sharing
    'lab_announcement', -- Lab announcements
    'system_notification' -- System notifications
);

-- Communication Status Enum
CREATE TYPE communication_status AS ENUM (
    'unread',
    'read',
    'archived',
    'deleted'
);

-- Unified Communications Table
CREATE TABLE IF NOT EXISTS unified_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Communication details
    communication_type communication_type NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Participants
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    from_lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    
    -- Context
    context_id UUID, -- ID of related entity (connection, event, forum post, etc.)
    context_type VARCHAR(50), -- Type of context (connection_request, event, forum_post, etc.)
    context_data JSONB, -- Additional context data
    
    -- Metadata
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    status communication_status DEFAULT 'unread',
    is_important BOOLEAN DEFAULT false,
    
    -- Attachments
    attachments JSONB DEFAULT '[]',
    
    -- Actions
    action_url VARCHAR(500), -- URL to perform action
    action_text VARCHAR(100), -- Text for action button
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    archived_at TIMESTAMP
);

-- Communication Threads (for replies)
CREATE TABLE IF NOT EXISTS communication_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_communication_id UUID REFERENCES unified_communications(id) ON DELETE CASCADE,
    reply_to_thread_id UUID REFERENCES communication_threads(id), -- For nested replies
    
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Communication Interactions (likes, reactions)
CREATE TABLE IF NOT EXISTS communication_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID REFERENCES unified_communications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    interaction_type VARCHAR(50) NOT NULL, -- like, reaction, star, flag
    interaction_data JSONB, -- e.g., {'emoji': '👍'}
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(communication_id, user_id, interaction_type)
);

-- Communication Preferences
CREATE TABLE IF NOT EXISTS communication_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Notification preferences
    notification_channels TEXT[] DEFAULT ARRAY['email', 'in_app', 'push'],
    notification_types TEXT[] DEFAULT ARRAY['message', 'connection', 'mention', 'reference', 'event'],
    
    -- Communication filters
    allow_lab_messages BOOLEAN DEFAULT true,
    allow_connection_requests BOOLEAN DEFAULT true,
    allow_event_messages BOOLEAN DEFAULT true,
    allow_public_messages BOOLEAN DEFAULT true,
    allow_network_messages BOOLEAN DEFAULT true,
    
    -- Do not disturb
    dnd_enabled BOOLEAN DEFAULT false,
    dnd_start_time TIME,
    dnd_end_time TIME,
    dnd_days TEXT[] DEFAULT ARRAY['saturday', 'sunday'],
    
    -- Auto-responses
    auto_response_enabled BOOLEAN DEFAULT false,
    auto_response_message TEXT,
    auto_response_trigger TEXT[] DEFAULT ARRAY['connection_request'],
    
    -- Preferences
    default_view VARCHAR(50) DEFAULT 'all', -- all, unread, important, archived
    sort_by VARCHAR(50) DEFAULT 'date', -- date, priority, type
    sort_order VARCHAR(10) DEFAULT 'desc', -- asc, desc
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab-to-Lab Communications
CREATE TABLE IF NOT EXISTS lab_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    to_lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- collaboration, equipment_share, protocol_request, general
    priority VARCHAR(20) DEFAULT 'normal',
    
    status VARCHAR(20) DEFAULT 'pending', -- pending, responded, archived
    responded_by UUID REFERENCES users(id),
    response_message TEXT,
    responded_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event-Based Communications
CREATE TABLE IF NOT EXISTS event_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID, -- References networking_events if it exists (no FK constraint to avoid dependency)
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- meetup_request, collaboration_offer, follow_up, general
    priority VARCHAR(20) DEFAULT 'normal',
    
    status VARCHAR(20) DEFAULT 'pending', -- pending, responded, archived
    responded_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_unified_communications_from_user ON unified_communications(from_user_id);
CREATE INDEX IF NOT EXISTS idx_unified_communications_to_user ON unified_communications(to_user_id);
CREATE INDEX IF NOT EXISTS idx_unified_communications_type ON unified_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_unified_communications_status ON unified_communications(status);
CREATE INDEX IF NOT EXISTS idx_unified_communications_created_at ON unified_communications(created_at);
CREATE INDEX IF NOT EXISTS idx_unified_communications_context ON unified_communications(context_id, context_type);

CREATE INDEX IF NOT EXISTS idx_communication_threads_parent ON communication_threads(parent_communication_id);
CREATE INDEX IF NOT EXISTS idx_communication_threads_user ON communication_threads(from_user_id);

CREATE INDEX IF NOT EXISTS idx_communication_interactions_comm ON communication_interactions(communication_id);
CREATE INDEX IF NOT EXISTS idx_communication_interactions_user ON communication_interactions(user_id);

CREATE INDEX IF NOT EXISTS idx_lab_communications_from ON lab_communications(from_lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_communications_to ON lab_communications(to_lab_id);

CREATE INDEX IF NOT EXISTS idx_event_communications_event ON event_communications(event_id);
CREATE INDEX IF NOT EXISTS idx_event_communications_from ON event_communications(from_user_id);
CREATE INDEX IF NOT EXISTS idx_event_communications_to ON event_communications(to_user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_unified_communications_updated_at BEFORE UPDATE ON unified_communications
    FOR EACH ROW EXECUTE FUNCTION update_communications_updated_at();

CREATE TRIGGER update_communication_threads_updated_at BEFORE UPDATE ON communication_threads
    FOR EACH ROW EXECUTE FUNCTION update_communications_updated_at();

CREATE TRIGGER update_communication_preferences_updated_at BEFORE UPDATE ON communication_preferences
    FOR EACH ROW EXECUTE FUNCTION update_communications_updated_at();

CREATE TRIGGER update_lab_communications_updated_at BEFORE UPDATE ON lab_communications
    FOR EACH ROW EXECUTE FUNCTION update_communications_updated_at();

CREATE TRIGGER update_event_communications_updated_at BEFORE UPDATE ON event_communications
    FOR EACH ROW EXECUTE FUNCTION update_communications_updated_at();


-- Team Messaging Migration
-- Creates simplified messaging system with group and direct messages

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    type VARCHAR(20) NOT NULL CHECK (type IN ('group', 'direct')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT false,
    UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message read status
CREATE TABLE IF NOT EXISTS message_read_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_message_read_status_message ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user ON message_read_status(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
DO $$
DECLARE
    demo_user_id UUID;
    user1_id UUID;
    user2_id UUID;
    group_conv_id UUID;
    direct_conv_id UUID;
BEGIN
    -- Get demo user ID
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@researchlab.com' LIMIT 1;
    
    -- Get other users
    SELECT id INTO user1_id FROM users WHERE email != 'demo@researchlab.com' ORDER BY created_at LIMIT 1;
    SELECT id INTO user2_id FROM users WHERE email != 'demo@researchlab.com' ORDER BY created_at LIMIT 1 OFFSET 1;
    
    IF demo_user_id IS NOT NULL THEN
        -- Create a group conversation
        INSERT INTO conversations (id, name, type, created_by)
        VALUES ('11111111-1111-1111-1111-111111111111', 'Lab Team Discussion', 'group', demo_user_id)
        RETURNING id INTO group_conv_id;
        
        -- Add participants to group
        INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
        VALUES 
            (group_conv_id, demo_user_id, true),
            (group_conv_id, user1_id, false)
        ON CONFLICT DO NOTHING;
        
        -- Create a direct conversation
        IF user1_id IS NOT NULL THEN
            INSERT INTO conversations (id, name, type, created_by)
            VALUES ('22222222-2222-2222-2222-222222222222', NULL, 'direct', demo_user_id)
            RETURNING id INTO direct_conv_id;
            
            -- Add participants to direct conversation
            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES 
                (direct_conv_id, demo_user_id),
                (direct_conv_id, user1_id)
            ON CONFLICT DO NOTHING;
            
            -- Add sample messages
            INSERT INTO messages (conversation_id, sender_id, content) VALUES
                (group_conv_id, demo_user_id, 'Hello team! Welcome to our lab discussion group.'),
                (direct_conv_id, user1_id, 'Hi! Thanks for connecting.')
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;
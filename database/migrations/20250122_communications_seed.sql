-- Communications Test Seed Data
-- Creates sample communications for testing the unified communications hub

-- Insert test communications
INSERT INTO unified_communications (
    communication_type, title, content, from_user_id, to_user_id, 
    status, priority, created_at
) VALUES
    -- Lab Messages
    (
        'lab_message',
        'New Protocol Available',
        'A new protocol for CRISPR gene editing has been added to the lab protocols database.',
        (SELECT id FROM users LIMIT 1 OFFSET 0),
        (SELECT id FROM users LIMIT 1 OFFSET 1),
        'unread',
        'normal',
        CURRENT_TIMESTAMP - INTERVAL '1 hour'
    ),
    -- Connection Requests
    (
        'connection_request',
        'Connection Request',
        'Dr. Sarah Johnson sent you a connection request',
        (SELECT id FROM users LIMIT 1 OFFSET 2),
        (SELECT id FROM users LIMIT 1 OFFSET 0),
        'unread',
        'normal',
        CURRENT_TIMESTAMP - INTERVAL '2 hours'
    ),
    (
        'connection_request',
        'Connection Request',
        'Dr. Michael Chen sent you a connection request',
        (SELECT id FROM users LIMIT 1 OFFSET 3),
        (SELECT id FROM users LIMIT 1 OFFSET 0),
        'read',
        'normal',
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    -- Event Messages
    (
        'event_message',
        'Conference Networking',
        'Would you like to meet at the upcoming conference to discuss collaboration?',
        (SELECT id FROM users LIMIT 1 OFFSET 1),
        (SELECT id FROM users LIMIT 1 OFFSET 0),
        'unread',
        'normal',
        CURRENT_TIMESTAMP - INTERVAL '3 hours'
    ),
    -- Forum Discussions
    (
        'forum_discussion',
        'Question Answered',
        'Your question about PCR optimization has been answered in the Help Forum',
        (SELECT id FROM users LIMIT 1 OFFSET 2),
        (SELECT id FROM users LIMIT 1 OFFSET 0),
        'unread',
        'normal',
        CURRENT_TIMESTAMP - INTERVAL '30 minutes'
    ),
    -- Reference Requests
    (
        'reference_request',
        'Reference Request',
        'Dr. Johnson requested a reference for your Python programming skills',
        (SELECT id FROM users LIMIT 1 OFFSET 1),
        (SELECT id FROM users LIMIT 1 OFFSET 0),
        'unread',
        'high',
        CURRENT_TIMESTAMP - INTERVAL '4 hours'
    ),
    -- Lab Announcements
    (
        'lab_announcement',
        'Lab Meeting Tomorrow',
        'Reminder: Lab meeting scheduled for tomorrow at 10 AM in Conference Room A',
        (SELECT id FROM users LIMIT 1 OFFSET 0),
        (SELECT id FROM users LIMIT 1 OFFSET 0),
        'read',
        'urgent',
        CURRENT_TIMESTAMP - INTERVAL '6 hours'
    ),
    -- System Notifications
    (
        'system_notification',
        'Your Paper Has Been Downloaded',
        'Your paper "CRISPR Applications in Cancer Research" has been downloaded 15 times this week',
        NULL,
        (SELECT id FROM users LIMIT 1 OFFSET 0),
        'unread',
        'normal',
        CURRENT_TIMESTAMP - INTERVAL '1 hour'
    );

-- Add some communication threads
INSERT INTO communication_threads (
    parent_communication_id, from_user_id, content, created_at
) VALUES
    (
        (SELECT id FROM unified_communications WHERE communication_type = 'lab_message' LIMIT 1),
        (SELECT id FROM users LIMIT 1 OFFSET 1),
        'Thanks for sharing! I will review it.',
        CURRENT_TIMESTAMP - INTERVAL '30 minutes'
    ),
    (
        (SELECT id FROM unified_communications WHERE communication_type = 'forum_discussion' LIMIT 1),
        (SELECT id FROM users LIMIT 1 OFFSET 3),
        'Great answer! This helped me with my research.',
        CURRENT_TIMESTAMP - INTERVAL '10 minutes'
    );

-- Add some interactions
INSERT INTO communication_interactions (
    communication_id, user_id, interaction_type, interaction_data
) VALUES
    (
        (SELECT id FROM unified_communications WHERE communication_type = 'lab_message' LIMIT 1),
        (SELECT id FROM users LIMIT 1 OFFSET 2),
        'like',
        '{"emoji": "👍"}'
    ),
    (
        (SELECT id FROM unified_communications WHERE communication_type = 'lab_announcement' LIMIT 1),
        (SELECT id FROM users LIMIT 1 OFFSET 1),
        'star',
        '{"starred": true}'
    );


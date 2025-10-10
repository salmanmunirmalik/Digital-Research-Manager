-- Migration: Lab Management Quick Actions Tables
-- Add tables for meetings, issues, and achievements

-- Meetings table for lab management
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    attendees TEXT[] DEFAULT '{}',
    location VARCHAR(255),
    agenda TEXT,
    lab_id VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Issues table for lab management
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    category VARCHAR(100),
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'open',
    attachments TEXT[] DEFAULT '{}',
    lab_id VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id)
);

-- Achievements table for lab management
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    impact_level VARCHAR(20) DEFAULT 'medium',
    tags TEXT[] DEFAULT '{}',
    lab_id VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data
INSERT INTO meetings (title, description, scheduled_date, scheduled_time, duration_minutes, attendees, location, agenda, lab_id, created_by) VALUES
('Weekly Lab Meeting', 'Regular team sync and project updates', '2024-01-20', '10:00:00', 60, ARRAY['Dr. Sarah Johnson', 'John Doe', 'Jane Smith'], 'Conference Room A', '1. Project updates\n2. Equipment issues\n3. Next week planning', 'demo-lab-id', '4fd07593-fdfd-46ca-890c-f7875e3c47fb');

INSERT INTO issues (title, description, priority, category, assigned_to, status, lab_id, created_by) VALUES
('PCR Machine Calibration', 'PCR machine needs calibration before next experiment', 'high', 'equipment', '4fd07593-fdfd-46ca-890c-f7875e3c47fb', 'open', 'demo-lab-id', '550e8400-e29b-41d4-a716-446655440003');

INSERT INTO achievements (title, description, category, impact_level, tags, lab_id, created_by) VALUES
('Successful Gene Editing Experiment', 'Successfully edited target gene in cell line with 95% efficiency', 'research', 'high', ARRAY['gene_editing', 'CRISPR', 'cell_biology'], 'demo-lab-id', '4fd07593-fdfd-46ca-890c-f7875e3c47fb');

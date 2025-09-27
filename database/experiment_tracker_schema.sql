-- Experiment Planner & Tracker Database Schema
-- This schema supports comprehensive experiment planning, tracking, and management

-- Experiment Templates Table
CREATE TABLE IF NOT EXISTS experiment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    methodology TEXT NOT NULL,
    estimated_duration INTEGER NOT NULL, -- in hours
    equipment TEXT[] DEFAULT '{}',
    materials TEXT[] DEFAULT '{}',
    reagents TEXT[] DEFAULT '{}',
    safety_requirements TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0
);

-- Experiments Table
CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    hypothesis TEXT,
    objectives TEXT[] DEFAULT '{}',
    methodology TEXT NOT NULL,
    expected_outcomes TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'ready', 'running', 'paused', 'completed', 'failed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(100) NOT NULL,
    estimated_duration INTEGER NOT NULL, -- in hours
    actual_duration INTEGER DEFAULT 0, -- in hours
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    due_date TIMESTAMP,
    lab_id UUID REFERENCES labs(id),
    researcher_id UUID REFERENCES users(id) NOT NULL,
    collaborators UUID[] DEFAULT '{}',
    equipment TEXT[] DEFAULT '{}',
    materials TEXT[] DEFAULT '{}',
    reagents TEXT[] DEFAULT '{}',
    safety_requirements TEXT[] DEFAULT '{}',
    budget DECIMAL(10,2) DEFAULT 0,
    actual_cost DECIMAL(10,2) DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    results TEXT,
    conclusions TEXT,
    next_steps TEXT,
    attachments TEXT[] DEFAULT '{}',
    template_id UUID REFERENCES experiment_templates(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experiment Milestones Table
CREATE TABLE IF NOT EXISTS experiment_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experiment Risks Table
CREATE TABLE IF NOT EXISTS experiment_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    probability VARCHAR(20) NOT NULL CHECK (probability IN ('low', 'medium', 'high')),
    impact VARCHAR(20) NOT NULL CHECK (impact IN ('low', 'medium', 'high')),
    mitigation TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'mitigated', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experiment Progress Log Table
CREATE TABLE IF NOT EXISTS experiment_progress_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    duration_logged INTEGER DEFAULT 0, -- in minutes
    cost_logged DECIMAL(10,2) DEFAULT 0,
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experiment Comments Table
CREATE TABLE IF NOT EXISTS experiment_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) NOT NULL,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experiment Collaborations Table
CREATE TABLE IF NOT EXISTS experiment_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'lead', 'collaborator', 'advisor', 'reviewer'
    permissions TEXT[] DEFAULT '{}', -- 'view', 'edit', 'comment', 'manage'
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'removed')),
    UNIQUE(experiment_id, user_id)
);

-- Experiment Analytics Table
CREATE TABLE IF NOT EXISTS experiment_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4),
    metric_unit VARCHAR(50),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Experiment Notifications Table
CREATE TABLE IF NOT EXISTS experiment_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'milestone_due', 'overdue', 'status_change', 'comment'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_priority ON experiments(priority);
CREATE INDEX IF NOT EXISTS idx_experiments_category ON experiments(category);
CREATE INDEX IF NOT EXISTS idx_experiments_researcher ON experiments(researcher_id);
CREATE INDEX IF NOT EXISTS idx_experiments_lab ON experiments(lab_id);
CREATE INDEX IF NOT EXISTS idx_experiments_due_date ON experiments(due_date);
CREATE INDEX IF NOT EXISTS idx_experiments_created_at ON experiments(created_at);

CREATE INDEX IF NOT EXISTS idx_milestones_experiment ON experiment_milestones(experiment_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON experiment_milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON experiment_milestones(due_date);

CREATE INDEX IF NOT EXISTS idx_risks_experiment ON experiment_risks(experiment_id);
CREATE INDEX IF NOT EXISTS idx_risks_status ON experiment_risks(status);

CREATE INDEX IF NOT EXISTS idx_progress_experiment ON experiment_progress_log(experiment_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON experiment_progress_log(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_created_at ON experiment_progress_log(created_at);

CREATE INDEX IF NOT EXISTS idx_comments_experiment ON experiment_comments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON experiment_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_collaborations_experiment ON experiment_collaborations(experiment_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_user ON experiment_collaborations(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_status ON experiment_collaborations(status);

CREATE INDEX IF NOT EXISTS idx_notifications_experiment ON experiment_notifications(experiment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON experiment_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON experiment_notifications(is_read);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON experiments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON experiment_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON experiment_milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON experiment_risks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON experiment_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate experiment progress percentage
CREATE OR REPLACE FUNCTION calculate_experiment_progress(exp_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_milestones INTEGER;
    completed_milestones INTEGER;
    progress_percentage INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_milestones
    FROM experiment_milestones
    WHERE experiment_id = exp_id;
    
    IF total_milestones = 0 THEN
        RETURN 0;
    END IF;
    
    SELECT COUNT(*) INTO completed_milestones
    FROM experiment_milestones
    WHERE experiment_id = exp_id AND status = 'completed';
    
    progress_percentage := (completed_milestones * 100) / total_milestones;
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to check for overdue milestones
CREATE OR REPLACE FUNCTION check_overdue_milestones()
RETURNS VOID AS $$
BEGIN
    UPDATE experiment_milestones
    SET status = 'overdue'
    WHERE due_date < CURRENT_TIMESTAMP 
    AND status IN ('pending', 'in_progress');
END;
$$ LANGUAGE plpgsql;

-- Function to update experiment status based on milestones
CREATE OR REPLACE FUNCTION update_experiment_status()
RETURNS TRIGGER AS $$
DECLARE
    exp_id UUID;
    all_completed BOOLEAN;
BEGIN
    exp_id := NEW.experiment_id;
    
    -- Check if all milestones are completed
    SELECT NOT EXISTS (
        SELECT 1 FROM experiment_milestones 
        WHERE experiment_id = exp_id 
        AND status != 'completed'
    ) INTO all_completed;
    
    -- Update experiment status if all milestones are completed
    IF all_completed THEN
        UPDATE experiments 
        SET status = 'completed', end_date = CURRENT_TIMESTAMP
        WHERE id = exp_id AND status != 'completed';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update experiment status when milestones change
CREATE TRIGGER update_experiment_status_trigger
    AFTER UPDATE ON experiment_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_experiment_status();

-- Insert some sample experiment templates
INSERT INTO experiment_templates (name, category, description, methodology, estimated_duration, equipment, materials, reagents, safety_requirements) VALUES
('PCR Amplification', 'molecular_biology', 'Standard PCR amplification protocol for DNA fragments', 
'1. Prepare reaction mix with Taq polymerase, dNTPs, primers, and buffer
2. Add template DNA to the reaction
3. Run thermal cycling: 95°C for 2 min, then 30 cycles of 95°C for 30s, 55°C for 30s, 72°C for 1 min
4. Final extension at 72°C for 5 min
5. Analyze results by gel electrophoresis', 
4, 
ARRAY['Thermal Cycler', 'Microcentrifuge', 'Gel Electrophoresis System', 'UV Transilluminator'],
ARRAY['PCR tubes', 'Agarose gel', 'Loading dye', 'DNA ladder'],
ARRAY['Taq polymerase', 'dNTPs', 'Primers', 'PCR buffer', 'Template DNA'],
ARRAY['Lab coat', 'Gloves', 'UV protection glasses']),

('Cell Culture Maintenance', 'cell_biology', 'Routine cell culture maintenance and passaging',
'1. Check cell confluence under microscope
2. Prepare fresh culture media
3. Aspirate old media and wash with PBS
4. Add trypsin and incubate for 2-3 minutes
5. Neutralize trypsin with fresh media
6. Count cells and split at appropriate ratio
7. Plate cells in new flasks with fresh media',
2,
ARRAY['CO2 Incubator', 'Biosafety Cabinet', 'Inverted Microscope', 'Centrifuge'],
ARRAY['Cell culture flasks', 'Pipettes', 'Centrifuge tubes', 'Cell counting chamber'],
ARRAY['Cell culture media', 'Trypsin-EDTA', 'FBS', 'PBS'],
ARRAY['Biosafety cabinet', 'Sterile technique', 'Personal protective equipment', 'Aseptic technique']),

('Protein Purification', 'biochemistry', 'His-tagged protein purification using Ni-NTA affinity chromatography',
'1. Induce protein expression in bacterial culture
2. Harvest cells by centrifugation
3. Lyse cells using sonication or chemical lysis
4. Clarify lysate by centrifugation
5. Equilibrate Ni-NTA column with binding buffer
6. Load lysate onto column
7. Wash with binding buffer containing imidazole
8. Elute protein with high imidazole buffer
9. Analyze purity by SDS-PAGE
10. Concentrate and store protein',
8,
ARRAY['Sonicator', 'Centrifuge', 'FPLC System', 'Ni-NTA Column', 'SDS-PAGE System'],
ARRAY['Centrifuge tubes', 'Syringe filters', 'Dialysis tubing', 'Protein storage tubes'],
ARRAY['Ni-NTA resin', 'Binding buffer', 'Elution buffer', 'Imidazole', 'Protease inhibitors'],
ARRAY['Lab coat', 'Gloves', 'Safety glasses', 'Cold room work']);

-- Create a view for experiment summary
CREATE OR REPLACE VIEW experiment_summary AS
SELECT 
    e.id,
    e.title,
    e.status,
    e.priority,
    e.category,
    e.estimated_duration,
    e.actual_duration,
    e.start_date,
    e.end_date,
    e.due_date,
    e.researcher_id,
    u.username as researcher_name,
    e.lab_id,
    l.name as lab_name,
    calculate_experiment_progress(e.id) as progress_percentage,
    COUNT(em.id) as total_milestones,
    COUNT(CASE WHEN em.status = 'completed' THEN 1 END) as completed_milestones,
    COUNT(CASE WHEN em.status = 'overdue' THEN 1 END) as overdue_milestones,
    e.created_at,
    e.updated_at
FROM experiments e
LEFT JOIN users u ON e.researcher_id = u.id
LEFT JOIN labs l ON e.lab_id = l.id
LEFT JOIN experiment_milestones em ON e.id = em.experiment_id
GROUP BY e.id, u.username, l.name;

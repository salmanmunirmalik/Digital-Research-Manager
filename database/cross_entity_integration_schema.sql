-- Cross-Entity Integration Schema for Digital Research Manager
-- This schema implements bidirectional data synchronization and A-Z research workflow

-- ==============================================
-- CORE INTEGRATION TABLES
-- ==============================================

-- Entity Relationship Mapping Table
CREATE TABLE IF NOT EXISTS entity_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_entity_type VARCHAR(50) NOT NULL, -- 'lab_notebook_entry', 'protocol', 'result', 'instrument_booking', etc.
    source_entity_id UUID NOT NULL,
    target_entity_type VARCHAR(50) NOT NULL,
    target_entity_id UUID NOT NULL,
    relationship_type VARCHAR(50) NOT NULL, -- 'references', 'generates', 'uses', 'follows', 'contains'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    UNIQUE(source_entity_type, source_entity_id, target_entity_type, target_entity_id, relationship_type)
);

-- Data Synchronization Log
CREATE TABLE IF NOT EXISTS data_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_entity_type VARCHAR(50) NOT NULL,
    source_entity_id UUID NOT NULL,
    target_entity_type VARCHAR(50) NOT NULL,
    target_entity_id UUID NOT NULL,
    sync_action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete', 'link'
    sync_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'conflict'
    sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- ==============================================
-- ENHANCED LAB NOTEBOOK WITH CROSS-REFERENCES
-- ==============================================

-- Enhanced Lab Notebook Entries with cross-entity support
ALTER TABLE lab_notebook_entries ADD COLUMN IF NOT EXISTS 
    related_protocols UUID[] DEFAULT '{}';

ALTER TABLE lab_notebook_entries ADD COLUMN IF NOT EXISTS 
    related_results UUID[] DEFAULT '{}';

ALTER TABLE lab_notebook_entries ADD COLUMN IF NOT EXISTS 
    related_instrument_bookings UUID[] DEFAULT '{}';

ALTER TABLE lab_notebook_entries ADD COLUMN IF NOT EXISTS 
    related_inventory_items UUID[] DEFAULT '{}';

ALTER TABLE lab_notebook_entries ADD COLUMN IF NOT EXISTS 
    related_collaborations UUID[] DEFAULT '{}';

ALTER TABLE lab_notebook_entries ADD COLUMN IF NOT EXISTS 
    auto_sync_enabled BOOLEAN DEFAULT true;

-- ==============================================
-- ENHANCED PROTOCOLS WITH NOTEBOOK INTEGRATION
-- ==============================================

-- Enhanced Protocols table
CREATE TABLE IF NOT EXISTS enhanced_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    protocol_type VARCHAR(50) NOT NULL, -- 'experimental', 'analytical', 'safety', 'maintenance'
    category VARCHAR(100),
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'review', 'approved', 'archived'
    
    -- Content sections
    objective TEXT,
    materials_needed JSONB DEFAULT '[]',
    equipment_required JSONB DEFAULT '[]',
    safety_precautions TEXT,
    procedure_steps JSONB DEFAULT '[]',
    expected_results TEXT,
    troubleshooting TEXT,
    references_list TEXT[] DEFAULT '{}',
    
    -- Cross-entity relationships
    related_notebook_entries UUID[] DEFAULT '{}',
    related_inventory_items UUID[] DEFAULT '{}',
    related_instrument_bookings UUID[] DEFAULT '{}',
    related_results UUID[] DEFAULT '{}',
    
    -- Metadata
    lab_id UUID REFERENCES labs(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    
    -- Auto-sync settings
    auto_sync_enabled BOOLEAN DEFAULT true,
    sync_to_notebook BOOLEAN DEFAULT true,
    sync_to_inventory BOOLEAN DEFAULT true,
    
    -- Search and organization
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    difficulty_level VARCHAR(20) DEFAULT 'medium', -- 'beginner', 'intermediate', 'advanced'
    estimated_duration INTEGER, -- in minutes
    cost_estimate DECIMAL(10,2)
);

-- ==============================================
-- ENHANCED RESULTS WITH NOTEBOOK INTEGRATION
-- ==============================================

-- Enhanced Results table
CREATE TABLE IF NOT EXISTS enhanced_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    result_type VARCHAR(50) NOT NULL, -- 'experimental', 'analytical', 'computational', 'literature'
    data_type VARCHAR(50) NOT NULL, -- 'quantitative', 'qualitative', 'mixed', 'observational'
    
    -- Content
    raw_data JSONB DEFAULT '{}',
    processed_data JSONB DEFAULT '{}',
    analysis_method TEXT,
    statistical_methods TEXT[] DEFAULT '{}',
    confidence_level DECIMAL(5,2),
    sample_size INTEGER,
    
    -- Cross-entity relationships
    related_notebook_entries UUID[] DEFAULT '{}',
    related_protocols UUID[] DEFAULT '{}',
    related_instrument_bookings UUID[] DEFAULT '{}',
    related_collaborations UUID[] DEFAULT '{}',
    
    -- Metadata
    lab_id UUID REFERENCES labs(id),
    project_id UUID REFERENCES projects(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Auto-sync settings
    auto_sync_enabled BOOLEAN DEFAULT true,
    sync_to_notebook BOOLEAN DEFAULT true,
    sync_to_protocols BOOLEAN DEFAULT true,
    
    -- Organization
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    file_attachments TEXT[] DEFAULT '{}',
    visualization_data JSONB DEFAULT '{}'
);

-- ==============================================
-- ENHANCED INSTRUMENT BOOKING WITH INTEGRATION
-- ==============================================

-- Enhanced Instrument Booking table
CREATE TABLE IF NOT EXISTS enhanced_instrument_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_name VARCHAR(255) NOT NULL,
    instrument_id UUID REFERENCES instruments(id),
    booking_type VARCHAR(50) NOT NULL, -- 'training', 'research', 'maintenance', 'calibration'
    
    -- Booking details
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time))/60) STORED,
    purpose TEXT NOT NULL,
    description TEXT,
    
    -- Cross-entity relationships
    related_notebook_entries UUID[] DEFAULT '{}',
    related_protocols UUID[] DEFAULT '{}',
    related_results UUID[] DEFAULT '{}',
    related_projects UUID[] DEFAULT '{}',
    
    -- User and lab info
    user_id UUID REFERENCES users(id),
    lab_id UUID REFERENCES labs(id),
    supervisor_id UUID REFERENCES users(id),
    
    -- Status and approval
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed', 'cancelled'
    approval_notes TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Auto-sync settings
    auto_sync_enabled BOOLEAN DEFAULT true,
    sync_to_notebook BOOLEAN DEFAULT true,
    sync_to_protocols BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cost DECIMAL(10,2),
    notes TEXT,
    attachments TEXT[] DEFAULT '{}'
);

-- ==============================================
-- SMART INTEGRATION FUNCTIONS
-- ==============================================

-- Function to create bidirectional relationships
CREATE OR REPLACE FUNCTION create_bidirectional_relationship(
    source_type VARCHAR(50),
    source_id UUID,
    target_type VARCHAR(50),
    target_id UUID,
    rel_type VARCHAR(50),
    user_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    relationship_id UUID;
BEGIN
    -- Create the relationship
    INSERT INTO entity_relationships (
        source_entity_type, source_entity_id,
        target_entity_type, target_entity_id,
        relationship_type, created_by
    ) VALUES (
        source_type, source_id,
        target_type, target_id,
        rel_type, user_id
    ) RETURNING id INTO relationship_id;
    
    -- Log the sync action
    INSERT INTO data_sync_log (
        source_entity_type, source_entity_id,
        target_entity_type, target_entity_id,
        sync_action, sync_status
    ) VALUES (
        source_type, source_id,
        target_type, target_id,
        'link', 'success'
    );
    
    RETURN relationship_id;
END;
$$ LANGUAGE plpgsql;

-- Function to sync notebook entry to related entities
CREATE OR REPLACE FUNCTION sync_notebook_entry_to_entities(
    notebook_entry_id UUID,
    entity_type VARCHAR(50),
    entity_ids UUID[],
    user_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    entity_id UUID;
BEGIN
    -- Update the notebook entry with related entities
    CASE entity_type
        WHEN 'protocol' THEN
            UPDATE lab_notebook_entries 
            SET related_protocols = entity_ids, updated_at = CURRENT_TIMESTAMP
            WHERE id = notebook_entry_id;
        WHEN 'result' THEN
            UPDATE lab_notebook_entries 
            SET related_results = entity_ids, updated_at = CURRENT_TIMESTAMP
            WHERE id = notebook_entry_id;
        WHEN 'instrument_booking' THEN
            UPDATE lab_notebook_entries 
            SET related_instrument_bookings = entity_ids, updated_at = CURRENT_TIMESTAMP
            WHERE id = notebook_entry_id;
        WHEN 'inventory_item' THEN
            UPDATE lab_notebook_entries 
            SET related_inventory_items = entity_ids, updated_at = CURRENT_TIMESTAMP
            WHERE id = notebook_entry_id;
    END CASE;
    
    -- Create bidirectional relationships
    FOREACH entity_id IN ARRAY entity_ids
    LOOP
        PERFORM create_bidirectional_relationship(
            'lab_notebook_entry', notebook_entry_id,
            entity_type, entity_id,
            'references', user_id
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-sync when protocol is created from notebook
CREATE OR REPLACE FUNCTION auto_sync_protocol_from_notebook()
RETURNS TRIGGER AS $$
BEGIN
    -- If this protocol was created from a notebook entry, sync back
    IF NEW.related_notebook_entries IS NOT NULL AND array_length(NEW.related_notebook_entries, 1) > 0 THEN
        -- Update the notebook entry to reference this protocol
        UPDATE lab_notebook_entries 
        SET related_protocols = array_append(related_protocols, NEW.id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY(NEW.related_notebook_entries);
        
        -- Log the sync
        INSERT INTO data_sync_log (
            source_entity_type, source_entity_id,
            target_entity_type, target_entity_id,
            sync_action, sync_status
        ) 
        SELECT 'protocol', NEW.id, 'lab_notebook_entry', unnest(NEW.related_notebook_entries), 'create', 'success';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-sync when result is created from notebook
CREATE OR REPLACE FUNCTION auto_sync_result_from_notebook()
RETURNS TRIGGER AS $$
BEGIN
    -- If this result was created from a notebook entry, sync back
    IF NEW.related_notebook_entries IS NOT NULL AND array_length(NEW.related_notebook_entries, 1) > 0 THEN
        -- Update the notebook entry to reference this result
        UPDATE lab_notebook_entries 
        SET related_results = array_append(related_results, NEW.id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY(NEW.related_notebook_entries);
        
        -- Log the sync
        INSERT INTO data_sync_log (
            source_entity_type, source_entity_id,
            target_entity_type, target_entity_id,
            sync_action, sync_status
        ) 
        SELECT 'result', NEW.id, 'lab_notebook_entry', unnest(NEW.related_notebook_entries), 'create', 'success';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGERS FOR AUTO-SYNC
-- ==============================================

-- Trigger for protocol auto-sync
CREATE TRIGGER trigger_auto_sync_protocol_from_notebook
    AFTER INSERT ON enhanced_protocols
    FOR EACH ROW
    EXECUTE FUNCTION auto_sync_protocol_from_notebook();

-- Trigger for result auto-sync
CREATE TRIGGER trigger_auto_sync_result_from_notebook
    AFTER INSERT ON enhanced_results
    FOR EACH ROW
    EXECUTE FUNCTION auto_sync_result_from_notebook();

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_entity_relationships_source ON entity_relationships(source_entity_type, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_relationships_target ON entity_relationships(target_entity_type, target_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_relationships_type ON entity_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_sync_log_source ON data_sync_log(source_entity_type, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_target ON data_sync_log(target_entity_type, target_entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON data_sync_log(sync_status);

CREATE INDEX IF NOT EXISTS idx_notebook_protocols ON lab_notebook_entries USING GIN(related_protocols);
CREATE INDEX IF NOT EXISTS idx_notebook_results ON lab_notebook_entries USING GIN(related_results);
CREATE INDEX IF NOT EXISTS idx_notebook_bookings ON lab_notebook_entries USING GIN(related_instrument_bookings);

CREATE INDEX IF NOT EXISTS idx_protocol_notebooks ON enhanced_protocols USING GIN(related_notebook_entries);
CREATE INDEX IF NOT EXISTS idx_result_notebooks ON enhanced_results USING GIN(related_notebook_entries);
CREATE INDEX IF NOT EXISTS idx_booking_notebooks ON enhanced_instrument_bookings USING GIN(related_notebook_entries);

-- ==============================================
-- VIEWS FOR INTEGRATED DATA ACCESS
-- ==============================================

-- View for complete research workflow
CREATE OR REPLACE VIEW research_workflow_integration AS
SELECT 
    n.id as notebook_entry_id,
    n.title as notebook_title,
    n.entry_type,
    n.status as notebook_status,
    n.created_at as notebook_created,
    
    -- Related protocols
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'id', p.id,
                'title', p.title,
                'version', p.version,
                'status', p.status,
                'last_used', p.last_used_at
            )
        ) FROM enhanced_protocols p 
         WHERE p.id = ANY(n.related_protocols)), 
        '[]'::json
    ) as protocols,
    
    -- Related results
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'id', r.id,
                'title', r.title,
                'result_type', r.result_type,
                'data_type', r.data_type,
                'created_at', r.created_at
            )
        ) FROM enhanced_results r 
         WHERE r.id = ANY(n.related_results)), 
        '[]'::json
    ) as results,
    
    -- Related instrument bookings
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'id', b.id,
                'instrument_name', b.instrument_name,
                'start_time', b.start_time,
                'end_time', b.end_time,
                'status', b.status,
                'purpose', b.purpose
            )
        ) FROM enhanced_instrument_bookings b 
         WHERE b.id = ANY(n.related_instrument_bookings)), 
        '[]'::json
    ) as instrument_bookings,
    
    -- Lab and user info
    n.lab_name,
    n.creator_name,
    n.tags,
    n.priority
    
FROM lab_notebook_entries n
WHERE n.auto_sync_enabled = true;

-- ==============================================
-- SAMPLE DATA FOR TESTING
-- ==============================================

-- Insert sample enhanced protocols
INSERT INTO enhanced_protocols (title, description, protocol_type, category, objective, materials_needed, equipment_required, procedure_steps, lab_id, created_by, tags) VALUES
('PCR Amplification Protocol', 'Standard PCR protocol for DNA amplification', 'experimental', 'molecular_biology', 'Amplify target DNA sequences using PCR', 
 '["DNA template", "PCR primers", "Taq polymerase", "dNTPs", "Buffer"]'::jsonb,
 '["Thermal cycler", "Microcentrifuge", "Pipettes", "PCR tubes"]'::jsonb,
 '["Denature DNA at 95°C for 5 minutes", "Anneal primers at 55°C for 30 seconds", "Extend at 72°C for 1 minute", "Repeat for 30 cycles"]'::jsonb,
 (SELECT id FROM labs LIMIT 1),
 (SELECT id FROM users WHERE role = 'researcher' LIMIT 1),
 ARRAY['PCR', 'DNA', 'amplification', 'molecular_biology']),

('Protein Extraction Protocol', 'Extract proteins from tissue samples', 'experimental', 'protein_analysis', 'Extract high-quality proteins for analysis',
 '["Tissue samples", "Lysis buffer", "Protease inhibitors", "Bradford reagent"]'::jsonb,
 '["Homogenizer", "Centrifuge", "Spectrophotometer", "Ice bath"]'::jsonb,
 '["Homogenize tissue in lysis buffer", "Centrifuge at 10,000g for 10 minutes", "Collect supernatant", "Quantify protein concentration"]'::jsonb,
 (SELECT id FROM labs LIMIT 1),
 (SELECT id FROM users WHERE role = 'researcher' LIMIT 1),
 ARRAY['protein', 'extraction', 'tissue', 'analysis']);

-- Insert sample enhanced results
INSERT INTO enhanced_results (title, description, result_type, data_type, raw_data, analysis_method, lab_id, project_id, created_by, tags) VALUES
('PCR Amplification Results', 'Results from PCR amplification experiment', 'experimental', 'quantitative',
 '{"amplification_efficiency": 0.95, "ct_values": [15.2, 16.1, 15.8], "band_intensity": "strong"}'::jsonb,
 'Real-time PCR analysis',
 (SELECT id FROM labs LIMIT 1),
 (SELECT id FROM projects LIMIT 1),
 (SELECT id FROM users WHERE role = 'researcher' LIMIT 1),
 ARRAY['PCR', 'amplification', 'quantitative', 'DNA']),

('Protein Concentration Analysis', 'Protein concentration measurements from tissue samples', 'experimental', 'quantitative',
 '{"concentrations": [2.5, 3.1, 2.8, 3.0], "units": "mg/ml", "cv": 8.5}'::jsonb,
 'Bradford assay',
 (SELECT id FROM labs LIMIT 1),
 (SELECT id FROM projects LIMIT 1),
 (SELECT id FROM users WHERE role = 'researcher' LIMIT 1),
 ARRAY['protein', 'concentration', 'Bradford', 'quantitative']);

-- Insert sample enhanced instrument bookings
INSERT INTO enhanced_instrument_bookings (instrument_name, booking_type, start_time, end_time, purpose, description, user_id, lab_id, status, cost) VALUES
('Thermal Cycler TC-1', 'research', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '2 hours', 
 'PCR amplification for DNA analysis', 'Running PCR reactions for gene expression study', 
 (SELECT id FROM users WHERE role = 'researcher' LIMIT 1),
 (SELECT id FROM labs LIMIT 1), 'approved', 50.00),

('Centrifuge CF-2000', 'research', CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '1 hour',
 'Protein extraction protocol', 'Centrifuging tissue samples for protein extraction',
 (SELECT id FROM users WHERE role = 'researcher' LIMIT 1),
 (SELECT id FROM labs LIMIT 1), 'approved', 25.00);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;

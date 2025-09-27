-- Professional Protocol Management Schema
-- Enhanced for biomedical research standards

-- Enhanced Protocols Table with Professional Standards
CREATE TABLE IF NOT EXISTS professional_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    protocol_type VARCHAR(50) NOT NULL, -- 'western_blot', 'pcr', 'elisa', 'cell_culture', 'immunofluorescence', 'flow_cytometry', 'microscopy', 'custom'
    category VARCHAR(100) NOT NULL, -- 'molecular_biology', 'cell_biology', 'protein_analysis', 'immunology', 'microscopy', 'analytical'
    subcategory VARCHAR(100), -- 'protein_extraction', 'antibody_detection', 'quantitative_pcr', 'cell_passaging', etc.
    
    -- Version Control
    version VARCHAR(20) DEFAULT '1.0',
    parent_protocol_id UUID REFERENCES professional_protocols(id),
    is_template BOOLEAN DEFAULT FALSE,
    template_name VARCHAR(255),
    
    -- Professional Metadata
    difficulty_level VARCHAR(20) NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    skill_requirements TEXT[], -- ['aseptic_technique', 'pipetting', 'microscopy', 'data_analysis']
    estimated_duration_minutes INTEGER NOT NULL,
    actual_duration_minutes INTEGER, -- Tracked from usage
    success_rate DECIMAL(5,2) DEFAULT 0.0, -- Percentage success rate
    
    -- Cost and Resource Management
    estimated_cost_usd DECIMAL(10,2),
    cost_per_sample DECIMAL(8,2),
    consumables_cost DECIMAL(8,2),
    equipment_cost DECIMAL(8,2),
    
    -- Safety and Compliance
    safety_level VARCHAR(20) DEFAULT 'low' CHECK (safety_level IN ('low', 'medium', 'high', 'biosafety_level_2', 'biosafety_level_3')),
    biosafety_requirements TEXT[],
    chemical_hazards TEXT[],
    biological_hazards TEXT[],
    ppe_required TEXT[], -- Personal Protective Equipment
    
    -- Content Structure (Professional Format)
    objective TEXT NOT NULL,
    background TEXT,
    hypothesis TEXT,
    
    -- Materials and Equipment
    reagents JSONB DEFAULT '[]', -- Structured reagent list with concentrations, suppliers, catalog numbers
    equipment JSONB DEFAULT '[]', -- Equipment with specifications, calibration requirements
    consumables JSONB DEFAULT '[]', -- Pipette tips, tubes, plates, etc.
    
    -- Procedure Steps
    preparation_steps JSONB DEFAULT '[]', -- Pre-experiment setup
    procedure_steps JSONB DEFAULT '[]', -- Main experimental steps
    post_processing_steps JSONB DEFAULT '[]', -- Data analysis, cleanup
    
    -- Quality Control
    positive_controls TEXT[],
    negative_controls TEXT[],
    quality_checkpoints JSONB DEFAULT '[]',
    troubleshooting_guide JSONB DEFAULT '[]',
    
    -- Expected Results and Analysis
    expected_results TEXT,
    data_analysis_methods TEXT[],
    interpretation_guidelines TEXT,
    common_pitfalls TEXT[],
    
    -- References and Citations
    literature_references TEXT[],
    protocol_references TEXT[],
    supplier_information JSONB DEFAULT '[]',
    
    -- Usage and Performance Tracking
    usage_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    total_ratings INTEGER DEFAULT 0,
    
    -- Privacy and Sharing
    privacy_level VARCHAR(20) DEFAULT 'personal' CHECK (privacy_level IN ('personal', 'team', 'lab', 'institution', 'global')),
    sharing_permissions JSONB DEFAULT '{}',
    access_level VARCHAR(20) DEFAULT 'read' CHECK (access_level IN ('read', 'comment', 'edit', 'admin')),
    
    -- Approval and Validation
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'validated', 'approved', 'archived', 'deprecated')),
    validation_level VARCHAR(20) DEFAULT 'none' CHECK (validation_level IN ('none', 'peer_reviewed', 'lab_validated', 'institution_approved', 'published')),
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP,
    validation_notes TEXT,
    
    -- Cross-entity Integration
    related_notebook_entries UUID[] DEFAULT '{}',
    related_inventory_items UUID[] DEFAULT '{}',
    related_instrument_bookings UUID[] DEFAULT '{}',
    related_results UUID[] DEFAULT '{}',
    related_projects UUID[] DEFAULT '{}',
    
    -- Metadata
    lab_id UUID REFERENCES labs(id),
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    
    -- Search and Discovery
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', title), 'A') ||
        setweight(to_tsvector('english', description), 'B') ||
        setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
    ) STORED,
    
    -- Constraints
    CONSTRAINT valid_duration CHECK (estimated_duration_minutes > 0),
    CONSTRAINT valid_cost CHECK (estimated_cost_usd >= 0),
    CONSTRAINT valid_success_rate CHECK (success_rate >= 0 AND success_rate <= 100)
);

-- Protocol Templates Table
CREATE TABLE IF NOT EXISTS protocol_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    protocol_type VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL, -- Complete protocol structure
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Protocol Usage Tracking
CREATE TABLE IF NOT EXISTS protocol_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID REFERENCES professional_protocols(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    lab_id UUID REFERENCES labs(id),
    usage_type VARCHAR(20) DEFAULT 'execution' CHECK (usage_type IN ('execution', 'reference', 'modification', 'sharing')),
    execution_status VARCHAR(20) DEFAULT 'completed' CHECK (execution_status IN ('started', 'completed', 'failed', 'abandoned')),
    actual_duration_minutes INTEGER,
    success_rating INTEGER CHECK (success_rating >= 1 AND success_rating <= 5),
    notes TEXT,
    modifications_made TEXT[],
    issues_encountered TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Protocol Reviews and Ratings
CREATE TABLE IF NOT EXISTS protocol_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID REFERENCES professional_protocols(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    pros TEXT[],
    cons TEXT[],
    suggestions TEXT[],
    is_verified BOOLEAN DEFAULT FALSE, -- Verified that reviewer actually used the protocol
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Protocol Sharing and Permissions
CREATE TABLE IF NOT EXISTS protocol_sharing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID REFERENCES professional_protocols(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with_lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    shared_with_institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) DEFAULT 'read' CHECK (permission_level IN ('read', 'comment', 'edit', 'admin')),
    shared_by UUID REFERENCES users(id),
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Protocol Collaborations
CREATE TABLE IF NOT EXISTS protocol_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID REFERENCES professional_protocols(id) ON DELETE CASCADE,
    collaborator_id UUID REFERENCES users(id),
    role VARCHAR(50) NOT NULL, -- 'author', 'reviewer', 'validator', 'contributor'
    contribution_type VARCHAR(50), -- 'methodology', 'validation', 'optimization', 'troubleshooting'
    contribution_description TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_professional_protocols_type ON professional_protocols(protocol_type);
CREATE INDEX IF NOT EXISTS idx_professional_protocols_category ON professional_protocols(category);
CREATE INDEX IF NOT EXISTS idx_professional_protocols_privacy ON professional_protocols(privacy_level);
CREATE INDEX IF NOT EXISTS idx_professional_protocols_status ON professional_protocols(status);
CREATE INDEX IF NOT EXISTS idx_professional_protocols_lab ON professional_protocols(lab_id);
CREATE INDEX IF NOT EXISTS idx_professional_protocols_created_by ON professional_protocols(created_by);
CREATE INDEX IF NOT EXISTS idx_professional_protocols_search ON professional_protocols USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_professional_protocols_tags ON professional_protocols USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_professional_protocols_usage_count ON professional_protocols(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_professional_protocols_rating ON professional_protocols(average_rating DESC);

CREATE INDEX IF NOT EXISTS idx_protocol_usage_logs_protocol ON protocol_usage_logs(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_usage_logs_user ON protocol_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_protocol_usage_logs_created_at ON protocol_usage_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_protocol_reviews_protocol ON protocol_reviews(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_reviews_rating ON protocol_reviews(rating);

-- Insert Professional Protocol Templates
INSERT INTO protocol_templates (template_name, protocol_type, category, description, template_data, is_public) VALUES
('Western Blot Standard Protocol', 'western_blot', 'protein_analysis', 'Complete Western Blot protocol from sample preparation to detection', 
'{
  "objective": "Detect and quantify specific proteins in biological samples using Western Blot technique",
  "background": "Western Blot is a widely used technique for protein detection and quantification. It involves protein separation by SDS-PAGE, transfer to membrane, and detection using specific antibodies.",
  "difficulty_level": "intermediate",
  "estimated_duration_minutes": 480,
  "safety_level": "medium",
  "ppe_required": ["lab_coat", "gloves", "safety_goggles"],
  "chemical_hazards": ["SDS", "methanol", "acetic_acid"],
  "reagents": [
    {"name": "SDS-PAGE Gel", "concentration": "10%", "supplier": "Bio-Rad", "catalog": "456-1093"},
    {"name": "Transfer Buffer", "concentration": "1x", "supplier": "Bio-Rad", "catalog": "170-3935"},
    {"name": "Blocking Buffer", "concentration": "5%", "supplier": "Bio-Rad", "catalog": "170-6404"}
  ],
  "equipment": [
    {"name": "Electrophoresis Unit", "specifications": "Mini-PROTEAN Tetra System", "calibration": "Monthly"},
    {"name": "Transfer Unit", "specifications": "Mini Trans-Blot Cell", "calibration": "Monthly"},
    {"name": "Imaging System", "specifications": "ChemiDoc XRS+", "calibration": "Weekly"}
  ],
  "preparation_steps": [
    {"step": 1, "description": "Prepare SDS-PAGE gel according to manufacturer instructions", "duration_minutes": 30},
    {"step": 2, "description": "Prepare protein samples with loading buffer", "duration_minutes": 15},
    {"step": 3, "description": "Heat samples at 95°C for 5 minutes", "duration_minutes": 5}
  ],
  "procedure_steps": [
    {"step": 1, "description": "Load samples and molecular weight markers into gel wells", "duration_minutes": 10},
    {"step": 2, "description": "Run electrophoresis at 100V until dye front reaches bottom", "duration_minutes": 60},
    {"step": 3, "description": "Transfer proteins to PVDF membrane using wet transfer", "duration_minutes": 90},
    {"step": 4, "description": "Block membrane with 5% milk in TBST for 1 hour", "duration_minutes": 60},
    {"step": 5, "description": "Incubate with primary antibody overnight at 4°C", "duration_minutes": 480},
    {"step": 6, "description": "Wash membrane 3x with TBST, 10 minutes each", "duration_minutes": 30},
    {"step": 7, "description": "Incubate with secondary antibody for 1 hour at RT", "duration_minutes": 60},
    {"step": 8, "description": "Wash membrane 3x with TBST, 10 minutes each", "duration_minutes": 30},
    {"step": 9, "description": "Develop using ECL substrate and image", "duration_minutes": 15}
  ],
  "quality_checkpoints": [
    {"checkpoint": "Gel Loading", "description": "Ensure equal protein loading across lanes", "critical": true},
    {"checkpoint": "Transfer Efficiency", "description": "Check Ponceau S staining for complete transfer", "critical": true},
    {"checkpoint": "Antibody Specificity", "description": "Include positive and negative controls", "critical": true}
  ],
  "troubleshooting_guide": [
    {"issue": "No bands detected", "solutions": ["Check antibody specificity", "Verify protein loading", "Optimize antibody concentration"]},
    {"issue": "High background", "solutions": ["Increase blocking time", "Optimize antibody concentration", "Increase wash stringency"]},
    {"issue": "Poor transfer", "solutions": ["Check transfer buffer pH", "Verify membrane activation", "Optimize transfer time"]}
  ],
  "expected_results": "Clear, specific bands corresponding to target protein molecular weight",
  "data_analysis_methods": ["Band intensity quantification", "Molecular weight determination", "Relative protein expression"],
  "common_pitfalls": ["Insufficient blocking", "Antibody cross-reactivity", "Overexposure of film"]
}', true),

('PCR Standard Protocol', 'pcr', 'molecular_biology', 'Standard Polymerase Chain Reaction protocol for DNA amplification',
'{
  "objective": "Amplify specific DNA sequences using polymerase chain reaction",
  "background": "PCR is a fundamental technique in molecular biology for amplifying DNA sequences. It involves repeated cycles of denaturation, annealing, and extension.",
  "difficulty_level": "beginner",
  "estimated_duration_minutes": 180,
  "safety_level": "low",
  "ppe_required": ["lab_coat", "gloves"],
  "reagents": [
    {"name": "PCR Master Mix", "concentration": "2x", "supplier": "Thermo Fisher", "catalog": "K0171"},
    {"name": "Forward Primer", "concentration": "10 μM", "supplier": "IDT", "catalog": "Custom"},
    {"name": "Reverse Primer", "concentration": "10 μM", "supplier": "IDT", "catalog": "Custom"},
    {"name": "Template DNA", "concentration": "Variable", "supplier": "Extracted", "catalog": "N/A"}
  ],
  "equipment": [
    {"name": "Thermal Cycler", "specifications": "Applied Biosystems 2720", "calibration": "Monthly"},
    {"name": "Gel Electrophoresis Unit", "specifications": "Mini-Sub Cell GT", "calibration": "Monthly"}
  ],
  "preparation_steps": [
    {"step": 1, "description": "Thaw all reagents and keep on ice", "duration_minutes": 5},
    {"step": 2, "description": "Prepare PCR reaction mix", "duration_minutes": 10},
    {"step": 3, "description": "Add template DNA last", "duration_minutes": 5}
  ],
  "procedure_steps": [
    {"step": 1, "description": "Initial denaturation at 95°C for 2 minutes", "duration_minutes": 2},
    {"step": 2, "description": "Denaturation at 95°C for 30 seconds", "duration_minutes": 0.5},
    {"step": 3, "description": "Annealing at 55°C for 30 seconds", "duration_minutes": 0.5},
    {"step": 4, "description": "Extension at 72°C for 1 minute", "duration_minutes": 1},
    {"step": 5, "description": "Repeat steps 2-4 for 30 cycles", "duration_minutes": 60},
    {"step": 6, "description": "Final extension at 72°C for 5 minutes", "duration_minutes": 5},
    {"step": 7, "description": "Hold at 4°C", "duration_minutes": 0}
  ],
  "quality_checkpoints": [
    {"checkpoint": "Primer Design", "description": "Verify primer specificity and melting temperature", "critical": true},
    {"checkpoint": "Template Quality", "description": "Check DNA concentration and purity", "critical": true},
    {"checkpoint": "Negative Control", "description": "Include no-template control", "critical": true}
  ],
  "troubleshooting_guide": [
    {"issue": "No amplification", "solutions": ["Check primer design", "Verify template quality", "Optimize annealing temperature"]},
    {"issue": "Non-specific bands", "solutions": ["Increase annealing temperature", "Optimize primer concentration", "Check template purity"]},
    {"issue": "Low yield", "solutions": ["Increase cycle number", "Optimize extension time", "Check enzyme activity"]}
  ],
  "expected_results": "Single band of expected size on agarose gel",
  "data_analysis_methods": ["Gel electrophoresis", "Band size verification", "Yield quantification"]
}', true),

('ELISA Standard Protocol', 'elisa', 'immunoassays', 'Enzyme-Linked Immunosorbent Assay for protein quantification',
'{
  "objective": "Quantify specific proteins or antibodies in biological samples using ELISA technique",
  "background": "ELISA is a plate-based assay technique for detecting and quantifying proteins, peptides, antibodies, and hormones.",
  "difficulty_level": "intermediate",
  "estimated_duration_minutes": 300,
  "safety_level": "low",
  "ppe_required": ["lab_coat", "gloves"],
  "reagents": [
    {"name": "ELISA Plate", "concentration": "96-well", "supplier": "Corning", "catalog": "3590"},
    {"name": "Capture Antibody", "concentration": "Variable", "supplier": "R&D Systems", "catalog": "Custom"},
    {"name": "Detection Antibody", "concentration": "Variable", "supplier": "R&D Systems", "catalog": "Custom"},
    {"name": "Substrate", "concentration": "TMB", "supplier": "R&D Systems", "catalog": "DY999"}
  ],
  "equipment": [
    {"name": "Plate Reader", "specifications": "BioTek Synergy H1", "calibration": "Weekly"},
    {"name": "Plate Washer", "specifications": "BioTek ELx405", "calibration": "Monthly"},
    {"name": "Incubator", "specifications": "37°C", "calibration": "Daily"}
  ],
  "preparation_steps": [
    {"step": 1, "description": "Prepare coating buffer", "duration_minutes": 10},
    {"step": 2, "description": "Dilute capture antibody in coating buffer", "duration_minutes": 5},
    {"step": 3, "description": "Prepare blocking buffer", "duration_minutes": 10}
  ],
  "procedure_steps": [
    {"step": 1, "description": "Coat plate with capture antibody overnight at 4°C", "duration_minutes": 480},
    {"step": 2, "description": "Wash plate 3x with wash buffer", "duration_minutes": 10},
    {"step": 3, "description": "Block with blocking buffer for 1 hour at RT", "duration_minutes": 60},
    {"step": 4, "description": "Wash plate 3x with wash buffer", "duration_minutes": 10},
    {"step": 5, "description": "Add samples and standards, incubate 2 hours at RT", "duration_minutes": 120},
    {"step": 6, "description": "Wash plate 3x with wash buffer", "duration_minutes": 10},
    {"step": 7, "description": "Add detection antibody, incubate 1 hour at RT", "duration_minutes": 60},
    {"step": 8, "description": "Wash plate 3x with wash buffer", "duration_minutes": 10},
    {"step": 9, "description": "Add substrate, incubate 15 minutes", "duration_minutes": 15},
    {"step": 10, "description": "Add stop solution and read absorbance", "duration_minutes": 5}
  ],
  "quality_checkpoints": [
    {"checkpoint": "Standard Curve", "description": "Include serial dilutions of known standards", "critical": true},
    {"checkpoint": "Blank Wells", "description": "Include blank wells for background subtraction", "critical": true},
    {"checkpoint": "Replicates", "description": "Run samples in triplicate", "critical": true}
  ],
  "troubleshooting_guide": [
    {"issue": "High background", "solutions": ["Increase blocking time", "Optimize antibody concentration", "Check wash buffer"]},
    {"issue": "Low signal", "solutions": ["Increase incubation time", "Check antibody activity", "Optimize sample concentration"]},
    {"issue": "Poor standard curve", "solutions": ["Check standard preparation", "Verify dilution series", "Optimize incubation conditions"]}
  ],
  "expected_results": "Linear standard curve with R² > 0.99",
  "data_analysis_methods": ["Standard curve fitting", "Concentration calculation", "Statistical analysis"]
}', true),

('Cell Culture Standard Protocol', 'cell_culture', 'cell_biology', 'Standard cell culture maintenance and passaging protocol',
'{
  "objective": "Maintain and propagate mammalian cell lines under sterile conditions",
  "background": "Cell culture is essential for studying cellular processes, drug screening, and protein production. Proper aseptic technique is critical.",
  "difficulty_level": "intermediate",
  "estimated_duration_minutes": 120,
  "safety_level": "medium",
  "ppe_required": ["lab_coat", "gloves", "safety_goggles", "face_mask"],
  "biosafety_requirements": ["Biosafety Level 2", "Laminar flow hood", "Incubator with CO2"],
  "reagents": [
    {"name": "Cell Culture Medium", "concentration": "Complete", "supplier": "Gibco", "catalog": "11965-092"},
    {"name": "Fetal Bovine Serum", "concentration": "10%", "supplier": "Gibco", "catalog": "10437-028"},
    {"name": "Trypsin-EDTA", "concentration": "0.25%", "supplier": "Gibco", "catalog": "25200-056"},
    {"name": "PBS", "concentration": "1x", "supplier": "Gibco", "catalog": "10010-023"}
  ],
  "equipment": [
    {"name": "Laminar Flow Hood", "specifications": "Class II A2", "calibration": "Annual"},
    {"name": "CO2 Incubator", "specifications": "37°C, 5% CO2", "calibration": "Daily"},
    {"name": "Inverted Microscope", "specifications": "Phase contrast", "calibration": "Monthly"}
  ],
  "preparation_steps": [
    {"step": 1, "description": "Sterilize laminar flow hood with 70% ethanol", "duration_minutes": 10},
    {"step": 2, "description": "Warm medium and reagents to 37°C", "duration_minutes": 15},
    {"step": 3, "description": "Prepare sterile pipettes and tubes", "duration_minutes": 5}
  ],
  "procedure_steps": [
    {"step": 1, "description": "Observe cell confluence under microscope", "duration_minutes": 5},
    {"step": 2, "description": "Aspirate old medium from culture vessel", "duration_minutes": 2},
    {"step": 3, "description": "Wash cells with PBS", "duration_minutes": 3},
    {"step": 4, "description": "Add trypsin-EDTA and incubate 2-5 minutes", "duration_minutes": 5},
    {"step": 5, "description": "Add complete medium to stop trypsinization", "duration_minutes": 2},
    {"step": 6, "description": "Centrifuge cell suspension at 300g for 5 minutes", "duration_minutes": 10},
    {"step": 7, "description": "Resuspend cells in fresh medium", "duration_minutes": 5},
    {"step": 8, "description": "Count cells and seed at appropriate density", "duration_minutes": 15},
    {"step": 9, "description": "Return cells to incubator", "duration_minutes": 2}
  ],
  "quality_checkpoints": [
    {"checkpoint": "Cell Viability", "description": "Check cell viability before passaging", "critical": true},
    {"checkpoint": "Sterility", "description": "Monitor for contamination", "critical": true},
    {"checkpoint": "Cell Density", "description": "Maintain appropriate seeding density", "critical": true}
  ],
  "troubleshooting_guide": [
    {"issue": "Cell contamination", "solutions": ["Discard contaminated culture", "Check sterile technique", "Use antibiotics"]},
    {"issue": "Poor cell growth", "solutions": ["Check medium pH", "Verify CO2 levels", "Check cell viability"]},
    {"issue": "Cell detachment", "solutions": ["Reduce trypsin time", "Check cell confluence", "Use gentler technique"]}
  ],
  "expected_results": "Healthy, adherent cells with >90% viability",
  "data_analysis_methods": ["Cell counting", "Viability assessment", "Growth curve analysis"]
}', true);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_protocol_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = setweight(to_tsvector('english', NEW.title), 'A') ||
                      setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
                      setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
CREATE TRIGGER update_protocol_search_vector_trigger
    BEFORE INSERT OR UPDATE ON professional_protocols
    FOR EACH ROW
    EXECUTE FUNCTION update_protocol_search_vector();

-- Create function to update protocol statistics
CREATE OR REPLACE FUNCTION update_protocol_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update success rate based on usage logs
    UPDATE professional_protocols 
    SET success_rate = (
        SELECT CASE 
            WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE execution_status = 'completed'))::DECIMAL / COUNT(*) * 100
            ELSE 0
        END
        FROM protocol_usage_logs 
        WHERE protocol_id = NEW.protocol_id
    )
    WHERE id = NEW.protocol_id;
    
    -- Update average rating
    UPDATE professional_protocols 
    SET average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM protocol_reviews 
        WHERE protocol_id = NEW.protocol_id
    ),
    total_ratings = (
        SELECT COUNT(*)
        FROM protocol_reviews 
        WHERE protocol_id = NEW.protocol_id
    )
    WHERE id = NEW.protocol_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for statistics updates
CREATE TRIGGER update_protocol_stats_usage
    AFTER INSERT OR UPDATE ON protocol_usage_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_protocol_stats();

CREATE TRIGGER update_protocol_stats_reviews
    AFTER INSERT OR UPDATE ON protocol_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_protocol_stats();

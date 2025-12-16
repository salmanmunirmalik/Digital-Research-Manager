-- Seed Dummy Protocols
-- Run this SQL script to add sample protocols

-- First, get a user ID (use the first available user)
DO $$
DECLARE
    v_user_id UUID;
    v_protocol_id UUID;
BEGIN
    -- Get first available user
    SELECT id INTO v_user_id FROM users LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found. Please create a user first.';
    END IF;

    -- Protocol 1: ELISA
    INSERT INTO protocols (
        title, description, category, version, author_id,
        content, materials, equipment, safety_notes, tags, privacy_level,
        is_approved, difficulty_level, estimated_duration, objective
    )
    VALUES (
        'ELISA (Enzyme-Linked Immunosorbent Assay)',
        'A plate-based assay technique designed for detecting and quantifying soluble substances such as peptides, proteins, antibodies, and hormones.',
        'Protein Analysis',
        '1.0',
        v_user_id,
        '[
            {"id": 1, "title": "Plate Coating", "description": "Coat 96-well plate with capture antibody (1-10 μg/mL) in coating buffer. Add 100 μL per well. Incubate overnight at 4°C or 2 hours at 37°C.", "duration": 120, "critical": true},
            {"id": 2, "title": "Blocking", "description": "Wash plate 3 times with wash buffer. Add 200 μL blocking buffer per well. Incubate at room temperature for 1-2 hours.", "duration": 120, "critical": true},
            {"id": 3, "title": "Sample Incubation", "description": "Wash plate 3 times. Add 100 μL of samples and standards per well. Incubate at 37°C for 1-2 hours or overnight at 4°C.", "duration": 120, "critical": true},
            {"id": 4, "title": "Secondary Antibody", "description": "Wash plate 5 times. Add 100 μL of enzyme-conjugated secondary antibody (diluted in blocking buffer) per well. Incubate at room temperature for 1 hour.", "duration": 60, "critical": true},
            {"id": 5, "title": "Substrate Development", "description": "Wash plate 5 times. Add 100 μL substrate solution per well. Incubate in dark at room temperature for 10-30 minutes. Monitor color development.", "duration": 30, "critical": true},
            {"id": 6, "title": "Stop and Read", "description": "Add 50 μL stop solution per well. Read absorbance immediately at appropriate wavelength (450 nm for TMB, 492 nm for OPD).", "duration": 5, "critical": true}
        ]'::jsonb,
        ARRAY[
            '96-well microplate (ELISA plate)',
            'Primary antibody (specific to target antigen)',
            'Secondary antibody (enzyme-conjugated)',
            'Blocking buffer (5% BSA or non-fat milk)',
            'Wash buffer (PBS with 0.05% Tween-20)',
            'Substrate solution (TMB or OPD)',
            'Stop solution (2M H2SO4)',
            'Sample dilutions',
            'Standard curve samples'
        ],
        ARRAY[
            'Microplate reader (spectrophotometer)',
            'Multichannel pipette',
            'Plate washer (optional)',
            'Incubator (37°C)',
            'Vortex mixer'
        ],
        'Wear appropriate PPE (gloves, lab coat)
Handle substrate solutions in fume hood
Dispose of stop solution (acid) properly
Avoid cross-contamination between wells',
        ARRAY['ELISA', 'immunoassay', 'protein detection', 'antibody', 'quantification'],
        'public',
        true,
        'intermediate',
        240,
        'Detect and quantify specific proteins or antibodies in biological samples using enzyme-linked detection'
    )
    ON CONFLICT DO NOTHING;

    -- Protocol 2: PCR Amplification
    INSERT INTO protocols (
        title, description, category, version, author_id,
        content, materials, equipment, safety_notes, tags, privacy_level,
        is_approved, difficulty_level, estimated_duration, objective
    )
    VALUES (
        'PCR Amplification',
        'Polymerase Chain Reaction for amplifying specific DNA sequences using thermal cycling and DNA polymerase.',
        'Molecular Biology',
        '1.0',
        v_user_id,
        '[
            {"id": 1, "title": "Reaction Setup", "description": "Prepare PCR master mix on ice. For 50 μL reaction: 5 μL 10X buffer, 3 μL MgCl2 (25 mM), 1 μL dNTPs (10 mM), 0.5 μL each primer (10 μM), 0.5 μL Taq polymerase, 1-5 μL template DNA, water to 50 μL.", "duration": 15, "critical": true},
            {"id": 2, "title": "Initial Denaturation", "description": "Place tubes in thermal cycler. Program: 95°C for 3-5 minutes to denature template DNA and activate hot-start polymerases.", "duration": 5, "critical": true},
            {"id": 3, "title": "Amplification Cycles", "description": "Run 25-35 cycles: Denature at 95°C for 30 seconds, Anneal at primer-specific temperature (typically 50-65°C) for 30 seconds, Extend at 72°C for 1 minute per kb of expected product.", "duration": 60, "critical": true},
            {"id": 4, "title": "Final Extension", "description": "72°C for 5-10 minutes to ensure all products are fully extended.", "duration": 10, "critical": false},
            {"id": 5, "title": "Hold", "description": "Hold at 4°C or 10°C until ready to analyze.", "duration": 0, "critical": false}
        ]'::jsonb,
        ARRAY[
            'DNA template (10-100 ng)',
            'Forward primer (10-20 μM)',
            'Reverse primer (10-20 μM)',
            'dNTP mix (200 μM each)',
            'PCR buffer (10X)',
            'MgCl2 (25 mM)',
            'Taq DNA polymerase (5 U/μL)',
            'Nuclease-free water',
            'PCR tubes or 96-well plate'
        ],
        ARRAY[
            'Thermal cycler (PCR machine)',
            'Micropipettes (P2, P20, P200)',
            'PCR workstation or clean bench',
            'Ice bucket',
            'Vortex mixer',
            'Centrifuge'
        ],
        'Work in designated PCR area to prevent contamination
Use filter tips for all pipetting
Keep reagents on ice when not in use
Wear gloves and change frequently',
        ARRAY['PCR', 'DNA amplification', 'molecular biology', 'polymerase chain reaction', 'genetics'],
        'public',
        true,
        'intermediate',
        90,
        'Amplify a specific DNA sequence to detectable levels for analysis, cloning, or sequencing'
    )
    ON CONFLICT DO NOTHING;

    -- Protocol 3: Western Blot
    INSERT INTO protocols (
        title, description, category, version, author_id,
        content, materials, equipment, safety_notes, tags, privacy_level,
        is_approved, difficulty_level, estimated_duration, objective
    )
    VALUES (
        'Western Blot',
        'Protein detection technique that separates proteins by gel electrophoresis, transfers them to a membrane, and detects specific proteins using antibodies.',
        'Protein Analysis',
        '1.0',
        v_user_id,
        '[
            {"id": 1, "title": "Sample Preparation", "description": "Mix protein samples with 2X Laemmli buffer (1:1 ratio). Heat at 95°C for 5 minutes to denature proteins. Centrifuge briefly to collect condensation.", "duration": 10, "critical": true},
            {"id": 2, "title": "Gel Electrophoresis", "description": "Load samples and ladder into gel wells. Run at 80-120V until dye front reaches bottom (approximately 1-1.5 hours). Monitor temperature to prevent overheating.", "duration": 90, "critical": true},
            {"id": 3, "title": "Protein Transfer", "description": "Assemble transfer sandwich: cathode, sponge, filter paper, gel, membrane, filter paper, sponge, anode. Transfer at 100V for 1 hour (wet transfer) or 25V for 7 minutes (semi-dry).", "duration": 60, "critical": true},
            {"id": 4, "title": "Blocking", "description": "Block membrane in 5% BSA or 5% non-fat milk in TBS-T for 1 hour at room temperature with gentle shaking.", "duration": 60, "critical": true},
            {"id": 5, "title": "Primary Antibody Incubation", "description": "Wash membrane 3x with TBS-T (5 min each). Incubate with primary antibody (diluted in blocking buffer) overnight at 4°C or 1-2 hours at room temperature.", "duration": 120, "critical": true},
            {"id": 6, "title": "Secondary Antibody and Detection", "description": "Wash membrane 3x with TBS-T (10 min each). Incubate with HRP-conjugated secondary antibody (1:5000-1:10000) for 1 hour at room temperature. Wash 3x with TBS-T. Add ECL substrate and image.", "duration": 75, "critical": true}
        ]'::jsonb,
        ARRAY[
            'Protein samples',
            'SDS-PAGE gel (10-12% acrylamide)',
            'Running buffer (Tris-Glycine-SDS)',
            'Transfer buffer',
            'PVDF or nitrocellulose membrane',
            'Blocking buffer (5% BSA or non-fat milk)',
            'Primary antibody',
            'Secondary antibody (HRP-conjugated)',
            'ECL substrate',
            'Wash buffer (TBS-T)',
            'Protein ladder',
            'Loading buffer (2X Laemmli)'
        ],
        ARRAY[
            'Gel electrophoresis apparatus',
            'Power supply',
            'Transfer apparatus (wet or semi-dry)',
            'Shaker/rocker',
            'Chemiluminescence imager or X-ray film',
            'Micropipettes',
            'Heat block or water bath'
        ],
        'Wear gloves when handling gels and membranes
Acrylamide is neurotoxic - handle with care
Work in well-ventilated area when using ECL substrate
Dispose of gels and buffers according to lab protocols',
        ARRAY['western blot', 'immunoblot', 'protein detection', 'SDS-PAGE', 'antibody'],
        'public',
        true,
        'advanced',
        300,
        'Detect and analyze specific proteins in a complex mixture using gel electrophoresis and immunoblotting'
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Successfully seeded 3 dummy protocols!';
END $$;


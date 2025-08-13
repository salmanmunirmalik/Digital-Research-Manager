import { Protocol } from '../types';

export const mockProtocols: Protocol[] = [
  {
    id: 'western-blot-101',
    title: 'Standard Western Blot Protocol',
    description: 'A reliable protocol for detecting specific proteins in a sample of tissue homogenate or extract.',
    tags: ['protein', 'western blot', 'immunoblotting'],
    author: 'Dr. Anya Sharma',
    lastUpdated: '2024-05-15',
    version: '2.2',
    access: 'Lab Only',
    versionHistory: [
        { version: '2.2', date: '2024-07-28', author: 'Admin', changes: 'Added integrated calculators and conditional logic.' },
        { version: '2.1', date: '2024-05-15', author: 'Dr. Anya Sharma', changes: 'Increased primary antibody incubation time for low-expression proteins.' },
        { version: '2.0', date: '2023-10-02', author: 'Dr. Anya Sharma', changes: 'Switched to PVDF membrane and updated transfer conditions.' },
        { version: '1.0', date: '2022-01-20', author: 'Dr. Anya Sharma', changes: 'Initial protocol creation.' },
    ],
    attachments: [
        { name: 'PVDF Membrane Handling Guide.pdf', url: '#', type: 'pdf' },
        { name: 'Example Blot Results.png', url: '#', type: 'image' },
    ],
    videoUrl: 'https://www.youtube.com/embed/LMsz-p9-a90',
    steps: [
      {
        step: 1,
        description: 'Sample Preparation',
        details: 'Lyse cells in RIPA buffer supplemented with protease and phosphatase inhibitors. Quantify protein concentration using BCA assay. Aim for a final concentration of 2 µg/µL.',
        safetyWarning: 'RIPA buffer contains detergents. Wear gloves and eye protection.',
        materials: ['RIPA buffer', 'Protease inhibitors', 'Phosphatase inhibitors', 'BCA Assay Kit', 'Cell samples', 'Microcentrifuge'],
      },
      {
        step: 2,
        description: 'Prepare Loading Samples',
        details: 'Dilute 20-30 µg of protein with 4x Laemmli sample buffer and water to a final volume of 20 µL. Heat at 95°C for 5 minutes.',
        durationMinutes: 5,
        materials: ['Protein sample', '4x Laemmli sample buffer', 'Nuclease-free water', 'Heat block'],
        calculator: {
            name: 'Dilution (M1V1=M2V2)',
            inputs: {
                m1: 2, // Corresponds to 2 µg/µL from step 1
                m2: 1, // Corresponds to 20µg in 20µL final volume
                v2: 20,
            }
        }
      },
      {
        step: 3,
        description: 'SDS-PAGE Gel Electrophoresis',
        details: 'Load samples on a 4-20% Tris-Glycine gel. Run at 120V for 90 minutes or until the dye front reaches the bottom.',
        durationMinutes: 90,
        materials: ['4-20% Tris-Glycine gel', 'Running buffer', 'Electrophoresis chamber', 'Power supply', 'Protein ladder'],
      },
      {
        step: 4,
        description: 'Protein Transfer',
        details: 'Transfer proteins to a PVDF membrane using a wet transfer system at 100V for 60 minutes in a cold room.',
        durationMinutes: 60,
        safetyWarning: 'Methanol is flammable and toxic. Work in a well-ventilated area.',
        materials: ['PVDF membrane', 'Transfer buffer (with Methanol)', 'Filter paper', 'Wet transfer system'],
        videoTimestamp: {
            url: 'https://www.youtube.com/embed/LMsz-p9-a90',
            time: 215, // corresponds to 3:35 in the video
            label: 'Watch Transfer Setup (at 3:35)'
        }
      },
      {
        step: 5,
        description: 'Blocking and Antibody Incubation',
        details: 'Block membrane with 5% non-fat milk or BSA in TBST for 1 hour at room temperature. Incubate with primary antibody overnight at 4°C.',
        durationMinutes: 60,
        materials: ['5% non-fat milk or BSA', 'TBST buffer', 'Primary antibody', 'Shaker'],
        conditional: {
            condition: "Target protein is known to be low-expression",
            ifTrue: "Use 5% BSA for blocking to reduce background and incubate primary antibody for 48 hours.",
            ifFalse: "Use 5% non-fat milk for blocking and incubate primary antibody overnight."
        }
      },
      {
        step: 6,
        description: 'Washing and Secondary Antibody',
        details: 'Wash membrane 3 times for 5 minutes each in TBST. Incubate with HRP-conjugated secondary antibody for 1 hour at room temperature.',
        durationMinutes: 60,
        materials: ['HRP-conjugated secondary antibody', 'TBST buffer'],
      },
      {
        step: 7,
        description: 'Detection',
        details: 'Wash membrane 3 times for 5 minutes each in TBST. Apply ECL substrate and image using a chemiluminescence imager.',
        materials: ['ECL substrate', 'Chemiluminescence imager'],
      },
    ],
  },
  {
    id: 'qpcr-sybr-green-202',
    title: 'qPCR with SYBR Green',
    description: 'Quantitative PCR protocol for measuring gene expression levels using SYBR Green dye.',
    tags: ['qpcr', 'gene expression', 'molecular biology'],
    author: 'Dr. Ben Carter',
    lastUpdated: '2024-06-01',
    version: '1.5',
    access: 'Public',
    discussionCount: 12,
    versionHistory: [{ version: '1.5', date: '2024-06-01', author: 'Dr. Ben Carter', changes: 'Updated cycling conditions.' }],
    attachments: [],
    steps: [
      {
        step: 1,
        description: 'RNA Extraction and cDNA Synthesis',
        details: 'Extract total RNA from samples using TRIzol. Synthesize cDNA using a reverse transcription kit with oligo(dT) primers.',
      },
      {
        step: 2,
        description: 'qPCR Reaction Setup',
        details: 'Prepare a master mix containing SYBR Green Master Mix, forward/reverse primers, and nuclease-free water. Add cDNA template to each well.',
        safetyWarning: 'SYBR Green is a potential mutagen. Always wear gloves.'
      },
      {
        step: 3,
        description: 'Run qPCR Cycle',
        details: 'Use a standard 3-step cycling protocol: 95°C for 10 min (activation), followed by 40 cycles of 95°C for 15s and 60°C for 60s.',
      },
      {
        step: 4,
        description: 'Melt Curve Analysis',
        details: 'Perform a melt curve analysis at the end of the run to verify primer specificity and absence of primer-dimers.',
      },
    ],
  },
   {
    id: 'bacterial-transformation-301',
    title: 'Bacterial Transformation (Heat Shock)',
    description: 'A standard heat shock protocol for introducing plasmid DNA into competent E. coli cells.',
    tags: ['cloning', 'bacteria', 'plasmid'],
    author: 'Lab Manager',
    lastUpdated: '2023-11-20',
    version: '3.0',
    access: 'Public',
    discussionCount: 5,
    versionHistory: [{ version: '3.0', date: '2023-11-20', author: 'Lab Manager', changes: 'Clarified heat shock timing.' }],
    attachments: [],
    videoUrl: 'https://www.youtube.com/embed/T_L_C9_TO58',
    steps: [
      {
        step: 1,
        description: 'Thaw Competent Cells',
        details: 'Thaw a 50 µL aliquot of competent E. coli cells (e.g., DH5α) on ice. This should take about 5-10 minutes.',
      },
      {
        step: 2,
        description: 'Add Plasmid DNA',
        details: 'Add 1-5 µL of plasmid DNA (10 pg to 100 ng) to the cells. Gently mix by flicking the tube. Incubate on ice for 30 minutes.',
      },
      {
        step: 3,
        description: 'Heat Shock',
        details: 'Place the tube in a 42°C water bath for exactly 45 seconds. Do not shake. Immediately transfer back to ice for 2 minutes.',
        safetyWarning: 'Ensure water bath is at the correct temperature. Timing is critical.'
      },
      {
        step: 4,
        description: 'Recovery',
        details: 'Add 950 µL of pre-warmed SOC medium to the tube. Incubate at 37°C for 60 minutes with shaking (250 rpm).',
      },
      {
        step: 5,
        description: 'Plating',
        details: 'Plate 100 µL of the cell suspension onto a pre-warmed LB agar plate containing the appropriate antibiotic. Incubate overnight at 37°C.',
      },
    ],
  },
  {
    id: 'cell-passaging-401',
    title: 'Mammalian Cell Passaging (Splitting)',
    description: 'A routine protocol for subculturing adherent mammalian cells to propagate them.',
    tags: ['cell culture', 'aseptic technique', 'mammalian'],
    author: 'Dr. Evelyn Reed',
    lastUpdated: '2024-07-10',
    version: '1.2',
    access: 'Private',
    versionHistory: [{ version: '1.2', date: '2024-07-10', author: 'Dr. Evelyn Reed', changes: 'Initial creation.' }],
    attachments: [],
    steps: [
        {
            step: 1,
            description: 'Aspirate Old Media',
            details: 'Work in a sterile biological safety cabinet. Aspirate the culture medium from the flask or dish.',
            safetyWarning: 'Maintain sterility at all times to prevent contamination.'
        },
        {
            step: 2,
            description: 'Wash with PBS',
            details: 'Gently wash the cell monolayer with sterile, pre-warmed PBS to remove any remaining serum.',
        },
        {
            step: 3,
            description: 'Trypsinization',
            details: 'Add pre-warmed Trypsin-EDTA to cover the cell layer. Incubate at 37°C for 2-5 minutes, or until cells detach.',
        },
        {
            step: 4,
            description: 'Neutralize and Collect Cells',
            details: 'Add complete medium (containing serum) to inactivate the trypsin. Resuspend cells gently and transfer the cell suspension to a conical tube.',
        },
        {
            step: 5,
            description: 'Count and Re-plate',
            details: 'Take a small aliquot for cell counting (e.g., using a hemocytometer and Trypan Blue). Seed new flasks with the desired cell density.',
        },
    ],
  },
  {
    id: 'nanodrop-quant-501',
    title: 'DNA/RNA Quantification with NanoDrop',
    description: 'Quickly quantify nucleic acid concentration and purity using a NanoDrop spectrophotometer.',
    tags: ['quantification', 'dna', 'rna', 'purity'],
    author: 'Core Facility',
    lastUpdated: '2024-03-22',
    version: '4.0',
    access: 'Public',
    discussionCount: 8,
    versionHistory: [{ version: '4.0', date: '2024-03-22', author: 'Core Facility', changes: 'Updated software screenshots.' }],
    attachments: [],
    steps: [
        {
            step: 1,
            description: 'Initialize NanoDrop',
            details: 'Clean the pedestals with nuclease-free water. Open the software and select the appropriate nucleic acid module (DNA or RNA).',
        },
        {
            step: 2,
            description: 'Blank the Instrument',
            details: 'Pipette 1-2 µL of the elution buffer (the same buffer your sample is in) onto the lower pedestal, lower the arm, and click "Blank".',
        },
        {
            step: 3,
            description: 'Measure Sample',
            details: 'Clean the pedestals. Pipette 1-2 µL of your nucleic acid sample onto the pedestal and click "Measure".',
        },
        {
            step: 4,
            description: 'Record Results',
            details: 'Record the concentration (ng/µL) and purity ratios (A260/280 and A260/230). An A260/280 of ~1.8 is considered pure for DNA, and ~2.0 for RNA.',
            safetyWarning: 'Wipe pedestals thoroughly between samples to avoid cross-contamination.'
        },
    ],
  },
  {
    id: 'if-staining-601',
    title: 'Immunofluorescence Staining of Adherent Cells',
    description: 'Protocol for visualizing proteins within cultured cells on coverslips using fluorescent antibodies.',
    tags: ['microscopy', 'immunofluorescence', 'staining', 'protein localization'],
    author: 'Dr. Kenichi Tanaka',
    lastUpdated: '2024-06-18',
    version: '2.5',
    access: 'Lab Only',
    versionHistory: [{ version: '2.5', date: '2024-06-18', author: 'Dr. Kenichi Tanaka', changes: 'Added alternative blocking buffers.' }],
    attachments: [],
    videoUrl: 'https://www.youtube.com/embed/_w_d_i_py-o',
    steps: [
        {
            step: 1,
            description: 'Cell Fixation',
            details: 'Fix cells grown on coverslips with 4% paraformaldehyde (PFA) in PBS for 15 minutes at room temperature.',
            safetyWarning: 'PFA is toxic. Handle in a fume hood and wear appropriate PPE.'
        },
        {
            step: 2,
            description: 'Permeabilization',
            details: 'Wash with PBS. Permeabilize cells with 0.1% Triton X-100 in PBS for 10 minutes to allow antibodies to enter the cell.',
        },
        {
            step: 3,
            description: 'Blocking',
            details: 'Block non-specific antibody binding by incubating coverslips in blocking buffer (e.g., 1% BSA in PBST) for 1 hour.',
        },
        {
            step: 4,
            description: 'Primary Antibody Incubation',
            details: 'Incubate with diluted primary antibody in a humidified chamber for 1 hour at room temperature or overnight at 4°C.',
        },
        {
            step: 5,
            description: 'Secondary Antibody and DAPI Stain',
            details: 'Wash thoroughly. Incubate with fluorophore-conjugated secondary antibody and DAPI (for nuclear staining) for 1 hour in the dark.',
        },
        {
            step: 6,
            description: 'Mount and Image',
            details: 'Wash and mount coverslips onto microscope slides using mounting medium. Seal and image using a fluorescence microscope.',
        },
    ],
  },
  {
    id: 'elisa-cytokine-701',
    title: 'ELISA for Cytokine Quantification',
    description: 'A sandwich ELISA protocol for quantifying the concentration of a specific cytokine in cell culture supernatants or serum.',
    tags: ['elisa', 'protein', 'quantification', 'cytokine'],
    author: 'Immunology Core',
    lastUpdated: '2024-07-25',
    version: '1.0',
    access: 'Public',
    discussionCount: 3,
    versionHistory: [{ version: '1.0', date: '2024-07-25', author: 'Immunology Core', changes: 'Initial release.' }],
    attachments: [],
    steps: [
      { step: 1, description: 'Coat Plate', details: 'Coat a 96-well plate with capture antibody diluted in coating buffer. Incubate overnight at 4°C.' },
      { step: 2, description: 'Blocking', details: 'Wash plate, then block with 1% BSA in PBS for 1-2 hours at room temperature.' },
      { step: 3, description: 'Add Samples and Standards', details: 'Wash plate. Add serially diluted standards and samples to wells. Incubate for 2 hours at room temperature.' },
      { step: 4, 'description': 'Add Detection Antibody', details: 'Wash plate. Add biotinylated detection antibody. Incubate for 1 hour at room temperature.' },
      { step: 5, description: 'Add Avidin-HRP', details: 'Wash plate. Add Avidin-HRP conjugate. Incubate for 30 minutes at room temperature in the dark.', safetyWarning: 'Protect from light.' },
      { step: 6, description: 'Develop and Read', details: 'Wash plate. Add TMB substrate and incubate until color develops. Stop reaction with stop solution. Read absorbance at 450 nm.' },
    ]
  },
  {
    id: 'crispr-ko-801',
    title: 'CRISPR/Cas9 Knockout in HEK293T cells',
    description: 'A protocol for generating a gene knockout in HEK293T cells using a two-plasmid CRISPR/Cas9 system.',
    tags: ['crispr', 'gene editing', 'knockout', 'hek293t'],
    author: 'Dr. Evelyn Reed',
    lastUpdated: '2024-06-30',
    version: '2.1',
    access: 'Lab Only',
    versionHistory: [{ version: '2.1', date: '2024-06-30', author: 'Dr. Evelyn Reed', changes: 'Updated antibiotic concentrations for selection.' }],
    attachments: [],
    videoUrl: 'https://www.youtube.com/embed/4YKFw2KZA5o',
    steps: [
      { step: 1, description: 'Design and Clone gRNA', details: 'Design a specific gRNA targeting your gene of interest. Clone the gRNA sequence into a gRNA expression vector.' },
      { step: 2, description: 'Cell Transfection', details: 'Co-transfect HEK293T cells with the Cas9-expression plasmid and the gRNA-expression plasmid using a lipid-based transfection reagent.', safetyWarning: 'Follow proper cell culture and transfection sterile techniques.' },
      { step: 3, description: 'Antibiotic Selection', details: '48 hours post-transfection, begin selection by adding the appropriate antibiotic (e.g., Puromycin) to the culture medium to select for successfully transfected cells.' },
      { step: 4, description: 'Isolate Single Clones', details: 'After selection, perform limiting dilution or use cloning cylinders to isolate single-cell clones.' },
      { step: 5, description: 'Screening and Validation', details: 'Expand clones and screen for the desired knockout by PCR, Sanger sequencing, and Western Blot to confirm loss of protein expression.' },
    ]
  }
];
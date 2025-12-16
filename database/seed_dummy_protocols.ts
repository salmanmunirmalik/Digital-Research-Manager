/**
 * Seed Dummy Protocols
 * Adds sample protocols to demonstrate the protocol feature
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Create a fresh pool for seeding
function createSeedPool() {
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return new Pool({
        host: url.hostname,
        port: parseInt(url.port || '5432'),
        database: url.pathname.slice(1),
        user: url.username,
        password: String(url.password || ''),
      });
    } catch (e) {
      return new Pool({ connectionString: process.env.DATABASE_URL });
    }
  }
  
  return new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'digital_research_manager',
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
  });
}

const pool = createSeedPool();

const dummyProtocols = [
  {
    title: 'ELISA (Enzyme-Linked Immunosorbent Assay)',
    description: 'A plate-based assay technique designed for detecting and quantifying soluble substances such as peptides, proteins, antibodies, and hormones.',
    category: 'Protein Analysis',
    objective: 'Detect and quantify specific proteins or antibodies in biological samples using enzyme-linked detection',
    background: 'ELISA is one of the most widely used immunoassays in research and clinical diagnostics. It relies on the specific binding between an antigen and its corresponding antibody, with an enzyme-linked detection system for quantification.',
    materials: [
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
    equipment: [
      'Microplate reader (spectrophotometer)',
      'Multichannel pipette',
      'Plate washer (optional)',
      'Incubator (37°C)',
      'Vortex mixer'
    ],
    safety_notes: [
      'Wear appropriate PPE (gloves, lab coat)',
      'Handle substrate solutions in fume hood',
      'Dispose of stop solution (acid) properly',
      'Avoid cross-contamination between wells'
    ],
    procedure: [
      {
        id: 1,
        title: 'Plate Coating',
        description: 'Coat 96-well plate with capture antibody (1-10 μg/mL) in coating buffer. Add 100 μL per well. Incubate overnight at 4°C or 2 hours at 37°C.',
        duration: 120,
        critical: true,
        materials_needed: [
          { name: 'Capture antibody', quantity: '1-10', unit: 'μg/mL' },
          { name: 'Coating buffer', quantity: '100', unit: 'μL/well' }
        ],
        warnings: ['Ensure even coating across all wells'],
        tips: ['Seal plate with parafilm during incubation to prevent evaporation']
      },
      {
        id: 2,
        title: 'Blocking',
        description: 'Wash plate 3 times with wash buffer. Add 200 μL blocking buffer per well. Incubate at room temperature for 1-2 hours.',
        duration: 120,
        critical: true,
        materials_needed: [
          { name: 'Blocking buffer', quantity: '200', unit: 'μL/well' }
        ],
        warnings: ['Do not allow wells to dry during washing'],
        tips: ['Use 5% BSA for better blocking, or 5% non-fat milk for cost-effectiveness']
      },
      {
        id: 3,
        title: 'Sample Incubation',
        description: 'Wash plate 3 times. Add 100 μL of samples and standards per well. Incubate at 37°C for 1-2 hours or overnight at 4°C.',
        duration: 120,
        critical: true,
        materials_needed: [
          { name: 'Samples', quantity: '100', unit: 'μL/well' },
          { name: 'Standards', quantity: '100', unit: 'μL/well' }
        ],
        warnings: ['Include negative and positive controls'],
        tips: ['Prepare samples in blocking buffer to reduce non-specific binding']
      },
      {
        id: 4,
        title: 'Secondary Antibody',
        description: 'Wash plate 5 times. Add 100 μL of enzyme-conjugated secondary antibody (diluted in blocking buffer) per well. Incubate at room temperature for 1 hour.',
        duration: 60,
        critical: true,
        materials_needed: [
          { name: 'Secondary antibody', quantity: '100', unit: 'μL/well' }
        ],
        warnings: ['Optimize antibody dilution to avoid background'],
        tips: ['Typical dilution range: 1:1000 to 1:10000']
      },
      {
        id: 5,
        title: 'Substrate Development',
        description: 'Wash plate 5 times. Add 100 μL substrate solution per well. Incubate in dark at room temperature for 10-30 minutes. Monitor color development.',
        duration: 30,
        critical: true,
        materials_needed: [
          { name: 'Substrate solution', quantity: '100', unit: 'μL/well' }
        ],
        warnings: ['Stop reaction before wells become too dark'],
        tips: ['TMB substrate: blue color, OPD substrate: yellow color']
      },
      {
        id: 6,
        title: 'Stop and Read',
        description: 'Add 50 μL stop solution per well. Read absorbance immediately at appropriate wavelength (450 nm for TMB, 492 nm for OPD).',
        duration: 5,
        critical: true,
        materials_needed: [
          { name: 'Stop solution', quantity: '50', unit: 'μL/well' }
        ],
        warnings: ['Read within 30 minutes of stopping'],
        tips: ['Use standard curve to calculate sample concentrations']
      }
    ],
    expected_results: 'A standard curve with R² > 0.99. Sample concentrations within the linear range of the standard curve. Negative controls should show minimal signal.',
    troubleshooting: [
      {
        issue: 'High background signal',
        solution: 'Increase blocking time, use higher concentration of blocking agent, or check for non-specific binding of secondary antibody'
      },
      {
        issue: 'No signal or very low signal',
        solution: 'Check antibody concentrations, ensure proper incubation times and temperatures, verify substrate is fresh'
      },
      {
        issue: 'Inconsistent results between wells',
        solution: 'Ensure even coating, check pipetting accuracy, avoid bubbles when adding reagents'
      }
    ],
    references: [
      'Engvall E, Perlmann P. Enzyme-linked immunosorbent assay (ELISA). Quantitative assay of immunoglobulin G. Immunochemistry. 1971;8(9):871-874.',
      'Lequin RM. Enzyme immunoassay (EIA)/enzyme-linked immunosorbent assay (ELISA). Clin Chem. 2005;51(12):2415-2418.'
    ],
    tags: ['ELISA', 'immunoassay', 'protein detection', 'antibody', 'quantification'],
    estimated_duration: 240,
    difficulty_level: 'intermediate'
  },
  {
    title: 'PCR Amplification',
    description: 'Polymerase Chain Reaction for amplifying specific DNA sequences using thermal cycling and DNA polymerase.',
    category: 'Molecular Biology',
    objective: 'Amplify a specific DNA sequence to detectable levels for analysis, cloning, or sequencing',
    background: 'PCR is a fundamental technique in molecular biology that allows exponential amplification of DNA sequences. It requires a DNA template, primers, nucleotides, and a thermostable DNA polymerase.',
    materials: [
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
    equipment: [
      'Thermal cycler (PCR machine)',
      'Micropipettes (P2, P20, P200)',
      'PCR workstation or clean bench',
      'Ice bucket',
      'Vortex mixer',
      'Centrifuge'
    ],
    safety_notes: [
      'Work in designated PCR area to prevent contamination',
      'Use filter tips for all pipetting',
      'Keep reagents on ice when not in use',
      'Wear gloves and change frequently'
    ],
    procedure: [
      {
        id: 1,
        title: 'Reaction Setup',
        description: 'Prepare PCR master mix on ice. For 50 μL reaction: 5 μL 10X buffer, 3 μL MgCl2 (25 mM), 1 μL dNTPs (10 mM), 0.5 μL each primer (10 μM), 0.5 μL Taq polymerase, 1-5 μL template DNA, water to 50 μL.',
        duration: 15,
        critical: true,
        materials_needed: [
          { name: 'PCR buffer', quantity: '5', unit: 'μL' },
          { name: 'MgCl2', quantity: '3', unit: 'μL' },
          { name: 'dNTPs', quantity: '1', unit: 'μL' },
          { name: 'Primers', quantity: '1', unit: 'μL each' },
          { name: 'Taq polymerase', quantity: '0.5', unit: 'μL' },
          { name: 'Template DNA', quantity: '1-5', unit: 'μL' }
        ],
        warnings: ['Keep all components on ice to prevent degradation'],
        tips: ['Prepare master mix for multiple reactions to reduce pipetting errors']
      },
      {
        id: 2,
        title: 'Initial Denaturation',
        description: 'Place tubes in thermal cycler. Program: 95°C for 3-5 minutes to denature template DNA and activate hot-start polymerases.',
        duration: 5,
        critical: true,
        materials_needed: [],
        warnings: ['Ensure lid temperature is set correctly'],
        tips: ['Longer initial denaturation (5 min) helps with complex templates']
      },
      {
        id: 3,
        title: 'Amplification Cycles',
        description: 'Run 25-35 cycles: Denature at 95°C for 30 seconds, Anneal at primer-specific temperature (typically 50-65°C) for 30 seconds, Extend at 72°C for 1 minute per kb of expected product.',
        duration: 60,
        critical: true,
        materials_needed: [],
        warnings: ['Too many cycles can increase non-specific products'],
        tips: ['Optimize annealing temperature based on primer Tm. Use gradient PCR if unsure.']
      },
      {
        id: 4,
        title: 'Final Extension',
        description: '72°C for 5-10 minutes to ensure all products are fully extended.',
        duration: 10,
        critical: false,
        materials_needed: [],
        warnings: [],
        tips: ['Helps with A-tailing for TA cloning']
      },
      {
        id: 5,
        title: 'Hold',
        description: 'Hold at 4°C or 10°C until ready to analyze.',
        duration: 0,
        critical: false,
        materials_needed: [],
        warnings: [],
        tips: ['Store at -20°C for long-term storage']
      }
    ],
    expected_results: 'Agarose gel electrophoresis should show a single band of expected size. Band intensity should correlate with template amount. No bands in negative control.',
    troubleshooting: [
      {
        issue: 'No PCR product',
        solution: 'Check primer design, verify template quality and quantity, optimize annealing temperature, ensure all reagents are added correctly'
      },
      {
        issue: 'Multiple bands or smearing',
        solution: 'Increase annealing temperature, reduce cycle number, optimize MgCl2 concentration, check primer specificity'
      },
      {
        issue: 'Weak or faint bands',
        solution: 'Increase template amount, optimize primer concentration, extend extension time, check reagent quality'
      }
    ],
    references: [
      'Mullis KB, Faloona FA. Specific synthesis of DNA in vitro via a polymerase-catalyzed chain reaction. Methods Enzymol. 1987;155:335-350.',
      'Saiki RK, et al. Primer-directed enzymatic amplification of DNA with a thermostable DNA polymerase. Science. 1988;239(4839):487-491.'
    ],
    tags: ['PCR', 'DNA amplification', 'molecular biology', 'polymerase chain reaction', 'genetics'],
    estimated_duration: 90,
    difficulty_level: 'intermediate'
  },
  {
    title: 'Western Blot',
    description: 'Protein detection technique that separates proteins by gel electrophoresis, transfers them to a membrane, and detects specific proteins using antibodies.',
    category: 'Protein Analysis',
    objective: 'Detect and analyze specific proteins in a complex mixture using gel electrophoresis and immunoblotting',
    background: 'Western blotting combines the resolving power of gel electrophoresis with the specificity of antibody-based detection. It is essential for protein identification, quantification, and post-translational modification analysis.',
    materials: [
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
    equipment: [
      'Gel electrophoresis apparatus',
      'Power supply',
      'Transfer apparatus (wet or semi-dry)',
      'Shaker/rocker',
      'Chemiluminescence imager or X-ray film',
      'Micropipettes',
      'Heat block or water bath'
    ],
    safety_notes: [
      'Wear gloves when handling gels and membranes',
      'Acrylamide is neurotoxic - handle with care',
      'Work in well-ventilated area when using ECL substrate',
      'Dispose of gels and buffers according to lab protocols'
    ],
    procedure: [
      {
        id: 1,
        title: 'Sample Preparation',
        description: 'Mix protein samples with 2X Laemmli buffer (1:1 ratio). Heat at 95°C for 5 minutes to denature proteins. Centrifuge briefly to collect condensation.',
        duration: 10,
        critical: true,
        materials_needed: [
          { name: 'Protein sample', quantity: 'variable', unit: 'μL' },
          { name: '2X Laemmli buffer', quantity: 'equal volume', unit: 'μL' }
        ],
        warnings: ['Do not overheat - can cause protein aggregation'],
        tips: ['Include positive and negative controls, use appropriate protein ladder']
      },
      {
        id: 2,
        title: 'Gel Electrophoresis',
        description: 'Load samples and ladder into gel wells. Run at 80-120V until dye front reaches bottom (approximately 1-1.5 hours). Monitor temperature to prevent overheating.',
        duration: 90,
        critical: true,
        materials_needed: [
          { name: 'Running buffer', quantity: 'enough to cover', unit: 'mL' }
        ],
        warnings: ['Ensure proper buffer levels, watch for bubbles'],
        tips: ['Run at lower voltage for better resolution of high molecular weight proteins']
      },
      {
        id: 3,
        title: 'Protein Transfer',
        description: 'Assemble transfer sandwich: cathode, sponge, filter paper, gel, membrane, filter paper, sponge, anode. Transfer at 100V for 1 hour (wet transfer) or 25V for 7 minutes (semi-dry).',
        duration: 60,
        critical: true,
        materials_needed: [
          { name: 'Transfer buffer', quantity: 'enough for sandwich', unit: 'mL' },
          { name: 'Membrane', quantity: '1', unit: 'sheet' }
        ],
        warnings: ['Ensure no air bubbles between gel and membrane'],
        tips: ['For proteins >100 kDa, extend transfer time or use lower voltage']
      },
      {
        id: 4,
        title: 'Blocking',
        description: 'Block membrane in 5% BSA or 5% non-fat milk in TBS-T for 1 hour at room temperature with gentle shaking.',
        duration: 60,
        critical: true,
        materials_needed: [
          { name: 'Blocking buffer', quantity: 'enough to cover', unit: 'mL' }
        ],
        warnings: ['Ensure membrane is fully submerged'],
        tips: ['BSA is preferred for phospho-specific antibodies']
      },
      {
        id: 5,
        title: 'Primary Antibody Incubation',
        description: 'Wash membrane 3x with TBS-T (5 min each). Incubate with primary antibody (diluted in blocking buffer) overnight at 4°C or 1-2 hours at room temperature.',
        duration: 120,
        critical: true,
        materials_needed: [
          { name: 'Primary antibody', quantity: 'diluted', unit: 'as per manufacturer' }
        ],
        warnings: ['Optimize antibody dilution to reduce background'],
        tips: ['Typical dilutions: 1:1000 to 1:5000. Reuse antibody 2-3 times if stored properly.']
      },
      {
        id: 6,
        title: 'Secondary Antibody and Detection',
        description: 'Wash membrane 3x with TBS-T (10 min each). Incubate with HRP-conjugated secondary antibody (1:5000-1:10000) for 1 hour at room temperature. Wash 3x with TBS-T. Add ECL substrate and image.',
        duration: 75,
        critical: true,
        materials_needed: [
          { name: 'Secondary antibody', quantity: 'diluted', unit: '1:5000-1:10000' },
          { name: 'ECL substrate', quantity: 'enough to cover', unit: 'mL' }
        ],
        warnings: ['Image immediately after adding substrate'],
        tips: ['Optimize exposure time to avoid overexposure. Use different exposure times for different protein levels.']
      }
    ],
    expected_results: 'Clear, specific bands corresponding to target protein molecular weight. Band intensity should correlate with protein abundance. No bands in negative control. Proper ladder migration.',
    troubleshooting: [
      {
        issue: 'No bands detected',
        solution: 'Check antibody specificity and concentration, verify protein transfer efficiency (stain membrane with Ponceau S), ensure sufficient protein loaded'
      },
      {
        issue: 'High background',
        solution: 'Increase blocking time, use higher concentration of blocking agent, optimize antibody dilutions, increase wash times'
      },
      {
        issue: 'Multiple bands',
        solution: 'Check antibody specificity, may detect isoforms or degradation products. Use more specific antibody or check sample quality.'
      },
      {
        issue: 'Bands too faint',
        solution: 'Increase protein loading, optimize antibody concentrations, extend incubation times, check transfer efficiency'
      }
    ],
    references: [
      'Towbin H, Staehelin T, Gordon J. Electrophoretic transfer of proteins from polyacrylamide gels to nitrocellulose sheets: procedure and some applications. Proc Natl Acad Sci USA. 1979;76(9):4350-4354.',
      'Burnette WN. "Western blotting": electrophoretic transfer of proteins from sodium dodecyl sulfate--polyacrylamide gels to unmodified nitrocellulose and radiographic detection with antibody and radioiodinated protein A. Anal Biochem. 1981;112(2):195-203.'
    ],
    tags: ['western blot', 'immunoblot', 'protein detection', 'SDS-PAGE', 'antibody'],
    estimated_duration: 300,
    difficulty_level: 'advanced'
  }
];

async function seedDummyProtocols() {
  try {
    console.log('🌱 Seeding dummy protocols...');

    // Get any existing user (prefer admin or first user)
    let userId;
    const userResult = await pool.query(
      "SELECT id FROM users WHERE role = 'admin' OR role = 'researcher' ORDER BY created_at LIMIT 1"
    );

    if (userResult.rows.length === 0) {
      console.error('❌ No users found in database. Please create a user first.');
      process.exit(1);
    } else {
      userId = userResult.rows[0].id;
      console.log(`✅ Using user ID: ${userId}`);
    }

    // Insert protocols
    for (const protocol of dummyProtocols) {
      // Check if protocol already exists
      const existing = await pool.query(
        'SELECT id FROM protocols WHERE title = $1',
        [protocol.title]
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️  Protocol "${protocol.title}" already exists, skipping...`);
        continue;
      }

      const result = await pool.query(
        `INSERT INTO protocols (
          title, description, category, version, author_id,
          content, materials, equipment, safety_notes, tags, privacy_level,
          is_approved, difficulty_level, estimated_duration, objective
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, title`,
        [
          protocol.title,
          protocol.description,
          protocol.category,
          '1.0',
          userId,
          JSON.stringify(protocol.procedure),
          protocol.materials,
          protocol.equipment,
          protocol.safety_notes.join('\n'),
          protocol.tags,
          'public',
          true,
          protocol.difficulty_level,
          protocol.estimated_duration,
          protocol.objective
        ]
      );

      console.log(`✅ Added protocol: "${result.rows[0].title}" (ID: ${result.rows[0].id})`);
    }

    console.log('✨ Dummy protocols seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding dummy protocols:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDummyProtocols()
  .then(() => {
    console.log('🎉 Protocol seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Protocol seeding failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });


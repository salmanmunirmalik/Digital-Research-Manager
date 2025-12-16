/**
 * Seed script for Lab Workspace dummy data
 * Adds sample data to all tabs: Teams, Projects, Tasks, Inventory, Instruments
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Create a fresh pool for seeding to avoid cached config issues
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
    password: process.env.DB_PASSWORD || '',
  });
}

const pool = createSeedPool();

async function seedLabWorkspace() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('🌱 Seeding Lab Workspace data...');

    // Get first lab and user IDs
    const labResult = await client.query('SELECT id, principal_researcher_id FROM labs LIMIT 1');
    if (labResult.rows.length === 0) {
      throw new Error('No lab found. Please create a lab first.');
    }
    const labId = labResult.rows[0].id;
    const principalResearcherId = labResult.rows[0].principal_researcher_id;

    // Get all users for assignments
    const usersResult = await client.query('SELECT id FROM users LIMIT 5');
    const userIds = usersResult.rows.map(r => r.id);
    if (userIds.length === 0) {
      throw new Error('No users found. Please create users first.');
    }

    console.log(`📋 Using lab: ${labId}, users: ${userIds.length}`);

    // 1. SEED TEAM MEMBERS (if not enough exist)
    const existingMembers = await client.query(
      'SELECT COUNT(*) as count FROM lab_members WHERE lab_id = $1',
      [labId]
    );
    const memberCount = parseInt(existingMembers.rows[0].count);

    if (memberCount < 5) {
      console.log('👥 Adding team members...');
      const memberRoles = ['principal_researcher', 'co_supervisor', 'researcher', 'researcher', 'student'];
      for (let i = 0; i < Math.min(5, userIds.length); i++) {
        try {
          await client.query(`
            INSERT INTO lab_members (lab_id, user_id, role, is_active)
            VALUES ($1, $2, $3, true)
            ON CONFLICT (lab_id, user_id) DO NOTHING
          `, [labId, userIds[i], memberRoles[i] || 'researcher']);
        } catch (e) {
          // Ignore conflicts
        }
      }
    }

    // 2. SEED RESEARCH PROJECTS
    console.log('📁 Adding research projects...');
    
    // Check if research_projects table exists, if not use projects table
    const projectsTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'research_projects'
      )
    `);
    const useResearchProjects = projectsTableCheck.rows[0].exists;
    const projectsTableName = useResearchProjects ? 'research_projects' : 'projects';
    
    const projects = [
      {
        project_code: 'PROJ-2024-001',
        project_title: 'CRISPR Gene Editing Optimization',
        project_description: 'Developing optimized protocols for CRISPR-Cas9 gene editing in mammalian cells. Focus on reducing off-target effects and improving efficiency.',
        project_type: 'research',
        research_field: 'Molecular Biology',
        status: 'active',
        total_budget: 150000,
        planned_start_date: '2024-01-15',
        planned_end_date: '2025-06-30'
      },
      {
        project_code: 'PROJ-2024-002',
        project_title: 'Protein Expression Analysis',
        project_description: 'Large-scale analysis of protein expression patterns in response to environmental stressors. Using mass spectrometry and bioinformatics.',
        project_type: 'research',
        research_field: 'Proteomics',
        status: 'active',
        total_budget: 95000,
        planned_start_date: '2024-03-01',
        planned_end_date: '2024-12-31'
      },
      {
        project_code: 'PROJ-2024-003',
        project_title: 'Cell Culture Protocol Standardization',
        project_description: 'Standardizing cell culture protocols across the lab to improve reproducibility and reduce contamination rates.',
        project_type: 'methodology',
        research_field: 'Cell Biology',
        status: 'in_progress',
        total_budget: 45000,
        planned_start_date: '2024-02-01',
        planned_end_date: '2024-08-31'
      },
      {
        project_code: 'PROJ-2023-004',
        project_title: 'Antibody Development Pipeline',
        project_description: 'Developing monoclonal antibodies for specific protein targets. Includes hybridoma generation and screening.',
        project_type: 'research',
        research_field: 'Immunology',
        status: 'completed',
        total_budget: 120000,
        planned_start_date: '2023-06-01',
        planned_end_date: '2024-01-31'
      },
      {
        project_code: 'PROJ-2024-005',
        project_title: 'Lab Equipment Maintenance Schedule',
        project_description: 'Establishing comprehensive maintenance schedules for all lab equipment to ensure optimal performance and longevity.',
        project_type: 'operations',
        research_field: 'Lab Management',
        status: 'active',
        total_budget: 25000,
        planned_start_date: '2024-01-01',
        planned_end_date: '2024-12-31'
      }
    ];

    for (const project of projects) {
      if (useResearchProjects) {
        await client.query(`
          INSERT INTO research_projects (
            project_code, project_title, project_description, project_type,
            research_field, status, total_budget, planned_start_date, planned_end_date,
            principal_investigator_id, lab_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT DO NOTHING
        `, [
          project.project_code, project.project_title, project.project_description,
          project.project_type, project.research_field, project.status,
          project.total_budget, project.planned_start_date, project.planned_end_date,
          principalResearcherId, labId
        ]);
      } else {
        await client.query(`
          INSERT INTO projects (
            title, description, lab_id, lead_researcher_id, status, start_date, end_date, budget
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT DO NOTHING
        `, [
          project.project_title, project.project_description, labId,
          principalResearcherId, project.status, project.planned_start_date,
          project.planned_end_date, project.total_budget
        ]);
      }
    }

    // 3. SEED INVENTORY ITEMS
    console.log('📦 Adding inventory items...');
    const inventoryItems = [
      {
        name: 'PCR Tubes (0.2ml)',
        description: 'Sterile PCR tubes for qPCR and standard PCR reactions',
        category: 'Consumables',
        location: 'Freezer A-3',
        quantity: 5000,
        unit: 'tubes',
        min_quantity: 1000,
        supplier: 'BioSupply Co.',
        cost_per_unit: 0.15,
        expiry_date: '2025-12-31'
      },
      {
        name: 'DMEM Medium',
        description: 'Dulbecco\'s Modified Eagle Medium with high glucose',
        category: 'Cell Culture',
        location: 'Fridge B-2',
        quantity: 12,
        unit: 'bottles',
        min_quantity: 5,
        supplier: 'CellTech Solutions',
        cost_per_unit: 45.00,
        expiry_date: '2024-08-15'
      },
      {
        name: 'Trypsin-EDTA Solution',
        description: '0.25% Trypsin-EDTA solution for cell detachment',
        category: 'Cell Culture',
        location: 'Freezer A-1',
        quantity: 8,
        unit: 'bottles',
        min_quantity: 3,
        supplier: 'CellTech Solutions',
        cost_per_unit: 38.50,
        expiry_date: '2024-09-30'
      },
      {
        name: 'Agarose Powder',
        description: 'Molecular biology grade agarose for gel electrophoresis',
        category: 'Molecular Biology',
        location: 'Shelf C-4',
        quantity: 500,
        unit: 'grams',
        min_quantity: 200,
        supplier: 'LabChem Inc.',
        cost_per_unit: 0.85,
        expiry_date: null
      },
      {
        name: 'Ethidium Bromide',
        description: 'DNA staining solution - handle with care',
        category: 'Molecular Biology',
        location: 'Chemical Storage - Hazardous',
        quantity: 50,
        unit: 'ml',
        min_quantity: 20,
        supplier: 'LabChem Inc.',
        cost_per_unit: 125.00,
        expiry_date: '2025-06-30'
      },
      {
        name: 'Pipette Tips (10μL)',
        description: 'Sterile filtered pipette tips for 10μL pipettes',
        category: 'Consumables',
        location: 'Bench Station 1',
        quantity: 20000,
        unit: 'tips',
        min_quantity: 5000,
        supplier: 'BioSupply Co.',
        cost_per_unit: 0.02,
        expiry_date: null
      },
      {
        name: 'FBS (Fetal Bovine Serum)',
        description: 'Premium grade FBS for cell culture, heat inactivated',
        category: 'Cell Culture',
        location: 'Freezer A-2',
        quantity: 5,
        unit: 'bottles',
        min_quantity: 2,
        supplier: 'CellTech Solutions',
        cost_per_unit: 350.00,
        expiry_date: '2024-10-31'
      },
      {
        name: 'Tris-HCl Buffer (1M)',
        description: 'Tris-HCl buffer solution pH 7.5',
        category: 'Reagents',
        location: 'Fridge B-1',
        quantity: 10,
        unit: 'bottles',
        min_quantity: 3,
        supplier: 'LabChem Inc.',
        cost_per_unit: 28.00,
        expiry_date: '2025-03-31'
      }
    ];

    for (const item of inventoryItems) {
      await client.query(`
        INSERT INTO inventory_items (
          name, description, category, lab_id, location, quantity, unit,
          min_quantity, supplier, cost_per_unit, expiry_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `, [
        item.name, item.description, item.category, labId, item.location,
        item.quantity, item.unit, item.min_quantity, item.supplier,
        item.cost_per_unit, item.expiry_date
      ]);
    }

    // 4. SEED INSTRUMENTS
    console.log('🔬 Adding instruments...');
    const instruments = [
      {
        name: 'Thermal Cycler Pro',
        description: 'Advanced thermal cycler for PCR reactions with gradient capability',
        category: 'Molecular Biology',
        location: 'Lab Room 201',
        model: 'TC-Pro-2024',
        manufacturer: 'BioTech Instruments',
        serial_number: 'TC-2024-001',
        status: 'available',
        purchase_date: '2023-05-15',
        warranty_expiry: '2026-05-15',
        calibration_due_date: '2024-08-01'
      },
      {
        name: 'Centrifuge Ultra',
        description: 'High-speed refrigerated centrifuge with multiple rotor options',
        category: 'General Equipment',
        location: 'Lab Room 201',
        model: 'CF-Ultra-5000',
        manufacturer: 'SpinTech Systems',
        serial_number: 'CF-2023-045',
        status: 'in_use',
        purchase_date: '2023-02-10',
        warranty_expiry: '2026-02-10',
        calibration_due_date: '2024-07-15'
      },
      {
        name: 'Fluorescence Microscope',
        description: 'Inverted fluorescence microscope with camera system',
        category: 'Imaging',
        location: 'Imaging Room 305',
        model: 'FM-Inv-4000',
        manufacturer: 'OptiView Scientific',
        serial_number: 'FM-2022-128',
        status: 'available',
        purchase_date: '2022-11-20',
        warranty_expiry: '2025-11-20',
        calibration_due_date: '2024-09-01'
      },
      {
        name: 'Cell Culture Incubator',
        description: 'CO2 incubator with temperature and humidity control',
        category: 'Cell Culture',
        location: 'Cell Culture Room 102',
        model: 'CC-Incubator-XL',
        manufacturer: 'CellCare Technologies',
        serial_number: 'CC-2023-089',
        status: 'available',
        purchase_date: '2023-03-05',
        warranty_expiry: '2026-03-05',
        calibration_due_date: '2024-06-30'
      },
      {
        name: 'Gel Documentation System',
        description: 'UV gel documentation system with image analysis software',
        category: 'Imaging',
        location: 'Lab Room 201',
        model: 'GD-System-Pro',
        manufacturer: 'BioImaging Solutions',
        serial_number: 'GD-2022-256',
        status: 'maintenance',
        purchase_date: '2022-08-15',
        warranty_expiry: '2025-08-15',
        calibration_due_date: '2024-05-20'
      },
      {
        name: 'Autoclave Sterilizer',
        description: 'Large capacity autoclave for sterilization',
        category: 'General Equipment',
        location: 'Sterilization Room 101',
        model: 'AC-Large-500',
        manufacturer: 'SteriTech Industries',
        serial_number: 'AC-2021-512',
        status: 'available',
        purchase_date: '2021-12-10',
        warranty_expiry: '2024-12-10',
        calibration_due_date: '2024-07-01'
      }
    ];

    const instrumentIds: string[] = [];
    for (const instrument of instruments) {
      const result = await client.query(`
        INSERT INTO instruments (
          name, description, category, lab_id, location, model, manufacturer,
          serial_number, status, purchase_date, warranty_expiry, calibration_due_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        instrument.name, instrument.description, instrument.category, labId,
        instrument.location, instrument.model, instrument.manufacturer,
        instrument.serial_number, instrument.status, instrument.purchase_date,
        instrument.warranty_expiry, instrument.calibration_due_date
      ]);
      
      if (result.rows.length > 0) {
        instrumentIds.push(result.rows[0].id);
      }
    }

    // 5. SEED INSTRUMENT BOOKINGS
    console.log('📅 Adding instrument bookings...');
    let bookings: any[] = [];
    if (instrumentIds.length > 0) {
      bookings = [
        {
          instrument_id: instrumentIds[0],
          user_id: userIds[0],
          start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // +4 hours
          purpose: 'PCR amplification for gene expression analysis',
          status: 'confirmed'
        },
        {
          instrument_id: instrumentIds[1],
          user_id: userIds[1],
          start_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
          purpose: 'Cell pellet collection',
          status: 'confirmed'
        }
      ];

      for (const booking of bookings) {
        await client.query(`
          INSERT INTO instrument_bookings (
            instrument_id, user_id, start_time, end_time, purpose, status
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `, [
          booking.instrument_id, booking.user_id, booking.start_time,
          booking.end_time, booking.purpose, booking.status
        ]);
      }
    }

    // 6. SEED INSTRUMENT MAINTENANCE RECORDS
    console.log('🔧 Adding maintenance records...');
    let maintenanceRecords: any[] = [];
    if (instrumentIds.length > 0) {
      maintenanceRecords = [
        {
          instrument_id: instrumentIds[4], // Gel Documentation System
          type: 'repair',
          title: 'Camera sensor replacement',
          description: 'Replacing faulty camera sensor in gel documentation system',
          scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          priority: 'high',
          estimated_duration: 120,
          cost: 850.00,
          status: 'scheduled'
        },
        {
          instrument_id: instrumentIds[1], // Centrifuge
          type: 'routine',
          title: 'Monthly calibration check',
          description: 'Routine calibration and performance check',
          scheduled_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
          priority: 'medium',
          estimated_duration: 60,
          cost: 200.00,
          status: 'scheduled'
        }
      ];

      for (const maintenance of maintenanceRecords) {
        await client.query(`
          INSERT INTO instrument_maintenance (
            instrument_id, type, title, description, scheduled_date,
            priority, estimated_duration, cost, status, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT DO NOTHING
        `, [
          maintenance.instrument_id, maintenance.type, maintenance.title,
          maintenance.description, maintenance.scheduled_date, maintenance.priority,
          maintenance.estimated_duration, maintenance.cost, maintenance.status,
          principalResearcherId
        ]);
      }
    }

    // 7. SEED WORKSPACE TASKS
    console.log('✅ Adding workspace tasks...');
    
    // Check if lab_workspaces table exists
    const workspaceTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lab_workspaces'
      )
    `);
    
    // Declare tasks outside if block for use in summary
    const tasks: Array<{
      title: string;
      description: string;
      status: string;
      priority: string;
      assignee_id: string;
      due_date: string;
    }> = [];
    
    if (workspaceTableCheck.rows[0].exists) {
      // Get or create workspace
      let workspaceResult = await client.query(
        'SELECT id FROM lab_workspaces WHERE lab_id = $1',
        [labId]
      );
      
      let workspaceId: string;
      if (workspaceResult.rows.length === 0) {
        const newWorkspace = await client.query(`
          INSERT INTO lab_workspaces (lab_id, name, created_by)
          VALUES ($1, 'Lab Workspace', $2)
          RETURNING id
        `, [labId, principalResearcherId]);
        workspaceId = newWorkspace.rows[0].id;
      } else {
        workspaceId = workspaceResult.rows[0].id;
      }

      // Get or create space
      let spaceResult = await client.query(
        'SELECT id FROM workspace_spaces WHERE workspace_id = $1 LIMIT 1',
        [workspaceId]
      );
      
      let spaceId: string;
      if (spaceResult.rows.length === 0) {
        const newSpace = await client.query(`
          INSERT INTO workspace_spaces (workspace_id, name, created_by)
          VALUES ($1, 'Research Tasks', $2)
          RETURNING id
        `, [workspaceId, principalResearcherId]);
        spaceId = newSpace.rows[0].id;
      } else {
        spaceId = spaceResult.rows[0].id;
      }

      // Get or create list
      let listResult = await client.query(
        'SELECT id FROM workspace_lists WHERE space_id = $1 LIMIT 1',
        [spaceId]
      );
      
      let listId: string;
      if (listResult.rows.length === 0) {
        const newList = await client.query(`
          INSERT INTO workspace_lists (space_id, name, created_by)
          VALUES ($1, 'Main Tasks', $2)
          RETURNING id
        `, [spaceId, principalResearcherId]);
        listId = newList.rows[0].id;
      } else {
        listId = listResult.rows[0].id;
      }

      // Add tasks
      tasks.push(...[
      {
        title: 'Prepare PCR reaction mix for gene expression analysis',
        description: 'Set up 96-well plate with master mix and primers. Include negative controls.',
        status: 'to_do',
        priority: 'high',
        assignee_id: userIds[0],
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Review and analyze protein expression data',
        description: 'Analyze mass spectrometry results from last week\'s experiment. Prepare summary report.',
        status: 'in_progress',
        priority: 'urgent',
        assignee_id: userIds[1],
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Update cell culture protocol documentation',
        description: 'Document the standardized protocol for HeLa cell culture. Include troubleshooting section.',
        status: 'in_review',
        priority: 'normal',
        assignee_id: userIds[2],
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Order new batch of FBS for cell culture',
        description: 'Check current stock and place order for FBS. Ensure proper storage upon arrival.',
        status: 'to_do',
        priority: 'high',
        assignee_id: userIds[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Calibrate thermal cycler before next experiment',
        description: 'Perform routine calibration check on thermal cycler. Verify temperature accuracy.',
        status: 'to_do',
        priority: 'normal',
        assignee_id: userIds[3],
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Prepare presentation for lab meeting',
        description: 'Create slides summarizing recent CRISPR optimization results. Include data visualizations.',
        status: 'in_progress',
        priority: 'high',
        assignee_id: userIds[1],
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Complete antibody screening assay',
        description: 'Finish screening hybridoma clones for specific antibody production.',
        status: 'done',
        priority: 'normal',
        assignee_id: userIds[2],
        due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
      ]);

      for (const task of tasks) {
        await client.query(`
          INSERT INTO workspace_tasks (
            workspace_id, space_id, list_id, title, description, status, priority,
            assignee_id, created_by, due_date
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT DO NOTHING
        `, [
          workspaceId, spaceId, listId, task.title, task.description,
          task.status, task.priority, task.assignee_id, principalResearcherId, task.due_date
        ]);
      }
    } else {
      console.log('⚠️  Workspace tables not found, skipping task seeding');
    }

    await client.query('COMMIT');
    console.log('✅ Lab Workspace seed data added successfully!');
    const taskCount = workspaceTableCheck.rows[0].exists ? tasks.length : 0;
    console.log(`
📊 Summary:
  👥 Team Members: Added/verified
  📁 Projects: ${projects.length} projects
  📦 Inventory: ${inventoryItems.length} items
  🔬 Instruments: ${instruments.length} instruments
  📅 Bookings: ${bookings.length} bookings
  🔧 Maintenance: ${maintenanceRecords.length} records
  ✅ Tasks: ${taskCount} tasks
    `);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding Lab Workspace:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed
seedLabWorkspace()
  .then(() => {
    console.log('🎉 Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  })
  .finally(() => {
    // Don't close the pool as it's shared
    // pool.end() is handled by the config module
  });


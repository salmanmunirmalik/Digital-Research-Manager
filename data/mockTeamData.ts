
import { TeamMember } from '../types';

export const mockTeam: TeamMember[] = [
  {
    id: 'team-001',
    name: 'Dr. Evelyn Reed',
    role: 'Principal Investigator',
    email: 'e.reed@researchlab.edu',
    status: 'Online',
    expertise: ['CRISPR Gene Editing', 'Cell Biology', 'Project Management'],
    currentProjects: [
      { name: 'CRISPR/Cas9 Knockout', protocolId: 'crispr-ko-801' },
      { name: 'Mammalian Cell Passaging', protocolId: 'cell-passaging-401' },
    ],
  },
  {
    id: 'team-002',
    name: 'Dr. Anya Sharma',
    role: 'Postdoctoral Fellow',
    email: 'a.sharma@researchlab.edu',
    status: 'In Lab',
    expertise: ['Immunoblotting', 'Protein Purification', 'Assay Development'],
    currentProjects: [
      { name: 'Standard Western Blot', protocolId: 'western-blot-101' },
    ],
  },
  {
    id: 'team-003',
    name: 'Dr. Ben Carter',
    role: 'Postdoctoral Fellow',
    email: 'b.carter@researchlab.edu',
    status: 'In Lab',
    expertise: ['qPCR', 'Gene Expression Analysis', 'RNA-Seq'],
    currentProjects: [
      { name: 'qPCR with SYBR Green', protocolId: 'qpcr-sybr-green-202' },
    ],
  },
  {
    id: 'team-004',
    name: 'Dr. Kenichi Tanaka',
    role: 'PhD Student',
    email: 'k.tanaka@researchlab.edu',
    status: 'Away',
    expertise: ['Microscopy', 'Immunofluorescence', 'Image Analysis'],
    currentProjects: [
      { name: 'IF Staining of Cells', protocolId: 'if-staining-601' },
    ],
  },
  {
    id: 'team-005',
    name: 'Lab Manager',
    role: 'Lab Manager',
    email: 'manager@researchlab.edu',
    status: 'Offline',
    expertise: ['Inventory Management', 'Safety Protocols', 'Equipment Maintenance'],
    currentProjects: [
      { name: 'Bacterial Transformation', protocolId: 'bacterial-transformation-301' },
    ],
  },
  {
    id: 'team-006',
    name: 'Jian Li',
    role: 'PhD Student',
    email: 'j.li@researchlab.edu',
    status: 'Online',
    expertise: ['Cell Culture', 'Molecular Cloning', 'Troubleshooting'],
    currentProjects: [
      { name: 'Help Request: Contamination', protocolId: 'cell-passaging-401' },
    ],
  },
    {
    id: 'team-007',
    name: 'Maria Garcia',
    role: 'Research Assistant',
    email: 'm.garcia@researchlab.edu',
    status: 'In Lab',
    expertise: ['RNA Extraction', 'Data Entry', 'Lab Organization'],
    currentProjects: [
      { name: 'DNA/RNA Quantification', protocolId: 'nanodrop-quant-501' },
    ],
  },
];

import { Project } from '../types';

export const mockNotebookProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'GeneX Function Study',
    description: 'Investigating the cellular role and downstream targets of the novel protein GeneX.',
    owner: 'Dr. Evelyn Reed',
    experiments: [
        {
            id: 'exp-101',
            name: 'Initial WB Validation',
            goal: 'Confirm GeneX expression in various cell lines and validate antibody specificity.',
            entries: [
                {
                    id: 'entry-201',
                    title: 'WB for GeneX - From Protocol',
                    author: 'Dr. Anya Sharma',
                    protocolId: 'western-blot-101',
                    createdDate: '2024-07-28T10:00:00Z',
                    lastModified: '2024-07-28T16:30:00Z',
                    status: 'Awaiting Review',
                    tags: ['western blot', 'validation', 'genex'],
                    comments: [
                        { id: 'com-3', author: 'Dr. Evelyn Reed', date: '2024-07-29T10:00:00Z', content: 'This looks great, Anya. Please add an AI summary and I will sign it.' }
                    ],
                    versionHistory: [],
                    content: [
                        { id: 'cb-1', type: 'text', data: { html: '<p>First attempt to validate the new anti-GeneX antibody (Cat# ab12345). Following the standard lab protocol.</p>' } },
                        { id: 'cb-2', type: 'protocol_step', data: { step: 1, description: 'Sample Preparation' } },
                        { id: 'cb-3', type: 'text', data: { html: '<p>Prepared lysates from HEK293T, HeLa, and A549 cells. Protein concentration determined by BCA assay.</p>' } },
                        { id: 'cb-4', type: 'table', data: { 
                            headers: ['Sample', 'Concentration (µg/µL)'],
                            rows: [
                                ['HEK293T', '2.1'],
                                ['HeLa', '1.8'],
                                ['A549', '2.5']
                            ]
                        }},
                        { id: 'cb-5', type: 'protocol_step', data: { step: 2, description: 'Prepare Loading Samples' } },
                        { id: 'cb-6', type: 'text', data: { html: '<p>Loaded 30 µg of protein for each cell line. Everything proceeded as expected.</p>' } },
                        { id: 'cb-7', type: 'protocol_step', data: { step: 7, description: 'Detection' } },
                        { id: 'cb-8', type: 'text', data: { html: '<p><b>Results:</b> Strong band observed around the expected MW (75 kDa) in HEK293T and HeLa cells. A549 showed a very faint band. The antibody seems specific. Background was low. Attaching the final blot image.</p>' } },
                        { id: 'cb-9', type: 'file', data: { name: 'GeneX_WB_2024-07-28.tiff', size: '4.5 MB', url: '#' } }
                    ]
                },
                 {
                    id: 'entry-202',
                    title: 'Follow-up Titration',
                    author: 'Dr. Anya Sharma',
                    createdDate: '2024-07-29T11:00:00Z',
                    lastModified: '2024-07-29T11:00:00Z',
                    status: 'In Progress',
                    tags: ['western blot', 'optimization'],
                    comments: [],
                    versionHistory: [],
                    content: [
                        { id: 'cb-10', type: 'text', data: { html: '<p>Based on yesterday\'s result, I am titrating the antibody to find the optimal concentration.</p>' } },
                    ]
                }
            ]
        },
        {
            id: 'exp-102',
            name: 'CRISPR Knockout Generation',
            goal: 'Generate a stable GeneX knockout cell line in HEK293T.',
            entries: [
                 {
                    id: 'entry-301',
                    title: 'Transfection for KO',
                    author: 'Dr. Evelyn Reed',
                    protocolId: 'crispr-ko-801',
                    createdDate: '2024-07-25T14:00:00Z',
                    lastModified: '2024-07-27T09:15:00Z',
                    status: 'Completed',
                    tags: ['crispr', 'knockout', 'transfection'],
                    versionHistory: [],
                    comments: [
                        { id: 'com-1', author: 'Dr. Anya Sharma', date: '2024-07-27T10:00:00Z', content: 'Looks good. What was the transfection efficiency?' },
                        { id: 'com-2', author: 'Dr. Evelyn Reed', date: '2024-07-27T10:05:00Z', content: 'Around 80% based on GFP co-transfection. Starting selection tomorrow.' },
                    ],
                    content: [
                         { id: 'cb-11', type: 'text', data: { html: '<p>Co-transfected pLenti-Cas9-Blast with two gRNA plasmids targeting Exon 2 of GeneX into HEK293T cells using Lipofectamine 3000.</p>' } },
                         { id: 'summary-301', type: 'summary', data: { text: "Objective:\nTo create a GeneX knockout in HEK293T cells via CRISPR/Cas9.\n\nKey Steps & Observations:\n- Co-transfection of Cas9 and gRNA plasmids was performed using Lipofectamine 3000.\n- Transfection efficiency was visually estimated at ~80% using a GFP co-reporter.\n\nOutcome:\nThe cells were successfully transfected. Antibiotic selection will begin to isolate stable knockout clones.", isStored: false }}
                    ]
                }
            ]
        }
    ]
  },
  {
    id: 'proj-002',
    name: 'Compound Screening Assay',
    description: 'Screen a library of 1000 small molecules for cytotoxic effects on cancer cell lines.',
    owner: 'Dr. Ben Carter',
    experiments: [
         {
            id: 'exp-201',
            name: 'HeLa Cell Viability Screen - Plates 1-10',
            goal: 'Perform initial screen on first 10 plates of the compound library.',
            entries: [
                {
                    id: 'entry-401',
                    title: 'Assay Day 1: Plates 1-5',
                    author: 'Dr. Ben Carter',
                    protocolId: 'cell-passaging-401', // General cell culture
                    createdDate: '2024-07-20T09:00:00Z',
                    lastModified: '2024-07-21T17:00:00Z',
                    status: 'Signed',
                    tags: ['assay', 'screening', 'cytotoxicity'],
                    comments: [],
                    versionHistory: [],
                    signature: {
                        signedBy: 'Dr. Evelyn Reed',
                        date: '2024-07-22T11:30:00Z'
                    },
                    content: [
                        { id: 'cb-12', type: 'text', data: { html: '<h3>Initial Screen Run</h3><p>Seeded HeLa cells and treated with compounds from plates 1-5 (Compounds #1-480). After 48 hours, performed CellTiter-Glo assay to measure viability.</p>' } },
                        { id: 'cb-13', type: 'file', data: { name: 'Plates_1-5_RawData.xlsx', size: '1.2 MB', url: '#' } },
                        { id: 'summary-401', type: 'summary', data: { 
                            text: "Objective:\nTo screen the first 5 plates of a small molecule library for cytotoxic effects on HeLa cells.\n\nKey Steps & Observations:\n- HeLa cells were seeded in 96-well plates.\n- Compounds were added to a final concentration of 10 µM.\n- Cells were incubated for 48 hours.\n- Viability was assessed using the CellTiter-Glo luminescent assay.\n\nOutcome:\nFour compounds (#42, #117, #256, #301) were identified as potential hits, showing a greater than 50% reduction in cell viability compared to the DMSO control. These will be advanced to dose-response validation.",
                            isStored: true
                        }}
                    ]
                }
            ]
        }
    ]
  }
];
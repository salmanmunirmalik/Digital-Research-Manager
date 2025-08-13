
import { ResultEntry } from '../types';

export const mockResults: ResultEntry[] = [
    {
        id: 'res-001',
        title: 'qPCR Results: Gene X expression post-treatment',
        date: '2024-07-22',
        author: 'Dr. Ben Carter',
        protocolId: 'qpcr-sybr-green-202',
        summary: 'Analyzed the expression of Gene X in treated vs. untreated cells. Results show a significant 2.5-fold increase in expression after 24h treatment.',
        tags: ['qPCR', 'gene expression', 'data'],
        dataPreview: {
            type: 'graph',
            content: {
                type: 'bar',
                title: 'Relative Gene X Expression',
                data: [
                    { label: 'Control', value: 1.0 },
                    { label: 'Treated', value: 2.5 }
                ]
            }
        },
        source: 'Manual'
    },
    {
        id: 'res-002',
        title: 'Protein Purification Yield (His-Tag)',
        date: '2024-07-19',
        author: 'Dr. Anya Sharma',
        protocolId: 'western-blot-101',
        summary: 'Successfully purified His-tagged Protein Y. Final yield was 2.5 mg from a 1L culture. Purity confirmed by Coomassie stain and Western Blot.',
        tags: ['protein purification', 'yield', 'data'],
        dataPreview: {
            type: 'table',
            content: {
                headers: ['Parameter', 'Value', 'Unit'],
                rows: [
                    ['Total Culture Volume', 1, 'L'],
                    ['Final Elution Volume', 2.08, 'mL'],
                    ['Concentration', 1.2, 'mg/mL'],
                    ['Total Yield', 2.5, 'mg'],
                    ['Purity (Est.)', '>95', '%']
                ]
            }
        },
        source: 'Manual'
    },
    {
        id: 'res-003',
        title: 'Cell Viability Assay - Compound Z',
        date: '2024-07-15',
        author: 'Dr. Evelyn Reed',
        protocolId: 'cell-passaging-401',
        summary: 'Dose-response curve for Compound Z on HeLa cells. The IC50 was determined to be approximately 15 µM.',
        tags: ['cell viability', 'ic50', 'cytotoxicity'],
        dataPreview: {
            type: 'text',
            content: 'Raw data available in notebook. IC50 calculated using GraphPad Prism. See attached analysis file.'
        },
        source: 'Manual'
    },
    {
        id: 'res-004',
        title: 'Summary: Assay Day 1: Plates 1-5',
        date: '2024-07-21',
        author: 'Dr. Ben Carter',
        protocolId: 'cell-passaging-401',
        summary: "Objective:\nTo screen the first 5 plates of a small molecule library for cytotoxic effects on HeLa cells.\n\nKey Steps & Observations:\n- HeLa cells were seeded in 96-well plates.\n- Compounds were added to a final concentration of 10 µM.\n- Cells were incubated for 48 hours.\n- Viability was assessed using the CellTiter-Glo luminescent assay.\n\nOutcome:\nFour compounds (#42, #117, #256, #301) were identified as potential hits, showing a greater than 50% reduction in cell viability compared to the DMSO control. These will be advanced to dose-response validation.",
        tags: ['summary', 'screening', 'cytotoxicity'],
        dataPreview: {
            type: 'text',
            content: 'Link to Notebook Entry #entry-401'
        },
        source: 'Notebook Summary',
        notebookEntryId: 'entry-401'
    }
];

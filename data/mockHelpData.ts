
import { HelpRequest } from '../types';

export const mockHelpRequests: HelpRequest[] = [
  {
    id: 'help-001',
    title: 'Contamination in my HEK293T cell culture',
    author: 'Jian Li',
    date: '2024-07-20',
    protocolId: 'cell-passaging-401',
    description: 'I keep getting what looks like yeast or fungal contamination in my HEK293T cells, about 2-3 days after splitting. I\'ve cleaned the incubator and the hood. Any ideas what to check next?',
    status: 'Open',
    tags: ['cell culture', 'contamination', 'hek293t'],
  },
  {
    id: 'help-002',
    title: 'Very high A260/230 ratio after RNA extraction',
    author: 'Maria Garcia',
    date: '2024-07-18',
    protocolId: 'nanodrop-quant-501',
    description: 'My A260/280 ratio is good (~2.1), but my A260/230 is consistently high, around 2.5-3.0. I know low ratios are bad, but what does a high one mean? I am worried it will affect my qPCR.',
    status: 'Open',
    tags: ['rna extraction', 'nanodrop', 'purity'],
  },
    {
    id: 'help-003',
    title: 'No bands on Western Blot after transfer',
    author: 'David Chen',
    date: '2024-07-15',
    protocolId: 'western-blot-101',
    description: 'I ran my gel, and the ladder looks fine. But after I transfer and do a Ponceau stain on the membrane, there are no bands at all. It\'s like the protein isn\'t transferring from the gel. What could be wrong with my transfer setup?',
    status: 'Resolved',
    tags: ['western blot', 'troubleshooting', 'transfer'],
  },
];

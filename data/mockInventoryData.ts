
import { InventoryItem } from '../types';

export const mockInventory: InventoryItem[] = [
    {
        id: 'inv-001',
        name: 'Puromycin',
        type: 'Reagent',
        supplier: 'Sigma-Aldrich',
        catalogNumber: 'P8833',
        location: 'Freezer -20°C, Box 3',
        quantity: { value: 50, unit: 'mg' },
        lotNumber: 'MKCK6135',
        expirationDate: '2026-12-31',
        sdsUrl: 'https://www.sigmaaldrich.com/US/en/sds/sigma/p8833',
        lowStockThreshold: 10,
        lastUpdated: '2024-07-01'
    },
    {
        id: 'inv-002',
        name: 'Anti-GAPDH (mouse monoclonal)',
        type: 'Antibody',
        supplier: 'Santa Cruz Biotech',
        catalogNumber: 'sc-47724',
        location: 'Freezer -20°C, Antibody Box',
        quantity: { value: 50, unit: 'µL' },
        lotNumber: 'A1524',
        expirationDate: '2025-05-15',
        lowStockThreshold: 20,
        lastUpdated: '2024-05-15'
    },
    {
        id: 'inv-003',
        name: 'pLenti-Cas9-Blast',
        type: 'Plasmid',
        supplier: 'Addgene',
        catalogNumber: '52962',
        location: 'Freezer -80°C, Plasmid Box 1',
        quantity: { value: 3, unit: 'tubes' },
        lotNumber: 'N/A',
        expirationDate: '2030-01-01',
        lastUpdated: '2024-06-20'
    },
    {
        id: 'inv-004',
        name: 'DMEM, high glucose, GlutaMAX™',
        type: 'Reagent',
        supplier: 'Gibco',
        catalogNumber: '10566016',
        location: 'Fridge 4°C, Media Shelf',
        quantity: { value: 1, unit: 'bottle' },
        lotNumber: '22A560',
        expirationDate: '2025-08-30',
        lowStockThreshold: 2,
        lastUpdated: '2024-07-10'
    },
    {
        id: 'inv-005',
        name: '100mm Cell Culture Dishes',
        type: 'Consumable',
        supplier: 'Corning',
        catalogNumber: '430167',
        location: 'Storage Room, Shelf 2B',
        quantity: { value: 8, unit: 'sleeves' },
        lotNumber: 'C-23-456',
        expirationDate: '2028-01-01',
        lowStockThreshold: 10, // This is low stock
        lastUpdated: '2024-07-21'
    },
    {
        id: 'inv-006',
        name: 'TRIzol Reagent',
        type: 'Reagent',
        supplier: 'Invitrogen',
        catalogNumber: '15596026',
        location: 'Fridge 4°C, RNA Box',
        quantity: { value: 50, unit: 'mL' },
        lotNumber: 'IV-789',
        expirationDate: '2024-01-31', // This is expired
        lowStockThreshold: 20,
        sdsUrl: 'https://www.thermofisher.com/document-connect/document-connect.html?url=https://assets.thermofisher.com/TFS-Assets/LSG/SDS/15596026_SDS_EN.pdf',
        lastUpdated: '2023-02-01'
    },
    {
        id: 'inv-007',
        name: 'Patient Sample #P042-A',
        type: 'Sample',
        supplier: 'Clinical Core',
        catalogNumber: 'N/A',
        location: 'Freezer -80°C, Clinical Box 7',
        quantity: { value: 2, unit: 'aliquots' },
        lotNumber: 'P042-A-01',
        expirationDate: '2029-07-01',
        lastUpdated: '2024-07-15'
    },
    {
        id: 'inv-008',
        name: 'Fetal Bovine Serum (FBS)',
        type: 'Reagent',
        supplier: 'Atlanta Biologicals',
        catalogNumber: 'S11150',
        location: 'Freezer -20°C, Box 1',
        quantity: { value: 250, unit: 'mL' },
        lotNumber: 'AB10101',
        expirationDate: '2025-09-01',
        lowStockThreshold: 100,
        lastUpdated: '2024-07-18'
    },
];


import { Instrument, Booking, UsageLogEntry } from '../types';

export const mockInstruments: Instrument[] = [
  { id: 'inst-001', name: 'Zeiss Confocal 880', type: 'Microscope', location: 'Microscopy Core, Room 204', status: 'Operational' },
  { id: 'inst-002', name: 'Illumina NextSeq 2000', type: 'Sequencer', location: 'Genomics Core, Room 310', status: 'Operational' },
  { id: 'inst-003', name: 'BD FACSAria Fusion', type: 'FACS', location: 'Flow Core, Room 112', status: 'Under Maintenance' },
  { id: 'inst-004', name: 'Beckman Optima XPN-100', type: 'Centrifuge', location: 'Main Lab, Bench 5', status: 'Operational' },
  { id: 'inst-005', 'name': 'Bio-Rad CFX96 Real-Time PCR', type: 'PCR Machine', location: 'PCR Suite, Room 301', status: 'Operational' },
  { id: 'inst-006', name: 'Leica DMi8 Inverted', type: 'Microscope', location: 'TC Room 1', status: 'Offline' }
];

const today = new Date();
const getISOString = (dayOffset: number, hour: number, minute: number = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
};

export const mockBookings: Booking[] = [
  // Zeiss Confocal 880
  { id: 'book-001', instrumentId: 'inst-001', userId: 'Dr. Anya Sharma', title: 'IF Staining Imaging', startTime: getISOString(0, 10), endTime: getISOString(0, 12) },
  { id: 'book-002', instrumentId: 'inst-001', userId: 'Dr. Kenichi Tanaka', title: 'Live Cell Imaging', startTime: getISOString(0, 14), endTime: getISOString(0, 17) },
  { id: 'book-003', instrumentId: 'inst-001', userId: 'Dr. Evelyn Reed', title: 'Post-transfection check', startTime: getISOString(1, 9), endTime: getISOString(1, 10) },

  // Illumina NextSeq 2000
  { id: 'book-004', instrumentId: 'inst-002', userId: 'Genomics Core Staff', title: 'Library QC Run', startTime: getISOString(0, 9), endTime: getISOString(0, 11) },
  { id: 'book-005', instrumentId: 'inst-002', userId: 'Dr. Ben Carter', title: 'RNA-Seq Library Run', startTime: getISOString(0, 11), endTime: getISOString(1, 18) },
  
  // Beckman Centrifuge
  { id: 'book-006', instrumentId: 'inst-004', userId: 'Dr. Evelyn Reed', title: 'Mitochondria Isolation', startTime: getISOString(0, 15, 30), endTime: getISOString(0, 16, 30)},

  // Bio-Rad PCR
  { id: 'book-007', instrumentId: 'inst-005', userId: 'Dr. Ben Carter', title: 'gDNA Expression Analysis', startTime: getISOString(2, 13), endTime: getISOString(2, 15) },
  { id: 'book-008', instrumentId: 'inst-005', userId: 'Dr. Anya Sharma', title: 'Validate siRNA knockdown', startTime: getISOString(0, 9), endTime: getISOString(0, 11) }
];


export const mockUsageLog: UsageLogEntry[] = [
    { id: 'log-001', instrumentId: 'inst-001', userId: 'Dr. Anya Sharma', startTime: getISOString(-1, 10), endTime: getISOString(-1, 12), type: 'Usage', notes: 'Images looked great. No issues.' },
    { id: 'log-002', instrumentId: 'inst-003', userId: 'Core Staff', startTime: getISOString(-2, 9), endTime: getISOString(-1, 17), type: 'Maintenance', notes: 'Annual laser alignment and cleaning. Machine is now offline pending verification.' },
    { id: 'log-003', instrumentId: 'inst-002', userId: 'Dr. Ben Carter', startTime: getISOString(-5, 11), endTime: getISOString(-4, 18), type: 'Usage', notes: 'Run completed successfully.' },
    { id: 'log-004', instrumentId: 'inst-001', userId: 'Dr. Kenichi Tanaka', startTime: getISOString(-3, 14), endTime: getISOString(-3, 17), type: 'Usage', notes: '' },
    { id: 'log-005', instrumentId: 'inst-004', userId: 'Dr. Evelyn Reed', startTime: getISOString(-1, 15, 30), endTime: getISOString(-1, 16, 30), type: 'Usage', notes: 'High speed run for protein fractionation.' },
    { id: 'log-006', instrumentId: 'inst-001', userId: 'Dr. Kenichi Tanaka', startTime: getISOString(-8, 14), endTime: getISOString(-8, 15), type: 'Issue Reported', notes: '488nm laser seems slightly less powerful than usual. Please check.' }
];
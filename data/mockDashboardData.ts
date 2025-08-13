
import { ActiveExperiment, DashboardTask, CalendarEvent } from '../types';

export const mockActiveExperiments: ActiveExperiment[] = [
  {
    id: 'exp-001',
    name: 'qPCR Run - Gene X Expression',
    status: 'Annealing',
    progress: 75,
    timeLeftMs: 15 * 60 * 1000, // 15 minutes
    link: '/protocols/qpcr-sybr-green-202',
  },
  {
    id: 'exp-002',
    name: 'Primary Antibody Incubation (WB)',
    status: 'Incubating at 4°C',
    progress: 30,
    timeLeftMs: 8 * 60 * 60 * 1000, // 8 hours
    link: '/protocols/western-blot-101',
  },
  {
    id: 'exp-003',
    name: 'HEK293T Cell Recovery',
    status: 'Awaiting selection',
    progress: 95,
    link: '/protocols/crispr-ko-801',
  },
];

export const mockTasks: DashboardTask[] = [
  {
    id: 'task-1',
    text: 'Prepare 1L of DMEM media',
    isCompleted: false,
    priority: 'High',
  },
  {
    id: 'task-2',
    text: 'Analyze last week\'s sequencing data',
    isCompleted: false,
    priority: 'Medium',
  },
  {
    id: 'task-3',
    text: 'Order Puromycin stock',
    isCompleted: true,
    priority: 'High',
  },
  {
    id: 'task-4',
    text: 'Email Dr. Smith about collaboration',
    isCompleted: false,
    priority: 'Low',
  },
];


const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
const nextMonday = new Date();
nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);

const formatDate = (d: Date) => d.toISOString().split('T')[0];

export const mockCalendarEvents: CalendarEvent[] = [
    {
        id: 'cal-1',
        title: 'Weekly Lab Meeting',
        date: formatDate(nextMonday),
        time: '10:00',
        type: 'Meeting',
    },
    {
        id: 'cal-2',
        title: 'Confocal Microscope Booking',
        date: formatDate(today),
        time: '14:00',
        type: 'Booking',
    },
     {
        id: 'cal-3',
        title: 'Start CRISPR Transfection',
        date: formatDate(today),
        time: '11:30',
        type: 'Experiment',
    },
    {
        id: 'cal-4',
        title: 'Journal Club Presentation',
        date: formatDate(tomorrow),
        time: '13:00',
        type: 'Meeting',
    },
    {
        id: 'cal-5',
        title: 'Analyze WB results',
        date: formatDate(yesterday),
        time: '09:00',
        type: 'Experiment',
    }
];

// Digital Research Manager - TypeScript Types
// Based on PostgreSQL database schema

export type UserRole = 'admin' | 'principal_researcher' | 'co_supervisor' | 'researcher' | 'student';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type PrivacyLevel = 'personal' | 'lab' | 'global';
export type DataType = 'protocol' | 'experiment' | 'inventory' | 'instrument' | 'result' | 'note' | 'attachment';

// Calculator Types
export type CalculatorName = string;

export interface CalculatorInput {
  name: string;
  label: string;
  type: 'number' | 'text' | 'select';
  unit?: string;
  required: boolean;
  min?: number;
  max?: number;
  step?: number | string;
  helpText: string;
  placeholder?: string;
  options?: string[];
}

export interface CalculatorResult {
  value: number;
  unit: string;
  confidence?: number;
  explanation?: string;
  warnings?: string[];
  suggestions?: string[];
}

export interface CalculatorInfo {
  name: string;
  category: string;
  subCategory: string;
  description: string;
  formula: string;
  units: {
    inputs: Record<string, string>;
    output: string;
  };
  examples: Array<{
    title: string;
    inputs: Record<string, any>;
    expectedOutput: number;
    explanation: string;
  }>;
  references: string[];
  tags: string[];
}

export interface ConversionCategory {
  name: string;
  units: Unit[];
}

export interface Unit {
  name: string;
  symbol: string;
  factor: number;
  baseUnit: string;
}

export interface ConversionHistory {
  id: string;
  fromValue: number;
  fromUnit: string;
  toValue: number;
  toUnit: string;
  category: string;
  timestamp: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  lab_id: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  profile?: {
    bio?: string;
    expertise?: string[];
    institution?: string;
    department?: string;
    phone?: string;
    avatar?: string;
  };
}

// Lab Types
export interface Lab {
  id: string;
  name: string;
  description?: string;
  institution: string;
  department?: string;
  created_at: string;
  updated_at: string;
  settings?: {
    timezone?: string;
    currency?: string;
    units?: 'metric' | 'imperial';
    privacy_default?: PrivacyLevel;
  };
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  lab_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  start_date?: string;
  end_date?: string;
  budget?: number;
  tags: string[];
  privacy_level: PrivacyLevel;
}

// Protocol Types
export interface Protocol {
  id: string;
  title: string;
  description?: string;
  category: string;
  steps: ProtocolStep[];
  materials: ProtocolMaterial[];
  equipment: ProtocolEquipment[];
  safety_notes?: string[];
  estimated_duration?: number; // in minutes
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  created_by: string;
  lab_id: string;
  project_id?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
  privacy_level: PrivacyLevel;
  version: number;
  parent_protocol_id?: string;
}

export interface ProtocolStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  duration?: number; // in minutes
  temperature?: number;
  notes?: string;
  warnings?: string[];
  images?: string[];
  videos?: string[];
}

export interface ProtocolMaterial {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  supplier?: string;
  catalog_number?: string;
  notes?: string;
}

export interface ProtocolEquipment {
  id: string;
  name: string;
  model?: string;
  supplier?: string;
  notes?: string;
}

// Experiment Types
export interface Experiment {
  id: string;
  title: string;
  description?: string;
  protocol_id: string;
  project_id?: string;
  created_by: string;
  lab_id: string;
  status: 'planned' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  results?: ExperimentResult[];
  notes?: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  privacy_level: PrivacyLevel;
}

export interface ExperimentResult {
  id: string;
  experiment_id: string;
  parameter: string;
  value: number | string;
  unit?: string;
  notes?: string;
  created_at: string;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  unit: string;
  supplier?: string;
  catalog_number?: string;
  cost_per_unit?: number;
  expiry_date?: string;
  storage_location?: string;
  lab_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  privacy_level: PrivacyLevel;
}

// Instrument Types
export interface Instrument {
  id: string;
  name: string;
  model?: string;
  manufacturer?: string;
  category: string;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_order';
  location?: string;
  lab_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  specifications?: Record<string, any>;
  maintenance_schedule?: {
    last_maintenance?: string;
    next_maintenance?: string;
    maintenance_notes?: string;
  };
  tags: string[];
  privacy_level: PrivacyLevel;
}

// Result Types
export interface Result {
  id: string;
  experiment_id: string;
  title: string;
  description?: string;
  data_type: DataType;
  data: any; // Flexible data structure
  analysis?: string;
  conclusions?: string;
  created_by: string;
  lab_id: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  privacy_level: PrivacyLevel;
  is_public: boolean;
  attachments?: string[];
}

// Note Types
export interface Note {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'protocol' | 'experiment' | 'inventory' | 'instrument';
  related_id?: string; // ID of related protocol, experiment, etc.
  created_by: string;
  lab_id: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  privacy_level: PrivacyLevel;
  is_public: boolean;
}

// Attachment Types
export interface Attachment {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  file_path: string;
  uploaded_by: string;
  lab_id: string;
  related_type?: DataType;
  related_id?: string;
  created_at: string;
  tags: string[];
  privacy_level: PrivacyLevel;
  is_public: boolean;
}

// Dashboard Types
export interface DashboardStats {
  total_protocols: number;
  total_experiments: number;
  pending_tasks: number;
  upcoming_events: number;
  lab_members: number;
  active_projects: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  assigned_to?: string;
  created_by: string;
  lab_id: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  privacy_level: PrivacyLevel;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  created_by: string;
  lab_id: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  privacy_level: PrivacyLevel;
  is_public: boolean;
}

export interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: 'yellow' | 'blue' | 'green' | 'purple' | 'pink' | 'orange';
  position: {
    x: number;
    y: number;
  };
  created_by: string;
  lab_id: string;
  created_at: string;
  updated_at: string;
  privacy_level: PrivacyLevel;
}

export interface ExperimentUpdate {
  id: string;
  experiment_id: string;
  title: string;
  description: string;
  status: 'success' | 'failure' | 'partial' | 'in_progress';
  created_by: string;
  lab_id: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  privacy_level: PrivacyLevel;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  category: 'protocol' | 'experiment' | 'inventory' | 'instrument' | 'result' | 'note';
  created_by: string;
  lab_id: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  privacy_level: PrivacyLevel;
}

// Research Data Entry Types
export interface ResearchDataEntry {
  id: string;
  title: string;
  description?: string;
  data_type: 'experiment' | 'analysis' | 'image' | 'document' | 'protocol' | 'code';
  category: string;
  date: string;
  status: 'draft' | 'in_review' | 'approved' | 'published';
  author: string;
  lab: string;
  files: Array<{
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: string;
  }>;
  metadata: {
    experimentDate?: string;
    sampleCount?: number;
    replicates?: number;
    conditions?: string[];
    instruments?: string[];
    reagents?: string[];
    notes?: string;
  };
  analysis?: {
    method: string;
    software: string;
    parameters: Record<string, any>;
    results: Record<string, any>;
  };
  protocol?: {
    steps: string[];
    duration: number;
    difficulty: 'easy' | 'medium' | 'hard';
    equipment: string[];
  };
  created_at: string;
  updated_at: string;
  tags: string[];
  privacy_level: PrivacyLevel;
}

// Research-Focused Dashboard Types
export interface ResearchProject {
  id: string;
  title: string;
  status: 'planning' | 'active' | 'analysis' | 'writing' | 'published';
  progress: number;
  team: string[];
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  publications: number;
  citations: number;
  funding?: {
    amount: number;
    source: string;
    endDate: string;
  };
  milestones: Array<{
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
  }>;
}

export interface ResearchMetrics {
  totalProjects: number;
  activeExperiments: number;
  publicationsThisYear: number;
  citationsTotal: number;
  collaborationScore: number;
  productivityTrend: 'up' | 'down' | 'stable';
  fundingSecured: number;
  grantApplications: number;
  conferencePresentations: number;
}

export interface ResearchDeadline {
  id: string;
  title: string;
  type: 'grant' | 'conference' | 'publication' | 'experiment' | 'thesis' | 'review';
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  description?: string;
  relatedProject?: string;
  status: 'upcoming' | 'submitted' | 'completed' | 'missed';
}

export interface ResearchActivity {
  id: string;
  type: 'experiment' | 'publication' | 'collaboration' | 'milestone' | 'grant' | 'conference';
  title: string;
  description?: string;
  timestamp: string;
  user: string;
  relatedProject?: string;
  impact?: 'high' | 'medium' | 'low';
}

export interface ResearchInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'achievement' | 'suggestion' | 'trend';
  title: string;
  description: string;
  action?: { 
    label: string; 
    route: string; 
    type: 'navigate' | 'modal' | 'external';
  };
  priority: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  category: 'grants' | 'collaborations' | 'publications' | 'productivity' | 'trends';
  expiresAt?: string;
}

export interface Collaboration {
  id: string;
  title: string;
  type: 'internal' | 'external' | 'industry' | 'international';
  status: 'active' | 'proposed' | 'completed' | 'on_hold';
  partners: Array<{
    name: string;
    institution: string;
    role: string;
    contact: string;
  }>;
  startDate: string;
  endDate?: string;
  description?: string;
  outcomes?: string[];
  publications?: number;
  funding?: number;
}

export interface ResearchTrend {
  id: string;
  title: string;
  category: 'methodology' | 'technology' | 'collaboration' | 'funding';
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: 'short' | 'medium' | 'long';
  relevance: number; // 0-100
  sources: string[];
  recommendations?: string[];
}
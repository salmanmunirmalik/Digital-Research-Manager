// Digital Research Manager - TypeScript Types
// Based on PostgreSQL database schema

export type UserRole = 'admin' | 'principal_researcher' | 'co_supervisor' | 'researcher' | 'student';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type PrivacyLevel = 'personal' | 'lab' | 'global';
export type DataType = 'protocol' | 'experiment' | 'inventory' | 'instrument' | 'result' | 'note' | 'attachment';

// Core User Types
export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  bio?: string;
  research_interests?: string[];
  created_at: string;
  updated_at: string;
  last_login?: string;
  email_verified: boolean;
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  bio?: string;
  research_interests?: string[];
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  bio?: string;
  research_interests?: string[];
  avatar_url?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserAuth {
  user: User;
  token: string;
  refresh_token: string;
}

// Lab Management Types
export interface Lab {
  id: string;
  name: string;
  description?: string;
  institution?: string;
  department?: string;
  principal_researcher_id: string;
  co_supervisor_id?: string;
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface LabCreate {
  name: string;
  description?: string;
  institution?: string;
  department?: string;
  co_supervisor_id?: string;
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
}

export interface LabMember {
  id: string;
  lab_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
  permissions: Record<string, any>;
  is_active: boolean;
  user?: User;
}

export interface LabMemberCreate {
  lab_id: string;
  user_id: string;
  role: UserRole;
  permissions?: Record<string, any>;
}

// Project Management Types
export interface Project {
  id: string;
  title: string;
  description?: string;
  lab_id: string;
  lead_researcher_id: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  objectives?: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  title: string;
  description?: string;
  lab_id: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  objectives?: string[];
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  permissions: Record<string, any>;
  user?: User;
}

// Protocol Management Types
export interface Protocol {
  id: string;
  title: string;
  description?: string;
  category?: string;
  version: string;
  author_id: string;
  lab_id?: string;
  project_id?: string;
  privacy_level: PrivacyLevel;
  content: string;
  materials?: string[];
  equipment?: string[];
  safety_notes?: string;
  estimated_duration?: number;
  difficulty_level?: string;
  tags?: string[];
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  author?: User;
  lab?: Lab;
  project?: Project;
}

export interface ProtocolCreate {
  title: string;
  description?: string;
  category?: string;
  content: string;
  materials?: string[];
  equipment?: string[];
  safety_notes?: string;
  estimated_duration?: number;
  difficulty_level?: string;
  tags?: string[];
  privacy_level?: PrivacyLevel;
  lab_id?: string;
  project_id?: string;
}

export interface ProtocolSharing {
  id: string;
  protocol_id: string;
  shared_with_user_id?: string;
  shared_with_lab_id?: string;
  permission_level: string;
  shared_at: string;
  expires_at?: string;
}

// Lab Notebook Types
export interface LabNotebookEntry {
  id: string;
  title: string;
  content: string;
  author_id: string;
  lab_id?: string;
  project_id?: string;
  entry_type: string;
  privacy_level: PrivacyLevel;
  tags?: string[];
  experiment_date?: string;
  results?: string;
  conclusions?: string;
  next_steps?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
  author?: User;
  lab?: Lab;
  project?: Project;
}

export interface LabNotebookEntryCreate {
  title: string;
  content: string;
  entry_type?: string;
  privacy_level?: PrivacyLevel;
  tags?: string[];
  experiment_date?: string;
  results?: string;
  conclusions?: string;
  next_steps?: string;
  attachments?: string[];
  lab_id?: string;
  project_id?: string;
}

// Inventory Management Types
export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  lab_id: string;
  location?: string;
  quantity: number;
  unit?: string;
  min_quantity: number;
  supplier?: string;
  supplier_contact?: string;
  cost_per_unit?: number;
  last_restocked?: string;
  expiry_date?: string;
  storage_conditions?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  lab?: Lab;
}

export interface InventoryItemCreate {
  name: string;
  description?: string;
  category?: string;
  location?: string;
  quantity: number;
  unit?: string;
  min_quantity?: number;
  supplier?: string;
  supplier_contact?: string;
  cost_per_unit?: number;
  last_restocked?: string;
  expiry_date?: string;
  storage_conditions?: string;
  notes?: string;
}

// Instrument Management Types
export interface Instrument {
  id: string;
  name: string;
  description?: string;
  category?: string;
  lab_id: string;
  location?: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  calibration_due_date?: string;
  status: string;
  maintenance_notes?: string;
  user_manual_url?: string;
  created_at: string;
  updated_at: string;
  lab?: Lab;
}

export interface InstrumentCreate {
  name: string;
  description?: string;
  category?: string;
  location?: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  calibration_due_date?: string;
  status?: string;
  maintenance_notes?: string;
  user_manual_url?: string;
}

export interface InstrumentBooking {
  id: string;
  instrument_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  purpose?: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  instrument?: Instrument;
  user?: User;
}

export interface InstrumentBookingCreate {
  instrument_id: string;
  start_time: string;
  end_time: string;
  purpose?: string;
}

// Task Management Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  assigned_by?: string;
  lab_id?: string;
  project_id?: string;
  priority: string;
  status: string;
  due_date?: string;
  completed_at?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  user?: User;
  assigned_by_user?: User;
  lab?: Lab;
  project?: Project;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  tags?: string[];
  lab_id?: string;
  project_id?: string;
}

// Sticky Notes Types
export interface StickyNote {
  id: string;
  user_id: string;
  content: string;
  color: string;
  position_x: number;
  position_y: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface StickyNoteCreate {
  content: string;
  color?: string;
  position_x?: number;
  position_y?: number;
  is_pinned?: boolean;
}

export interface StickyNoteUpdate {
  content?: string;
  color?: string;
  position_x?: number;
  position_y?: number;
  is_pinned?: boolean;
}

// Calendar Types
export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location?: string;
  event_type: string;
  lab_id?: string;
  project_id?: string;
  attendees?: string[];
  reminder_minutes: number;
  created_at: string;
  updated_at: string;
  user?: User;
  lab?: Lab;
  project?: Project;
}

export interface CalendarEventCreate {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  location?: string;
  event_type?: string;
  lab_id?: string;
  project_id?: string;
  attendees?: string[];
  reminder_minutes?: number;
}

// Experiment Updates Types
export interface ExperimentUpdate {
  id: string;
  user_id: string;
  title: string;
  content: string;
  experiment_id?: string;
  lab_id?: string;
  project_id?: string;
  update_type: string;
  progress_percentage: number;
  challenges?: string;
  solutions?: string;
  next_milestone?: string;
  due_date?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  user?: User;
  lab?: Lab;
  project?: Project;
}

export interface ExperimentUpdateCreate {
  title: string;
  content: string;
  experiment_id?: string;
  update_type?: string;
  progress_percentage?: number;
  challenges?: string;
  solutions?: string;
  next_milestone?: string;
  due_date?: string;
  tags?: string[];
  lab_id?: string;
  project_id?: string;
}

// Data Sharing Types
export interface DataSharing {
  id: string;
  data_type: DataType;
  data_id: string;
  owner_id: string;
  privacy_level: PrivacyLevel;
  shared_with_users?: string[];
  shared_with_labs?: string[];
  is_public: boolean;
  access_requests?: string[];
  created_at: string;
  updated_at: string;
  owner?: User;
}

export interface DataSharingCreate {
  data_type: DataType;
  data_id: string;
  privacy_level: PrivacyLevel;
  shared_with_users?: string[];
  shared_with_labs?: string[];
  is_public?: boolean;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: User;
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

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  privacy_level?: PrivacyLevel;
  lab_id?: string;
  project_id?: string;
  user_id?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  action_url?: string;
}

// Permission Types
export interface Permission {
  resource: string;
  actions: string[];
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'date' | 'number' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface FormConfig {
  fields: FormField[];
  submitText?: string;
  cancelText?: string;
}

// UI Component Types
export interface NavItem {
  id: string;
  title: string;
  route: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

export interface Breadcrumb {
  title: string;
  route?: string;
  active?: boolean;
}

// Chart and Analytics Types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface TableData {
  columns: {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
  }[];
  rows: Record<string, any>[];
}

// File Upload Types
export interface FileUpload {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface FileUploadCreate {
  file: File;
  description?: string;
  tags?: string[];
}

// Export Types
export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel' | 'json';
  include_attachments?: boolean;
  date_range?: {
    from: string;
    to: string;
  };
  filters?: SearchFilters;
}

// Import Types
export interface ImportOptions {
  format: 'csv' | 'excel' | 'json';
  file: File;
  mapping?: Record<string, string>;
  update_existing?: boolean;
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'notification' | 'update' | 'chat' | 'system';
  payload: any;
  timestamp: string;
  user_id?: string;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Success Types
export interface SuccessMessage {
  message: string;
  data?: any;
  timestamp: string;
}

// Results & Data Types
export interface ResultEntry {
  id: string;
  title: string;
  summary: string;
  author: string;
  date: string;
  tags: string[];
  source: 'Manual' | 'Notebook Summary' | 'Import';
  dataPreview: DataPreview;
  lab_id: string;
  project_id?: string;
  privacy_level: PrivacyLevel;
  created_at: string;
  updated_at: string;
}

export interface DataPreview {
  type: 'table' | 'graph' | 'text' | 'image';
  content: any;
}

export interface DataEntryForm {
  title: string;
  summary: string;
  data_type: 'experiment' | 'observation' | 'measurement' | 'survey' | 'simulation' | 'other';
  data_format: 'spreadsheet' | 'manual' | 'import';
  lab_id: string;
  project_id?: string;
  tags: string[];
  privacy_level: PrivacyLevel;
  
  // For spreadsheet data
  spreadsheet_data?: {
    headers: string[];
    rows: string[][];
    file_name?: string;
    file_type?: 'excel' | 'csv' | 'tsv';
  };
  
  // For manual entry
  manual_data?: {
    fields: Array<{
      name: string;
      type: 'text' | 'number' | 'date' | 'boolean' | 'select';
      value: string | number | boolean;
      required: boolean;
      options?: string[];
    }>;
  };
  
  // For imported data
  import_data?: {
    source: string;
    original_format: string;
    metadata: Record<string, any>;
  };
}

export interface DataTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select';
    required: boolean;
    default_value?: string | number | boolean;
    options?: string[];
    validation_rules?: Record<string, any>;
  }>;
  created_by: string;
  lab_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}


export interface VersionHistory {
  version: string;
  date: string;
  author: string;
  changes: string;
}

export interface ProtocolAttachment {
    name: string;
    url: string;
    type: 'pdf' | 'image' | 'video' | 'spreadsheet' | 'other';
    size?: number;
    uploadedAt: string;
}

export interface ProtocolStep {
  step: number;
  description: string;
  details?: string;
  safetyWarning?: string;
  materials?: string[]; // For the Reagents & Equipment checklist
  durationMinutes?: number; // For the integrated timer
  temperature?: {
    value: number;
    unit: 'C' | 'F' | 'K';
    tolerance?: number;
  };
  pH?: {
    value: number;
    tolerance?: number;
  };
  calculator?: {
    name: CalculatorName;
    inputs: { [key: string]: string | number };
  };
  videoTimestamp?: {
      url: string;
      time: number; // in seconds
      label: string;
  };
  conditional?: {
      condition: string;
      ifTrue: string;
      ifFalse: string;
  };
  qualityControl?: {
    expectedOutcome: string;
    successCriteria: string[];
    troubleshooting: string[];
  };
  wasteDisposal?: string;
  references?: string[];
}

export interface Protocol {
  id: string;
  title: string;
  description: string;
  abstract?: string;
  tags: string[];
  author: string;
  lastUpdated: string;
  version: string;
  versionHistory: VersionHistory[];
  access: 'Public' | 'Lab Only' | 'Private' | 'Collaborative';
  discussionCount?: number;
  steps: ProtocolStep[];
  videoUrl?: string;
  attachments: ProtocolAttachment[];
  forkedFrom?: string; // ID of the protocol it was duplicated from
  
  // Enhanced fields for scientists
  category: ProtocolCategory;
  subcategory: ProtocolSubcategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  estimatedTime: {
    preparation: number; // minutes
    execution: number; // minutes
    analysis: number; // minutes
    total: number; // minutes
  };
  equipment: {
    essential: string[];
    optional: string[];
    shared: string[];
  };
  reagents: {
    essential: ReagentInfo[];
    optional: ReagentInfo[];
    alternatives: ReagentAlternative[];
  };
  safety: {
    riskLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
    hazards: string[];
    ppe: string[];
    emergencyProcedures: string[];
    disposalRequirements: string[];
  };
  validation: {
    testedBy: string[];
    validationDate: string;
    successRate: number; // percentage
    notes: string;
  };
  publications: {
    doi?: string;
    journal?: string;
    year?: number;
    authors?: string[];
  };
  relatedProtocols: string[]; // IDs of related protocols
  keywords: string[];
  language: string;
  lastValidated: string;
  citationCount: number;
  rating: number; // 1-5 stars
  reviewCount: number;
}

export type ProtocolCategory = 
  | 'Molecular Biology'
  | 'Cell Biology'
  | 'Biochemistry'
  | 'Genetics'
  | 'Microbiology'
  | 'Immunology'
  | 'Neuroscience'
  | 'Bioinformatics'
  | 'Chemistry'
  | 'Physics'
  | 'Engineering'
  | 'Other';

export type ProtocolSubcategory = 
  | 'DNA/RNA Extraction'
  | 'PCR & Amplification'
  | 'Cloning & Transformation'
  | 'Protein Expression'
  | 'Cell Culture'
  | 'Flow Cytometry'
  | 'Microscopy'
  | 'Western Blot'
  | 'ELISA'
  | 'Sequencing'
  | 'CRISPR/Cas9'
  | 'Single Cell Analysis'
  | 'Proteomics'
  | 'Metabolomics'
  | 'Bioinformatics Analysis'
  | 'Data Visualization'
  | 'Other';

export interface ReagentInfo {
  name: string;
  concentration?: string;
  volume: string;
  supplier?: string;
  catalogNumber?: string;
  storage: string;
  stability: string;
  alternatives?: string[];
}

export interface ReagentAlternative {
  original: string;
  alternatives: {
    name: string;
    supplier: string;
    catalogNumber: string;
    notes: string;
  }[];
}

// Enhanced Calculator Types
export type CalculatorCategory = 
    | 'Chemistry & Biochemistry'
    | 'Molecular & Cell Biology'
    | 'Physiology & Neuroscience'
    | 'Bioinformatics'
    | 'Statistics & Data Analysis'
    | 'Engineering & Physics';

export type CalculatorSubCategory = 
    | 'General Chemistry'
    | 'Nucleic Acid Tools'
    | 'Primers & Oligos'
    | 'Cloning & Reactions'
    | 'Protein & Assays'
    | 'Cell Biology'
    | 'Genetics & Physiology'
    | 'Bioinformatics & Sequencing'
    | 'Statistical Analysis'
    | 'Data Visualization'
    | 'Unit Conversion'
    | 'Dilution Series';

export type CalculatorName =
    // Chemistry & Biochemistry
    | 'Molarity Calculator'
    | 'Dilution Calculator (M1V1=M2V2)'
    | 'Molecular Weight Calculator'
    | 'Buffer pH Calculator (Henderson-Hasselbalch)'
    | 'Unit Converter'
    | 'Concentration Calculator'
    | 'pH Calculator'
    | 'Buffer Preparation'
    | 'Titration Calculator'
    | 'Reaction Stoichiometry'
    
    // Molecular & Cell Biology
    | 'Primer Tm Calculator'
    | 'Oligo Resuspension Calculator'
    | 'Ligation Ratio Calculator'
    | 'Transformation Efficiency Calculator'
    | 'PCR Master Mix Calculator'
    | 'Cell Viability Calculator'
    | 'Serial Dilution Calculator'
    | 'Primer Designer'
    | 'Restriction Digest Calculator'
    | 'DNA Concentration Calculator'
    | 'RNA Concentration Calculator'
    | 'Protein Concentration Calculator'
    | 'Cell Counting Calculator'
    | 'Doubling Time Calculator'
    
    // Physiology & Neuroscience
    | 'Nernst Potential Calculator'
    | 'Action Potential Calculator'
    | 'Synaptic Strength Calculator'
    | 'Ion Concentration Calculator'
    | 'Membrane Potential Calculator'
    
    // Bioinformatics
    | 'Sequence Alignment Calculator'
    | 'GC Content Calculator'
    | 'Codon Usage Calculator'
    | 'Restriction Site Finder'
    | 'Primer Pair Analyzer'
    | 'Sequence Similarity Calculator'
    
    // Statistics & Data Analysis
    | 'Standard Deviation Calculator'
    | 'T-Test Calculator'
    | 'ANOVA Calculator'
    | 'Correlation Calculator'
    | 'Linear Regression Calculator'
    | 'Sample Size Calculator'
    | 'P-Value Calculator'
    | 'Confidence Interval Calculator'
    
    // Engineering & Physics
    | 'Centrifugation Calculator'
    | 'Flow Rate Calculator'
    | 'Pressure Calculator'
    | 'Temperature Conversion'
    | 'Volume Calculator'
    | 'Density Calculator';

export interface CalculatorInfo {
    name: CalculatorName;
    category: CalculatorCategory;
    subCategory: CalculatorSubCategory;
    description: string;
    formula?: string;
    units: {
        inputs: { [key: string]: string };
        output: string;
    };
    examples: CalculatorExample[];
    references?: string[];
    tags: string[];
}

export interface CalculatorExample {
    title: string;
    inputs: { [key: string]: string | number };
    expectedOutput: string | number;
    explanation: string;
}

export interface CalculatorInput {
    name: string;
    label: string;
    type: 'number' | 'text' | 'select' | 'checkbox';
    unit?: string;
    required: boolean;
    min?: number;
    max?: number;
    step?: number;
    options?: { value: string; label: string }[];
    placeholder?: string;
    helpText?: string;
    validation?: {
        pattern?: string;
        message?: string;
    };
}

export interface CalculatorResult {
    value: number | string;
    unit: string;
    confidence?: number;
    explanation?: string;
    warnings?: string[];
    suggestions?: string[];
}

// --- NEW LAB NOTEBOOK TYPES ---

export type ContentBlockType = 'text' | 'table' | 'image' | 'file' | 'protocol_step' | 'summary';

export interface ContentBlock {
    id: string;
    type: ContentBlockType;
    data: any; // 'text': { html: string }, 'table': { headers: string[], rows: string[][] }, 'image': { url: string, caption: string }, 'summary': { text: string, isStored?: boolean } etc.
}

export interface NotebookComment {
    id: string;
    author: string;
    date: string;
    content: string;
}

export interface EntryVersion {
    version: number;
    date: string;
    author: string;
    content: ContentBlock[];
}

export interface DigitalSignature {
    signedBy: string; // User ID or Name of the PI
    date: string; // ISO 8601 timestamp
}

export interface NotebookEntry {
  id: string;
  title: string;
  author: string;
  createdDate: string;
  lastModified: string;
  protocolId?: string;
  tags: string[];
  status: 'In Progress' | 'Completed' | 'Awaiting Review' | 'Signed';
  content: ContentBlock[];
  summary?: string; // AI generated summary
  versionHistory: EntryVersion[];
  comments: NotebookComment[];
  signature?: DigitalSignature;
}

export interface Experiment {
    id: string;
    name: string;
    goal?: string;
    entries: NotebookEntry[];
}

export interface Project {
    id: string;
    name: string;
    description: string;
    owner: string; // User ID or Name of PI
    experiments: Experiment[];
}

// --- END NEW LAB NOTEBOOK TYPES ---


export interface HelpRequest {
  id: string;
  title: string;
  author: string;
  date: string;
  protocolId?: string;
  description: string;
  status: 'Open' | 'Resolved';
  tags: string[];
}

export interface InventoryItem {
    id: string;
    name: string;
    type: 'Reagent' | 'Antibody' | 'Plasmid' | 'Consumable' | 'Sample';
    supplier: string;
    catalogNumber: string;
    location: string;
    quantity: {
        value: number;
        unit: string;
    };
    lotNumber: string;
    expirationDate: string; // YYYY-MM-DD
    lowStockThreshold?: number;
    sdsUrl?: string;
    lastUpdated: string;
}

export type DataPreview = 
    | { type: 'table'; content: { headers: string[]; rows: (string|number)[][] } }
    | { type: 'graph'; content: { type: 'bar' | 'line'; title: string; data: { label: string; value: number }[] } }
    | { type: 'text'; content: string };

export interface ResultEntry {
    id:string;
    title: string;
    date: string;
    author: string;
    protocolId?: string;
    summary: string;
    tags: string[];
    dataPreview: DataPreview;
    source?: 'Notebook Summary' | 'Manual';
    notebookEntryId?: string;
    analysis?: {
        insights: string;
        nextSteps: string;
        pitfalls: string;
    };
}


// --- Dashboard Types ---
export interface ActiveExperiment {
  id: string;
  name: string;
  status: string;
  progress: number; // 0-100
  timeLeftMs?: number; // duration in milliseconds
  link: string;
}

export interface DashboardTask {
  id: string;
  text: string;
  isCompleted: boolean;
  priority: 'High' | 'Medium' | 'Low';
}

export interface DashboardNotification {
  id: string;
  type: 'Alert' | 'Info' | 'Help' | 'Booking';
  message: string;
  link: string;
  date: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: 'Experiment' | 'Meeting' | 'Booking';
}

// --- Instrument Booking Types ---
export interface Instrument {
  id: string;
  name: string;
  type: 'Microscope' | 'Sequencer' | 'Centrifuge' | 'FACS' | 'PCR Machine';
  location: string;
  status: 'Operational' | 'Under Maintenance' | 'Offline';
}

export interface Booking {
  id: string;
  instrumentId: string;
  userId: string; // Could be name for simplicity
  title: string;
  startTime: string; // ISO 8601 format: 'YYYY-MM-DDTHH:mm:ss.sssZ'
  endTime: string; // ISO 8601 format
}

export interface UsageLogEntry {
  id: string;
  instrumentId: string;
  userId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  type: 'Usage' | 'Maintenance' | 'Issue Reported';
  notes: string;
}

// --- Team Types ---
export interface TeamMember {
  id: string;
  name: string;
  role: 'Principal Investigator' | 'Postdoctoral Fellow' | 'PhD Student' | 'Lab Manager' | 'Research Assistant';
  avatarUrl?: string; // Using a generic icon for now
  email: string;
  status: 'Online' | 'In Lab' | 'Away' | 'Offline';
  expertise: string[];
  currentProjects: {
    name: string;
    protocolId: string;
  }[];
}

// --- CALCULATOR ENHANCEMENT TYPES ---

export interface ScratchpadItem {
  id: string;
  calculatorName: CalculatorName;
  inputs: { label: string; value: string | number; unit?: string }[];
  result: { label: string; value: string | number; unit?: string };
  timestamp: string;
}

export interface WorkflowStep {
  id: string;
  calculatorName: CalculatorName;
}

// --- BIOINFORMATICS TYPES ---

export interface PrimerPair {
  forward: {
    sequence: string;
    tm: number;
    gc: number;
    start: number;
  };
  reverse: {
    sequence: string;
    tm: number;
    gc: number;
    start: number;
  };
  productSize: number;
}

export interface RestrictionCut {
  enzyme: string;
  cutPositions: number[];
}

export interface RestrictionResult {
  cuts: RestrictionCut[];
  fragments: number[];
}
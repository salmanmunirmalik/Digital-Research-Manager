// Cross-Entity Integration Service
// Handles bidirectional data synchronization and A-Z research workflow

export interface EntityRelationship {
  id: string;
  sourceEntityType: string;
  sourceEntityId: string;
  targetEntityType: string;
  targetEntityId: string;
  relationshipType: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  metadata: Record<string, any>;
}

export interface DataSyncLog {
  id: string;
  sourceEntityType: string;
  sourceEntityId: string;
  targetEntityType: string;
  targetEntityId: string;
  syncAction: 'create' | 'update' | 'delete' | 'link';
  syncStatus: 'pending' | 'success' | 'failed' | 'conflict';
  syncTimestamp: string;
  errorMessage?: string;
  metadata: Record<string, any>;
}

export interface EnhancedProtocol {
  id: string;
  title: string;
  description: string;
  protocolType: 'experimental' | 'analytical' | 'safety' | 'maintenance';
  category: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  objective: string;
  materialsNeeded: any[];
  equipmentRequired: any[];
  safetyPrecautions: string;
  procedureSteps: any[];
  expectedResults: string;
  troubleshooting: string;
  references: string[];
  relatedNotebookEntries: string[];
  relatedInventoryItems: string[];
  relatedInstrumentBookings: string[];
  relatedResults: string[];
  labId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  usageCount: number;
  autoSyncEnabled: boolean;
  syncToNotebook: boolean;
  syncToInventory: boolean;
  tags: string[];
  keywords: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration?: number;
  costEstimate?: number;
}

export interface EnhancedResult {
  id: string;
  title: string;
  description: string;
  resultType: 'experimental' | 'analytical' | 'computational' | 'literature';
  dataType: 'quantitative' | 'qualitative' | 'mixed' | 'observational';
  rawData: Record<string, any>;
  processedData: Record<string, any>;
  analysisMethod: string;
  statisticalMethods: string[];
  confidenceLevel?: number;
  sampleSize?: number;
  relatedNotebookEntries: string[];
  relatedProtocols: string[];
  relatedInstrumentBookings: string[];
  relatedCollaborations: string[];
  labId: string;
  projectId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  autoSyncEnabled: boolean;
  syncToNotebook: boolean;
  syncToProtocols: boolean;
  tags: string[];
  keywords: string[];
  fileAttachments: string[];
  visualizationData: Record<string, any>;
}

export interface EnhancedInstrumentBooking {
  id: string;
  instrumentName: string;
  instrumentId?: string;
  bookingType: 'training' | 'research' | 'maintenance' | 'calibration';
  startTime: string;
  endTime: string;
  durationMinutes: number;
  purpose: string;
  description: string;
  relatedNotebookEntries: string[];
  relatedProtocols: string[];
  relatedResults: string[];
  relatedProjects: string[];
  userId: string;
  labId: string;
  supervisorId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  approvalNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  autoSyncEnabled: boolean;
  syncToNotebook: boolean;
  syncToProtocols: boolean;
  createdAt: string;
  updatedAt: string;
  cost?: number;
  notes?: string;
  attachments: string[];
}

export interface ResearchWorkflowIntegration {
  notebookEntryId: string;
  notebookTitle: string;
  entryType: string;
  notebookStatus: string;
  notebookCreated: string;
  protocols: any[];
  results: any[];
  instrumentBookings: any[];
  labName: string;
  creatorName: string;
  tags: string[];
  priority: string;
}

export interface WorkflowAnalytics {
  totalNotebookEntries: number;
  totalProtocols: number;
  totalResults: number;
  totalBookings: number;
  totalRelationships: number;
  syncStatusCounts: Record<string, number>;
}

class CrossEntityIntegrationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'http://localhost:5001/api';
  }

  // ==============================================
  // CORE INTEGRATION METHODS
  // ==============================================

  async getWorkflowIntegration(notebookId: string): Promise<ResearchWorkflowIntegration> {
    const response = await fetch(`${this.baseUrl}/cross-entity/workflow/${notebookId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch workflow integration');
    }
    return response.json();
  }

  async createBidirectionalRelationship(
    sourceType: string,
    sourceId: string,
    targetType: string,
    targetId: string,
    relationshipType: string,
    userId?: string
  ): Promise<{ success: boolean; relationshipId: string }> {
    const response = await fetch(`${this.baseUrl}/cross-entity/relationships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceType,
        sourceId,
        targetType,
        targetId,
        relationshipType,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create bidirectional relationship');
    }
    return response.json();
  }

  async syncNotebookToEntities(
    notebookId: string,
    entityType: string,
    entityIds: string[],
    userId?: string
  ): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/cross-entity/sync/notebook/${notebookId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entityType,
        entityIds,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync notebook to entities');
    }
    return response.json();
  }

  // ==============================================
  // ENHANCED PROTOCOLS METHODS
  // ==============================================

  async getEnhancedProtocols(filters?: {
    labId?: string;
    category?: string;
    status?: string;
  }): Promise<EnhancedProtocol[]> {
    const params = new URLSearchParams();
    if (filters?.labId) params.append('labId', filters.labId);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);

    const response = await fetch(`${this.baseUrl}/cross-entity/protocols?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch enhanced protocols');
    }
    return response.json();
  }

  async createEnhancedProtocol(protocol: Partial<EnhancedProtocol>): Promise<EnhancedProtocol> {
    const response = await fetch(`${this.baseUrl}/cross-entity/protocols`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(protocol),
    });

    if (!response.ok) {
      throw new Error('Failed to create enhanced protocol');
    }
    return response.json();
  }

  // ==============================================
  // ENHANCED RESULTS METHODS
  // ==============================================

  async getEnhancedResults(filters?: {
    labId?: string;
    resultType?: string;
    dataType?: string;
  }): Promise<EnhancedResult[]> {
    const params = new URLSearchParams();
    if (filters?.labId) params.append('labId', filters.labId);
    if (filters?.resultType) params.append('resultType', filters.resultType);
    if (filters?.dataType) params.append('dataType', filters.dataType);

    const response = await fetch(`${this.baseUrl}/cross-entity/results?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch enhanced results');
    }
    return response.json();
  }

  async createEnhancedResult(result: Partial<EnhancedResult>): Promise<EnhancedResult> {
    const response = await fetch(`${this.baseUrl}/cross-entity/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    });

    if (!response.ok) {
      throw new Error('Failed to create enhanced result');
    }
    return response.json();
  }

  // ==============================================
  // ENHANCED INSTRUMENT BOOKING METHODS
  // ==============================================

  async getEnhancedBookings(filters?: {
    labId?: string;
    userId?: string;
    status?: string;
    instrumentName?: string;
  }): Promise<EnhancedInstrumentBooking[]> {
    const params = new URLSearchParams();
    if (filters?.labId) params.append('labId', filters.labId);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.instrumentName) params.append('instrumentName', filters.instrumentName);

    const response = await fetch(`${this.baseUrl}/cross-entity/bookings?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch enhanced bookings');
    }
    return response.json();
  }

  async createEnhancedBooking(booking: Partial<EnhancedInstrumentBooking>): Promise<EnhancedInstrumentBooking> {
    const response = await fetch(`${this.baseUrl}/cross-entity/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking),
    });

    if (!response.ok) {
      throw new Error('Failed to create enhanced booking');
    }
    return response.json();
  }

  // ==============================================
  // RELATIONSHIP MANAGEMENT METHODS
  // ==============================================

  async getEntityRelationships(entityType: string, entityId: string): Promise<EntityRelationship[]> {
    const response = await fetch(`${this.baseUrl}/cross-entity/relationships/${entityType}/${entityId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch entity relationships');
    }
    return response.json();
  }

  async getSyncLog(filters?: {
    limit?: number;
    status?: string;
  }): Promise<DataSyncLog[]> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);

    const response = await fetch(`${this.baseUrl}/cross-entity/sync-log?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sync log');
    }
    return response.json();
  }

  // ==============================================
  // ANALYTICS METHODS
  // ==============================================

  async getWorkflowAnalytics(filters?: {
    labId?: string;
    timeRange?: string;
  }): Promise<WorkflowAnalytics> {
    const params = new URLSearchParams();
    if (filters?.labId) params.append('labId', filters.labId);
    if (filters?.timeRange) params.append('timeRange', filters.timeRange);

    const response = await fetch(`${this.baseUrl}/cross-entity/analytics/workflow?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch workflow analytics');
    }
    return response.json();
  }

  // ==============================================
  // SMART INTEGRATION HELPERS
  // ==============================================

  /**
   * Auto-create protocol from notebook entry
   */
  async createProtocolFromNotebook(
    notebookEntryId: string,
    protocolData: Partial<EnhancedProtocol>
  ): Promise<EnhancedProtocol> {
    // Get the notebook entry first
    const notebookResponse = await fetch(`${this.baseUrl}/lab-notebook/${notebookEntryId}`);
    if (!notebookResponse.ok) {
      throw new Error('Failed to fetch notebook entry');
    }
    const notebookEntry = await notebookResponse.json();

    // Create protocol with notebook reference
    const protocol = await this.createEnhancedProtocol({
      ...protocolData,
      relatedNotebookEntries: [notebookEntryId],
      labId: notebookEntry.lab_id,
      createdBy: notebookEntry.created_by,
      autoSyncEnabled: true,
      syncToNotebook: true,
    });

    return protocol;
  }

  /**
   * Auto-create result from notebook entry
   */
  async createResultFromNotebook(
    notebookEntryId: string,
    resultData: Partial<EnhancedResult>
  ): Promise<EnhancedResult> {
    // Get the notebook entry first
    const notebookResponse = await fetch(`${this.baseUrl}/lab-notebook/${notebookEntryId}`);
    if (!notebookResponse.ok) {
      throw new Error('Failed to fetch notebook entry');
    }
    const notebookEntry = await notebookResponse.json();

    // Create result with notebook reference
    const result = await this.createEnhancedResult({
      ...resultData,
      relatedNotebookEntries: [notebookEntryId],
      labId: notebookEntry.lab_id,
      createdBy: notebookEntry.created_by,
      autoSyncEnabled: true,
      syncToNotebook: true,
    });

    return result;
  }

  /**
   * Auto-create instrument booking from notebook entry
   */
  async createBookingFromNotebook(
    notebookEntryId: string,
    bookingData: Partial<EnhancedInstrumentBooking>
  ): Promise<EnhancedInstrumentBooking> {
    // Get the notebook entry first
    const notebookResponse = await fetch(`${this.baseUrl}/lab-notebook/${notebookEntryId}`);
    if (!notebookResponse.ok) {
      throw new Error('Failed to fetch notebook entry');
    }
    const notebookEntry = await notebookResponse.json();

    // Create booking with notebook reference
    const booking = await this.createEnhancedBooking({
      ...bookingData,
      relatedNotebookEntries: [notebookEntryId],
      labId: notebookEntry.lab_id,
      userId: notebookEntry.created_by,
      autoSyncEnabled: true,
      syncToNotebook: true,
    });

    return booking;
  }

  /**
   * Get integrated workflow for a research project
   */
  async getProjectWorkflow(projectId: string): Promise<{
    notebookEntries: any[];
    protocols: EnhancedProtocol[];
    results: EnhancedResult[];
    bookings: EnhancedInstrumentBooking[];
    relationships: EntityRelationship[];
  }> {
    // This would typically involve multiple API calls to get all related entities
    // For now, we'll implement a simplified version
    const [protocols, results, bookings] = await Promise.all([
      this.getEnhancedProtocols(),
      this.getEnhancedResults(),
      this.getEnhancedBookings(),
    ]);

    // Filter by project (assuming we have project relationships)
    const projectProtocols = protocols.filter(p => 
      p.relatedNotebookEntries.some(entryId => 
        // This would need to be implemented based on your project structure
        true
      )
    );

    const projectResults = results.filter(r => r.projectId === projectId);
    const projectBookings = bookings.filter(b => 
      b.relatedProjects.includes(projectId)
    );

    return {
      notebookEntries: [], // Would need to implement notebook filtering
      protocols: projectProtocols,
      results: projectResults,
      bookings: projectBookings,
      relationships: [], // Would need to implement relationship fetching
    };
  }

  /**
   * Sync all entities for a notebook entry
   */
  async syncAllEntitiesForNotebook(notebookId: string): Promise<{
    protocols: EnhancedProtocol[];
    results: EnhancedResult[];
    bookings: EnhancedInstrumentBooking[];
  }> {
    const workflow = await this.getWorkflowIntegration(notebookId);
    
    const [protocols, results, bookings] = await Promise.all([
      Promise.all(workflow.protocols.map((p: any) => 
        this.getEnhancedProtocols().then(protocols => 
          protocols.find(protocol => protocol.id === p.id)
        )
      )).then(protocols => protocols.filter(Boolean)),
      
      Promise.all(workflow.results.map((r: any) => 
        this.getEnhancedResults().then(results => 
          results.find(result => result.id === r.id)
        )
      )).then(results => results.filter(Boolean)),
      
      Promise.all(workflow.instrumentBookings.map((b: any) => 
        this.getEnhancedBookings().then(bookings => 
          bookings.find(booking => booking.id === b.id)
        )
      )).then(bookings => bookings.filter(Boolean)),
    ]);

    return { protocols, results, bookings };
  }
}

export default new CrossEntityIntegrationService();

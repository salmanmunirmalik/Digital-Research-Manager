/**
 * Human Override System
 * Task 35: Implement human override mechanisms
 * 
 * Allows humans to override AI decisions:
 * - Override AI actions
 * - Bypass safety checks (with justification)
 * - Force action execution
 * - Emergency stop
 */

import { EventEmitter } from 'events';
import { ActionValidationResult, ActionValidationRequest } from './ActionValidationSystem.js';
import { ApprovalGateSystem, approvalGateSystem } from './ApprovalGateSystem.js';
import { AuditLoggingSystem, auditLoggingSystem } from './AuditLoggingSystem.js';
import { RollbackSystem, rollbackSystem } from './RollbackSystem.js';
import pool from '../../../database/config.js';

export type OverrideType = 
  | 'safety_check'
  | 'action_validation'
  | 'approval_requirement'
  | 'agent_execution'
  | 'emergency_stop';

export type OverrideLevel = 'user' | 'researcher' | 'principal_researcher' | 'admin';

export interface OverrideRequest {
  overrideId: string;
  type: OverrideType;
  action: string;
  target: string;
  targetId?: string;
  requestedBy: string;
  requestedAt: number;
  justification: string;
  level: OverrideLevel;
  originalResult?: {
    validationResult?: ActionValidationResult;
    safetyCheck?: any;
    approvalRequired?: boolean;
  };
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'cancelled';
  approvedBy?: string;
  approvedAt?: number;
  executedAt?: number;
  metadata?: Record<string, any>;
}

export interface OverrideResult {
  success: boolean;
  overrideId: string;
  action: string;
  executed: boolean;
  error?: string;
  duration: number;
}

export class HumanOverrideSystem extends EventEmitter {
  private overrideHistory: OverrideRequest[] = [];
  private activeOverrides: Map<string, OverrideRequest> = new Map();
  private approvalGate: ApprovalGateSystem;
  private auditLogger: AuditLoggingSystem;
  private rollbackSystem: RollbackSystem;
  
  constructor(
    approvalGate: ApprovalGateSystem,
    auditLogger: AuditLoggingSystem,
    rollbackSystem: RollbackSystem
  ) {
    super();
    this.approvalGate = approvalGate;
    this.auditLogger = auditLogger;
    this.rollbackSystem = rollbackSystem;
  }
  
  /**
   * Request override
   */
  async requestOverride(
    type: OverrideType,
    action: string,
    target: string,
    targetId: string | undefined,
    requestedBy: string,
    justification: string,
    originalResult?: OverrideRequest['originalResult'],
    metadata?: Record<string, any>
  ): Promise<OverrideRequest> {
    // Determine required override level
    const requiredLevel = this.determineOverrideLevel(type, originalResult);
    
    // Check if user has required level
    const userLevel = await this.getUserLevel(requestedBy);
    if (!this.hasRequiredLevel(userLevel, requiredLevel)) {
      throw new Error(`Insufficient override level. Required: ${requiredLevel}, User: ${userLevel}`);
    }
    
    const overrideId = `override_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const overrideRequest: OverrideRequest = {
      overrideId,
      type,
      action,
      target,
      targetId,
      requestedBy,
      requestedAt: Date.now(),
      justification,
      level: requiredLevel,
      originalResult,
      status: 'pending',
      metadata
    };
    
    // If user has sufficient level, auto-approve
    if (userLevel === requiredLevel || this.isHigherLevel(userLevel, requiredLevel)) {
      overrideRequest.status = 'approved';
      overrideRequest.approvedBy = requestedBy;
      overrideRequest.approvedAt = Date.now();
    } else {
      // Require approval from higher level
      overrideRequest.status = 'pending';
    }
    
    this.activeOverrides.set(overrideId, overrideRequest);
    
    // Log override request
    await this.auditLogger.logSecurityEvent(
      'override_request',
      'warning',
      {
        overrideId,
        type,
        action,
        target,
        requestedBy,
        justification
      },
      { overrideId }
    );
    
    this.emit('override:requested', overrideRequest);
    
    // If auto-approved, execute immediately
    if (overrideRequest.status === 'approved') {
      return await this.executeOverride(overrideRequest);
    }
    
    return overrideRequest;
  }
  
  /**
   * Execute override
   */
  async executeOverride(overrideRequest: OverrideRequest): Promise<OverrideRequest> {
    if (overrideRequest.status !== 'approved') {
      throw new Error('Override must be approved before execution');
    }
    
    const startTime = Date.now();
    
    try {
      // Create snapshot before override (for potential rollback)
      if (overrideRequest.targetId) {
        await this.rollbackSystem.createSnapshot(
          overrideRequest.overrideId,
          overrideRequest.action,
          overrideRequest.target,
          overrideRequest.targetId,
          {}, // Would fetch actual state
          {
            userId: overrideRequest.requestedBy,
            description: `Override: ${overrideRequest.justification}`
          }
        );
      }
      
      // Execute the overridden action
      let executed = false;
      
      switch (overrideRequest.type) {
        case 'safety_check':
          // Bypass safety check and proceed
          executed = true;
          break;
        
        case 'action_validation':
          // Bypass validation and proceed
          executed = true;
          break;
        
        case 'approval_requirement':
          // Bypass approval requirement
          executed = true;
          break;
        
        case 'agent_execution':
          // Force agent execution
          executed = true;
          break;
        
        case 'emergency_stop':
          // Emergency stop - halt all operations
          await this.executeEmergencyStop(overrideRequest);
          executed = true;
          break;
      }
      
      overrideRequest.status = 'executed';
      overrideRequest.executedAt = Date.now();
      
      const duration = Date.now() - startTime;
      
      // Log override execution
      await this.auditLogger.logSecurityEvent(
        'override_executed',
        'warning',
        {
          overrideId: overrideRequest.overrideId,
          type: overrideRequest.type,
          action: overrideRequest.action,
          target: overrideRequest.target,
          executed,
          duration
        },
        { overrideId: overrideRequest.overrideId }
      );
      
      this.activeOverrides.delete(overrideRequest.overrideId);
      this.overrideHistory.push(overrideRequest);
      
      this.emit('override:executed', { request: overrideRequest, duration });
      
      return overrideRequest;
    } catch (error: any) {
      overrideRequest.status = 'cancelled';
      
      await this.auditLogger.logSecurityEvent(
        'override_failed',
        'error',
        {
          overrideId: overrideRequest.overrideId,
          error: error.message
        },
        { overrideId: overrideRequest.overrideId }
      );
      
      throw error;
    }
  }
  
  /**
   * Approve override request
   */
  async approveOverride(
    overrideId: string,
    approverId: string,
    reason?: string
  ): Promise<OverrideRequest> {
    const overrideRequest = this.activeOverrides.get(overrideId);
    if (!overrideRequest) {
      throw new Error(`Override request ${overrideId} not found`);
    }
    
    // Check if approver has sufficient level
    const approverLevel = await this.getUserLevel(approverId);
    if (!this.hasRequiredLevel(approverLevel, overrideRequest.level)) {
      throw new Error(`Approver does not have sufficient level. Required: ${overrideRequest.level}, Approver: ${approverLevel}`);
    }
    
    overrideRequest.status = 'approved';
    overrideRequest.approvedBy = approverId;
    overrideRequest.approvedAt = Date.now();
    
    // Log approval
    await this.auditLogger.logSecurityEvent(
      'override_approved',
      'warning',
      {
        overrideId,
        approverId,
        reason
      },
      { overrideId }
    );
    
    this.emit('override:approved', overrideRequest);
    
    // Execute override
    return await this.executeOverride(overrideRequest);
  }
  
  /**
   * Reject override request
   */
  async rejectOverride(
    overrideId: string,
    rejectorId: string,
    reason: string
  ): Promise<void> {
    const overrideRequest = this.activeOverrides.get(overrideId);
    if (!overrideRequest) {
      throw new Error(`Override request ${overrideId} not found`);
    }
    
    overrideRequest.status = 'rejected';
    
    // Log rejection
    await this.auditLogger.logSecurityEvent(
      'override_rejected',
      'info',
      {
        overrideId,
        rejectorId,
        reason
      },
      { overrideId }
    );
    
    this.activeOverrides.delete(overrideId);
    this.overrideHistory.push(overrideRequest);
    
    this.emit('override:rejected', { request: overrideRequest, reason });
  }
  
  /**
   * Execute emergency stop
   */
  private async executeEmergencyStop(overrideRequest: OverrideRequest): Promise<void> {
    // Emergency stop - halt all agent operations
    // This would integrate with the agent execution system
    
    await this.auditLogger.logSecurityEvent(
      'emergency_stop',
      'critical',
      {
        overrideId: overrideRequest.overrideId,
        requestedBy: overrideRequest.requestedBy,
        justification: overrideRequest.justification
      },
      { overrideId: overrideRequest.overrideId }
    );
    
    // Emit emergency stop event
    this.emit('emergency:stop', overrideRequest);
  }
  
  /**
   * Determine required override level
   */
  private determineOverrideLevel(
    type: OverrideType,
    originalResult?: OverrideRequest['originalResult']
  ): OverrideLevel {
    if (type === 'emergency_stop') return 'admin';
    if (type === 'safety_check' && originalResult?.safetyCheck?.safetyLevel === 'unsafe') {
      return 'principal_researcher';
    }
    if (type === 'approval_requirement' && originalResult?.approvalRequired) {
      return 'principal_researcher';
    }
    return 'researcher';
  }
  
  /**
   * Get user override level
   */
  private async getUserLevel(userId: string): Promise<OverrideLevel> {
    try {
      const result = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) return 'user';
      
      const role = result.rows[0].role;
      if (role === 'admin') return 'admin';
      if (role === 'principal_researcher' || role === 'co_supervisor') return 'principal_researcher';
      if (role === 'researcher') return 'researcher';
      return 'user';
    } catch (error) {
      console.error('Error getting user level:', error);
      return 'user';
    }
  }
  
  /**
   * Check if user has required level
   */
  private hasRequiredLevel(userLevel: OverrideLevel, requiredLevel: OverrideLevel): boolean {
    const levels: OverrideLevel[] = ['user', 'researcher', 'principal_researcher', 'admin'];
    const userIndex = levels.indexOf(userLevel);
    const requiredIndex = levels.indexOf(requiredLevel);
    return userIndex >= requiredIndex;
  }
  
  /**
   * Check if level is higher
   */
  private isHigherLevel(level1: OverrideLevel, level2: OverrideLevel): boolean {
    const levels: OverrideLevel[] = ['user', 'researcher', 'principal_researcher', 'admin'];
    return levels.indexOf(level1) > levels.indexOf(level2);
  }
  
  /**
   * Get override request
   */
  getOverrideRequest(overrideId: string): OverrideRequest | undefined {
    return this.activeOverrides.get(overrideId) ||
           this.overrideHistory.find(r => r.overrideId === overrideId);
  }
  
  /**
   * Get pending overrides
   */
  getPendingOverrides(): OverrideRequest[] {
    return Array.from(this.activeOverrides.values())
      .filter(r => r.status === 'pending');
  }
  
  /**
   * Get override history
   */
  getOverrideHistory(limit: number = 50): OverrideRequest[] {
    return this.overrideHistory.slice(-limit);
  }
}

// Singleton instance
export const humanOverrideSystem = new HumanOverrideSystem(
  approvalGateSystem,
  auditLoggingSystem,
  rollbackSystem
);


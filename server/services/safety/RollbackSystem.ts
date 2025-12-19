/**
 * Rollback System
 * Task 34: Add rollback capabilities
 * 
 * Enables rollback of actions and system state:
 * - Action snapshots
 * - State restoration
 * - Transaction management
 * - Recovery procedures
 */

import { EventEmitter } from 'events';
import pool from "../../../database/config.js";
import { AuditLoggingSystem, auditLoggingSystem } from './AuditLoggingSystem.js';

export type RollbackType = 'action' | 'state' | 'transaction' | 'full';
export type RollbackStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface ActionSnapshot {
  snapshotId: string;
  actionId: string;
  actionType: string;
  target: string;
  targetId: string;
  timestamp: number;
  state: {
    before: any;
    after?: any;
  };
  metadata: {
    userId: string;
    agentType?: string;
    description?: string;
  };
}

export interface RollbackRequest {
  rollbackId: string;
  snapshotId: string;
  requestedBy: string;
  requestedAt: number;
  status: RollbackStatus;
  type: RollbackType;
  reason: string;
  target: string;
  targetId: string;
  rollbackSteps: Array<{
    step: number;
    description: string;
    status: 'pending' | 'completed' | 'failed';
    error?: string;
  }>;
  metadata?: Record<string, any>;
}

export interface RollbackResult {
  success: boolean;
  rollbackId: string;
  stepsCompleted: number;
  stepsFailed: number;
  errors: string[];
  restoredState?: any;
  duration: number;
}

export class RollbackSystem extends EventEmitter {
  private snapshots: Map<string, ActionSnapshot> = new Map();
  private rollbackHistory: RollbackRequest[] = [];
  private auditLogger: AuditLoggingSystem;
  
  constructor(auditLogger: AuditLoggingSystem) {
    super();
    this.auditLogger = auditLogger;
  }
  
  /**
   * Create snapshot before action
   */
  async createSnapshot(
    actionId: string,
    actionType: string,
    target: string,
    targetId: string,
    beforeState: any,
    metadata: {
      userId: string;
      agentType?: string;
      description?: string;
    }
  ): Promise<ActionSnapshot> {
    const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const snapshot: ActionSnapshot = {
      snapshotId,
      actionId,
      actionType,
      target,
      targetId,
      timestamp: Date.now(),
      state: {
        before: this.deepClone(beforeState)
      },
      metadata
    };
    
    // Store snapshot
    this.snapshots.set(snapshotId, snapshot);
    
    // Store in database
    await this.storeSnapshot(snapshot);
    
    // Log snapshot creation
    await this.auditLogger.log({
      eventType: 'system_event',
      severity: 'info',
      userId: metadata.userId,
      action: 'create_snapshot',
      target: target,
      targetId: targetId,
      status: 'success',
      details: {
        snapshotId,
        actionId,
        actionType
      }
    });
    
    this.emit('snapshot:created', snapshot);
    
    return snapshot;
  }
  
  /**
   * Update snapshot with after state
   */
  async updateSnapshot(snapshotId: string, afterState: any): Promise<void> {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }
    
    snapshot.state.after = this.deepClone(afterState);
    
    // Update in database
    await this.updateSnapshotInDatabase(snapshot);
    
    this.emit('snapshot:updated', snapshot);
  }
  
  /**
   * Execute rollback
   */
  async executeRollback(
    snapshotId: string,
    requestedBy: string,
    reason: string
  ): Promise<RollbackResult> {
    const startTime = Date.now();
    let snapshot = this.snapshots.get(snapshotId);
    
    if (!snapshot) {
      // Try to load from database
      const dbSnapshot = await this.loadSnapshotFromDatabase(snapshotId);
      if (!dbSnapshot) {
        throw new Error(`Snapshot ${snapshotId} not found`);
      }
      this.snapshots.set(snapshotId, dbSnapshot);
      snapshot = dbSnapshot;
    }
    
    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }
    
    const rollbackId = `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const rollbackRequest: RollbackRequest = {
      rollbackId,
      snapshotId,
      requestedBy,
      requestedAt: Date.now(),
      status: 'in_progress',
      type: this.determineRollbackType(snapshot),
      reason,
      target: snapshot.target,
      targetId: snapshot.targetId,
      rollbackSteps: this.createRollbackSteps(snapshot)
    };
    
    // Store rollback request
    await this.storeRollbackRequest(rollbackRequest);
    
    // Log rollback start
    await this.auditLogger.log({
      eventType: 'system_event',
      severity: 'warning',
      userId: requestedBy,
      action: 'rollback',
      target: snapshot.target,
      targetId: snapshot.targetId,
      status: 'pending',
      details: {
        rollbackId,
        snapshotId,
        reason
      }
    });
    
    try {
      // Execute rollback steps
      const errors: string[] = [];
      let stepsCompleted = 0;
      let stepsFailed = 0;
      
      for (const step of rollbackRequest.rollbackSteps) {
        try {
          await this.executeRollbackStep(step, snapshot);
          step.status = 'completed';
          stepsCompleted++;
        } catch (error: any) {
          step.status = 'failed';
          step.error = error.message;
          errors.push(`Step ${step.step}: ${error.message}`);
          stepsFailed++;
        }
      }
      
      const success = stepsFailed === 0;
      rollbackRequest.status = success ? 'completed' : 'failed';
      
      // Update rollback request
      await this.updateRollbackRequest(rollbackRequest);
      
      const duration = Date.now() - startTime;
      
      const result: RollbackResult = {
        success,
        rollbackId,
        stepsCompleted,
        stepsFailed,
        errors,
        restoredState: snapshot.state.before,
        duration
      };
      
      // Log rollback completion
      await this.auditLogger.log({
        eventType: 'system_event',
        severity: success ? 'info' : 'error',
        userId: requestedBy,
        action: 'rollback',
        target: snapshot.target,
        targetId: snapshot.targetId,
        status: success ? 'success' : 'failure',
        details: {
          rollbackId,
          success,
          stepsCompleted,
          stepsFailed,
          errors
        }
      });
      
      this.rollbackHistory.push(rollbackRequest);
      this.emit('rollback:completed', { request: rollbackRequest, result });
      
      return result;
    } catch (error: any) {
      rollbackRequest.status = 'failed';
      await this.updateRollbackRequest(rollbackRequest);
      
      await this.auditLogger.log({
        eventType: 'error',
        severity: 'error',
        userId: requestedBy,
        action: 'rollback',
        target: snapshot.target,
        targetId: snapshot.targetId,
        status: 'failure',
        details: {
          rollbackId,
          error: error.message
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Create rollback steps
   */
  private createRollbackSteps(snapshot: ActionSnapshot): RollbackRequest['rollbackSteps'] {
    const steps: RollbackRequest['rollbackSteps'] = [];
    
    // Step 1: Validate snapshot
    steps.push({
      step: 1,
      description: 'Validate snapshot integrity',
      status: 'pending'
    });
    
    // Step 2: Restore state based on target type
    steps.push({
      step: 2,
      description: `Restore ${snapshot.target} state`,
      status: 'pending'
    });
    
    // Step 3: Update related records
    steps.push({
      step: 3,
      description: 'Update related records',
      status: 'pending'
    });
    
    // Step 4: Verify restoration
    steps.push({
      step: 4,
      description: 'Verify state restoration',
      status: 'pending'
    });
    
    return steps;
  }
  
  /**
   * Execute a rollback step
   */
  private async executeRollbackStep(
    step: RollbackRequest['rollbackSteps'][0],
    snapshot: ActionSnapshot
  ): Promise<void> {
    switch (step.step) {
      case 1:
        // Validate snapshot
        if (!snapshot.state.before) {
          throw new Error('Snapshot missing before state');
        }
        break;
      
      case 2:
        // Restore state
        await this.restoreState(snapshot);
        break;
      
      case 3:
        // Update related records (if needed)
        await this.updateRelatedRecords(snapshot);
        break;
      
      case 4:
        // Verify restoration
        await this.verifyRestoration(snapshot);
        break;
      
      default:
        throw new Error(`Unknown rollback step: ${step.step}`);
    }
  }
  
  /**
   * Restore state
   */
  private async restoreState(snapshot: ActionSnapshot): Promise<void> {
    const { target, targetId, state } = snapshot;
    
    // Restore based on target type
    switch (target.toLowerCase()) {
      case 'paper':
      case 'notebook':
      case 'protocol':
      case 'experiment':
        // Restore from database
        await pool.query(`
          UPDATE ${target}s
          SET data = $1
          WHERE id = $2
        `, [JSON.stringify(state.before), targetId]);
        break;
      
      case 'user':
        // Restore user data
        await pool.query(`
          UPDATE users
          SET data = $1
          WHERE id = $2
        `, [JSON.stringify(state.before), targetId]);
        break;
      
      default:
        // Generic restoration
        await pool.query(`
          UPDATE ${target}
          SET state = $1
          WHERE id = $2
        `, [JSON.stringify(state.before), targetId]);
    }
  }
  
  /**
   * Update related records
   */
  private async updateRelatedRecords(snapshot: ActionSnapshot): Promise<void> {
    // This would update any related records that were affected by the action
    // For now, it's a placeholder
  }
  
  /**
   * Verify restoration
   */
  private async verifyRestoration(snapshot: ActionSnapshot): Promise<void> {
    // Verify that the state was restored correctly
    const { target, targetId, state } = snapshot;
    
    // Query current state
    const result = await pool.query(`
      SELECT data FROM ${target}s WHERE id = $1
    `, [targetId]);
    
    if (result.rows.length === 0) {
      throw new Error(`Target ${target} with id ${targetId} not found`);
    }
    
    const currentState = result.rows[0].data;
    
    // Compare states (simplified)
    if (JSON.stringify(currentState) !== JSON.stringify(state.before)) {
      throw new Error('State restoration verification failed');
    }
  }
  
  /**
   * Determine rollback type
   */
  private determineRollbackType(snapshot: ActionSnapshot): RollbackType {
    if (snapshot.actionType === 'delete') return 'action';
    if (snapshot.target === 'database' || snapshot.target === 'system') return 'state';
    return 'action';
  }
  
  /**
   * Get snapshot
   */
  getSnapshot(snapshotId: string): ActionSnapshot | undefined {
    return this.snapshots.get(snapshotId);
  }
  
  /**
   * Get rollback history
   */
  getRollbackHistory(limit: number = 50): RollbackRequest[] {
    return this.rollbackHistory.slice(0, limit);
  }
  
  /**
   * Deep clone object
   */
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));
    
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  /**
   * Store snapshot in database
   */
  private async storeSnapshot(snapshot: ActionSnapshot): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO action_snapshots (
          id, action_id, action_type, target, target_id,
          timestamp, state_before, state_after, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        snapshot.snapshotId,
        snapshot.actionId,
        snapshot.actionType,
        snapshot.target,
        snapshot.targetId,
        new Date(snapshot.timestamp),
        JSON.stringify(snapshot.state.before),
        snapshot.state.after ? JSON.stringify(snapshot.state.after) : null,
        JSON.stringify(snapshot.metadata)
      ]);
    } catch (error) {
      console.error('Error storing snapshot:', error);
    }
  }
  
  /**
   * Update snapshot in database
   */
  private async updateSnapshotInDatabase(snapshot: ActionSnapshot): Promise<void> {
    try {
      await pool.query(`
        UPDATE action_snapshots
        SET state_after = $1
        WHERE id = $2
      `, [
        snapshot.state.after ? JSON.stringify(snapshot.state.after) : null,
        snapshot.snapshotId
      ]);
    } catch (error) {
      console.error('Error updating snapshot:', error);
    }
  }
  
  /**
   * Load snapshot from database
   */
  private async loadSnapshotFromDatabase(snapshotId: string): Promise<ActionSnapshot | null> {
    try {
      const result = await pool.query(`
        SELECT * FROM action_snapshots WHERE id = $1
      `, [snapshotId]);
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        snapshotId: row.id,
        actionId: row.action_id,
        actionType: row.action_type,
        target: row.target,
        targetId: row.target_id,
        timestamp: new Date(row.timestamp).getTime(),
        state: {
          before: row.state_before,
          after: row.state_after
        },
        metadata: row.metadata
      };
    } catch (error) {
      console.error('Error loading snapshot:', error);
      return null;
    }
  }
  
  /**
   * Store rollback request
   */
  private async storeRollbackRequest(request: RollbackRequest): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO rollback_requests (
          id, snapshot_id, requested_by, requested_at,
          status, type, reason, target, target_id, rollback_steps, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        request.rollbackId,
        request.snapshotId,
        request.requestedBy,
        new Date(request.requestedAt),
        request.status,
        request.type,
        request.reason,
        request.target,
        request.targetId,
        JSON.stringify(request.rollbackSteps),
        JSON.stringify(request.metadata || {})
      ]);
    } catch (error) {
      console.error('Error storing rollback request:', error);
    }
  }
  
  /**
   * Update rollback request
   */
  private async updateRollbackRequest(request: RollbackRequest): Promise<void> {
    try {
      await pool.query(`
        UPDATE rollback_requests
        SET status = $1, rollback_steps = $2
        WHERE id = $3
      `, [
        request.status,
        JSON.stringify(request.rollbackSteps),
        request.rollbackId
      ]);
    } catch (error) {
      console.error('Error updating rollback request:', error);
    }
  }
}

// Singleton instance
export const rollbackSystem = new RollbackSystem(auditLoggingSystem);


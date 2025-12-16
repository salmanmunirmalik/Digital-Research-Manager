/**
 * Approval Gate System
 * Task 32: Implement approval gates for high-stakes actions
 * 
 * Manages approval workflows for high-stakes actions:
 * - Approval request creation
 * - Approval workflow routing
 * - Approval status tracking
 * - Timeout handling
 * - Automatic escalation
 */

import { ActionValidationResult, ActionValidationRequest } from './ActionValidationSystem.js';
import { CriticalityScore } from './CriticalityScoringSystem.js';
import { EventEmitter } from 'events';
import pool from "../../../database/config.js";

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
export type ApprovalLevel = 'user' | 'researcher' | 'principal_researcher' | 'admin';

export interface ApprovalRequest {
  requestId: string;
  action: string;
  target: string;
  targetId?: string;
  requestedBy: string; // User ID
  requestedAt: number;
  status: ApprovalStatus;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  requiredApprovalLevel: ApprovalLevel;
  approvers: Array<{
    userId: string;
    level: ApprovalLevel;
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: number;
    reason?: string;
  }>;
  description: string;
  reason: string;
  metadata?: Record<string, any>;
  expiresAt?: number;
  timeout?: number;
  escalationLevel?: number;
}

export interface ApprovalResponse {
  requestId: string;
  approverId: string;
  decision: 'approved' | 'rejected';
  reason?: string;
  timestamp: number;
}

export class ApprovalGateSystem extends EventEmitter {
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private approvalHistory: ApprovalRequest[] = [];
  
  /**
   * Create approval request
   */
  async createApprovalRequest(
    validationResult: ActionValidationResult,
    actionRequest: ActionValidationRequest,
    criticalityScore: CriticalityScore
  ): Promise<ApprovalRequest> {
    if (!validationResult.requiresApproval || !validationResult.approvalRequired) {
      throw new Error('Action does not require approval');
    }
    
    const requestId = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine required approval level based on criticality
    const requiredLevel = this.determineApprovalLevel(criticalityScore.criticality);
    
    // Find approvers
    const approvers = await this.findApprovers(
      actionRequest.context.userId,
      requiredLevel,
      actionRequest.context.userRole
    );
    
    const approvalRequest: ApprovalRequest = {
      requestId,
      action: actionRequest.action,
      target: actionRequest.target,
      targetId: actionRequest.targetId,
      requestedBy: actionRequest.context.userId,
      requestedAt: Date.now(),
      status: 'pending',
      criticality: criticalityScore.criticality,
      requiredApprovalLevel: requiredLevel,
      approvers: approvers.map(approver => ({
        userId: approver.userId,
        level: approver.level,
        status: 'pending' as const
      })),
      description: actionRequest.metadata?.description || `${actionRequest.action} on ${actionRequest.target}`,
      reason: validationResult.approvalRequired.reason,
      metadata: actionRequest.metadata,
      expiresAt: validationResult.approvalRequired.timeout 
        ? Date.now() + validationResult.approvalRequired.timeout 
        : undefined,
      timeout: validationResult.approvalRequired.timeout
    };
    
    this.pendingApprovals.set(requestId, approvalRequest);
    
    // Store in database
    await this.storeApprovalRequest(approvalRequest);
    
    // Emit event
    this.emit('approval:requested', approvalRequest);
    
    // Start timeout if applicable
    if (approvalRequest.expiresAt) {
      this.startTimeout(approvalRequest);
    }
    
    return approvalRequest;
  }
  
  /**
   * Process approval response
   */
  async processApproval(response: ApprovalResponse): Promise<{
    approved: boolean;
    request: ApprovalRequest;
    canExecute: boolean;
  }> {
    const request = this.pendingApprovals.get(response.requestId);
    if (!request) {
      throw new Error(`Approval request ${response.requestId} not found`);
    }
    
    // Update approver status
    const approver = request.approvers.find(a => a.userId === response.approverId);
    if (!approver) {
      throw new Error(`Approver ${response.approverId} not found in request`);
    }
    
    approver.status = response.decision;
    approver.approvedAt = response.timestamp;
    approver.reason = response.reason;
    
    // Check if all required approvers have approved
    const allApproved = request.approvers.every(a => a.status === 'approved');
    const anyRejected = request.approvers.some(a => a.status === 'rejected');
    
    if (anyRejected) {
      request.status = 'rejected';
      this.completeApproval(request);
      this.emit('approval:rejected', { request, response });
      
      return {
        approved: false,
        request,
        canExecute: false
      };
    }
    
    if (allApproved) {
      request.status = 'approved';
      this.completeApproval(request);
      this.emit('approval:approved', { request, response });
      
      return {
        approved: true,
        request,
        canExecute: true
      };
    }
    
    // Still pending
    await this.updateApprovalRequest(request);
    this.emit('approval:updated', { request, response });
    
    return {
      approved: false,
      request,
      canExecute: false
    };
  }
  
  /**
   * Complete approval (approved or rejected)
   */
  private completeApproval(request: ApprovalRequest): void {
    this.pendingApprovals.delete(request.requestId);
    this.approvalHistory.push(request);
    
    // Update in database
    this.updateApprovalRequest(request);
  }
  
  /**
   * Determine required approval level
   */
  private determineApprovalLevel(criticality: 'low' | 'medium' | 'high' | 'critical'): ApprovalLevel {
    switch (criticality) {
      case 'critical':
        return 'admin';
      case 'high':
        return 'principal_researcher';
      case 'medium':
        return 'researcher';
      default:
        return 'user';
    }
  }
  
  /**
   * Find approvers for a request
   */
  private async findApprovers(
    requestingUserId: string,
    requiredLevel: ApprovalLevel,
    userRole?: string
  ): Promise<Array<{ userId: string; level: ApprovalLevel }>> {
    try {
      // Query database for users with appropriate roles
      const roleMapping: Record<ApprovalLevel, string[]> = {
        'user': ['student', 'researcher'],
        'researcher': ['researcher', 'co_supervisor'],
        'principal_researcher': ['principal_researcher', 'co_supervisor'],
        'admin': ['admin']
      };
      
      const requiredRoles = roleMapping[requiredLevel] || [];
      
      const query = `
        SELECT id, role
        FROM users
        WHERE role = ANY($1)
          AND id != $2
        ORDER BY 
          CASE role
            WHEN 'admin' THEN 1
            WHEN 'principal_researcher' THEN 2
            WHEN 'co_supervisor' THEN 3
            WHEN 'researcher' THEN 4
            ELSE 5
          END
        LIMIT 3
      `;
      
      const result = await pool.query(query, [requiredRoles, requestingUserId]);
      
      return result.rows.map(row => ({
        userId: row.id,
        level: this.mapRoleToApprovalLevel(row.role)
      }));
    } catch (error) {
      console.error('Error finding approvers:', error);
      // Fallback: return empty array (would need manual approval)
      return [];
    }
  }
  
  /**
   * Map database role to approval level
   */
  private mapRoleToApprovalLevel(role: string): ApprovalLevel {
    if (role === 'admin') return 'admin';
    if (role === 'principal_researcher' || role === 'co_supervisor') return 'principal_researcher';
    if (role === 'researcher') return 'researcher';
    return 'user';
  }
  
  /**
   * Start timeout for approval request
   */
  private startTimeout(request: ApprovalRequest): void {
    if (!request.expiresAt) return;
    
    const timeout = request.expiresAt - Date.now();
    if (timeout <= 0) {
      this.handleTimeout(request);
      return;
    }
    
    setTimeout(() => {
      this.handleTimeout(request);
    }, timeout);
  }
  
  /**
   * Handle approval timeout
   */
  private handleTimeout(request: ApprovalRequest): void {
    if (request.status !== 'pending') return;
    
    request.status = 'expired';
    this.completeApproval(request);
    
    // Escalate if needed
    if (request.criticality === 'critical' || request.criticality === 'high') {
      this.escalateApproval(request);
    }
    
    this.emit('approval:expired', request);
  }
  
  /**
   * Escalate approval request
   */
  private escalateApproval(request: ApprovalRequest): void {
    const escalationLevel = (request.escalationLevel || 0) + 1;
    
    // Find higher-level approvers
    const higherLevel = this.getHigherApprovalLevel(request.requiredApprovalLevel);
    
    if (higherLevel) {
      this.findApprovers(request.requestedBy, higherLevel, undefined)
        .then(approvers => {
          if (approvers.length > 0) {
            request.requiredApprovalLevel = higherLevel;
            request.approvers = approvers.map(a => ({
              userId: a.userId,
              level: a.level,
              status: 'pending' as const
            }));
            request.escalationLevel = escalationLevel;
            request.status = 'pending';
            
            this.updateApprovalRequest(request);
            this.emit('approval:escalated', request);
          }
        })
        .catch(error => {
          console.error('Error escalating approval:', error);
        });
    }
  }
  
  /**
   * Get higher approval level
   */
  private getHigherApprovalLevel(level: ApprovalLevel): ApprovalLevel | null {
    const levels: ApprovalLevel[] = ['user', 'researcher', 'principal_researcher', 'admin'];
    const currentIndex = levels.indexOf(level);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }
  
  /**
   * Get approval request
   */
  getApprovalRequest(requestId: string): ApprovalRequest | undefined {
    return this.pendingApprovals.get(requestId) || 
           this.approvalHistory.find(r => r.requestId === requestId);
  }
  
  /**
   * Get pending approvals for a user
   */
  getPendingApprovalsForUser(userId: string): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values()).filter(request =>
      request.approvers.some(a => a.userId === userId && a.status === 'pending')
    );
  }
  
  /**
   * Cancel approval request
   */
  async cancelApprovalRequest(requestId: string, userId: string): Promise<boolean> {
    const request = this.pendingApprovals.get(requestId);
    if (!request) return false;
    
    if (request.requestedBy !== userId) {
      throw new Error('Only the requester can cancel the approval request');
    }
    
    request.status = 'cancelled';
    this.completeApproval(request);
    
    this.emit('approval:cancelled', request);
    
    return true;
  }
  
  /**
   * Store approval request in database
   */
  private async storeApprovalRequest(request: ApprovalRequest): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO approval_requests (
          id, action, target, target_id, requested_by, requested_at,
          status, criticality, required_approval_level, description, reason,
          metadata, expires_at, timeout
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        request.requestId,
        request.action,
        request.target,
        request.targetId,
        request.requestedBy,
        new Date(request.requestedAt),
        request.status,
        request.criticality,
        request.requiredApprovalLevel,
        request.description,
        request.reason,
        JSON.stringify(request.metadata || {}),
        request.expiresAt ? new Date(request.expiresAt) : null,
        request.timeout
      ]);
    } catch (error) {
      console.error('Error storing approval request:', error);
      // Continue even if database storage fails
    }
  }
  
  /**
   * Update approval request in database
   */
  private async updateApprovalRequest(request: ApprovalRequest): Promise<void> {
    try {
      await pool.query(`
        UPDATE approval_requests
        SET status = $1, approvers = $2, escalation_level = $3
        WHERE id = $4
      `, [
        request.status,
        JSON.stringify(request.approvers),
        request.escalationLevel,
        request.requestId
      ]);
    } catch (error) {
      console.error('Error updating approval request:', error);
    }
  }
}

// Singleton instance
export const approvalGateSystem = new ApprovalGateSystem();


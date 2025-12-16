/**
 * Action Validation System
 * Task 30: Implement action validation system
 * 
 * Validates actions before execution to ensure:
 * - Actions are safe and appropriate
 * - User has permission
 * - Actions don't violate constraints
 * - Critical actions require approval
 */

import { AISafetyFramework, SafetyCheckResult } from './AISafetyFramework.js';
import { EventEmitter } from 'events';

export type ActionType = 
  | 'read'
  | 'write'
  | 'delete'
  | 'modify'
  | 'execute'
  | 'query'
  | 'create'
  | 'update'
  | 'publish'
  | 'share';

export type ActionCriticality = 'low' | 'medium' | 'high' | 'critical';

export interface ActionValidationRequest {
  action: ActionType;
  target: string; // What the action targets (e.g., 'paper', 'data', 'user')
  targetId?: string; // Specific ID if applicable
  parameters?: Record<string, any>;
  context: {
    userId: string;
    agentType?: string;
    taskType?: string;
    userRole?: string;
    permissions?: string[];
  };
  metadata?: {
    description?: string;
    reason?: string;
    expectedImpact?: string;
  };
}

export interface ActionValidationResult {
  allowed: boolean;
  requiresApproval: boolean;
  criticality: ActionCriticality;
  safetyCheck?: SafetyCheckResult;
  validationScore: number; // 0-100
  issues: Array<{
    type: 'permission' | 'safety' | 'constraint' | 'policy' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggestion?: string;
  }>;
  warnings: string[];
  approvalRequired?: {
    reason: string;
    approver?: string; // Role or user who can approve
    timeout?: number; // Approval timeout in milliseconds
  };
}

export class ActionValidationSystem extends EventEmitter {
  private safetyFramework: AISafetyFramework;
  private actionPolicies: Map<ActionType, {
    defaultCriticality: ActionCriticality;
    requiresApproval: boolean;
    allowedRoles?: string[];
    constraints?: (request: ActionValidationRequest) => boolean;
  }> = new Map();
  
  constructor(safetyFramework: AISafetyFramework) {
    super();
    this.safetyFramework = safetyFramework;
    this.initializeActionPolicies();
  }
  
  /**
   * Initialize action policies
   */
  private initializeActionPolicies(): void {
    // Define policies for different action types
    this.actionPolicies.set('read', {
      defaultCriticality: 'low',
      requiresApproval: false
    });
    
    this.actionPolicies.set('write', {
      defaultCriticality: 'medium',
      requiresApproval: false
    });
    
    this.actionPolicies.set('delete', {
      defaultCriticality: 'high',
      requiresApproval: true,
      constraints: (request) => {
        // Additional constraints for delete actions
        return true;
      }
    });
    
    this.actionPolicies.set('modify', {
      defaultCriticality: 'medium',
      requiresApproval: false
    });
    
    this.actionPolicies.set('execute', {
      defaultCriticality: 'high',
      requiresApproval: true
    });
    
    this.actionPolicies.set('publish', {
      defaultCriticality: 'high',
      requiresApproval: true
    });
    
    this.actionPolicies.set('share', {
      defaultCriticality: 'medium',
      requiresApproval: false
    });
  }
  
  /**
   * Validate an action
   */
  async validateAction(request: ActionValidationRequest): Promise<ActionValidationResult> {
    const issues: ActionValidationResult['issues'] = [];
    const warnings: string[] = [];
    let validationScore = 100;
    let requiresApproval = false;
    
    // Get action policy
    const policy = this.actionPolicies.get(request.action);
    const criticality = this.determineCriticality(request, policy);
    
    // Check permissions
    const permissionCheck = this.checkPermissions(request);
    if (!permissionCheck.allowed) {
      issues.push({
        type: 'permission',
        severity: 'high',
        description: permissionCheck.reason || 'Insufficient permissions',
        suggestion: 'Contact administrator for access'
      });
      validationScore -= 30;
    }
    
    // Check constraints
    if (policy?.constraints) {
      const constraintCheck = policy.constraints(request);
      if (!constraintCheck) {
        issues.push({
          type: 'constraint',
          severity: 'medium',
          description: 'Action violates system constraints',
          suggestion: 'Review action parameters'
        });
        validationScore -= 20;
      }
    }
    
    // Safety check if action involves content
    let safetyCheck: SafetyCheckResult | undefined;
    if (request.parameters?.content || request.metadata?.description) {
      const content = request.parameters?.content || request.metadata?.description || '';
      safetyCheck = await this.safetyFramework.checkSafety({
        content,
        contentType: 'text',
        context: {
          userIntent: request.metadata?.reason,
          taskType: request.context.taskType
        }
      });
      
      if (!safetyCheck.passed) {
        issues.push(...safetyCheck.issues.map(issue => ({
          type: 'safety' as const,
          severity: issue.severity,
          description: issue.description,
          suggestion: issue.suggestion
        })));
        validationScore -= (100 - safetyCheck.safetyScore) * 0.5;
      }
    }
    
    // Check if approval is required
    if (policy?.requiresApproval || criticality === 'critical' || criticality === 'high') {
      requiresApproval = true;
    }
    
    // Determine if action is allowed
    const allowed = issues.filter(i => i.severity === 'critical').length === 0 &&
                   permissionCheck.allowed &&
                   (safetyCheck ? safetyCheck.passed : true);
    
    // Build approval requirement if needed
    let approvalRequired: ActionValidationResult['approvalRequired'] | undefined;
    if (requiresApproval && allowed) {
      approvalRequired = {
        reason: this.getApprovalReason(criticality, request),
        approver: this.determineApprover(criticality, request),
        timeout: criticality === 'critical' ? 3600000 : 1800000 // 1 hour or 30 minutes
      };
    }
    
    const result: ActionValidationResult = {
      allowed,
      requiresApproval,
      criticality,
      safetyCheck,
      validationScore: Math.max(0, Math.min(100, validationScore)),
      issues,
      warnings,
      approvalRequired
    };
    
    this.emit('action:validated', { request, result });
    
    return result;
  }
  
  /**
   * Check user permissions
   */
  private checkPermissions(request: ActionValidationRequest): {
    allowed: boolean;
    reason?: string;
  } {
    // Simplified permission checking
    // In production, integrate with actual permission system
    
    const { userId, userRole, permissions } = request.context;
    
    // Admin can do everything
    if (userRole === 'admin') {
      return { allowed: true };
    }
    
    // Check action-specific permissions
    const policy = this.actionPolicies.get(request.action);
    if (policy?.allowedRoles && !policy.allowedRoles.includes(userRole || '')) {
      return {
        allowed: false,
        reason: `Action '${request.action}' requires one of: ${policy.allowedRoles.join(', ')}`
      };
    }
    
    // Check user permissions
    if (permissions && permissions.length > 0) {
      const requiredPermission = `${request.action}:${request.target}`;
      if (!permissions.includes(requiredPermission) && !permissions.includes(`${request.action}:*`)) {
        return {
          allowed: false,
          reason: `Missing permission: ${requiredPermission}`
        };
      }
    }
    
    return { allowed: true };
  }
  
  /**
   * Determine action criticality
   */
  private determineCriticality(
    request: ActionValidationRequest,
    policy?: { defaultCriticality: ActionCriticality }
  ): ActionCriticality {
    // Use policy default or infer from action
    if (policy) {
      return policy.defaultCriticality;
    }
    
    // Infer criticality from action type
    switch (request.action) {
      case 'delete':
      case 'execute':
      case 'publish':
        return 'high';
      case 'modify':
      case 'write':
        return 'medium';
      default:
        return 'low';
    }
  }
  
  /**
   * Get approval reason
   */
  private getApprovalReason(
    criticality: ActionCriticality,
    request: ActionValidationRequest
  ): string {
    if (criticality === 'critical') {
      return `Critical action: ${request.action} on ${request.target} requires approval`;
    }
    if (criticality === 'high') {
      return `High-risk action: ${request.action} on ${request.target} requires approval`;
    }
    return `Action ${request.action} requires approval`;
  }
  
  /**
   * Determine who can approve
   */
  private determineApprover(
    criticality: ActionCriticality,
    request: ActionValidationRequest
  ): string {
    if (criticality === 'critical') {
      return 'admin';
    }
    if (criticality === 'high') {
      return 'principal_researcher';
    }
    return 'researcher';
  }
  
  /**
   * Register custom action policy
   */
  registerActionPolicy(
    action: ActionType,
    policy: {
      defaultCriticality: ActionCriticality;
      requiresApproval: boolean;
      allowedRoles?: string[];
      constraints?: (request: ActionValidationRequest) => boolean;
    }
  ): void {
    this.actionPolicies.set(action, policy);
    this.emit('policy:registered', { action, policy });
  }
  
  /**
   * Get action policy
   */
  getActionPolicy(action: ActionType) {
    return this.actionPolicies.get(action);
  }
}

// Singleton instance
export const actionValidationSystem = new ActionValidationSystem(aiSafetyFramework);


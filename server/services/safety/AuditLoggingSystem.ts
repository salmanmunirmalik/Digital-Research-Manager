/**
 * Audit Logging System
 * Task 33: Create comprehensive audit logging system
 * 
 * Logs all AI agent actions and system events for:
 * - Compliance and accountability
 * - Security monitoring
 * - Performance analysis
 * - Debugging and troubleshooting
 */

import { EventEmitter } from 'events';
import pool from "../../../database/config.js";

export type AuditEventType = 
  | 'agent_execution'
  | 'action_validation'
  | 'approval_request'
  | 'approval_response'
  | 'safety_check'
  | 'user_interaction'
  | 'data_access'
  | 'system_event'
  | 'error'
  | 'security_event';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogEntry {
  logId: string;
  timestamp: number;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  agentType?: string;
  action?: string;
  target?: string;
  targetId?: string;
  status: 'success' | 'failure' | 'pending' | 'cancelled';
  details: Record<string, any>;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
    correlationId?: string;
  };
  performance?: {
    duration?: number;
    tokensUsed?: number;
    cost?: number;
  };
  security?: {
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    threatType?: string;
    mitigation?: string;
  };
}

export interface AuditLogQuery {
  userId?: string;
  agentType?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  status?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
}

export class AuditLoggingSystem extends EventEmitter {
  private logBuffer: AuditLogEntry[] = [];
  private bufferSize = 100;
  private flushInterval = 5000; // 5 seconds
  private flushTimer?: NodeJS.Timeout;
  
  constructor() {
    super();
    this.startFlushTimer();
    this.setupEventListeners();
  }
  
  /**
   * Setup event listeners for automatic logging
   */
  private setupEventListeners(): void {
    // Listen to various system events
    process.on('uncaughtException', (error) => {
      this.log({
        eventType: 'error',
        severity: 'critical',
        status: 'failure',
        details: {
          error: error.message,
          stack: error.stack
        }
      });
    });
    
    process.on('unhandledRejection', (reason) => {
      this.log({
        eventType: 'error',
        severity: 'error',
        status: 'failure',
        details: {
          reason: String(reason)
        }
      });
    });
  }
  
  /**
   * Log an audit event
   */
  async log(entry: Partial<AuditLogEntry>): Promise<string> {
    const logId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullEntry: AuditLogEntry = {
      logId,
      timestamp: Date.now(),
      eventType: entry.eventType || 'system_event',
      severity: entry.severity || 'info',
      status: entry.status || 'success',
      details: entry.details || {},
      ...entry
    };
    
    // Add to buffer
    this.logBuffer.push(fullEntry);
    
    // Emit event
    this.emit('audit:logged', fullEntry);
    
    // Flush if buffer is full
    if (this.logBuffer.length >= this.bufferSize) {
      await this.flush();
    }
    
    return logId;
  }
  
  /**
   * Log agent execution
   */
  async logAgentExecution(
    agentType: string,
    userId: string,
    input: any,
    result: any,
    metadata?: {
      duration?: number;
      tokensUsed?: number;
      cost?: number;
      status?: 'success' | 'failure';
    }
  ): Promise<string> {
    return await this.log({
      eventType: 'agent_execution',
      severity: metadata?.status === 'failure' ? 'error' : 'info',
      userId,
      agentType,
      action: 'execute',
      target: 'agent',
      status: metadata?.status || (result?.success ? 'success' : 'failure'),
      details: {
        input: this.sanitizeForLogging(input),
        result: this.sanitizeForLogging(result),
        error: result?.error
      },
      performance: {
        duration: metadata?.duration,
        tokensUsed: metadata?.tokensUsed,
        cost: metadata?.cost
      }
    });
  }
  
  /**
   * Log action validation
   */
  async logActionValidation(
    userId: string,
    action: string,
    target: string,
    validationResult: any,
    metadata?: Record<string, any>
  ): Promise<string> {
    return await this.log({
      eventType: 'action_validation',
      severity: validationResult.allowed ? 'info' : 'warning',
      userId,
      action,
      target,
      status: validationResult.allowed ? 'success' : 'failure',
      details: {
        validationResult: this.sanitizeForLogging(validationResult),
        ...metadata
      },
      security: {
        riskLevel: validationResult.criticality === 'critical' ? 'critical' :
                   validationResult.criticality === 'high' ? 'high' :
                   validationResult.criticality === 'medium' ? 'medium' : 'low'
      }
    });
  }
  
  /**
   * Log approval request
   */
  async logApprovalRequest(
    requestId: string,
    userId: string,
    action: string,
    target: string,
    criticality: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return await this.log({
      eventType: 'approval_request',
      severity: criticality === 'critical' ? 'warning' : 'info',
      userId,
      action,
      target,
      status: 'pending',
      details: {
        requestId,
        criticality,
        ...metadata
      },
      metadata: {
        requestId
      }
    });
  }
  
  /**
   * Log approval response
   */
  async logApprovalResponse(
    requestId: string,
    approverId: string,
    decision: 'approved' | 'rejected',
    reason?: string
  ): Promise<string> {
    return await this.log({
      eventType: 'approval_response',
      severity: decision === 'rejected' ? 'warning' : 'info',
      userId: approverId,
      action: 'approve',
      target: 'approval_request',
      status: decision === 'approved' ? 'success' : 'failure',
      details: {
        requestId,
        decision,
        reason
      },
      metadata: {
        requestId
      }
    });
  }
  
  /**
   * Log safety check
   */
  async logSafetyCheck(
    content: string,
    safetyResult: any,
    metadata?: Record<string, any>
  ): Promise<string> {
    return await this.log({
      eventType: 'safety_check',
      severity: safetyResult.safetyLevel === 'unsafe' ? 'error' :
                safetyResult.safetyLevel === 'high_risk' ? 'warning' : 'info',
      action: 'safety_check',
      target: 'content',
      status: safetyResult.passed ? 'success' : 'failure',
      details: {
        safetyResult: this.sanitizeForLogging(safetyResult),
        contentLength: content.length,
        ...metadata
      },
      security: {
        riskLevel: safetyResult.safetyLevel === 'unsafe' ? 'critical' :
                   safetyResult.safetyLevel === 'high_risk' ? 'high' :
                   safetyResult.safetyLevel === 'medium_risk' ? 'medium' : 'low'
      }
    });
  }
  
  /**
   * Log user interaction
   */
  async logUserInteraction(
    userId: string,
    interactionType: string,
    details: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<string> {
    return await this.log({
      eventType: 'user_interaction',
      severity: 'info',
      userId,
      action: interactionType,
      status: 'success',
      details: this.sanitizeForLogging(details),
      metadata
    });
  }
  
  /**
   * Log data access
   */
  async logDataAccess(
    userId: string,
    dataType: string,
    dataId: string,
    accessType: 'read' | 'write' | 'delete',
    metadata?: Record<string, any>
  ): Promise<string> {
    return await this.log({
      eventType: 'data_access',
      severity: accessType === 'delete' ? 'warning' : 'info',
      userId,
      action: accessType,
      target: dataType,
      targetId: dataId,
      status: 'success',
      details: metadata || {},
      security: {
        riskLevel: accessType === 'delete' ? 'high' : 'low'
      }
    });
  }
  
  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: string,
    severity: AuditSeverity,
    details: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<string> {
    return await this.log({
      eventType: 'security_event',
      severity,
      action: eventType,
      status: 'success',
      details: this.sanitizeForLogging(details),
      metadata,
      security: {
        riskLevel: severity === 'critical' ? 'critical' :
                   severity === 'error' ? 'high' :
                   severity === 'warning' ? 'medium' : 'low',
        threatType: eventType
      }
    });
  }
  
  /**
   * Query audit logs
   */
  async queryLogs(query: AuditLogQuery): Promise<AuditLogEntry[]> {
    try {
      let sql = 'SELECT * FROM audit_logs WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;
      
      if (query.userId) {
        sql += ` AND user_id = $${paramIndex++}`;
        params.push(query.userId);
      }
      
      if (query.agentType) {
        sql += ` AND agent_type = $${paramIndex++}`;
        params.push(query.agentType);
      }
      
      if (query.eventType) {
        sql += ` AND event_type = $${paramIndex++}`;
        params.push(query.eventType);
      }
      
      if (query.severity) {
        sql += ` AND severity = $${paramIndex++}`;
        params.push(query.severity);
      }
      
      if (query.status) {
        sql += ` AND status = $${paramIndex++}`;
        params.push(query.status);
      }
      
      if (query.startTime) {
        sql += ` AND timestamp >= $${paramIndex++}`;
        params.push(new Date(query.startTime));
      }
      
      if (query.endTime) {
        sql += ` AND timestamp <= $${paramIndex++}`;
        params.push(new Date(query.endTime));
      }
      
      sql += ' ORDER BY timestamp DESC';
      
      if (query.limit) {
        sql += ` LIMIT $${paramIndex++}`;
        params.push(query.limit);
      }
      
      if (query.offset) {
        sql += ` OFFSET $${paramIndex++}`;
        params.push(query.offset);
      }
      
      const result = await pool.query(sql, params);
      
      return result.rows.map(row => this.mapRowToEntry(row));
    } catch (error) {
      console.error('Error querying audit logs:', error);
      return [];
    }
  }
  
  /**
   * Get audit log by ID
   */
  async getLogById(logId: string): Promise<AuditLogEntry | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM audit_logs WHERE id = $1',
        [logId]
      );
      
      if (result.rows.length === 0) return null;
      
      return this.mapRowToEntry(result.rows[0]);
    } catch (error) {
      console.error('Error getting audit log:', error);
      return null;
    }
  }
  
  /**
   * Flush buffer to database
   */
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;
    
    const entries = [...this.logBuffer];
    this.logBuffer = [];
    
    try {
      // Batch insert
      const values = entries.map((entry, index) => {
        const baseIndex = index * 12;
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12})`;
      }).join(', ');
      
      const params: any[] = [];
      entries.forEach(entry => {
        params.push(
          entry.logId,
          new Date(entry.timestamp),
          entry.eventType,
          entry.severity,
          entry.userId || null,
          entry.agentType || null,
          entry.action || null,
          entry.target || null,
          entry.targetId || null,
          entry.status,
          JSON.stringify(entry.details),
          JSON.stringify(entry.metadata || {})
        );
      });
      
      await pool.query(`
        INSERT INTO audit_logs (
          id, timestamp, event_type, severity, user_id, agent_type,
          action, target, target_id, status, details, metadata
        ) VALUES ${values}
        ON CONFLICT (id) DO NOTHING
      `, params);
      
      this.emit('audit:flushed', { count: entries.length });
    } catch (error) {
      console.error('Error flushing audit logs:', error);
      // Re-add entries to buffer on error
      this.logBuffer.unshift(...entries);
    }
  }
  
  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(error => {
        console.error('Error in flush timer:', error);
      });
    }, this.flushInterval);
  }
  
  /**
   * Stop flush timer
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }
  
  /**
   * Sanitize data for logging (remove sensitive information)
   */
  private sanitizeForLogging(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const sensitiveFields = ['password', 'apiKey', 'token', 'secret', 'creditCard', 'ssn'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }
    
    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeForLogging(sanitized[key]);
      }
    }
    
    return sanitized;
  }
  
  /**
   * Map database row to audit log entry
   */
  private mapRowToEntry(row: any): AuditLogEntry {
    return {
      logId: row.id,
      timestamp: new Date(row.timestamp).getTime(),
      eventType: row.event_type,
      severity: row.severity,
      userId: row.user_id,
      agentType: row.agent_type,
      action: row.action,
      target: row.target,
      targetId: row.target_id,
      status: row.status,
      details: row.details || {},
      metadata: row.metadata || {}
    };
  }
  
  /**
   * Generate audit report
   */
  async generateReport(
    startTime: number,
    endTime: number,
    options?: {
      groupBy?: 'user' | 'agent' | 'event' | 'severity';
      includeStats?: boolean;
    }
  ): Promise<any> {
    const logs = await this.queryLogs({ startTime, endTime });
    
    const report: any = {
      period: {
        start: new Date(startTime).toISOString(),
        end: new Date(endTime).toISOString()
      },
      totalEvents: logs.length,
      events: logs
    };
    
    if (options?.includeStats) {
      report.stats = {
        bySeverity: this.groupBy(logs, 'severity'),
        byEventType: this.groupBy(logs, 'eventType'),
        byStatus: this.groupBy(logs, 'status'),
        byUser: this.groupBy(logs, 'userId'),
        byAgent: this.groupBy(logs, 'agentType')
      };
    }
    
    return report;
  }
  
  /**
   * Group logs by field
   */
  private groupBy(logs: AuditLogEntry[], field: keyof AuditLogEntry): Record<string, number> {
    const groups: Record<string, number> = {};
    
    logs.forEach(log => {
      const value = String(log[field] || 'unknown');
      groups[value] = (groups[value] || 0) + 1;
    });
    
    return groups;
  }
}

// Singleton instance
export const auditLoggingSystem = new AuditLoggingSystem();


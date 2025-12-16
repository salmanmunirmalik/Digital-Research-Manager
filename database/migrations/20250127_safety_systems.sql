-- Safety Systems Database Migration
-- Creates tables for approval requests, audit logs, action snapshots, and rollback requests

-- Approval Requests Table
CREATE TABLE IF NOT EXISTS approval_requests (
    id VARCHAR(255) PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(100) NOT NULL,
    target_id VARCHAR(255),
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_at TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired', 'cancelled'
    criticality VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    required_approval_level VARCHAR(50) NOT NULL, -- 'user', 'researcher', 'principal_researcher', 'admin'
    description TEXT,
    reason TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP,
    timeout INTEGER,
    approvers JSONB DEFAULT '[]',
    escalation_level INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- 'agent_execution', 'action_validation', 'approval_request', etc.
    severity VARCHAR(50) NOT NULL, -- 'info', 'warning', 'error', 'critical'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    agent_type VARCHAR(100),
    action VARCHAR(100),
    target VARCHAR(100),
    target_id VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- 'success', 'failure', 'pending', 'cancelled'
    details JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    performance JSONB DEFAULT '{}', -- duration, tokensUsed, cost
    security JSONB DEFAULT '{}', -- riskLevel, threatType, mitigation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Action Snapshots Table
CREATE TABLE IF NOT EXISTS action_snapshots (
    id VARCHAR(255) PRIMARY KEY,
    action_id VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    target VARCHAR(100) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    state_before JSONB NOT NULL,
    state_after JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rollback Requests Table
CREATE TABLE IF NOT EXISTS rollback_requests (
    id VARCHAR(255) PRIMARY KEY,
    snapshot_id VARCHAR(255) NOT NULL REFERENCES action_snapshots(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_at TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
    type VARCHAR(50) NOT NULL, -- 'action', 'state', 'transaction', 'full'
    reason TEXT NOT NULL,
    target VARCHAR(100) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    rollback_steps JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_by ON approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_criticality ON approval_requests(criticality);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_at ON approval_requests(requested_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_agent_type ON audit_logs(agent_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target, target_id);

CREATE INDEX IF NOT EXISTS idx_action_snapshots_action_id ON action_snapshots(action_id);
CREATE INDEX IF NOT EXISTS idx_action_snapshots_target ON action_snapshots(target, target_id);
CREATE INDEX IF NOT EXISTS idx_action_snapshots_timestamp ON action_snapshots(timestamp);

CREATE INDEX IF NOT EXISTS idx_rollback_requests_snapshot_id ON rollback_requests(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_rollback_requests_requested_by ON rollback_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_rollback_requests_status ON rollback_requests(status);
CREATE INDEX IF NOT EXISTS idx_rollback_requests_requested_at ON rollback_requests(requested_at);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_approval_requests_updated_at
    BEFORE UPDATE ON approval_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rollback_requests_updated_at
    BEFORE UPDATE ON rollback_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


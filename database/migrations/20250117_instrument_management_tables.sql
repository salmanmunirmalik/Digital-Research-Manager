-- Instrument Management Tables Migration
-- This creates the missing tables for comprehensive instrument management

-- Instrument Maintenance Table
CREATE TABLE IF NOT EXISTS instrument_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'routine', 'repair', 'calibration', 'cleaning', 'inspection', 'upgrade'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    assigned_to UUID REFERENCES users(id),
    estimated_duration INTEGER DEFAULT 60, -- in minutes
    cost DECIMAL(10,2) DEFAULT 0,
    parts_used TEXT[] DEFAULT '{}',
    notes TEXT,
    checklist JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    before_images TEXT[] DEFAULT '{}',
    after_images TEXT[] DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Instrument Rosters Table
CREATE TABLE IF NOT EXISTS instrument_rosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'operator', 'supervisor', 'maintenance_tech', 'trainer', 'admin'
    training_level VARCHAR(20) DEFAULT 'basic', -- 'basic', 'intermediate', 'advanced', 'expert'
    certification_date DATE,
    certification_expiry DATE,
    permissions TEXT[] DEFAULT '{}', -- 'operate', 'maintain', 'train', 'admin'
    last_training TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending_approval', -- 'pending_approval', 'approved', 'suspended', 'expired'
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(instrument_id, user_id)
);

-- Instrument Usage Table
CREATE TABLE IF NOT EXISTS instrument_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    purpose TEXT NOT NULL,
    samples_processed INTEGER DEFAULT 0,
    efficiency_rating INTEGER CHECK (efficiency_rating >= 1 AND efficiency_rating <= 5),
    issues_reported TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Instrument Alerts Table
CREATE TABLE IF NOT EXISTS instrument_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'maintenance_due', 'maintenance_overdue', 'usage_limit', 'error', 'warning'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'critical'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_instrument_maintenance_instrument_id ON instrument_maintenance(instrument_id);
CREATE INDEX IF NOT EXISTS idx_instrument_maintenance_scheduled_date ON instrument_maintenance(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_instrument_maintenance_status ON instrument_maintenance(status);

CREATE INDEX IF NOT EXISTS idx_instrument_rosters_instrument_id ON instrument_rosters(instrument_id);
CREATE INDEX IF NOT EXISTS idx_instrument_rosters_user_id ON instrument_rosters(user_id);
CREATE INDEX IF NOT EXISTS idx_instrument_rosters_status ON instrument_rosters(status);

CREATE INDEX IF NOT EXISTS idx_instrument_usage_instrument_id ON instrument_usage(instrument_id);
CREATE INDEX IF NOT EXISTS idx_instrument_usage_user_id ON instrument_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_instrument_usage_start_time ON instrument_usage(start_time);

CREATE INDEX IF NOT EXISTS idx_instrument_alerts_instrument_id ON instrument_alerts(instrument_id);
CREATE INDEX IF NOT EXISTS idx_instrument_alerts_acknowledged ON instrument_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_instrument_alerts_severity ON instrument_alerts(severity);

-- Create triggers for updated_at
CREATE TRIGGER update_instrument_maintenance_updated_at 
    BEFORE UPDATE ON instrument_maintenance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instrument_rosters_updated_at 
    BEFORE UPDATE ON instrument_rosters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Base Schema Migration
-- This must run first to create core tables (users, labs, projects, etc.)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Roles Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin',
        'principal_researcher',
        'co_supervisor', 
        'researcher',
        'student'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User Status Enum
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM (
        'active',
        'inactive',
        'suspended',
        'pending_verification'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Privacy Level Enum
DO $$ BEGIN
    CREATE TYPE privacy_level AS ENUM (
        'personal',
        'lab',
        'global'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Data Type Enum
DO $$ BEGIN
    CREATE TYPE data_type AS ENUM (
        'protocol',
        'experiment',
        'inventory',
        'instrument',
        'result',
        'note',
        'attachment'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    status user_status NOT NULL DEFAULT 'pending_verification',
    avatar_url TEXT,
    bio TEXT,
    research_interests TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token UUID DEFAULT uuid_generate_v4(),
    reset_password_token UUID,
    reset_password_expires TIMESTAMP WITH TIME ZONE
);

-- Labs Table
CREATE TABLE IF NOT EXISTS labs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    institution VARCHAR(255),
    department VARCHAR(255),
    principal_researcher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    co_supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    logo_url TEXT,
    website_url TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Lab Members Table
CREATE TABLE IF NOT EXISTS lab_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(lab_id, user_id)
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    lead_researcher_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'planning',
    priority VARCHAR(20) DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    location VARCHAR(255),
    quantity INTEGER DEFAULT 0,
    unit VARCHAR(50),
    min_quantity INTEGER DEFAULT 0,
    supplier VARCHAR(255),
    supplier_contact TEXT,
    cost_per_unit DECIMAL(10,2),
    last_restocked DATE,
    expiry_date DATE,
    storage_conditions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Instruments Table
CREATE TABLE IF NOT EXISTS instruments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    location VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    manufacturer VARCHAR(255),
    purchase_date DATE,
    warranty_expiry DATE,
    calibration_due_date DATE,
    status VARCHAR(50) DEFAULT 'available',
    maintenance_notes TEXT,
    user_manual_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lab Notebook Entries Table
CREATE TABLE IF NOT EXISTS lab_notebook_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lab_id UUID REFERENCES labs(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    entry_type VARCHAR(50) DEFAULT 'experiment',
    privacy_level privacy_level DEFAULT 'personal',
    tags TEXT[],
    experiment_date DATE,
    results TEXT,
    conclusions TEXT,
    next_steps TEXT,
    attachments TEXT[],
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Protocols Table
CREATE TABLE IF NOT EXISTS protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    version VARCHAR(20) DEFAULT '1.0',
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lab_id UUID REFERENCES labs(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    privacy_level privacy_level DEFAULT 'personal',
    content TEXT NOT NULL,
    materials TEXT[],
    equipment TEXT[],
    safety_notes TEXT,
    estimated_duration INTEGER, -- in minutes
    difficulty_level VARCHAR(20),
    tags TEXT[],
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Results Table
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    data_type VARCHAR(50) NOT NULL DEFAULT 'experiment',
    data_format VARCHAR(50) NOT NULL DEFAULT 'manual',
    data_content JSONB NOT NULL,
    tags TEXT[],
    privacy_level privacy_level DEFAULT 'lab',
    source VARCHAR(50) DEFAULT 'manual',
    notebook_entry_id UUID REFERENCES lab_notebook_entries(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

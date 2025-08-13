-- ResearchLabSync Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM (
  'Principal Investigator',
  'Postdoctoral Fellow', 
  'PhD Student',
  'Lab Manager',
  'Research Assistant',
  'Undergraduate Student'
);

CREATE TYPE user_status AS ENUM (
  'Online',
  'In Lab',
  'Away',
  'Offline'
);

CREATE TYPE protocol_access AS ENUM (
  'Public',
  'Lab Only',
  'Private',
  'Collaborative'
);

CREATE TYPE protocol_difficulty AS ENUM (
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert'
);

CREATE TYPE risk_level AS ENUM (
  'Low',
  'Medium',
  'High',
  'Extreme'
);

CREATE TYPE inventory_type AS ENUM (
  'Reagent',
  'Antibody',
  'Plasmid',
  'Consumable',
  'Sample',
  'Equipment',
  'Glassware'
);

CREATE TYPE instrument_type AS ENUM (
  'Microscope',
  'Sequencer',
  'Centrifuge',
  'FACS',
  'PCR Machine',
  'Incubator',
  'Freezer',
  'Other'
);

CREATE TYPE instrument_status AS ENUM (
  'Operational',
  'Under Maintenance',
  'Offline',
  'Reserved'
);

CREATE TYPE entry_status AS ENUM (
  'In Progress',
  'Completed',
  'Awaiting Review',
  'Signed'
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'Research Assistant',
  avatar_url TEXT,
  status user_status DEFAULT 'Offline',
  expertise TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protocols table (enhanced)
CREATE TABLE protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  abstract TEXT,
  tags TEXT[] DEFAULT '{}',
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version VARCHAR(20) DEFAULT '1.0.0',
  access protocol_access DEFAULT 'Lab Only',
  discussion_count INTEGER DEFAULT 0,
  video_url TEXT,
  forked_from UUID REFERENCES protocols(id),
  
  -- Enhanced fields for scientists
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100) NOT NULL,
  difficulty protocol_difficulty NOT NULL,
  estimated_time JSONB NOT NULL, -- {preparation, execution, analysis, total}
  equipment JSONB NOT NULL, -- {essential, optional, shared}
  reagents JSONB NOT NULL, -- {essential, optional, alternatives}
  safety JSONB NOT NULL, -- {risk_level, hazards, ppe, emergency_procedures, disposal_requirements}
  validation JSONB NOT NULL, -- {tested_by, validation_date, success_rate, notes}
  publications JSONB, -- {doi, journal, year, authors}
  related_protocols UUID[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  language VARCHAR(10) DEFAULT 'en',
  last_validated TIMESTAMP WITH TIME ZONE,
  citation_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protocol steps table (enhanced)
CREATE TABLE protocol_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  details TEXT,
  safety_warning TEXT,
  materials TEXT[],
  duration_minutes INTEGER,
  
  -- Enhanced step fields
  temperature JSONB, -- {value, unit, tolerance}
  ph JSONB, -- {value, tolerance}
  calculator_data JSONB,
  video_timestamp JSONB,
  conditional_data JSONB,
  quality_control JSONB, -- {expected_outcome, success_criteria, troubleshooting}
  waste_disposal TEXT,
  references TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protocol attachments table
CREATE TABLE protocol_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  size BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experiments table
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notebook entries table
CREATE TABLE notebook_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  protocol_id UUID REFERENCES protocols(id),
  status entry_status DEFAULT 'In Progress',
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content blocks table
CREATE TABLE content_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES notebook_entries(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory items table (enhanced)
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type inventory_type NOT NULL,
  supplier VARCHAR(255),
  catalog_number VARCHAR(100),
  location VARCHAR(255) NOT NULL,
  quantity_value DECIMAL(10,3) NOT NULL,
  quantity_unit VARCHAR(50) NOT NULL,
  lot_number VARCHAR(100),
  expiration_date DATE,
  low_stock_threshold DECIMAL(10,3),
  sds_url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instruments table (enhanced)
CREATE TABLE instruments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type instrument_type NOT NULL,
  location VARCHAR(255) NOT NULL,
  status instrument_status DEFAULT 'Operational',
  specifications JSONB, -- {manufacturer, model, capacity, etc.}
  maintenance_schedule JSONB, -- {last_maintenance, next_maintenance, notes}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  purpose TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Results table (enhanced)
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  protocol_id UUID REFERENCES protocols(id),
  summary TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  data_preview JSONB NOT NULL,
  source VARCHAR(50) DEFAULT 'Manual',
  notebook_entry_id UUID REFERENCES notebook_entries(id),
  insights TEXT,
  next_steps TEXT,
  pitfalls TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Help requests table
CREATE TABLE help_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  protocol_id UUID REFERENCES protocols(id),
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'Open',
  tags TEXT[] DEFAULT '{}',
  priority VARCHAR(20) DEFAULT 'Medium',
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Scratchpad items table
CREATE TABLE scratchpad_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  calculator_name VARCHAR(100) NOT NULL,
  inputs JSONB NOT NULL,
  result JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protocol reviews table
CREATE TABLE protocol_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protocol discussions table
CREATE TABLE protocol_discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  parent_id UUID REFERENCES protocol_discussions(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab events table
CREATE TABLE lab_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL, -- 'Meeting', 'Seminar', 'Training', 'Maintenance'
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255),
  organizer_id UUID NOT NULL REFERENCES users(id),
  attendees UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_protocols_category ON protocols(category);
CREATE INDEX idx_protocols_subcategory ON protocols(subcategory);
CREATE INDEX idx_protocols_difficulty ON protocols(difficulty);
CREATE INDEX idx_protocols_tags ON protocols USING GIN(tags);
CREATE INDEX idx_protocols_keywords ON protocols USING GIN(keywords);
CREATE INDEX idx_protocols_author ON protocols(author_id);
CREATE INDEX idx_protocols_created ON protocols(created_at);

CREATE INDEX idx_protocol_steps_protocol ON protocol_steps(protocol_id);
CREATE INDEX idx_protocol_steps_number ON protocol_steps(protocol_id, step_number);

CREATE INDEX idx_inventory_type ON inventory_items(type);
CREATE INDEX idx_inventory_location ON inventory_items(location);
CREATE INDEX idx_inventory_expiration ON inventory_items(expiration_date);
CREATE INDEX idx_inventory_low_stock ON inventory_items(quantity_value, low_stock_threshold);

CREATE INDEX idx_instruments_type ON instruments(type);
CREATE INDEX idx_instruments_status ON instruments(status);
CREATE INDEX idx_instruments_location ON instruments(location);

CREATE INDEX idx_bookings_instrument ON bookings(instrument_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_time ON bookings(start_time, end_time);

CREATE INDEX idx_results_author ON results(author_id);
CREATE INDEX idx_results_protocol ON results(protocol_id);
CREATE INDEX idx_results_tags ON results USING GIN(tags);
CREATE INDEX idx_results_created ON results(created_at);

CREATE INDEX idx_notebook_entries_experiment ON notebook_entries(experiment_id);
CREATE INDEX idx_notebook_entries_author ON notebook_entries(author_id);
CREATE INDEX idx_notebook_entries_status ON notebook_entries(status);

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE scratchpad_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_events ENABLE ROW LEVEL SECURITY;

-- Users can view all users but only edit their own profile
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Protocols: Public protocols visible to all, private to owner only
CREATE POLICY "Protocols visible based on access" ON protocols FOR SELECT USING (
  access = 'Public' OR 
  access = 'Lab Only' OR 
  auth.uid() = author_id
);

CREATE POLICY "Protocols editable by owner" ON protocols FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Protocols deletable by owner" ON protocols FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Protocols insertable by authenticated users" ON protocols FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Similar policies for other tables...
-- (Add comprehensive RLS policies for all tables based on your security requirements)

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_protocols_updated_at BEFORE UPDATE ON protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment discussion count
CREATE OR REPLACE FUNCTION increment_discussion_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE protocols 
  SET discussion_count = discussion_count + 1 
  WHERE id = NEW.protocol_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_protocol_discussion_count 
  AFTER INSERT ON protocol_discussions
  FOR EACH ROW EXECUTE FUNCTION increment_discussion_count();

-- Function to calculate protocol rating
CREATE OR REPLACE FUNCTION calculate_protocol_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE protocols 
  SET 
    rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM protocol_reviews 
      WHERE protocol_id = NEW.protocol_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM protocol_reviews 
      WHERE protocol_id = NEW.protocol_id
    )
  WHERE id = NEW.protocol_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_protocol_rating 
  AFTER INSERT OR UPDATE OR DELETE ON protocol_reviews
  FOR EACH ROW EXECUTE FUNCTION calculate_protocol_rating();

-- Insert sample data
INSERT INTO users (username, email, role, expertise) VALUES
('admin', 'admin@researchlab.com', 'Principal Investigator', ARRAY['Molecular Biology', 'Biochemistry', 'Cell Biology']),
('scientist1', 'scientist1@researchlab.com', 'Postdoctoral Fellow', ARRAY['Genetics', 'Bioinformatics']),
('student1', 'student1@researchlab.com', 'PhD Student', ARRAY['Microbiology', 'Immunology']);

-- Insert sample instruments
INSERT INTO instruments (name, type, location, specifications) VALUES
('Confocal Microscope', 'Microscope', 'Room 101', '{"manufacturer": "Zeiss", "model": "LSM 800", "wavelengths": ["488nm", "561nm", "640nm"]}'),
('PCR Machine', 'PCR Machine', 'Room 102', '{"manufacturer": "Bio-Rad", "model": "C1000", "capacity": "96 wells"}'),
('Centrifuge', 'Centrifuge', 'Room 103', '{"manufacturer": "Eppendorf", "model": "5810R", "max_speed": "14000 rpm"}');

-- Insert sample inventory
INSERT INTO inventory_items (name, type, supplier, catalog_number, location, quantity_value, quantity_unit, lot_number, expiration_date, low_stock_threshold) VALUES
('Taq DNA Polymerase', 'Reagent', 'Thermo Fisher', '10342020', 'Freezer A1', 100, 'μL', 'LOT123', '2025-12-31', 20),
('Trypan Blue', 'Reagent', 'Sigma', 'T8154', 'Refrigerator B2', 50, 'mL', 'LOT456', '2026-06-30', 10),
('96-well Plates', 'Consumable', 'Corning', '3595', 'Shelf C3', 100, 'pieces', 'LOT789', NULL, 20);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

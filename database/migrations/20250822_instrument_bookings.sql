-- Instrument Bookings Migration
-- This handles the complex booking system used in research labs

-- Booking time slots (configurable per instrument)
CREATE TABLE IF NOT EXISTS instrument_booking_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER DEFAULT 60, -- Default 1-hour slots
  max_advance_booking_days INTEGER DEFAULT 30, -- How far in advance can book
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(instrument_id, day_of_week, start_time)
);

-- Actual bookings
CREATE TABLE IF NOT EXISTS instrument_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  purpose TEXT NOT NULL,
  research_project VARCHAR(255), -- Link to research project
  urgency VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled, completed
  approved_by UUID REFERENCES users(id), -- PI/Lab Manager who approved
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  actual_start_time TIMESTAMP WITH TIME ZONE, -- When user actually started using
  actual_end_time TIMESTAMP WITH TIME ZONE, -- When user actually finished
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Link bookings to resource exchange requests (when supplies are needed for the experiment)
-- Note: resource_exchange_requests table may be created by a later migration
CREATE TABLE IF NOT EXISTS booking_supply_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES instrument_bookings(id) ON DELETE CASCADE,
  exchange_request_id UUID, -- References resource_exchange_requests if it exists (no FK to avoid dependency)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(booking_id, exchange_request_id)
);

-- Instrument maintenance and unavailable periods
CREATE TABLE IF NOT EXISTS instrument_unavailable_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  reason VARCHAR(100) NOT NULL, -- maintenance, calibration, repair, etc.
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Triggers for updated_at
CREATE TRIGGER update_instrument_bookings_updated_at BEFORE UPDATE ON instrument_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instrument_booking_slots_updated_at BEFORE UPDATE ON instrument_booking_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instrument_unavailable_periods_updated_at BEFORE UPDATE ON instrument_unavailable_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance (after tables and triggers are created)
CREATE INDEX IF NOT EXISTS idx_bookings_instrument_date ON instrument_bookings(instrument_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON instrument_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON instrument_bookings(status);
CREATE INDEX IF NOT EXISTS idx_booking_slots_instrument ON instrument_booking_slots(instrument_id);
CREATE INDEX IF NOT EXISTS idx_unavailable_periods_instrument ON instrument_unavailable_periods(instrument_id);

-- Insert default booking slots for existing instruments (9 AM - 6 PM, Monday-Friday)
INSERT INTO instrument_booking_slots (instrument_id, day_of_week, start_time, end_time, slot_duration_minutes)
SELECT 
  i.id,
  d.day_of_week,
  '09:00:00'::time,
  '18:00:00'::time,
  60
FROM instruments i
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS d(day_of_week) -- Monday to Friday
ON CONFLICT DO NOTHING;

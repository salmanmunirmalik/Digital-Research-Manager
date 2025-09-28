-- Calendar Events and Quick Notes Migration

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  event_type VARCHAR(50) DEFAULT 'meeting', -- meeting | deadline | reminder | experiment | appointment
  priority VARCHAR(20) DEFAULT 'medium', -- low | medium | high
  color VARCHAR(20) DEFAULT 'blue', -- blue | green | red | yellow
  is_all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quick Notes Table
CREATE TABLE IF NOT EXISTS quick_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  color VARCHAR(20) DEFAULT 'yellow', -- yellow | blue | green | pink
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON calendar_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_quick_notes_user ON quick_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_notes_created ON quick_notes(created_at);

-- Triggers for updated_at
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quick_notes_updated_at BEFORE UPDATE ON quick_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

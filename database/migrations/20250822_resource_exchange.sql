-- Resource Exchange and Shared Instruments Migration

-- Supplies/Consumables Requests
CREATE TABLE IF NOT EXISTS resource_exchange_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity INTEGER,
  unit VARCHAR(50),
  urgency VARCHAR(20) DEFAULT 'normal',
  needed_by DATE,
  location_preference VARCHAR(30) DEFAULT 'institution', -- institution | consortium | any
  status VARCHAR(20) DEFAULT 'open', -- open | matched | fulfilled | cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Offers to Fulfill a Request
CREATE TABLE IF NOT EXISTS resource_exchange_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES resource_exchange_requests(id) ON DELETE CASCADE,
  provider_lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  provider_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER,
  unit VARCHAR(50),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending | accepted | declined | fulfilled | withdrawn
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mark instruments as shared across labs/universities
CREATE TABLE IF NOT EXISTS shared_instruments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  sharing_scope VARCHAR(30) DEFAULT 'institution', -- institution | consortium | public
  access_policy TEXT, -- e.g., booking rules, approvals
  external_contact_email VARCHAR(255),
  is_shared BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (instrument_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exchange_requests_lab ON resource_exchange_requests(requester_lab_id);
CREATE INDEX IF NOT EXISTS idx_exchange_offers_request ON resource_exchange_offers(request_id);
CREATE INDEX IF NOT EXISTS idx_shared_instruments_instrument ON shared_instruments(instrument_id);

-- Triggers for updated_at
CREATE TRIGGER update_exchange_requests_updated_at BEFORE UPDATE ON resource_exchange_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchange_offers_updated_at BEFORE UPDATE ON resource_exchange_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_instruments_updated_at BEFORE UPDATE ON shared_instruments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



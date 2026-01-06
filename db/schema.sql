-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Drinks Table
CREATE TABLE drinks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 2. Market Configuration
CREATE TABLE market_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barman_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  increase_per_order DECIMAL(10, 2) DEFAULT 0.10,
  decrease_others DECIMAL(10, 2) DEFAULT 0.05,
  cycle_duration_seconds INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sessions
CREATE TABLE market_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barman_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  current_cycle_number INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ,
  last_price_update_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drink_id UUID REFERENCES drinks(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES market_sessions(id) ON DELETE CASCADE NOT NULL,
  cycle_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Price History
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drink_id UUID REFERENCES drinks(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES market_sessions(id) ON DELETE CASCADE NOT NULL,
  cycle_number INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  variation DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Events (Temporaries)
CREATE TABLE market_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barman_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('fixed_price', 'discount', 'crash')),
  value DECIMAL(10, 2),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE drinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Drinks: Owner can do everything, public can view
CREATE POLICY "Owners can manage their drinks" ON drinks
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Public can view drinks of active sessions" ON drinks
  FOR SELECT USING (TRUE); -- Simplified for public page

-- Config: Only owner
CREATE POLICY "Owners can manage their config" ON market_configs
  FOR ALL USING (auth.uid() = barman_id);

-- Sessions: Only owner, public can view
CREATE POLICY "Owners can manage their sessions" ON market_sessions
  FOR ALL USING (auth.uid() = barman_id);
CREATE POLICY "Public can view active sessions" ON market_sessions
  FOR SELECT USING (is_active = TRUE);

-- Orders: Owner can insert/view
CREATE POLICY "Owners can manage orders" ON orders
  FOR ALL USING (EXISTS (
    SELECT 1 FROM market_sessions s 
    WHERE s.id = session_id AND s.barman_id = auth.uid()
  ));

-- Price History: Public read, System/Owner write
CREATE POLICY "Public can view price history" ON price_history
  FOR SELECT USING (TRUE);
CREATE POLICY "Owners can manage price history" ON price_history
  FOR ALL USING (EXISTS (
    SELECT 1 FROM market_sessions s 
    WHERE s.id = session_id AND s.barman_id = auth.uid()
  ));

-- Events: Owner management
CREATE POLICY "Owners can manage events" ON market_events
  FOR ALL USING (auth.uid() = barman_id);
CREATE POLICY "Public can view events" ON market_events
  FOR SELECT USING (TRUE);

-- Helper Function for atomic cycle increment
CREATE OR REPLACE FUNCTION increment_cycle(session_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_cycle INTEGER;
BEGIN
  UPDATE market_sessions
  SET current_cycle_number = current_cycle_number + 1,
      last_price_update_at = NOW()
  WHERE id = session_id
  RETURNING current_cycle_number INTO new_cycle;

  RETURN new_cycle;
END;
$$ LANGUAGE plpgsql;

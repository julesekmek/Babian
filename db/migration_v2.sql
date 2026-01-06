-- Add min/max price columns to drinks
ALTER TABLE drinks ADD COLUMN min_price DECIMAL(10, 2);
ALTER TABLE drinks ADD COLUMN max_price DECIMAL(10, 2);

-- Set default values for existing drinks (min = 50% of base, max = 500% of base)
UPDATE drinks SET min_price = base_price * 0.5 WHERE min_price IS NULL;
UPDATE drinks SET max_price = base_price * 5.0 WHERE max_price IS NULL;

-- Make them NOT NULL after setting defaults
ALTER TABLE drinks ALTER COLUMN min_price SET NOT NULL;
ALTER TABLE drinks ALTER COLUMN max_price SET NOT NULL;

-- Create join table for events and drinks
CREATE TABLE event_drinks (
  event_id UUID REFERENCES market_events(id) ON DELETE CASCADE NOT NULL,
  drink_id UUID REFERENCES drinks(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (event_id, drink_id)
);

-- Enable RLS for the new table
ALTER TABLE event_drinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their event_drinks" ON event_drinks
  FOR ALL USING (EXISTS (
    SELECT 1 FROM market_events e 
    WHERE e.id = event_id AND e.barman_id = auth.uid()
  ));

CREATE POLICY "Public can view event_drinks" ON event_drinks
  FOR SELECT USING (TRUE);

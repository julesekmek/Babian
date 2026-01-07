-- Migration v4: Add support for pre-created events
-- This allows barmen to create event templates and activate them on-demand

-- Add new columns to market_events table
ALTER TABLE market_events 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('template', 'scheduled', 'active', 'finished')) DEFAULT 'active';

-- Update existing events to have proper status
UPDATE market_events 
SET status = CASE 
  WHEN NOW() >= start_at AND NOW() <= end_at THEN 'active'
  WHEN NOW() > end_at THEN 'finished'
  WHEN NOW() < start_at THEN 'scheduled'
  ELSE 'active'
END
WHERE status IS NULL OR status = 'active';

-- Add index for faster template queries
CREATE INDEX IF NOT EXISTS idx_market_events_template ON market_events(barman_id, is_template, status);

-- Add comment for documentation
COMMENT ON COLUMN market_events.description IS 'Detailed description for pre-created event templates';
COMMENT ON COLUMN market_events.is_template IS 'True if event is a pre-created template waiting to be activated';
COMMENT ON COLUMN market_events.status IS 'Lifecycle status: template (not activated), scheduled (future start), active (running), finished (expired)';

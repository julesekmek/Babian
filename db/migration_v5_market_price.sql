-- Add market_price column to track price before events
ALTER TABLE drinks ADD COLUMN IF NOT EXISTS market_price DECIMAL(10, 2);

-- Initialize market_price with current_price for existing drinks
UPDATE drinks SET market_price = current_price WHERE market_price IS NULL;

-- Ensure market_price is NOT NULL for future
ALTER TABLE drinks ALTER COLUMN market_price SET NOT NULL;

-- Atomic function to trigger a new cycle only if conditions are met
CREATE OR REPLACE FUNCTION trigger_cycle(s_id UUID, expected_cycle INTEGER, min_seconds INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE market_sessions
  SET last_price_update_at = NOW()
  WHERE id = s_id 
    AND current_cycle_number = expected_cycle
    AND (last_price_update_at IS NULL OR EXTRACT(EPOCH FROM (NOW() - last_price_update_at)) >= min_seconds)
  RETURNING 1 INTO rows_affected;

  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

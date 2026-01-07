-- Make cycle_number optional in orders table to allow for time-based tracking
ALTER TABLE orders ALTER COLUMN cycle_number DROP NOT NULL;

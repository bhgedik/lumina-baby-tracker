-- Lumina: Add optional sensitivity tracker field to feeding logs
-- Allows mothers to note suspected gas/allergy triggers per feeding
ALTER TABLE feeding_logs
  ADD COLUMN sensitivity_notes TEXT;

COMMENT ON COLUMN feeding_logs.sensitivity_notes IS 'Free-text notes on suspected gas or allergy triggers (e.g. Dairy, Caffeine)';

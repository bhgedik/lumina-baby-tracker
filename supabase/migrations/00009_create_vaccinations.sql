-- Sprouty: Vaccination records
-- NOTE: Vaccination schedules use CHRONOLOGICAL age (not corrected!)
CREATE TABLE vaccinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  dose_number SMALLINT NOT NULL,
  scheduled_date DATE NOT NULL,
  administered_date DATE,
  administered_by TEXT,
  lot_number TEXT,
  side_effects TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vaccinations_baby ON vaccinations(baby_id);
CREATE INDEX idx_vaccinations_scheduled ON vaccinations(baby_id, scheduled_date);
CREATE UNIQUE INDEX idx_vaccinations_unique ON vaccinations(baby_id, vaccine_name, dose_number);

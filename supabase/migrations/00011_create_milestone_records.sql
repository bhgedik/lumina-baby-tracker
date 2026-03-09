-- Sprouty: Individual baby milestone tracking
CREATE TABLE milestone_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  milestone_definition_id UUID NOT NULL REFERENCES milestone_definitions(id),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'emerging', 'achieved')),
  achieved_date DATE,
  notes TEXT,
  evidence_urls TEXT[],
  logged_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_milestone_records_unique ON milestone_records(baby_id, milestone_definition_id);
CREATE INDEX idx_milestone_records_baby ON milestone_records(baby_id, status);

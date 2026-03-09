-- Sprouty: Diaper change logs
CREATE TABLE diaper_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  logged_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('wet', 'dirty', 'both', 'dry')),
  stool_color TEXT,
  stool_consistency TEXT,
  has_rash BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_diaper_logs_baby_time ON diaper_logs(baby_id, logged_at DESC);
CREATE INDEX idx_diaper_logs_family ON diaper_logs(family_id);

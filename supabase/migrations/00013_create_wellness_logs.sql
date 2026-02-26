-- Nodd: Parent wellness and mood tracking
CREATE TABLE wellness_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mood', 'epds', 'energy', 'note')),
  mood SMALLINT CHECK (mood BETWEEN 1 AND 5),
  energy SMALLINT CHECK (energy BETWEEN 1 AND 5),
  epds_score SMALLINT CHECK (epds_score BETWEEN 0 AND 30),
  epds_responses JSONB,
  sleep_quality SMALLINT CHECK (sleep_quality BETWEEN 1 AND 5),
  notes TEXT,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wellness_logs_profile ON wellness_logs(profile_id, logged_at DESC);
CREATE INDEX idx_wellness_logs_epds ON wellness_logs(profile_id, type) WHERE type = 'epds';

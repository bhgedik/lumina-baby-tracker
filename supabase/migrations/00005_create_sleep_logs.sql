-- Sprouty: Sleep logs (naps and night sleep)
CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('nap', 'night')),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  method TEXT,
  location TEXT,
  quality SMALLINT CHECK (quality BETWEEN 1 AND 5),
  night_wakings SMALLINT,
  room_temperature_celsius NUMERIC(4,1),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sleep_logs_baby_time ON sleep_logs(baby_id, started_at DESC);
CREATE INDEX idx_sleep_logs_family ON sleep_logs(family_id);
CREATE INDEX idx_sleep_logs_active ON sleep_logs(baby_id) WHERE ended_at IS NULL;

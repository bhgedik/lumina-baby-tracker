-- Nodd: Growth measurements (weight, height, head circumference)
CREATE TABLE growth_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  measured_at TIMESTAMPTZ NOT NULL,
  weight_grams INTEGER,
  height_cm NUMERIC(5,2),
  head_circumference_cm NUMERIC(5,2),
  weight_percentile NUMERIC(5,2),
  height_percentile NUMERIC(5,2),
  head_percentile NUMERIC(5,2),
  chart_type TEXT NOT NULL DEFAULT 'who' CHECK (chart_type IN ('who', 'fenton')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_growth_logs_baby_time ON growth_logs(baby_id, measured_at DESC);

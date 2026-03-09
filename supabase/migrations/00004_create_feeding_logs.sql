-- Sprouty: Feeding logs (breast, bottle, solid, snack)
CREATE TABLE feeding_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('breast', 'bottle', 'solid', 'snack')),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  breast_side TEXT CHECK (breast_side IN ('left', 'right', 'both')),
  left_duration_seconds INTEGER,
  right_duration_seconds INTEGER,
  bottle_amount_ml NUMERIC(6,1),
  bottle_content TEXT CHECK (bottle_content IN ('breast_milk', 'formula', 'mixed', 'water', 'juice')),
  bottle_temperature TEXT CHECK (bottle_temperature IN ('warm', 'room', 'cold')),
  solid_foods JSONB,
  notes TEXT,
  baby_response TEXT CHECK (baby_response IN ('good', 'fussy', 'refused')),
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feeding_logs_baby_time ON feeding_logs(baby_id, started_at DESC);
CREATE INDEX idx_feeding_logs_family ON feeding_logs(family_id);
CREATE INDEX idx_feeding_logs_active_timer ON feeding_logs(baby_id) WHERE ended_at IS NULL;

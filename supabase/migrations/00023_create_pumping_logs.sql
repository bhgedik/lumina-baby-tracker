-- ============================================================
-- Pumping (expressing milk) logs
-- ============================================================

CREATE TABLE pumping_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  side TEXT NOT NULL CHECK (side IN ('left', 'right', 'both')) DEFAULT 'both',
  left_volume_ml NUMERIC(5,1),
  right_volume_ml NUMERIC(5,1),
  total_volume_ml NUMERIC(5,1) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pumping_logs_baby_time ON pumping_logs(baby_id, started_at DESC);
CREATE INDEX idx_pumping_logs_family ON pumping_logs(family_id);

-- RLS
ALTER TABLE pumping_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY pumping_logs_select ON pumping_logs
  FOR SELECT USING (family_id = get_user_family_id());

CREATE POLICY pumping_logs_insert ON pumping_logs
  FOR INSERT WITH CHECK (family_id = get_user_family_id());

CREATE POLICY pumping_logs_update ON pumping_logs
  FOR UPDATE USING (family_id = get_user_family_id());

CREATE POLICY pumping_logs_delete ON pumping_logs
  FOR DELETE USING (family_id = get_user_family_id());

-- Auto-update updated_at
CREATE TRIGGER set_pumping_logs_updated_at
  BEFORE UPDATE ON pumping_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

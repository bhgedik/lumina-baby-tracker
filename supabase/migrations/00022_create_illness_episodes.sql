-- ============================================================
-- Lumina — Illness Episodes + Health Log Linkage
-- ============================================================

-- ── illness_episodes table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS illness_episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  primary_symptoms TEXT[] NOT NULL DEFAULT '{}',
  diagnosis TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Link health_logs to episodes ────────────────────────────
ALTER TABLE health_logs ADD COLUMN IF NOT EXISTS episode_id UUID REFERENCES illness_episodes(id) ON DELETE SET NULL;

-- ── Update health_logs type constraint to include well_child_checkup ──
ALTER TABLE health_logs DROP CONSTRAINT IF EXISTS health_logs_type_check;
ALTER TABLE health_logs ADD CONSTRAINT health_logs_type_check
  CHECK (type IN ('temperature', 'medication', 'symptom', 'doctor_visit', 'er_visit', 'well_child_checkup', 'other'));

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_illness_episodes_baby_id ON illness_episodes(baby_id);
CREATE INDEX IF NOT EXISTS idx_illness_episodes_family_id ON illness_episodes(family_id);
CREATE INDEX IF NOT EXISTS idx_illness_episodes_status ON illness_episodes(status);
CREATE INDEX IF NOT EXISTS idx_health_logs_episode_id ON health_logs(episode_id);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE illness_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY illness_episodes_family_isolation ON illness_episodes
  FOR ALL
  USING (family_id = get_user_family_id())
  WITH CHECK (family_id = get_user_family_id());

-- ── Updated_at trigger ──────────────────────────────────────
CREATE TRIGGER set_illness_episodes_updated_at
  BEFORE UPDATE ON illness_episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

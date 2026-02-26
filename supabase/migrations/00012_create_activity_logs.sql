-- Nodd: Activity and play logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  started_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  category TEXT NOT NULL CHECK (category IN ('tummy_time', 'reading', 'music', 'sensory_play', 'motor_play', 'social_play', 'outdoor', 'bath', 'other')),
  activity_name TEXT NOT NULL,
  developmental_domains TEXT[] NOT NULL DEFAULT '{}',
  baby_response TEXT NOT NULL CHECK (baby_response IN ('loved_it', 'engaged', 'neutral', 'fussy', 'cried')),
  notes TEXT,
  linked_content_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_baby_time ON activity_logs(baby_id, started_at DESC);

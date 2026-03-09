-- Sprouty: AI-generated insights
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  target_profile_id UUID REFERENCES profiles(id),
  intervention_level TEXT NOT NULL CHECK (intervention_level IN ('passive', 'reactive', 'proactive', 'empathic')),
  lifecycle_stage TEXT NOT NULL CHECK (lifecycle_stage IN ('prenatal', 'fourth_trimester', 'transition', 'exploration', 'toddler')),
  category TEXT NOT NULL CHECK (category IN ('feeding', 'sleep', 'growth', 'milestone', 'health', 'wellness', 'general')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_items TEXT[],
  source_data JSONB NOT NULL DEFAULT '{}',
  confidence NUMERIC(3,2) CHECK (confidence BETWEEN 0 AND 1),
  priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'read', 'dismissed', 'acted_on')),
  user_rating TEXT CHECK (user_rating IN ('helpful', 'not_helpful')),
  user_feedback TEXT,
  expires_at TIMESTAMPTZ,
  triggered_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_family ON ai_insights(family_id, status, created_at DESC);
CREATE INDEX idx_ai_insights_baby ON ai_insights(baby_id, created_at DESC);
CREATE INDEX idx_ai_insights_priority ON ai_insights(family_id, priority, status) WHERE status = 'active';

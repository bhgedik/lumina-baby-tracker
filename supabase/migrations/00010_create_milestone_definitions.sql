-- Lumina: Milestone definitions (seed data from CDC/WHO)
-- These are system-level records, not user-created
CREATE TABLE milestone_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL CHECK (domain IN ('motor_gross', 'motor_fine', 'cognitive', 'language', 'social_emotional', 'sensory')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  expected_age_months_start NUMERIC(4,1) NOT NULL,
  expected_age_months_end NUMERIC(4,1) NOT NULL,
  concern_if_not_by_months NUMERIC(4,1) NOT NULL,
  lifecycle_stage TEXT NOT NULL CHECK (lifecycle_stage IN ('prenatal', 'fourth_trimester', 'transition', 'exploration', 'toddler')),
  order_in_stage SMALLINT NOT NULL,
  tips TEXT[] NOT NULL DEFAULT '{}',
  content_trigger_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_milestone_defs_stage ON milestone_definitions(lifecycle_stage);
CREATE INDEX idx_milestone_defs_age ON milestone_definitions(expected_age_months_start, expected_age_months_end);

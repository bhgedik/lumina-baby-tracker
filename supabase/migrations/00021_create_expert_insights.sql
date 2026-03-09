-- ============================================================
-- Migration 00021: Create expert_insights table + seed data
-- Global expert content — veteran pediatrician developmental nudges
-- Not family-scoped (no RLS needed — read-only public content)
-- ============================================================

CREATE TABLE expert_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('feeding', 'sleep', 'growth', 'milestone', 'health', 'wellness', 'motor', 'general')),
  trigger_age_min_days INT NOT NULL,
  trigger_age_max_days INT NOT NULL,
  trigger_condition JSONB NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'urgent')),
  source TEXT NOT NULL,
  action_items TEXT[],
  visual_guide JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for age-range lookups
CREATE INDEX idx_expert_insights_age ON expert_insights(trigger_age_min_days, trigger_age_max_days) WHERE is_active = TRUE;
CREATE INDEX idx_expert_insights_category ON expert_insights(category) WHERE is_active = TRUE;

-- ============================================================
-- Seed Data: 4 High-Value Developmental Nudges
-- ============================================================

-- 1. Bouncer vs. Floor Time (10–14 weeks)
INSERT INTO expert_insights (slug, title, body, category, trigger_age_min_days, trigger_age_max_days, trigger_condition, severity, source, action_items, visual_guide, display_order)
VALUES (
  'bouncer_vs_floor_time',
  'Floor Time Beats the Bouncer Right Now',
  E'Your little one is getting ready to discover their hands \u2014 it''s one of the most exciting milestones coming up! Bouncers are great for a break, but they keep baby''s arms tucked in, which can delay the ''reaching and grabbing'' milestone. Try swapping just 10\u201315 minutes of bouncer time for flat floor time on a play mat. You''ll be amazed how quickly those little arms start exploring!',
  'motor',
  70,
  98,
  '{"log_type": "activity", "activity_contains": "bouncer"}',
  'info',
  'AAP Motor Development Guidelines',
  ARRAY[
    'Swap 10-15 min of bouncer time for floor play after a feed',
    'Place a high-contrast toy just within arm''s reach — not too close, not too far',
    'Alternate between tummy time and back play on the mat'
  ],
  '{"type": "step_by_step", "steps": ["Lay baby on a flat play mat on their back after a feed — wait 10 min post-feed to avoid spit-up", "Place a high-contrast toy 6-8 inches from their hand — close enough to notice, far enough to reach for", "After 5 min, gently roll baby to tummy for supervised tummy time — alternate every few minutes"]}',
  1
);

-- 2. Tummy Time Alternative (2–6 weeks)
INSERT INTO expert_insights (slug, title, body, category, trigger_age_min_days, trigger_age_max_days, trigger_condition, severity, source, action_items, visual_guide, display_order)
VALUES (
  'tummy_time_chest_alternative',
  'Tummy Time Hack: Your Chest Counts!',
  E'If your baby screams the moment they hit the floor for tummy time \u2014 you''re not alone, and you''re not doing it wrong. Here''s a secret from the NICU: lying on your chest IS tummy time. Baby gets the same core strengthening and neck control practice, but with the comfort of your heartbeat and warmth. Start with 3\u20135 minutes after a feed when they''re calm and alert. As they get stronger, the floor won''t seem so scary.',
  'motor',
  14,
  42,
  '{"log_type": "activity", "activity_contains": "tummy"}',
  'info',
  'AAP Tummy Time Recommendations',
  ARRAY[
    'Recline at 45° and place baby chest-to-chest after a feed',
    'Start with 3-5 min sessions, 2-3 times per day',
    'Gradually lower your recline angle as baby gets stronger'
  ],
  '{"type": "step_by_step", "steps": ["Recline on a couch or bed at about 45° — not flat, so baby has to work slightly against gravity", "Place baby chest-to-chest, face turned to the side — talk or sing so they try to lift their head toward your voice", "Start with 3-5 minutes and gradually increase — when baby tolerates this well, try a rolled towel under their chest on the floor"]}',
  2
);

-- 3. Active Sleep vs. Waking (0–8 weeks)
INSERT INTO expert_insights (slug, title, body, category, trigger_age_min_days, trigger_age_max_days, trigger_condition, severity, source, action_items, display_order)
VALUES (
  'active_sleep_vs_waking',
  'Pause Before You Pick Up — Active Sleep Is Normal',
  E'Those nighttime grunts, squirms, and even little cries can be alarming \u2014 but your newborn might actually be in ''active sleep,'' not waking up. Newborns spend up to 50% of their sleep in this noisy REM phase where they process everything they learned that day. If you rush to pick them up, you might accidentally wake them from a sleep cycle they were going to settle back into. Try the ''10-second pause'' \u2014 wait and watch before intervening. If they escalate to a real cry, of course respond right away.',
  'sleep',
  0,
  56,
  '{"log_type": "sleep", "time_of_day": "night"}',
  'info',
  'AAP Infant Sleep Patterns',
  ARRAY[
    'Practice the 10-second pause when you hear nighttime sounds',
    'Watch for escalation — grunts and squirms are different from a cry',
    'Keep the room dim and quiet during the pause to avoid stimulating them'
  ],
  3
);

-- 4. Feeding & Jaw Fatigue (0–4 weeks)
INSERT INTO expert_insights (slug, title, body, category, trigger_age_min_days, trigger_age_max_days, trigger_condition, severity, source, action_items, display_order)
VALUES (
  'feeding_jaw_fatigue',
  'Marathon Feeds? Baby''s Jaw Might Be Tired',
  E'If feeds are stretching past 45 minutes and your baby keeps dozing off at the breast or bottle, they might not be eating anymore \u2014 they could be ''comfort sucking'' because their tiny jaw muscles are exhausted. Newborn jaws fatigue quickly, just like your arms would holding a heavy weight. This doesn''t mean your supply is low or that something is wrong. Try a gentle break: unlatch, do a quick diaper check or burp, and re-offer. A refreshed baby often feeds more efficiently in a shorter second round.',
  'feeding',
  0,
  28,
  '{"log_type": "feeding", "duration_gt_minutes": 45}',
  'info',
  'AAP Breastfeeding Guidelines / La Leche League',
  ARRAY[
    'If a feed exceeds 40 min, gently unlatch and burp',
    'Do a diaper check or brief skin-to-skin break',
    'Re-offer after 5 min — a rested jaw feeds more efficiently'
  ],
  4
);

-- ============================================================
-- Sprouty — Complete Schema DDL
-- Run this in Supabase SQL Editor on a fresh database.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  locale TEXT NOT NULL DEFAULT 'en-US',
  preferred_units TEXT NOT NULL DEFAULT 'metric' CHECK (preferred_units IN ('metric', 'imperial')),
  emergency_contacts JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_families_created_at ON families(created_at);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('primary', 'partner', 'caregiver')),
  experience_level TEXT NOT NULL DEFAULT 'first_time' CHECK (experience_level IN ('first_time', 'experienced')),
  delivery_method TEXT CHECK (delivery_method IN ('vaginal', 'c_section')),
  avatar_url TEXT,
  notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_family_id ON profiles(family_id);

CREATE TABLE babies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  due_date DATE,
  gestational_age_weeks SMALLINT CHECK (gestational_age_weeks BETWEEN 22 AND 42),
  gestational_age_days SMALLINT NOT NULL DEFAULT 0 CHECK (gestational_age_days BETWEEN 0 AND 6),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  blood_type TEXT,
  birth_weight_grams INTEGER,
  birth_length_cm NUMERIC(5,2),
  birth_head_circumference_cm NUMERIC(5,2),
  photo_url TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_multiple BOOLEAN NOT NULL DEFAULT FALSE,
  primary_feeding_method TEXT NOT NULL DEFAULT 'mixed' CHECK (primary_feeding_method IN ('breast_only', 'formula_only', 'mixed')),
  known_allergies TEXT[] NOT NULL DEFAULT '{}',
  chronic_conditions TEXT[] NOT NULL DEFAULT '{}',
  uses_adjusted_milestones BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_babies_family_id ON babies(family_id);
CREATE INDEX idx_babies_active ON babies(family_id, is_active) WHERE is_active = TRUE;

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
  sensitivity_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feeding_logs_baby_time ON feeding_logs(baby_id, started_at DESC);
CREATE INDEX idx_feeding_logs_family ON feeding_logs(family_id);
CREATE INDEX idx_feeding_logs_active_timer ON feeding_logs(baby_id) WHERE ended_at IS NULL;

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

CREATE TABLE diaper_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  logged_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('wet', 'dirty', 'both', 'dry')),
  stool_color TEXT,
  stool_consistency TEXT,
  has_rash BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_diaper_logs_baby_time ON diaper_logs(baby_id, logged_at DESC);
CREATE INDEX idx_diaper_logs_family ON diaper_logs(family_id);

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

CREATE TABLE health_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  logged_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('temperature', 'medication', 'symptom', 'doctor_visit', 'er_visit', 'other')),
  temperature_celsius NUMERIC(4,1),
  temperature_method TEXT CHECK (temperature_method IN ('rectal', 'axillary', 'ear', 'forehead')),
  medication_name TEXT,
  medication_dose TEXT,
  symptoms TEXT[],
  doctor_name TEXT,
  diagnosis TEXT,
  notes TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_logs_baby_time ON health_logs(baby_id, logged_at DESC);
CREATE INDEX idx_health_logs_type ON health_logs(baby_id, type);

CREATE TABLE vaccinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  dose_number SMALLINT NOT NULL,
  scheduled_date DATE NOT NULL,
  administered_date DATE,
  administered_by TEXT,
  lot_number TEXT,
  side_effects TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vaccinations_baby ON vaccinations(baby_id);
CREATE INDEX idx_vaccinations_scheduled ON vaccinations(baby_id, scheduled_date);
CREATE UNIQUE INDEX idx_vaccinations_unique ON vaccinations(baby_id, vaccine_name, dose_number);

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

CREATE TABLE milestone_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  milestone_definition_id UUID NOT NULL REFERENCES milestone_definitions(id),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'emerging', 'achieved')),
  achieved_date DATE,
  notes TEXT,
  evidence_urls TEXT[],
  logged_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_milestone_records_unique ON milestone_records(baby_id, milestone_definition_id);
CREATE INDEX idx_milestone_records_baby ON milestone_records(baby_id, status);

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
  source_data JSONB NOT NULL DEFAULT '{}'::jsonb,
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

CREATE TABLE content_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('article', 'activity', 'product', 'video', 'checklist')),
  title TEXT NOT NULL,
  subtitle TEXT,
  body TEXT NOT NULL,
  thumbnail_url TEXT,
  target_lifecycle_stages TEXT[] NOT NULL DEFAULT '{}',
  target_age_months_start NUMERIC(4,1) NOT NULL DEFAULT 0,
  target_age_months_end NUMERIC(4,1) NOT NULL DEFAULT 36,
  developmental_domains TEXT[] NOT NULL DEFAULT '{}',
  triggered_by_milestone_ids UUID[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  source TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_library_stage ON content_library USING GIN(target_lifecycle_stages);
CREATE INDEX idx_content_library_tags ON content_library USING GIN(tags);
CREATE INDEX idx_content_library_milestones ON content_library USING GIN(triggered_by_milestone_ids);
CREATE INDEX idx_content_library_age ON content_library(target_age_months_start, target_age_months_end);

-- RLS Policies
CREATE OR REPLACE FUNCTION get_user_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own family" ON families FOR SELECT USING (id = get_user_family_id());
CREATE POLICY "Users can update their own family" ON families FOR UPDATE USING (id = get_user_family_id());

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view family members" ON profiles FOR SELECT USING (family_id = get_user_family_id());
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON babies FOR ALL USING (family_id = get_user_family_id()) WITH CHECK (family_id = get_user_family_id());

ALTER TABLE feeding_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON feeding_logs FOR ALL USING (family_id = get_user_family_id()) WITH CHECK (family_id = get_user_family_id());

ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON sleep_logs FOR ALL USING (family_id = get_user_family_id()) WITH CHECK (family_id = get_user_family_id());

ALTER TABLE diaper_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON diaper_logs FOR ALL USING (family_id = get_user_family_id()) WITH CHECK (family_id = get_user_family_id());

ALTER TABLE growth_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON growth_logs FOR ALL USING (family_id = get_user_family_id()) WITH CHECK (family_id = get_user_family_id());

ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON health_logs FOR ALL USING (family_id = get_user_family_id()) WITH CHECK (family_id = get_user_family_id());

ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON vaccinations FOR ALL USING (family_id = get_user_family_id()) WITH CHECK (family_id = get_user_family_id());

ALTER TABLE milestone_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read milestone definitions" ON milestone_definitions FOR SELECT USING (true);

ALTER TABLE milestone_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON milestone_records FOR ALL USING (family_id = get_user_family_id()) WITH CHECK (family_id = get_user_family_id());

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON activity_logs FOR ALL USING (family_id = get_user_family_id()) WITH CHECK (family_id = get_user_family_id());

ALTER TABLE wellness_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON wellness_logs FOR ALL USING (family_id = get_user_family_id()) WITH CHECK (family_id = get_user_family_id());
CREATE POLICY "private_wellness_owner_only" ON wellness_logs FOR SELECT USING ((is_private = FALSE AND family_id = get_user_family_id()) OR profile_id = auth.uid());

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON ai_insights FOR ALL USING (family_id = get_user_family_id()) WITH CHECK (family_id = get_user_family_id());

ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read content" ON content_library FOR SELECT USING (true);

-- Functions
CREATE OR REPLACE FUNCTION corrected_age_days(p_baby_id UUID, p_ref_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(chronological_days INTEGER, corrected_days INTEGER, adjustment_days INTEGER, is_preterm BOOLEAN, use_corrected BOOLEAN) AS $$
DECLARE
  b RECORD;
  gest_total_days INTEGER;
  full_term_days INTEGER := 280;
  adj INTEGER;
  chrono INTEGER;
  corr INTEGER;
BEGIN
  SELECT * INTO b FROM babies WHERE babies.id = p_baby_id;
  chrono := p_ref_date - b.date_of_birth;
  adj := 0;
  IF b.gestational_age_weeks IS NOT NULL AND b.gestational_age_weeks < 37 THEN
    gest_total_days := (b.gestational_age_weeks * 7) + b.gestational_age_days;
    adj := full_term_days - gest_total_days;
    corr := GREATEST(chrono - adj, 0);
    RETURN QUERY SELECT chrono, corr, adj, TRUE, (corr < 730);
  ELSE
    RETURN QUERY SELECT chrono, chrono, 0, FALSE, FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY['families','profiles','babies','feeding_logs','sleep_logs','diaper_logs','growth_logs','health_logs','vaccinations','milestone_records','activity_logs','wellness_logs','ai_insights','content_library'])
  LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO families (id, name) VALUES (NEW.id, 'My Family');
  INSERT INTO profiles (id, family_id, email, display_name)
  VALUES (NEW.id, NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Event Triggers
CREATE OR REPLACE FUNCTION notify_log_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('log_inserted', json_build_object('table', TG_TABLE_NAME, 'baby_id', NEW.baby_id, 'family_id', NEW.family_id, 'id', NEW.id)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY['feeding_logs','sleep_logs','diaper_logs','growth_logs','health_logs','activity_logs'])
  LOOP
    EXECUTE format('CREATE TRIGGER notify_on_insert AFTER INSERT ON %I FOR EACH ROW EXECUTE FUNCTION notify_log_insert()', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION notify_milestone_achieved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'achieved' AND (OLD IS NULL OR OLD.status != 'achieved') THEN
    PERFORM pg_notify('milestone_achieved', json_build_object('baby_id', NEW.baby_id, 'family_id', NEW.family_id, 'milestone_definition_id', NEW.milestone_definition_id, 'achieved_date', NEW.achieved_date)::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_milestone_achieved
  AFTER INSERT OR UPDATE ON milestone_records
  FOR EACH ROW EXECUTE FUNCTION notify_milestone_achieved();

CREATE OR REPLACE FUNCTION notify_epds_submitted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'epds' THEN
    PERFORM pg_notify('epds_submitted', json_build_object('profile_id', NEW.profile_id, 'family_id', NEW.family_id, 'epds_score', NEW.epds_score)::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_epds
  AFTER INSERT ON wellness_logs
  FOR EACH ROW EXECUTE FUNCTION notify_epds_submitted();

-- Invite Codes
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'partner' CHECK (role IN ('partner', 'caregiver')),
  redeemed_by UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invite_codes_code ON invite_codes(code) WHERE redeemed_by IS NULL;
CREATE INDEX idx_invite_codes_family ON invite_codes(family_id);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_view_invite_codes" ON invite_codes FOR SELECT USING (family_id = get_user_family_id());
CREATE POLICY "family_insert_invite_codes" ON invite_codes FOR INSERT WITH CHECK (family_id = get_user_family_id() AND created_by = auth.uid());
CREATE POLICY "lookup_unredeemed_invite_codes" ON invite_codes FOR SELECT USING (auth.uid() IS NOT NULL AND redeemed_by IS NULL AND expires_at > NOW());

CREATE OR REPLACE FUNCTION redeem_invite_code(p_code TEXT, p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_invite RECORD;
  v_old_family_id UUID;
BEGIN
  SELECT * INTO v_invite FROM invite_codes WHERE code = UPPER(p_code) AND redeemed_by IS NULL AND expires_at > NOW() FOR UPDATE;
  IF v_invite IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invite code');
  END IF;
  SELECT family_id INTO v_old_family_id FROM profiles WHERE id = p_user_id;
  UPDATE profiles SET family_id = v_invite.family_id, role = v_invite.role, updated_at = NOW() WHERE id = p_user_id;
  UPDATE invite_codes SET redeemed_by = p_user_id, redeemed_at = NOW() WHERE id = v_invite.id;
  IF v_old_family_id IS NOT NULL AND v_old_family_id != v_invite.family_id THEN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE family_id = v_old_family_id AND id != p_user_id) THEN
      DELETE FROM families WHERE id = v_old_family_id;
    END IF;
  END IF;
  RETURN json_build_object('success', true, 'family_id', v_invite.family_id, 'role', v_invite.role);
END;
$$;

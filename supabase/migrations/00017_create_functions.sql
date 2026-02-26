-- Nodd: Database functions

-- Corrected age calculation (server-side)
CREATE OR REPLACE FUNCTION corrected_age_days(p_baby_id UUID, p_ref_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  chronological_days INTEGER,
  corrected_days INTEGER,
  adjustment_days INTEGER,
  is_preterm BOOLEAN,
  use_corrected BOOLEAN
) AS $$
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

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'families', 'profiles', 'babies', 'feeding_logs', 'sleep_logs',
      'diaper_logs', 'growth_logs', 'health_logs', 'vaccinations',
      'milestone_records', 'activity_logs', 'wellness_logs', 'ai_insights',
      'content_library'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t
    );
  END LOOP;
END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a new family for the user
  INSERT INTO families (id, name) VALUES (NEW.id, 'My Family');
  -- Create their profile
  INSERT INTO profiles (id, family_id, email, display_name)
  VALUES (NEW.id, NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

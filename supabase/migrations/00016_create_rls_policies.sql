-- Lumina: Row Level Security Policies
-- Security boundary: family_id isolation via get_user_family_id()

-- Helper function: get user's family_id from their profile
CREATE OR REPLACE FUNCTION get_user_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── FAMILIES ───
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own family" ON families
  FOR SELECT USING (id = get_user_family_id());
CREATE POLICY "Users can update their own family" ON families
  FOR UPDATE USING (id = get_user_family_id());

-- ─── PROFILES ───
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view family members" ON profiles
  FOR SELECT USING (family_id = get_user_family_id());
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ─── BABIES ───
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON babies
  FOR ALL USING (family_id = get_user_family_id())
  WITH CHECK (family_id = get_user_family_id());

-- ─── FEEDING LOGS ───
ALTER TABLE feeding_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON feeding_logs
  FOR ALL USING (family_id = get_user_family_id())
  WITH CHECK (family_id = get_user_family_id());

-- ─── SLEEP LOGS ───
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON sleep_logs
  FOR ALL USING (family_id = get_user_family_id())
  WITH CHECK (family_id = get_user_family_id());

-- ─── DIAPER LOGS ───
ALTER TABLE diaper_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON diaper_logs
  FOR ALL USING (family_id = get_user_family_id())
  WITH CHECK (family_id = get_user_family_id());

-- ─── GROWTH LOGS ───
ALTER TABLE growth_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON growth_logs
  FOR ALL USING (family_id = get_user_family_id())
  WITH CHECK (family_id = get_user_family_id());

-- ─── HEALTH LOGS ───
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON health_logs
  FOR ALL USING (family_id = get_user_family_id())
  WITH CHECK (family_id = get_user_family_id());

-- ─── VACCINATIONS ───
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON vaccinations
  FOR ALL USING (family_id = get_user_family_id())
  WITH CHECK (family_id = get_user_family_id());

-- ─── MILESTONE DEFINITIONS (public read) ───
ALTER TABLE milestone_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read milestone definitions" ON milestone_definitions
  FOR SELECT USING (true);

-- ─── MILESTONE RECORDS ───
ALTER TABLE milestone_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON milestone_records
  FOR ALL USING (family_id = get_user_family_id())
  WITH CHECK (family_id = get_user_family_id());

-- ─── ACTIVITY LOGS ───
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON activity_logs
  FOR ALL USING (family_id = get_user_family_id())
  WITH CHECK (family_id = get_user_family_id());

-- ─── WELLNESS LOGS ───
ALTER TABLE wellness_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON wellness_logs
  FOR ALL USING (family_id = get_user_family_id())
  WITH CHECK (family_id = get_user_family_id());
-- Additional policy: private wellness logs only visible to owner
CREATE POLICY "private_wellness_owner_only" ON wellness_logs
  FOR SELECT USING (
    (is_private = FALSE AND family_id = get_user_family_id())
    OR profile_id = auth.uid()
  );

-- ─── AI INSIGHTS ───
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_isolation" ON ai_insights
  FOR ALL USING (family_id = get_user_family_id())
  WITH CHECK (family_id = get_user_family_id());

-- ─── CONTENT LIBRARY (public read) ───
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read content" ON content_library
  FOR SELECT USING (true);

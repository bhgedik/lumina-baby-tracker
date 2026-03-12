-- Lumina: Caregiver profiles (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('primary', 'partner', 'caregiver')),
  experience_level TEXT NOT NULL DEFAULT 'first_time' CHECK (experience_level IN ('first_time', 'experienced')),
  delivery_method TEXT CHECK (delivery_method IN ('vaginal', 'c_section')),
  avatar_url TEXT,
  notification_preferences JSONB NOT NULL DEFAULT '{"feeding_reminders":true,"milestone_alerts":true,"ai_insights":true,"wellness_checkins":true,"quiet_hours_start":"22:00","quiet_hours_end":"07:00"}',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_family_id ON profiles(family_id);

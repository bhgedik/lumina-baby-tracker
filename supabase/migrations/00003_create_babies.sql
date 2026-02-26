-- Nodd: Baby profiles
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

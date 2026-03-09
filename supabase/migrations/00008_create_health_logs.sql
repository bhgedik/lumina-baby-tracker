-- Sprouty: Health logs (temperature, medication, symptoms, doctor visits)
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

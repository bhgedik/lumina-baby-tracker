-- Nodd: Family table
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

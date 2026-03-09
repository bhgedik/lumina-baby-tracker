-- Sprouty: Content library (articles, activities, checklists, etc.)
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

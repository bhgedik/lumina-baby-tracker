-- Sprouty: Event triggers for milestone checks and AI pipeline

-- Notify on feeding log insert (for milestone/intervention checks)
CREATE OR REPLACE FUNCTION notify_log_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('log_inserted', json_build_object(
    'table', TG_TABLE_NAME,
    'baby_id', NEW.baby_id,
    'family_id', NEW.family_id,
    'id', NEW.id
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply notification trigger to all log tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'feeding_logs', 'sleep_logs', 'diaper_logs',
      'growth_logs', 'health_logs', 'activity_logs'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER notify_on_insert AFTER INSERT ON %I FOR EACH ROW EXECUTE FUNCTION notify_log_insert()',
      t
    );
  END LOOP;
END $$;

-- Notify on milestone achievement
CREATE OR REPLACE FUNCTION notify_milestone_achieved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'achieved' AND (OLD IS NULL OR OLD.status != 'achieved') THEN
    PERFORM pg_notify('milestone_achieved', json_build_object(
      'baby_id', NEW.baby_id,
      'family_id', NEW.family_id,
      'milestone_definition_id', NEW.milestone_definition_id,
      'achieved_date', NEW.achieved_date
    )::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_milestone_achieved
  AFTER INSERT OR UPDATE ON milestone_records
  FOR EACH ROW EXECUTE FUNCTION notify_milestone_achieved();

-- Notify on EPDS submission for burnout detection
CREATE OR REPLACE FUNCTION notify_epds_submitted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'epds' THEN
    PERFORM pg_notify('epds_submitted', json_build_object(
      'profile_id', NEW.profile_id,
      'family_id', NEW.family_id,
      'epds_score', NEW.epds_score
    )::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_epds
  AFTER INSERT ON wellness_logs
  FOR EACH ROW EXECUTE FUNCTION notify_epds_submitted();

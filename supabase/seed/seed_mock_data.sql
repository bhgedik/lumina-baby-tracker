-- ============================================================
-- Lumina — Realistic 5-Week Mock Data Seed
-- Baby: Ece, born 35 days ago, breastfed
-- Mother: Buse, first-time, vaginal delivery
-- Logging: 75% consistency (25% sparse/blank days)
--
-- Usage:
--   psql "$DATABASE_URL" -f seed_mock_data.sql
--   OR paste into Supabase SQL Editor and run
--
-- Idempotent: safe to run multiple times (cleans previous seed)
-- ============================================================

-- Disable triggers to avoid auto-profile conflicts
SET session_replication_role = 'replica';
SET timezone = 'Europe/Istanbul';

DO $$
DECLARE
  -- ── Deterministic seed UUIDs ──
  c_family_id  CONSTANT UUID := 'a1b2c3d4-0000-0000-0000-000000000001';
  c_user_id    CONSTANT UUID := 'a1b2c3d4-0000-0000-0000-000000000002';
  c_baby_id    CONSTANT UUID := 'a1b2c3d4-0000-0000-0000-000000000003';

  c_birth_date CONSTANT DATE := CURRENT_DATE - 35;

  -- ── Loop variables ──
  v_day          INTEGER;
  v_day_date     DATE;
  v_is_full      BOOLEAN;
  v_feed_count   INTEGER;
  v_diaper_count INTEGER;
  v_nap_count    INTEGER;
  v_hour         INTEGER;
  v_min          INTEGER;
  v_ts           TIMESTAMPTZ;
  v_dur          INTEGER;
  v_side         TEXT;
  v_type         TEXT;
  v_rand         FLOAT;
  v_left_dur     INTEGER;
  v_right_dur    INTEGER;
  v_split        INTEGER;
  i              INTEGER;

BEGIN
  -- ════════════════════════════════════════════════════════════
  -- CLEANUP — remove previous seed data
  -- ════════════════════════════════════════════════════════════

  DELETE FROM growth_logs     WHERE family_id = c_family_id;
  DELETE FROM diaper_logs     WHERE family_id = c_family_id;
  DELETE FROM sleep_logs      WHERE family_id = c_family_id;
  DELETE FROM feeding_logs    WHERE family_id = c_family_id;
  DELETE FROM health_logs     WHERE family_id = c_family_id;
  DELETE FROM activity_logs   WHERE family_id = c_family_id;
  DELETE FROM milestone_records WHERE family_id = c_family_id;
  DELETE FROM vaccinations    WHERE family_id = c_family_id;
  DELETE FROM ai_insights     WHERE family_id = c_family_id;
  DELETE FROM babies          WHERE family_id = c_family_id;
  DELETE FROM invite_codes    WHERE family_id = c_family_id;
  DELETE FROM profiles        WHERE family_id = c_family_id;
  DELETE FROM families        WHERE id = c_family_id;
  DELETE FROM auth.identities WHERE user_id = c_user_id;
  DELETE FROM auth.users      WHERE id = c_user_id;

  -- ════════════════════════════════════════════════════════════
  -- FOUNDATION — family, auth user, profile, baby
  -- ════════════════════════════════════════════════════════════

  INSERT INTO families (id, name, timezone, locale, preferred_units)
  VALUES (c_family_id, 'Seed Family', 'Europe/Istanbul', 'tr-TR', 'metric');

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    c_user_id,
    'authenticated', 'authenticated',
    'seed@lumina.app',
    -- bcrypt hash placeholder (not for real auth, just seed data)
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Buse"}'::jsonb,
    FALSE, ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), c_user_id, c_user_id::TEXT,
    jsonb_build_object('sub', c_user_id::TEXT, 'email', 'seed@lumina.app'),
    'email', NOW(), NOW(), NOW()
  );

  INSERT INTO profiles (
    id, family_id, email, display_name, role,
    experience_level, delivery_method, onboarding_completed
  ) VALUES (
    c_user_id, c_family_id, 'seed@lumina.app', 'Buse',
    'primary', 'first_time', 'vaginal', TRUE
  );

  -- Baby — full-term girl, breastfed, born 35 days ago
  INSERT INTO babies (
    id, family_id, name, date_of_birth, gender,
    birth_weight_grams, birth_length_cm, birth_head_circumference_cm,
    primary_feeding_method, is_active
  ) VALUES (
    c_baby_id, c_family_id, 'Ece', c_birth_date, 'female',
    3250, 50.0, 34.5,
    'breast_only', TRUE
  );

  -- ════════════════════════════════════════════════════════════
  -- GROWTH LOGS — 2 data points only
  -- ════════════════════════════════════════════════════════════

  -- Birth measurement
  INSERT INTO growth_logs (
    baby_id, family_id, logged_by, measured_at,
    weight_grams, height_cm, head_circumference_cm, chart_type
  ) VALUES (
    c_baby_id, c_family_id, c_user_id,
    c_birth_date::TIMESTAMPTZ + INTERVAL '2 hours',
    3250, 50.0, 34.5, 'who'
  );

  -- 1-month checkup (day 30)
  IF c_birth_date + 30 <= CURRENT_DATE THEN
    INSERT INTO growth_logs (
      baby_id, family_id, logged_by, measured_at,
      weight_grams, height_cm, head_circumference_cm,
      chart_type, notes
    ) VALUES (
      c_baby_id, c_family_id, c_user_id,
      (c_birth_date + 30)::TIMESTAMPTZ + INTERVAL '10 hours',
      4100, 53.5, 36.0, 'who',
      '1-month checkup — healthy, gaining well'
    );
  END IF;

  -- ════════════════════════════════════════════════════════════
  -- DAILY LOGS — 35 days with 75% consistency
  -- ════════════════════════════════════════════════════════════

  FOR v_day IN 0..34 LOOP
    v_day_date := c_birth_date + v_day;

    -- Safety: never generate future data
    IF v_day_date > CURRENT_DATE THEN
      EXIT;
    END IF;

    -- ── Consistency dice ──
    -- 75% full day, ~12.5% sparse, ~12.5% blank
    v_rand := random();
    IF v_rand > 0.75 THEN
      IF random() < 0.5 THEN
        CONTINUE;  -- blank day (mother forgot to log)
      END IF;
      v_is_full := FALSE;  -- sparse day (1-3 entries per category)
    ELSE
      v_is_full := TRUE;   -- full logging day
    END IF;

    -- ──────────────────────────────────────────────────────────
    -- FEEDING LOGS
    -- Week 1: 10-12 feeds (newborn chaos)
    -- Week 2-3: 8-10 feeds (settling)
    -- Week 4-5: 7-9 feeds (more predictable)
    -- ──────────────────────────────────────────────────────────

    IF v_day < 7 THEN
      v_feed_count := CASE WHEN v_is_full
        THEN 10 + floor(random() * 3)::INT
        ELSE 2 + floor(random() * 2)::INT END;
    ELSIF v_day < 21 THEN
      v_feed_count := CASE WHEN v_is_full
        THEN 8 + floor(random() * 3)::INT
        ELSE 2 + floor(random() * 2)::INT END;
    ELSE
      v_feed_count := CASE WHEN v_is_full
        THEN 7 + floor(random() * 3)::INT
        ELSE 1 + floor(random() * 2)::INT END;
    END IF;

    FOR i IN 1..v_feed_count LOOP
      -- Spread feeds evenly across 24h with jitter
      v_hour := floor(
        (i - 1) * (24.0 / v_feed_count)
        + random() * (24.0 / v_feed_count * 0.6)
      )::INT;
      IF v_hour > 23 THEN v_hour := 23; END IF;
      v_min := floor(random() * 50)::INT;
      v_ts := v_day_date::TIMESTAMPTZ
            + make_interval(hours => v_hour, mins => v_min);

      -- Duration: 10-30 minutes (600-1800 seconds)
      v_dur := 600 + floor(random() * 1200)::INT;

      -- Side selection: 30% left, 30% right, 40% both
      v_rand := random();
      IF v_rand < 0.30 THEN
        v_side := 'left';
        v_left_dur := v_dur;
        v_right_dur := 0;
      ELSIF v_rand < 0.60 THEN
        v_side := 'right';
        v_left_dur := 0;
        v_right_dur := v_dur;
      ELSE
        v_side := 'both';
        v_split := floor(v_dur * (0.4 + random() * 0.2))::INT;
        v_left_dur := v_split;
        v_right_dur := v_dur - v_split;
      END IF;

      -- Baby response: 75% good, 25% fussy
      v_rand := random();
      IF v_rand < 0.75 THEN
        v_type := 'good';
      ELSE
        v_type := 'fussy';
      END IF;

      INSERT INTO feeding_logs (
        baby_id, family_id, logged_by, type,
        started_at, ended_at, breast_side,
        left_duration_seconds, right_duration_seconds,
        baby_response, created_at
      ) VALUES (
        c_baby_id, c_family_id, c_user_id, 'breast',
        v_ts,
        v_ts + make_interval(secs => v_dur),
        v_side, v_left_dur, v_right_dur,
        v_type, v_ts
      );
    END LOOP;

    -- ──────────────────────────────────────────────────────────
    -- SLEEP LOGS
    -- Night: 2 longer blocks (20:00-05:00)
    -- Day: 2-5 short naps (08:00-18:00)
    -- ──────────────────────────────────────────────────────────

    -- Night sleep block 1 (start 20:00-23:00)
    IF v_is_full OR random() < 0.6 THEN
      v_hour := 20 + floor(random() * 3)::INT;
      v_min := floor(random() * 40)::INT;
      v_ts := v_day_date::TIMESTAMPTZ
            + make_interval(hours => v_hour, mins => v_min);

      -- Duration: longer stretches as baby ages
      IF v_day < 14 THEN
        v_dur := 90 + floor(random() * 90)::INT;   -- 1.5-3h (newborn)
      ELSE
        v_dur := 120 + floor(random() * 120)::INT;  -- 2-4h (older)
      END IF;

      INSERT INTO sleep_logs (
        baby_id, family_id, logged_by, type,
        started_at, ended_at, duration_minutes,
        quality, night_wakings, created_at
      ) VALUES (
        c_baby_id, c_family_id, c_user_id, 'night',
        v_ts, v_ts + make_interval(mins => v_dur), v_dur,
        3 + floor(random() * 3)::INT,
        floor(random() * 3)::INT,
        v_ts
      );

      -- Night sleep block 2 (after feed gap)
      v_ts := v_ts + make_interval(mins => v_dur + 20 + floor(random() * 30)::INT);
      v_dur := 60 + floor(random() * 120)::INT;

      INSERT INTO sleep_logs (
        baby_id, family_id, logged_by, type,
        started_at, ended_at, duration_minutes,
        quality, night_wakings, created_at
      ) VALUES (
        c_baby_id, c_family_id, c_user_id, 'night',
        v_ts, v_ts + make_interval(mins => v_dur), v_dur,
        2 + floor(random() * 4)::INT,
        floor(random() * 2)::INT,
        v_ts
      );
    END IF;

    -- Daytime naps
    IF v_is_full THEN
      IF v_day < 14 THEN
        v_nap_count := 3 + floor(random() * 3)::INT;  -- 3-5 naps (newborn)
      ELSE
        v_nap_count := 2 + floor(random() * 3)::INT;  -- 2-4 naps (older)
      END IF;

      FOR i IN 1..v_nap_count LOOP
        v_hour := 8 + floor(random() * 10)::INT;  -- 08:00-17:59
        v_min := floor(random() * 50)::INT;
        v_ts := v_day_date::TIMESTAMPTZ
              + make_interval(hours => v_hour, mins => v_min);

        -- Nap duration: 20-100 minutes
        v_dur := 20 + floor(random() * 80)::INT;

        INSERT INTO sleep_logs (
          baby_id, family_id, logged_by, type,
          started_at, ended_at, duration_minutes,
          quality, created_at
        ) VALUES (
          c_baby_id, c_family_id, c_user_id, 'nap',
          v_ts, v_ts + make_interval(mins => v_dur), v_dur,
          2 + floor(random() * 4)::INT,
          v_ts
        );
      END LOOP;
    END IF;

    -- ──────────────────────────────────────────────────────────
    -- DIAPER LOGS
    -- Week 1: 8-11 changes (frequent newborn output)
    -- Week 2-3: 6-8 changes
    -- Week 4-5: 6-7 changes
    -- ──────────────────────────────────────────────────────────

    IF v_day < 7 THEN
      v_diaper_count := CASE WHEN v_is_full
        THEN 8 + floor(random() * 4)::INT
        ELSE 1 + floor(random() * 2)::INT END;
    ELSIF v_day < 21 THEN
      v_diaper_count := CASE WHEN v_is_full
        THEN 6 + floor(random() * 3)::INT
        ELSE 1 + floor(random() * 2)::INT END;
    ELSE
      v_diaper_count := CASE WHEN v_is_full
        THEN 6 + floor(random() * 2)::INT
        ELSE 1 + floor(random() * 2)::INT END;
    END IF;

    FOR i IN 1..v_diaper_count LOOP
      v_hour := floor(
        (i - 1) * (24.0 / v_diaper_count)
        + random() * (24.0 / v_diaper_count * 0.6)
      )::INT;
      IF v_hour > 23 THEN v_hour := 23; END IF;
      v_min := floor(random() * 50)::INT;
      v_ts := v_day_date::TIMESTAMPTZ
            + make_interval(hours => v_hour, mins => v_min);

      -- Type distribution: 40% wet, 25% dirty, 30% both, 5% dry
      v_rand := random();
      IF v_rand < 0.40 THEN
        v_type := 'wet';
      ELSIF v_rand < 0.65 THEN
        v_type := 'dirty';
      ELSIF v_rand < 0.95 THEN
        v_type := 'both';
      ELSE
        v_type := 'dry';
      END IF;

      INSERT INTO diaper_logs (
        baby_id, family_id, logged_by, logged_at, type,
        stool_color, stool_consistency, has_rash, created_at
      ) VALUES (
        c_baby_id, c_family_id, c_user_id, v_ts, v_type,
        -- Stool color only for dirty/both (breastfed = yellow/mustard)
        CASE WHEN v_type IN ('dirty', 'both') THEN
          (ARRAY['yellow','yellow','mustard','mustard','green'])[1 + floor(random() * 5)::INT]
        ELSE NULL END,
        -- Stool consistency only for dirty/both
        CASE WHEN v_type IN ('dirty', 'both') THEN
          (ARRAY['seedy','seedy','soft','pasty'])[1 + floor(random() * 4)::INT]
        ELSE NULL END,
        -- 5% chance of mild rash
        random() < 0.05,
        v_ts
      );
    END LOOP;

  END LOOP;  -- end 35-day loop

  -- ════════════════════════════════════════════════════════════
  -- SUMMARY
  -- ════════════════════════════════════════════════════════════

  RAISE NOTICE '────────────────────────────────────────';
  RAISE NOTICE 'Seed complete!';
  RAISE NOTICE 'Family:  % (Seed Family)', c_family_id;
  RAISE NOTICE 'User:    % (Buse)', c_user_id;
  RAISE NOTICE 'Baby:    % (Ece, born %)', c_baby_id, c_birth_date;
  RAISE NOTICE 'Feeding: % rows', (SELECT count(*) FROM feeding_logs WHERE family_id = c_family_id);
  RAISE NOTICE 'Sleep:   % rows', (SELECT count(*) FROM sleep_logs WHERE family_id = c_family_id);
  RAISE NOTICE 'Diaper:  % rows', (SELECT count(*) FROM diaper_logs WHERE family_id = c_family_id);
  RAISE NOTICE 'Growth:  % rows', (SELECT count(*) FROM growth_logs WHERE family_id = c_family_id);
  RAISE NOTICE '────────────────────────────────────────';

END;
$$;

-- Re-enable triggers
SET session_replication_role = 'origin';

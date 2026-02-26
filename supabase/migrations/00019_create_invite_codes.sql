-- ============================================================
-- Sprout — Invite Codes
-- Partner/caregiver invite system with 6-char codes
-- ============================================================

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

-- Index for fast code lookups (only unredeemed)
CREATE INDEX idx_invite_codes_code ON invite_codes(code) WHERE redeemed_by IS NULL;

-- Index for family lookups
CREATE INDEX idx_invite_codes_family ON invite_codes(family_id);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Family members can see their own invites
CREATE POLICY "family_view_invite_codes" ON invite_codes
  FOR SELECT USING (family_id = get_user_family_id());

-- Family members can create invites
CREATE POLICY "family_insert_invite_codes" ON invite_codes
  FOR INSERT WITH CHECK (
    family_id = get_user_family_id()
    AND created_by = auth.uid()
  );

-- Any authenticated user can look up unredeemed, unexpired codes
CREATE POLICY "lookup_unredeemed_invite_codes" ON invite_codes
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND redeemed_by IS NULL
    AND expires_at > NOW()
  );

-- ============================================================
-- Redeem invite code (SECURITY DEFINER — runs with elevated privileges)
-- Validates code, joins user to the invite's family, cleans up
-- the auto-created empty family from handle_new_user() trigger.
-- ============================================================
CREATE OR REPLACE FUNCTION redeem_invite_code(p_code TEXT, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_old_family_id UUID;
BEGIN
  -- Find and lock the invite code
  SELECT * INTO v_invite
  FROM invite_codes
  WHERE code = UPPER(p_code)
    AND redeemed_by IS NULL
    AND expires_at > NOW()
  FOR UPDATE;

  IF v_invite IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invite code');
  END IF;

  -- Get the user's current (auto-created) family before reassigning
  SELECT family_id INTO v_old_family_id
  FROM profiles
  WHERE id = p_user_id;

  -- Move user to the inviter's family
  UPDATE profiles
  SET family_id = v_invite.family_id,
      role = v_invite.role,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Mark invite as redeemed
  UPDATE invite_codes
  SET redeemed_by = p_user_id,
      redeemed_at = NOW()
  WHERE id = v_invite.id;

  -- Clean up the auto-created empty family (if no other members)
  IF v_old_family_id IS NOT NULL AND v_old_family_id != v_invite.family_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles WHERE family_id = v_old_family_id AND id != p_user_id
    ) THEN
      DELETE FROM families WHERE id = v_old_family_id;
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'family_id', v_invite.family_id,
    'role', v_invite.role
  );
END;
$$;

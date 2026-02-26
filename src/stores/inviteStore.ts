// ============================================================
// Sprout — Invite Store (Zustand)
// Partner/caregiver invite code generation & redemption
// Online-only — requires Supabase
// ============================================================

import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../data/supabase/client';
import type { UUID } from '../shared/types/common';

interface InviteState {
  inviteCode: string | null;
  expiresAt: string | null;
  isGenerating: boolean;
  isRedeeming: boolean;
  error: string | null;

  generateCode: (familyId: UUID, userId: UUID) => Promise<void>;
  redeemCode: (code: string, userId: UUID) => Promise<{ success: boolean; familyId?: string; error?: string }>;
  fetchExistingCode: (familyId: UUID) => Promise<void>;
  clearError: () => void;
}

// Generate 6-char alphanumeric code (no ambiguous chars: I/1/O/0)
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const useInviteStore = create<InviteState>((set) => ({
  inviteCode: null,
  expiresAt: null,
  isGenerating: false,
  isRedeeming: false,
  error: null,

  generateCode: async (familyId: UUID, userId: UUID) => {
    if (!isSupabaseConfigured) {
      set({ error: 'Requires internet connection' });
      return;
    }

    set({ isGenerating: true, error: null });
    try {
      const code = generateInviteCode();
      const { error } = await supabase.from('invite_codes').insert({
        family_id: familyId,
        code,
        created_by: userId,
        role: 'partner',
      });

      if (error) {
        set({ isGenerating: false, error: error.message });
        return;
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      set({ inviteCode: code, expiresAt, isGenerating: false });
    } catch (err) {
      set({ isGenerating: false, error: 'Failed to generate invite code' });
    }
  },

  redeemCode: async (code: string, userId: UUID) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Requires internet connection' };
    }

    set({ isRedeeming: true, error: null });
    try {
      const { data, error } = await supabase.rpc('redeem_invite_code', {
        p_code: code.toUpperCase(),
        p_user_id: userId,
      });

      if (error) {
        set({ isRedeeming: false, error: error.message });
        return { success: false, error: error.message };
      }

      const result = data as { success: boolean; family_id?: string; error?: string };
      set({ isRedeeming: false });

      if (!result.success) {
        set({ error: result.error ?? 'Invalid invite code' });
        return { success: false, error: result.error };
      }

      return { success: true, familyId: result.family_id };
    } catch (err) {
      set({ isRedeeming: false, error: 'Failed to redeem invite code' });
      return { success: false, error: 'Failed to redeem invite code' };
    }
  },

  fetchExistingCode: async (familyId: UUID) => {
    if (!isSupabaseConfigured) return;

    try {
      const { data } = await supabase
        .from('invite_codes')
        .select('code, expires_at')
        .eq('family_id', familyId)
        .is('redeemed_by', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        set({ inviteCode: data.code, expiresAt: data.expires_at });
      }
    } catch {
      // No existing code — that's fine
    }
  },

  clearError: () => set({ error: null }),
}));

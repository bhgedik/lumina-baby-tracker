// ============================================================
// Lumina — Auth Store (Zustand)
// Session, profile, and family state
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../data/supabase/client';
import type { UUID } from '../shared/types/common';
import type { Profile, Family } from '../modules/baby/types';

interface AuthState {
  session: { user: { id: UUID; email: string } } | null;
  profile: Profile | null;
  family: Family | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setProfile: (profile: Profile) => void;
  setFamily: (family: Family) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  updateFamily: (updates: Partial<Family>) => void;
  completeOnboarding: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  family: null,
  isAuthenticated: false,
  isLoading: true,
  isHydrated: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({
          session: { user: { id: session.user.id, email: session.user.email ?? '' } },
          isAuthenticated: true,
          isLoading: false,
        });
        // Fetch profile and family in background
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          set({ profile: profile as Profile });
          const { data: family } = await supabase
            .from('families')
            .select('*')
            .eq('id', profile.family_id)
            .single();
          if (family) set({ family: family as Family });
        }
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ isLoading: false });
      return { error: error.message };
    }
    if (data.session) {
      set({
        session: { user: { id: data.session.user.id, email: data.session.user.email ?? '' } },
        isAuthenticated: true,
        isLoading: false,
      });
    }
    return { error: null };
  },

  signUp: async (email, password, _displayName) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ isLoading: false });
      return { error: error.message };
    }
    set({ isLoading: false });
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      session: null,
      profile: null,
      family: null,
      isAuthenticated: false,
    });
  },

  setProfile: (profile: Profile) => {
    set({ profile });
    AsyncStorage.setItem('@sprout/profile', JSON.stringify(profile)).catch(() => {});
  },

  setFamily: (family: Family) => {
    set({ family });
    AsyncStorage.setItem('@sprout/family', JSON.stringify(family)).catch(() => {});
  },

  updateProfile: (updates: Partial<Profile>) => {
    const current = get().profile;
    if (!current) return;
    const now = new Date().toISOString();
    const updated = { ...current, ...updates, updated_at: now };
    set({ profile: updated });
    AsyncStorage.setItem('@sprout/profile', JSON.stringify(updated)).catch(() => {});
    if (isSupabaseConfigured) {
      supabase.from('profiles').update({ ...updates, updated_at: now }).eq('id', current.id).then(() => {});
    }
  },

  updateFamily: (updates: Partial<Family>) => {
    const current = get().family;
    if (!current) return;
    const now = new Date().toISOString();
    const updated = { ...current, ...updates, updated_at: now };
    set({ family: updated });
    AsyncStorage.setItem('@sprout/family', JSON.stringify(updated)).catch(() => {});
    if (isSupabaseConfigured) {
      supabase.from('families').update({ ...updates, updated_at: now }).eq('id', current.id).then(() => {});
    }
  },

  completeOnboarding: () => {
    const profile = get().profile;
    if (profile) {
      const updated = { ...profile, onboarding_completed: true };
      set({ profile: updated });
      AsyncStorage.setItem('@sprout/profile', JSON.stringify(updated)).catch(() => {});
    }
  },

  hydrate: async () => {
    // First try to load locally persisted profile/family
    try {
      const [profileRaw, familyRaw] = await Promise.all([
        AsyncStorage.getItem('@sprout/profile'),
        AsyncStorage.getItem('@sprout/family'),
      ]);
      if (profileRaw) set({ profile: JSON.parse(profileRaw) });
      if (familyRaw) set({ family: JSON.parse(familyRaw) });
    } catch {}

    // Only call Supabase when actually configured — skip the stub
    if (isSupabaseConfigured) {
      try {
        await get().initialize();
      } catch {
        set({ isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isAuthenticated: false, isLoading: false });
    }
    set({ isHydrated: true });
  },
}));

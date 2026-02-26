// ============================================================
// Sprout — Supabase Client Initialization
// Gracefully stubs if env vars are missing (offline-only mode)
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../shared/constants/config';

const supabaseUrl = APP_CONFIG.supabase.url;
const supabaseAnonKey = APP_CONFIG.supabase.anonKey;

const isConfigured = supabaseUrl.startsWith('http') && supabaseAnonKey.length > 0;

export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : createStubClient();

export { isConfigured as isSupabaseConfigured };

// Minimal stub that returns empty results — allows the app to run
// fully offline with Zustand stores until real credentials are added.
function createStubClient(): SupabaseClient {
  const emptyResponse = { data: null, error: null };
  const emptySession = { data: { session: null }, error: null };

  const chainable = () => {
    const obj: Record<string, unknown> = {};
    const handler: ProxyHandler<Record<string, unknown>> = {
      get(_target, prop) {
        if (prop === 'then') return undefined; // not a Promise
        if (prop === 'single') return () => Promise.resolve(emptyResponse);
        return () => new Proxy({}, handler);
      },
    };
    return new Proxy(obj, handler);
  };

  return {
    auth: {
      getSession: () => Promise.resolve(emptySession),
      signInWithPassword: () => Promise.resolve({ data: { session: null, user: null }, error: { message: 'Supabase not configured' } }),
      signUp: () => Promise.resolve({ data: { session: null, user: null }, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => chainable(),
    functions: {
      invoke: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    },
  } as unknown as SupabaseClient;
}

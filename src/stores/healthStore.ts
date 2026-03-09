// ============================================================
// Sprouty — Health Store (Zustand)
// Three collections: health logs, vaccinations, illness episodes
// Offline-first with AsyncStorage + SyncQueue
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UUID } from '../shared/types/common';
import type { HealthLog, Vaccination, IllnessEpisode } from '../modules/health/types';
import { generateUUID, type SyncQueueItem } from './createSyncedStore';

const LOGS_KEY = '@nodd/health-logs';
const VACCINATIONS_KEY = '@nodd/vaccinations';
const EPISODES_KEY = '@nodd/illness-episodes';

interface HealthState {
  healthLogs: HealthLog[];
  vaccinations: Vaccination[];
  episodes: IllnessEpisode[];
  logsSyncQueue: SyncQueueItem[];
  vaccinationsSyncQueue: SyncQueueItem[];
  episodesSyncQueue: SyncQueueItem[];
  isHydrated: boolean;

  // Health logs
  addHealthLog: (log: HealthLog) => void;
  updateHealthLog: (id: UUID, updates: Partial<HealthLog>) => void;
  getHealthLogsByBaby: (babyId: UUID) => HealthLog[];
  getEpisodeLogs: (episodeId: UUID) => HealthLog[];

  // Vaccinations
  addVaccination: (vax: Vaccination) => void;
  updateVaccination: (id: UUID, updates: Partial<Vaccination>) => void;
  getVaccinationsByBaby: (babyId: UUID) => Vaccination[];

  // Episodes
  addEpisode: (episode: IllnessEpisode) => void;
  resolveEpisode: (id: UUID) => void;
  getActiveEpisodes: (babyId: UUID) => IllnessEpisode[];
  getResolvedEpisodes: (babyId: UUID) => IllnessEpisode[];

  hydrate: () => Promise<void>;
}

function persistLogs(logs: HealthLog[], syncQueue: SyncQueueItem[]) {
  AsyncStorage.setItem(LOGS_KEY, JSON.stringify({ items: logs, syncQueue })).catch(() => {});
}

function persistVaccinations(items: Vaccination[], syncQueue: SyncQueueItem[]) {
  AsyncStorage.setItem(VACCINATIONS_KEY, JSON.stringify({ items, syncQueue })).catch(() => {});
}

function persistEpisodes(items: IllnessEpisode[], syncQueue: SyncQueueItem[]) {
  AsyncStorage.setItem(EPISODES_KEY, JSON.stringify({ items, syncQueue })).catch(() => {});
}

export const useHealthStore = create<HealthState>((set, get) => ({
  healthLogs: [],
  vaccinations: [],
  episodes: [],
  logsSyncQueue: [],
  vaccinationsSyncQueue: [],
  episodesSyncQueue: [],
  isHydrated: false,

  // ── Health Logs ───────────────────────────────────────────

  addHealthLog: (log) => {
    const state = get();
    const newItems = [...state.healthLogs, log];
    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      operation: 'insert',
      table: 'health_logs',
      data: log as unknown as Record<string, unknown>,
      timestamp: Date.now(),
      retryCount: 0,
    };
    const newQueue = [...state.logsSyncQueue, queueItem];
    set({ healthLogs: newItems, logsSyncQueue: newQueue });
    persistLogs(newItems, newQueue);
  },

  updateHealthLog: (id, updates) => {
    const state = get();
    const newItems = state.healthLogs.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      operation: 'update',
      table: 'health_logs',
      data: { id, ...updates } as Record<string, unknown>,
      timestamp: Date.now(),
      retryCount: 0,
    };
    const newQueue = [...state.logsSyncQueue, queueItem];
    set({ healthLogs: newItems, logsSyncQueue: newQueue });
    persistLogs(newItems, newQueue);
  },

  getHealthLogsByBaby: (babyId) => {
    return get().healthLogs.filter((log) => log.baby_id === babyId);
  },

  getEpisodeLogs: (episodeId) => {
    return get().healthLogs
      .filter((log) => log.episode_id === episodeId)
      .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
  },

  // ── Vaccinations ──────────────────────────────────────────

  addVaccination: (vax) => {
    const state = get();
    const newItems = [...state.vaccinations, vax];
    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      operation: 'insert',
      table: 'vaccinations',
      data: vax as unknown as Record<string, unknown>,
      timestamp: Date.now(),
      retryCount: 0,
    };
    const newQueue = [...state.vaccinationsSyncQueue, queueItem];
    set({ vaccinations: newItems, vaccinationsSyncQueue: newQueue });
    persistVaccinations(newItems, newQueue);
  },

  updateVaccination: (id, updates) => {
    const state = get();
    const newItems = state.vaccinations.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      operation: 'update',
      table: 'vaccinations',
      data: { id, ...updates } as Record<string, unknown>,
      timestamp: Date.now(),
      retryCount: 0,
    };
    const newQueue = [...state.vaccinationsSyncQueue, queueItem];
    set({ vaccinations: newItems, vaccinationsSyncQueue: newQueue });
    persistVaccinations(newItems, newQueue);
  },

  getVaccinationsByBaby: (babyId) => {
    return get().vaccinations.filter((v) => v.baby_id === babyId);
  },

  // ── Episodes ──────────────────────────────────────────────

  addEpisode: (episode) => {
    const state = get();
    const newItems = [...state.episodes, episode];
    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      operation: 'insert',
      table: 'illness_episodes',
      data: episode as unknown as Record<string, unknown>,
      timestamp: Date.now(),
      retryCount: 0,
    };
    const newQueue = [...state.episodesSyncQueue, queueItem];
    set({ episodes: newItems, episodesSyncQueue: newQueue });
    persistEpisodes(newItems, newQueue);
  },

  resolveEpisode: (id) => {
    const now = new Date().toISOString();
    const state = get();
    const newItems = state.episodes.map((ep) =>
      ep.id === id ? { ...ep, status: 'resolved' as const, resolved_at: now, updated_at: now } : ep
    );
    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      operation: 'update',
      table: 'illness_episodes',
      data: { id, status: 'resolved', resolved_at: now, updated_at: now },
      timestamp: Date.now(),
      retryCount: 0,
    };
    const newQueue = [...state.episodesSyncQueue, queueItem];
    set({ episodes: newItems, episodesSyncQueue: newQueue });
    persistEpisodes(newItems, newQueue);
  },

  getActiveEpisodes: (babyId) => {
    return get().episodes
      .filter((ep) => ep.baby_id === babyId && ep.status === 'active')
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  },

  getResolvedEpisodes: (babyId) => {
    return get().episodes
      .filter((ep) => ep.baby_id === babyId && ep.status === 'resolved')
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  },

  // ── Hydration ─────────────────────────────────────────────

  hydrate: async () => {
    try {
      const [logsRaw, vaxRaw, epsRaw] = await Promise.all([
        AsyncStorage.getItem(LOGS_KEY),
        AsyncStorage.getItem(VACCINATIONS_KEY),
        AsyncStorage.getItem(EPISODES_KEY),
      ]);
      const logs = logsRaw ? JSON.parse(logsRaw) : {};
      const vax = vaxRaw ? JSON.parse(vaxRaw) : {};
      const eps = epsRaw ? JSON.parse(epsRaw) : {};
      set({
        healthLogs: logs.items ?? [],
        logsSyncQueue: logs.syncQueue ?? [],
        vaccinations: vax.items ?? [],
        vaccinationsSyncQueue: vax.syncQueue ?? [],
        episodes: eps.items ?? [],
        episodesSyncQueue: eps.syncQueue ?? [],
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },
}));

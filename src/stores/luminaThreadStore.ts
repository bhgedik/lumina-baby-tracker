// ============================================================
// Nodd — Lumina Thread Store (Zustand)
// Persists AI consultation threads with AsyncStorage
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '../modules/insights/types';
import type { ChatThread, CarePlanMeta } from '../modules/lumina/types';

const STORAGE_KEY = '@nodd/lumina-threads-v1';
const MAX_THREADS = 50;
const PREVIEW_LENGTH = 80;

interface PersistedData {
  threads: ChatThread[];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + '...';
}

function persist(data: PersistedData) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
}

interface LuminaThreadState {
  threads: ChatThread[];
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  createThread: (
    title: string,
    initialMessages: ChatMessage[],
    isCarePlan?: boolean,
    carePlanMeta?: CarePlanMeta,
  ) => string;
  appendMessage: (threadId: string, message: ChatMessage) => void;
  deleteThread: (threadId: string) => void;
  getThread: (threadId: string) => ChatThread | undefined;
  getRecentThreads: () => ChatThread[];
  getActiveCarePlans: () => ChatThread[];
}

export const useLuminaThreadStore = create<LuminaThreadState>((set, get) => ({
  threads: [],
  isHydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: PersistedData = JSON.parse(raw);
        set({ threads: data.threads ?? [], isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  createThread: (
    title: string,
    initialMessages: ChatMessage[],
    isCarePlan = false,
    carePlanMeta?: CarePlanMeta,
  ) => {
    const id = generateId();
    const now = Date.now();
    const lastMsg = initialMessages[initialMessages.length - 1];
    const preview = lastMsg ? truncate(lastMsg.text, PREVIEW_LENGTH) : '';

    const thread: ChatThread = {
      id,
      title: truncate(title, 60),
      preview,
      messages: initialMessages,
      createdAt: now,
      updatedAt: now,
      isCarePlan,
      carePlanMeta,
    };

    const { threads } = get();
    let next = [thread, ...threads];

    // Prune oldest non-care-plan threads if over limit
    if (next.length > MAX_THREADS) {
      const carePlans = next.filter((t) => t.isCarePlan);
      const regular = next.filter((t) => !t.isCarePlan);
      const maxRegular = MAX_THREADS - carePlans.length;
      next = [...carePlans, ...regular.slice(0, Math.max(maxRegular, 0))];
    }

    set({ threads: next });
    persist({ threads: next });
    return id;
  },

  appendMessage: (threadId: string, message: ChatMessage) => {
    const { threads } = get();
    const next = threads.map((t) => {
      if (t.id !== threadId) return t;
      return {
        ...t,
        messages: [...t.messages, message],
        preview: truncate(message.text, PREVIEW_LENGTH),
        updatedAt: Date.now(),
      };
    });
    set({ threads: next });
    persist({ threads: next });
  },

  deleteThread: (threadId: string) => {
    const { threads } = get();
    const next = threads.filter((t) => t.id !== threadId);
    set({ threads: next });
    persist({ threads: next });
  },

  getThread: (threadId: string) => {
    return get().threads.find((t) => t.id === threadId);
  },

  getRecentThreads: () => {
    return get()
      .threads.filter((t) => !t.isCarePlan)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getActiveCarePlans: () => {
    return get()
      .threads.filter((t) => t.isCarePlan)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
}));

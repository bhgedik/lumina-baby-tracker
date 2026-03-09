// ============================================================
// Nodd — Lumina Thread Types
// Persistent AI consultation threads + care plans
// ============================================================

import type { ChatMessage } from '../insights/types';

export type ChatMode = 'transient' | 'persistent';

export interface CarePlanMeta {
  totalDays: number;
  currentDay: number;
  planType: string; // e.g. 'sleep_training', 'feeding_transition'
  startedAt: number;
}

export interface ChatThread {
  id: string;
  title: string; // derived from first user message (truncated)
  preview: string; // last message text, truncated
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  isCarePlan: boolean;
  carePlanMeta?: CarePlanMeta;
}

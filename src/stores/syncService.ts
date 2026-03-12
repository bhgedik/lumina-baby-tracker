// ============================================================
// Lumina — Sync Service (Stubbed for Phase 2)
// Background sync queue drain to Supabase
// Full implementation when Supabase project is connected
// ============================================================

import { useFeedingStore } from './feedingStore';
import { useSleepStore } from './sleepStore';
import { useDiaperStore } from './diaperStore';

let syncInterval: ReturnType<typeof setInterval> | null = null;

export async function drainSyncQueue(): Promise<void> {
  const feedingQueue = useFeedingStore.getState().syncQueue;
  const sleepQueue = useSleepStore.getState().syncQueue;
  const diaperQueue = useDiaperStore.getState().syncQueue;

  const allItems = [
    ...feedingQueue.map((q) => ({ ...q, store: 'feeding' as const })),
    ...sleepQueue.map((q) => ({ ...q, store: 'sleep' as const })),
    ...diaperQueue.map((q) => ({ ...q, store: 'diaper' as const })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  if (allItems.length === 0) return;

  // TODO: Push each item to Supabase in order, clear on success
  // For Phase 2, sync queue accumulates locally.
  // When Supabase project is fully connected, this will:
  // 1. Process each queue item in timestamp order
  // 2. Call supabase.from(item.table).insert/update/delete
  // 3. On success, remove from the respective store's syncQueue
  // 4. On failure, increment retryCount, skip after 5 retries
}

export function startSyncService(): void {
  if (syncInterval) return;
  // Drain every 30 seconds
  syncInterval = setInterval(() => {
    drainSyncQueue().catch(() => {});
  }, 30000);
}

export function stopSyncService(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

// ============================================================
// Sprouty — Growth Store (Zustand)
// Weight, length, and head circumference logs
// ============================================================

import { createSyncedStore } from './createSyncedStore';
import type { GrowthLog } from '../modules/growth/types';

export const useGrowthStore = createSyncedStore<GrowthLog>('@sprout/growth-logs', 'growth_logs');

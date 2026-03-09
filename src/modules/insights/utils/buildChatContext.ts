// ============================================================
// Sprouty — Chat Context Builder
// Queries Zustand stores for recent baby data and formats
// into RecentLogEntry[] for the ai-chat edge function
// ============================================================

import { useFeedingStore } from '../../../stores/feedingStore';
import { useSleepStore } from '../../../stores/sleepStore';
import { useDiaperStore } from '../../../stores/diaperStore';
import { useHealthStore } from '../../../stores/healthStore';
import type { UUID } from '../../../shared/types/common';

interface RecentLogEntry {
  type: string;
  time: string;
  details?: string;
}

interface ChatContext {
  recentLogs: {
    feedings: RecentLogEntry[];
    sleep: RecentLogEntry[];
    diapers: RecentLogEntry[];
    health: RecentLogEntry[];
  };
}

function isWithinHours(dateStr: string, hours: number): boolean {
  return Date.now() - new Date(dateStr).getTime() < hours * 3600000;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function buildChatContext(babyId: UUID): ChatContext {
  // --- Feedings (last 24h) ---
  const feedingItems = useFeedingStore.getState().items
    .filter((f) => f.baby_id === babyId && isWithinHours(f.started_at, 24));

  const feedings: RecentLogEntry[] = feedingItems.map((f) => {
    let details = '';
    if (f.type === 'breast') {
      const left = f.left_duration_seconds ? Math.round(f.left_duration_seconds / 60) : 0;
      const right = f.right_duration_seconds ? Math.round(f.right_duration_seconds / 60) : 0;
      details = `L: ${left}min, R: ${right}min`;
    } else if (f.type === 'bottle' && f.bottle_amount_ml) {
      details = `${f.bottle_amount_ml}ml${f.bottle_content ? ` ${f.bottle_content}` : ''}`;
    } else if (f.type === 'solid' && f.solid_foods?.length) {
      details = f.solid_foods.map((s) => s.food_name).join(', ');
    }
    return { type: f.type, time: formatTime(f.started_at), details: details || undefined };
  });

  // --- Sleep (last 24h) ---
  const sleepItems = useSleepStore.getState().items
    .filter((s) => s.baby_id === babyId && isWithinHours(s.started_at, 24));

  const sleep: RecentLogEntry[] = sleepItems.map((s) => ({
    type: s.type,
    time: formatTime(s.started_at),
    details: s.duration_minutes ? `${s.duration_minutes}min` : undefined,
  }));

  // --- Diapers (last 24h) ---
  const diaperItems = useDiaperStore.getState().items
    .filter((d) => d.baby_id === babyId && isWithinHours(d.logged_at, 24));

  const diapers: RecentLogEntry[] = diaperItems.map((d) => ({
    type: d.type,
    time: formatTime(d.logged_at),
    details: d.stool_color ? `color: ${d.stool_color}` : undefined,
  }));

  // --- Health (last 7 days + active episodes) ---
  const healthLogs = useHealthStore.getState().getHealthLogsByBaby(babyId)
    .filter((h) => isWithinHours(h.logged_at, 168));

  const activeEpisodes = useHealthStore.getState().getActiveEpisodes(babyId);

  const health: RecentLogEntry[] = [
    ...healthLogs.map((h) => {
      const parts: string[] = [];
      if (h.temperature_celsius) parts.push(`temp: ${h.temperature_celsius}C`);
      if (h.symptoms?.length) parts.push(`symptoms: ${h.symptoms.join(', ')}`);
      if (h.medication_name) parts.push(`med: ${h.medication_name}${h.medication_dose ? ` ${h.medication_dose}` : ''}`);
      if (h.diagnosis) parts.push(`dx: ${h.diagnosis}`);
      return {
        type: h.type,
        time: formatTime(h.logged_at),
        details: parts.join('; ') || undefined,
      };
    }),
    ...activeEpisodes.map((ep) => ({
      type: 'active_illness',
      time: formatTime(ep.started_at),
      details: `${ep.title}: ${ep.primary_symptoms.join(', ')}${ep.diagnosis ? ` (dx: ${ep.diagnosis})` : ''}`,
    })),
  ];

  return { recentLogs: { feedings, sleep, diapers, health } };
}

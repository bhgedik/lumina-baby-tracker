// ============================================================
// Lumina — useActiveEpisodes Hook
// Returns active and resolved illness episodes for active baby
// ============================================================

import { useMemo, useCallback } from 'react';
import { useBabyStore } from '../../../stores/babyStore';
import { useHealthStore } from '../../../stores/healthStore';
import type { IllnessEpisode } from '../types';

export function useActiveEpisodes() {
  const baby = useBabyStore((s) => s.getActiveBaby());
  const episodes = useHealthStore((s) => s.episodes);
  const healthLogs = useHealthStore((s) => s.healthLogs);

  const active = useMemo<IllnessEpisode[]>(() => {
    if (!baby) return [];
    return episodes
      .filter((ep) => ep.baby_id === baby.id && ep.status === 'active')
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  }, [baby, episodes]);

  const resolved = useMemo<IllnessEpisode[]>(() => {
    if (!baby) return [];
    return episodes
      .filter((ep) => ep.baby_id === baby.id && ep.status === 'resolved')
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  }, [baby, episodes]);

  const getLogCount = useCallback(
    (episodeId: string): number => {
      return healthLogs.filter((log) => log.episode_id === episodeId).length;
    },
    [healthLogs],
  );

  return { active, resolved, getLogCount };
}

// ============================================================
// Lumina — Sleep Timer Hook
// Reads sleepStore.activeTimer, returns elapsed display
// ============================================================

import { useState, useEffect } from 'react';
import { useSleepStore } from '../../../stores/sleepStore';

interface SleepTimerState {
  elapsedSeconds: number;
  isRunning: boolean;
  sleepType: 'nap' | 'night' | null;
}

export function useSleepTimer(): SleepTimerState {
  const activeTimer = useSleepStore((s) => s.activeTimer);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!activeTimer) {
      setElapsedSeconds(0);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
      setElapsedSeconds(elapsed);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  return {
    elapsedSeconds,
    isRunning: !!activeTimer,
    sleepType: activeTimer?.type ?? null,
  };
}

// ============================================================
// Lumina — Feeding Timer Hook
// Reads feedingStore.activeTimer, returns elapsed display
// ============================================================

import { useState, useEffect } from 'react';
import { useFeedingStore, type FeedingTimer } from '../../../stores/feedingStore';
import type { BreastSide } from '../../../shared/types/common';

interface FeedingTimerState {
  elapsedSeconds: number;
  leftSeconds: number;
  rightSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  currentSide: BreastSide | null;
  timerType: 'breast' | 'bottle' | null;
}

export function useFeedingTimer(): FeedingTimerState {
  const activeTimer = useFeedingStore((s) => s.activeTimer);
  const [state, setState] = useState<FeedingTimerState>({
    elapsedSeconds: 0,
    leftSeconds: 0,
    rightSeconds: 0,
    isRunning: false,
    isPaused: false,
    currentSide: null,
    timerType: null,
  });

  useEffect(() => {
    if (!activeTimer) {
      setState({
        elapsedSeconds: 0,
        leftSeconds: 0,
        rightSeconds: 0,
        isRunning: false,
        isPaused: false,
        currentSide: null,
        timerType: null,
      });
      return;
    }

    const tick = () => {
      const isPaused = !!activeTimer.pausedAt;
      const runningElapsed = isPaused
        ? 0
        : Math.floor((Date.now() - activeTimer.startedAt) / 1000);
      const totalElapsed = activeTimer.accumulatedSeconds + runningElapsed;

      // Calculate side-specific seconds
      let leftSec = activeTimer.leftSeconds;
      let rightSec = activeTimer.rightSeconds;
      if (!isPaused) {
        if (activeTimer.side === 'left') leftSec += runningElapsed;
        else if (activeTimer.side === 'right') rightSec += runningElapsed;
      }

      setState({
        elapsedSeconds: totalElapsed,
        leftSeconds: leftSec,
        rightSeconds: rightSec,
        isRunning: !isPaused,
        isPaused,
        currentSide: activeTimer.side,
        timerType: activeTimer.type,
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  return state;
}

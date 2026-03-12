// ============================================================
// Lumina — Dynamic Lottie Icon
// Animated illustrations for Quick Log cards, driven by baby data
// Playback speed/progress responds to time-since-last-event & age
// ============================================================

import React from 'react';
import LottieView from 'lottie-react-native';

type IconDomain = 'feeding' | 'sleep' | 'diaper' | 'growth' | 'health' | 'activity';

interface DynamicLottieIconProps {
  type: IconDomain;
  size?: number;
  hoursSinceLastEvent?: number | null;
  babyAgeMonths?: number;
}

const LOTTIE_SOURCES: Record<string, any> = {
  feeding: require('../../../assets/lottie/feeding-bottle.json'),
  sleep: require('../../../assets/lottie/sleep-moon.json'),
  diaper: require('../../../assets/lottie/diaper-cloud.json'),
  growth: require('../../../assets/lottie/growth-sprout.json'),
  health: require('../../../assets/lottie/health-heart.json'),
  'activity-0': require('../../../assets/lottie/activity-ball.json'),
  'activity-1': require('../../../assets/lottie/activity-top.json'),
  'activity-2': require('../../../assets/lottie/activity-rattle.json'),
};

interface PlaybackConfig {
  source: any;
  autoPlay: boolean;
  loop: boolean;
  speed?: number;
  progress?: number;
}

function getPlaybackConfig(
  type: IconDomain,
  hours?: number | null,
  ageMonths?: number,
): PlaybackConfig {
  switch (type) {
    case 'feeding':
      // 0-2hrs: gentle float (speed 0.8), 3+hrs: urgent (speed 1.8)
      return {
        source: LOTTIE_SOURCES.feeding,
        autoPlay: true,
        loop: true,
        speed: (hours ?? 0) >= 3 ? 1.8 : 0.8,
      };
    case 'sleep':
      // Always: gentle Zzz float
      return { source: LOTTIE_SOURCES.sleep, autoPlay: true, loop: true, speed: 0.8 };
    case 'diaper':
      // 0-2hrs: calm (speed 0.8), 3+hrs: active droplets (speed 1.5)
      return {
        source: LOTTIE_SOURCES.diaper,
        autoPlay: true,
        loop: true,
        speed: (hours ?? 0) >= 3 ? 1.5 : 0.8,
      };
    case 'growth':
      // Static frame mapped to baby age: 0mo=0.0 → 24mo=1.0
      return {
        source: LOTTIE_SOURCES.growth,
        autoPlay: false,
        loop: false,
        progress: Math.min((ageMonths ?? 0) / 24, 1.0),
      };
    case 'health':
      // Gentle heartbeat loop
      return { source: LOTTIE_SOURCES.health, autoPlay: true, loop: true, speed: 1.0 };
    case 'activity': {
      // Rotate by day of week: 0-2 = ball, 3-4 = top, 5-6 = rattle
      const day = new Date().getDay();
      const variant = day <= 2 ? '0' : day <= 4 ? '1' : '2';
      return {
        source: LOTTIE_SOURCES[`activity-${variant}`],
        autoPlay: true,
        loop: true,
        speed: 1.0,
      };
    }
  }
}

export function DynamicLottieIcon({
  type,
  size = 52,
  hoursSinceLastEvent,
  babyAgeMonths,
}: DynamicLottieIconProps) {
  const config = getPlaybackConfig(type, hoursSinceLastEvent, babyAgeMonths);

  return (
    <LottieView
      source={config.source}
      autoPlay={config.autoPlay}
      loop={config.loop}
      speed={config.speed}
      progress={config.progress}
      style={{ width: size, height: size }}
    />
  );
}

// ============================================================
// Sprouty — Hand-Drawn Card Illustrations
// Playful, storybook-style SVG illustrations for dashboard cards
// Each illustration is warm, organic, and slightly whimsical
// ============================================================

import React from 'react';
import Svg, { Circle, Path, G, Ellipse, Rect, Line } from 'react-native-svg';

interface IllustrationProps {
  size?: number;
  color?: string;
}

// Feeding — cute bottle with a heart + milk splash
function FeedingIllustration({ size = 52, color = '#F49770' }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <G>
        {/* Bottle body — rounded rectangle */}
        <Rect x="17" y="16" width="18" height="28" rx="6" fill={color + '18'} stroke={color} strokeWidth={2} />
        {/* Bottle neck */}
        <Rect x="21" y="8" width="10" height="10" rx="3" fill={color + '18'} stroke={color} strokeWidth={2} />
        {/* Nipple */}
        <Path d="M24 8 Q26 3 28 8" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
        {/* Milk level — wavy line */}
        <Path d="M19 30 Q22 27 26 30 Q30 33 33 30 L33 40 Q33 42 31 42 L21 42 Q19 42 19 40 Z" fill={color + '20'} />
        {/* Measurement lines */}
        <Line x1="19" y1="24" x2="22" y2="24" stroke={color} strokeWidth={1} strokeLinecap="round" opacity={0.4} />
        <Line x1="19" y1="30" x2="22" y2="30" stroke={color} strokeWidth={1} strokeLinecap="round" opacity={0.4} />
        <Line x1="19" y1="36" x2="22" y2="36" stroke={color} strokeWidth={1} strokeLinecap="round" opacity={0.4} />
        {/* Heart */}
        <Path d="M38 14 C38 11 42 11 42 14 C42 11 46 11 46 14 C46 18 42 21 42 21 C42 21 38 18 38 14Z" fill={color} opacity={0.5} />
      </G>
    </Svg>
  );
}

// Sleep — crescent moon with a sleeping face, stars, and a tiny cloud
function SleepIllustration({ size = 52, color = '#7C9A8E' }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <G>
        {/* Moon crescent */}
        <Path d="M14 26 C14 15 24 8 34 12 C28 14 24 20 24 26 C24 32 28 38 34 40 C24 44 14 37 14 26Z" fill={color + '18'} stroke={color} strokeWidth={2} />
        {/* Sleeping eyes (closed arcs) */}
        <Path d="M17 24 Q19 22 21 24" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
        {/* Tiny smile */}
        <Path d="M18 28 Q19.5 29.5 21 28" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
        {/* Stars */}
        <Path d="M38 10 L39 13 L42 13 L39.5 15 L40.5 18 L38 16 L35.5 18 L36.5 15 L34 13 L37 13 Z" fill={color} opacity={0.5} />
        <Circle cx="44" cy="24" r="1.5" fill={color} opacity={0.3} />
        <Circle cx="40" cy="32" r="1" fill={color} opacity={0.3} />
        {/* Zzz */}
        <Path d="M42 36 L46 36 L42 40 L46 40" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.4} />
      </G>
    </Svg>
  );
}

// Diaper — cute cloud-shaped diaper with a tiny raindrop
function DiaperIllustration({ size = 52, color = '#FF9800' }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <G>
        {/* Diaper body — soft rounded shape */}
        <Path d="M12 22 C12 16 18 12 26 12 C34 12 40 16 40 22 L40 32 C40 38 36 42 32 42 L20 42 C16 42 12 38 12 32 Z" fill={color + '15'} stroke={color} strokeWidth={2} />
        {/* Waistband curve */}
        <Path d="M14 22 Q26 18 38 22" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.5} />
        {/* Center fold line — gentle curve */}
        <Path d="M26 22 Q27 32 26 40" stroke={color} strokeWidth={1} strokeLinecap="round" fill="none" opacity={0.3} />
        {/* Tabs */}
        <Ellipse cx="16" cy="22" rx="3" ry="2" fill={color} opacity={0.3} />
        <Ellipse cx="36" cy="22" rx="3" ry="2" fill={color} opacity={0.3} />
        {/* Water droplets */}
        <Path d="M22 30 Q23 27 24 30 Q23 32 22 30Z" fill={color} opacity={0.4} />
        <Path d="M28 28 Q29 25 30 28 Q29 30 28 28Z" fill={color} opacity={0.4} />
        <Path d="M34 31 Q35 28 36 31 Q35 33 34 31Z" fill={color} opacity={0.3} />
      </G>
    </Svg>
  );
}

// Growth — tiny sprout growing from a pot with measurement marks
function GrowthIllustration({ size = 52, color = '#4CAF50' }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <G>
        {/* Pot */}
        <Path d="M18 36 L20 46 L32 46 L34 36 Z" fill={color + '18'} stroke={color} strokeWidth={2} strokeLinejoin="round" />
        <Rect x="16" y="34" width="20" height="4" rx="2" fill={color + '25'} stroke={color} strokeWidth={2} />
        {/* Stem */}
        <Path d="M26 34 Q26 24 26 18" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
        {/* Left leaf */}
        <Path d="M26 24 Q20 20 18 14 Q24 16 26 24Z" fill={color + '30'} stroke={color} strokeWidth={1.5} />
        {/* Right leaf */}
        <Path d="M26 18 Q32 14 36 10 Q34 18 26 18Z" fill={color + '30'} stroke={color} strokeWidth={1.5} />
        {/* Tiny sparkle */}
        <Circle cx="38" cy="8" r="1.5" fill={color} opacity={0.4} />
        <Circle cx="42" cy="14" r="1" fill={color} opacity={0.3} />
      </G>
    </Svg>
  );
}

// Health — smiling heart with a tiny stethoscope
function HealthIllustration({ size = 52, color = '#E53935' }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <G>
        {/* Heart shape */}
        <Path d="M26 42 C26 42 10 32 10 20 C10 14 15 10 20 10 C23 10 25 12 26 14 C27 12 29 10 32 10 C37 10 42 14 42 20 C42 32 26 42 26 42Z" fill={color + '15'} stroke={color} strokeWidth={2} />
        {/* Happy closed eyes */}
        <Path d="M19 22 Q21 20 23 22" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
        <Path d="M29 22 Q31 20 33 22" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
        {/* Smile */}
        <Path d="M22 28 Q26 32 30 28" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
        {/* Rosy cheeks */}
        <Ellipse cx="18" cy="26" rx="2" ry="1.2" fill={color} opacity={0.15} />
        <Ellipse cx="34" cy="26" rx="2" ry="1.2" fill={color} opacity={0.15} />
        {/* Tiny plus sign */}
        <Line x1="42" y1="8" x2="42" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.4} />
        <Line x1="39" y1="11" x2="45" y2="11" stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.4} />
      </G>
    </Svg>
  );
}

// Activity — playful rattle with motion lines
function ActivityIllustration({ size = 52, color = '#5E8A72' }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <G>
        {/* Rattle head — circle */}
        <Circle cx="26" cy="18" r="12" fill={color + '15'} stroke={color} strokeWidth={2} />
        {/* Handle */}
        <Path d="M26 30 L26 44" stroke={color} strokeWidth={3} strokeLinecap="round" />
        {/* Handle grip */}
        <Ellipse cx="26" cy="45" rx="4" ry="3" fill={color + '18'} stroke={color} strokeWidth={2} />
        {/* Beads inside rattle */}
        <Circle cx="22" cy="15" r="2" fill={color} opacity={0.3} />
        <Circle cx="30" cy="15" r="2" fill={color} opacity={0.3} />
        <Circle cx="26" cy="20" r="2" fill={color} opacity={0.3} />
        {/* Motion lines */}
        <Path d="M10 12 Q8 14 10 16" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.3} />
        <Path d="M8 18 Q6 20 8 22" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.25} />
        <Path d="M42 12 Q44 14 42 16" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.3} />
      </G>
    </Svg>
  );
}

export const CardIllustrationMap: Record<string, React.FC<IllustrationProps>> = {
  feeding: FeedingIllustration,
  sleep: SleepIllustration,
  diaper: DiaperIllustration,
  growth: GrowthIllustration,
  health: HealthIllustration,
  activity: ActivityIllustration,
};

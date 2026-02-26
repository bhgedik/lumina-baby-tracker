// ============================================================
// Nodd — Custom SVG Mood Icons
// Premium hand-drawn face icons in sage/cream palette
// ============================================================

import React from 'react';
import Svg, { Circle, Path, G, Line } from 'react-native-svg';
import type { MoodEmoji } from '../../stores/motherMoodStore';

interface MoodIconProps {
  size?: number;
  color?: string;
}

// Radiant — happy closed eyes (arcs), small open mouth, 3 sparkle rays
function RadiantIcon({ size = 40, color = '#FFD700' }: MoodIconProps) {
  const fill = color + '18';
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <G>
        {/* Sparkle rays */}
        <Line x1="20" y1="2" x2="20" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Line x1="10" y1="5" x2="12" y2="8.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Line x1="30" y1="5" x2="28" y2="8.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
        {/* Face circle */}
        <Circle cx="20" cy="22" r="14" fill={fill} stroke={color} strokeWidth={2} />
        {/* Happy closed eyes (arcs) */}
        <Path d="M13 20 Q15 17 17 20" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M23 20 Q25 17 27 20" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Open mouth */}
        <Path d="M16 26 Q20 30 24 26" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
    </Svg>
  );
}

// Good — dot eyes, gentle upward arc mouth
function GoodIcon({ size = 40, color = '#5E8A72' }: MoodIconProps) {
  const fill = color + '18';
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <G>
        <Circle cx="20" cy="20" r="16" fill={fill} stroke={color} strokeWidth={2} />
        {/* Dot eyes */}
        <Circle cx="14" cy="18" r="2" fill={color} />
        <Circle cx="26" cy="18" r="2" fill={color} />
        {/* Gentle smile */}
        <Path d="M13 25 Q20 30 27 25" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
    </Svg>
  );
}

// Okay — dot eyes, straight horizontal line mouth
function OkayIcon({ size = 40, color = '#87807A' }: MoodIconProps) {
  const fill = color + '18';
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <G>
        <Circle cx="20" cy="20" r="16" fill={fill} stroke={color} strokeWidth={2} />
        {/* Dot eyes */}
        <Circle cx="14" cy="18" r="2" fill={color} />
        <Circle cx="26" cy="18" r="2" fill={color} />
        {/* Straight mouth */}
        <Line x1="14" y1="26" x2="26" y2="26" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </G>
    </Svg>
  );
}

// Struggling — dot eyes, gentle downward arc mouth
function StrugglingIcon({ size = 40, color = '#F17C4C' }: MoodIconProps) {
  const fill = color + '18';
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <G>
        <Circle cx="20" cy="20" r="16" fill={fill} stroke={color} strokeWidth={2} />
        {/* Dot eyes */}
        <Circle cx="14" cy="18" r="2" fill={color} />
        <Circle cx="26" cy="18" r="2" fill={color} />
        {/* Gentle frown */}
        <Path d="M14 27 Q20 23 26 27" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
    </Svg>
  );
}

// Overwhelmed — curved sad eyes, deep frown, single tear drop
function OverwhelmedIcon({ size = 40, color = '#E53935' }: MoodIconProps) {
  const fill = color + '18';
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <G>
        <Circle cx="20" cy="20" r="16" fill={fill} stroke={color} strokeWidth={2} />
        {/* Curved sad eyes */}
        <Path d="M11 17 Q14 20 17 17" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M23 17 Q26 20 29 17" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Deep frown */}
        <Path d="M13 28 Q20 22 27 28" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Tear drop */}
        <Path d="M28 20 Q29 23 28 25 Q27 23 28 20 Z" fill={color} opacity={0.6} />
      </G>
    </Svg>
  );
}

export const MoodIconMap: Record<MoodEmoji, React.FC<MoodIconProps>> = {
  radiant: RadiantIcon,
  good: GoodIcon,
  okay: OkayIcon,
  struggling: StrugglingIcon,
  overwhelmed: OverwhelmedIcon,
};

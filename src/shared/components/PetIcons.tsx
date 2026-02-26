// ============================================================
// Nodd — Digital Pet Baby Face Icons
// Expressive baby faces that change based on elapsed time
// Follows MoodIcons.tsx pattern (same imports, props, export)
// ============================================================

import React from 'react';
import Svg, { Circle, Path, G, Ellipse } from 'react-native-svg';

export type PetState = 'happy' | 'neutral' | 'urgent';

export interface PetIconProps {
  size?: number;
  color?: string;
}

// Happy — content, just-logged: dot eyes, big smile arc, rosy cheeks, hair tuft
function HappyIcon({ size = 40, color = '#5E8A72' }: PetIconProps) {
  const fill = color + '18';
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <G>
        {/* Hair tuft */}
        <Path d="M17 9 Q20 3 23 9" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
        {/* Face circle */}
        <Circle cx="20" cy="22" r="14" fill={fill} stroke={color} strokeWidth={2} />
        {/* Dot eyes */}
        <Circle cx="14" cy="20" r="2" fill={color} />
        <Circle cx="26" cy="20" r="2" fill={color} />
        {/* Rosy cheeks */}
        <Ellipse cx="11" cy="24" rx="2.5" ry="1.5" fill={color} opacity={0.2} />
        <Ellipse cx="29" cy="24" rx="2.5" ry="1.5" fill={color} opacity={0.2} />
        {/* Big smile arc */}
        <Path d="M14 26 Q20 31 26 26" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
    </Svg>
  );
}

// Neutral — curious, getting-due: wide dot eyes, raised eyebrow, small "o" mouth
function NeutralIcon({ size = 40, color = '#B8860B' }: PetIconProps) {
  const fill = color + '18';
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <G>
        {/* Hair tuft */}
        <Path d="M17 9 Q20 3 23 9" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
        {/* Face circle */}
        <Circle cx="20" cy="22" r="14" fill={fill} stroke={color} strokeWidth={2} />
        {/* Raised eyebrow (right) */}
        <Path d="M23 15 Q25 13 28 15" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
        {/* Wide dot eyes */}
        <Circle cx="14" cy="19" r="2.5" fill={color} />
        <Circle cx="26" cy="19" r="2.5" fill={color} />
        {/* Small "o" mouth */}
        <Circle cx="20" cy="27" r="2" stroke={color} strokeWidth={2} fill="none" />
      </G>
    </Svg>
  );
}

// Urgent — crying, overdue: squinting arc eyes, tear drops, open cry mouth
function UrgentIcon({ size = 40, color = '#D32F2F' }: PetIconProps) {
  const fill = color + '18';
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <G>
        {/* Hair tuft */}
        <Path d="M17 9 Q20 3 23 9" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
        {/* Face circle */}
        <Circle cx="20" cy="22" r="14" fill={fill} stroke={color} strokeWidth={2} />
        {/* Squinting arc eyes */}
        <Path d="M11 19 Q14 22 17 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M23 19 Q26 22 29 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Tear drops */}
        <Path d="M17 22 Q18 25 17 27 Q16 25 17 22 Z" fill={color} opacity={0.5} />
        <Path d="M24 22 Q25 25 24 27 Q23 25 24 22 Z" fill={color} opacity={0.5} />
        {/* Open cry mouth */}
        <Ellipse cx="20" cy="28" rx="4" ry="3" stroke={color} strokeWidth={2} fill={color} opacity={0.15} />
      </G>
    </Svg>
  );
}

export const PetIconMap: Record<PetState, React.FC<PetIconProps>> = {
  happy: HappyIcon,
  neutral: NeutralIcon,
  urgent: UrgentIcon,
};

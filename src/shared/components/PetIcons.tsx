// ============================================================
// Lumina — 3D Clay-Style Pet Baby Face Icons
// Recraft-generated PNG icons for dashboard pet states
// ============================================================

import React from 'react';
import { Image } from 'react-native';

export type PetState = 'happy' | 'neutral' | 'urgent';

export interface PetIconProps {
  size?: number;
  color?: string;
}

const images = {
  happy: require('../../../assets/pet/happy.png'),
  neutral: require('../../../assets/pet/neutral.png'),
  urgent: require('../../../assets/pet/urgent.png'),
};

function HappyIcon({ size = 40 }: PetIconProps) {
  return <Image source={images.happy} style={{ width: size, height: size }} resizeMode="contain" />;
}

function NeutralIcon({ size = 40 }: PetIconProps) {
  return <Image source={images.neutral} style={{ width: size, height: size }} resizeMode="contain" />;
}

function UrgentIcon({ size = 40 }: PetIconProps) {
  return <Image source={images.urgent} style={{ width: size, height: size }} resizeMode="contain" />;
}

export const PetIconMap: Record<PetState, React.FC<PetIconProps>> = {
  happy: HappyIcon,
  neutral: NeutralIcon,
  urgent: UrgentIcon,
};

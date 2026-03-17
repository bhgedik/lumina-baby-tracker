// ============================================================
// Lumina — 3D Clay-Style Icons for Logging Sheets
// Recraft-generated PNG icons used in bottom sheets and log screens
// ============================================================

import React from 'react';
import { Image } from 'react-native';

interface ClayIconProps {
  size?: number;
}

const iconSources = {
  'moon-nap': require('../../../assets/icons/moon-nap.png'),
  'moon-night': require('../../../assets/icons/moon-night.png'),
  'droplet-wet': require('../../../assets/icons/droplet-wet.png'),
  'cloud-dirty': require('../../../assets/icons/cloud-dirty.png'),
  'layers-both': require('../../../assets/icons/layers-both.png'),
  'sun-dry': require('../../../assets/icons/sun-dry.png'),
  'bottle': require('../../../assets/icons/bottle.png'),
  'play-timer': require('../../../assets/icons/play-timer.png'),
  'clock-past': require('../../../assets/icons/clock-past.png'),
  'thermometer': require('../../../assets/icons/thermometer.png'),
  'pill': require('../../../assets/icons/pill.png'),
  'book': require('../../../assets/icons/book.png'),
  'music': require('../../../assets/icons/music.png'),
  'breast': require('../../../assets/icons/breast.png'),
  'solids': require('../../../assets/icons/solids.png'),
  'bottle-bm': require('../../../assets/icons/bottle-bm.png'),
  'bottle-formula': require('../../../assets/icons/bottle-formula.png'),
} as const;

export type ClayIconName = keyof typeof iconSources;

export function ClayIcon({ name, size = 32 }: ClayIconProps & { name: ClayIconName }) {
  return (
    <Image
      source={iconSources[name]}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

export default ClayIcon;

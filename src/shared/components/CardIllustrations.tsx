// ============================================================
// Lumina — 3D Clay-Style Card Illustrations
// Recraft-generated PNG illustrations for dashboard cards
// ============================================================

import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface IllustrationProps {
  size?: number;
  color?: string;
}

const images = {
  feeding: require('../../../assets/illustrations/feeding.png'),
  sleep: require('../../../assets/illustrations/sleep.png'),
  diaper: require('../../../assets/illustrations/diaper.png'),
  growth: require('../../../assets/illustrations/growth.png'),
  health: require('../../../assets/illustrations/health.png'),
  activity: require('../../../assets/illustrations/activity.png'),
  pumping: require('../../../assets/illustrations/pumping.png'),
};

function FeedingIllustration({ size = 52 }: IllustrationProps) {
  return <Image source={images.feeding} style={{ width: size, height: size }} resizeMode="contain" />;
}

function SleepIllustration({ size = 52 }: IllustrationProps) {
  return <Image source={images.sleep} style={{ width: size, height: size }} resizeMode="contain" />;
}

function DiaperIllustration({ size = 52 }: IllustrationProps) {
  return <Image source={images.diaper} style={{ width: size, height: size }} resizeMode="contain" />;
}

function GrowthIllustration({ size = 52 }: IllustrationProps) {
  return <Image source={images.growth} style={{ width: size, height: size }} resizeMode="contain" />;
}

function HealthIllustration({ size = 52 }: IllustrationProps) {
  return <Image source={images.health} style={{ width: size, height: size }} resizeMode="contain" />;
}

function ActivityIllustration({ size = 52 }: IllustrationProps) {
  return <Image source={images.activity} style={{ width: size, height: size }} resizeMode="contain" />;
}

function PumpingIllustration({ size = 52 }: IllustrationProps) {
  return <Image source={images.pumping} style={{ width: size, height: size }} resizeMode="contain" />;
}

export const CardIllustrationMap: Record<string, React.FC<IllustrationProps>> = {
  feeding: FeedingIllustration,
  sleep: SleepIllustration,
  diaper: DiaperIllustration,
  growth: GrowthIllustration,
  health: HealthIllustration,
  activity: ActivityIllustration,
  pumping: PumpingIllustration,
};

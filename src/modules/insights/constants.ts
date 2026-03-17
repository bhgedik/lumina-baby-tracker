// ============================================================
// Lumina — Insights Shared Constants
// Tag colors and priority accents used across insight components
// ============================================================

import { colors } from '../../shared/constants/theme';
import type { InsightTag } from './types';

export const TAG_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  health_pattern:    { bg: colors.primary[50],    text: colors.primary[700],    icon: colors.primary[500] },
  sleep_alert:       { bg: '#EDE7F6',             text: '#5E35B1',              icon: '#7E57C2' },
  feeding_insight:   { bg: colors.secondary[50],  text: colors.secondary[700],  icon: colors.secondary[500] },
  diaper_pattern:    { bg: '#E3F2FD',             text: '#1565C0',              icon: '#42A5F5' },
  growth_note:       { bg: colors.primary[50],    text: colors.primary[700],    icon: colors.primary[500] },
  milestone_watch:   { bg: '#FFF8E1',             text: '#F57F17',              icon: '#FFB300' },
  general:           { bg: colors.neutral[100],   text: colors.neutral[700],    icon: colors.neutral[500] },
};

export const PRIORITY_ACCENT: Record<string, string> = {
  high: colors.secondary[500],
  medium: colors.primary[500],
  low: colors.neutral[300],
};

/** Map veteran rule categories to InsightTag */
export const VET_CATEGORY_TAG: Record<string, InsightTag> = {
  hydration: 'health_pattern',
  feeding: 'feeding_insight',
  routine: 'general',
  grooming: 'general',
  medication: 'health_pattern',
  skin_care: 'health_pattern',
  sleep: 'sleep_alert',
  checkup: 'health_pattern',
};
export const VET_CATEGORY_ICON: Record<string, string> = {
  hydration: 'droplet',
  feeding: 'droplet',
  routine: 'book-open',
  grooming: 'scissors',
  medication: 'thermometer',
  skin_care: 'shield',
  sleep: 'moon',
  checkup: 'eye',
};
export const VET_SEVERITY_PRIORITY: Record<string, 'low' | 'medium' | 'high'> = {
  info: 'low',
  warning: 'medium',
  urgent: 'high',
};

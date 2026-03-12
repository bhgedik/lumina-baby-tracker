// ============================================================
// Lumina — Date/Time Utilities
// ============================================================

import { format, formatDistanceToNow, differenceInMinutes, differenceInHours } from 'date-fns';

/**
 * Format a timestamp for display in the app.
 */
export function formatTime(date: string | Date): string {
  return format(new Date(date), 'h:mm a');
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, h:mm a');
}

/**
 * Get relative time string ("2 hours ago", "just now").
 */
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Calculate hours since a given timestamp.
 */
export function hoursSince(date: string | Date): number {
  return differenceInHours(new Date(), new Date(date));
}

/**
 * Calculate minutes since a given timestamp.
 */
export function minutesSince(date: string | Date): number {
  return differenceInMinutes(new Date(), new Date(date));
}

/**
 * Format duration in minutes to "Xh Ym" or "Ym" format.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Format seconds to "M:SS" for timers.
 */
export function formatTimerSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format weight based on preferred units.
 */
export function formatWeight(
  grams: number,
  units: 'metric' | 'imperial'
): string {
  if (units === 'imperial') {
    const lbs = grams / 453.592;
    const wholeLbs = Math.floor(lbs);
    const oz = Math.round((lbs - wholeLbs) * 16);
    return `${wholeLbs} lb ${oz} oz`;
  }
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
  return `${grams} g`;
}

/**
 * Format height/length based on preferred units.
 */
export function formatHeight(
  cm: number,
  units: 'metric' | 'imperial'
): string {
  if (units === 'imperial') {
    const inches = cm / 2.54;
    return `${inches.toFixed(1)} in`;
  }
  return `${cm.toFixed(1)} cm`;
}

/**
 * Format temperature based on preferred units.
 */
export function formatTemperature(
  celsius: number,
  units: 'metric' | 'imperial'
): string {
  if (units === 'imperial') {
    const f = (celsius * 9) / 5 + 32;
    return `${f.toFixed(1)}°F`;
  }
  return `${celsius.toFixed(1)}°C`;
}

/**
 * Format volume based on preferred units.
 */
export function formatVolume(
  ml: number,
  units: 'metric' | 'imperial'
): string {
  if (units === 'imperial') {
    const oz = ml / 29.5735;
    return `${oz.toFixed(1)} oz`;
  }
  return `${ml} ml`;
}

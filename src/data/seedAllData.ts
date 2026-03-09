// ============================================================
// Sprouty — Seed Data Generators
// Generates 30 days of realistic demo data for all tracking
// domains, simulating a mother with ~75% logging completion
// ============================================================

import { generateUUID } from '../stores/createSyncedStore';
import type { Baby } from '../modules/baby/types';
import type { FeedingLog } from '../modules/feeding/types';
import type { SleepLog } from '../modules/sleep/types';
import type { DiaperLog } from '../modules/diaper/types';
import type { PrimaryFeedingMethod } from '../shared/types/common';

// ─── Constants ───

const SEED_DAYS = 30;

// Per-day completeness factors — averages to 0.75 (75%)
// Index 0 = oldest day (30 days ago), index 29 = today
const DAILY_COMPLETENESS: number[] = [
  0.5, 0.0, 0.8, 0.8, 0.8, 1.0, 0.8, 0.8, 0.6, 1.0,
  0.8, 1.0, 0.8, 1.0, 0.8, 0.0, 0.8, 1.0, 0.8, 0.8,
  1.0, 0.6, 0.8, 1.0, 0.6, 0.8, 0.0, 1.0, 0.8, 1.0,
];

// Typical newborn feed times (every 2-3 hours)
const FEED_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

// Nap templates: [startHour, durationMinutes]
const NAP_TEMPLATES: [number, number][] = [
  [9, 55],   // Morning nap ~55 min
  [13, 70],  // Afternoon nap ~70 min
  [17, 40],  // Late nap ~40 min
];

// Diaper change times
const DIAPER_HOURS = [1, 4, 7, 10, 13, 16, 19];
const DIAPER_TYPES: ('wet' | 'dirty' | 'both')[] = [
  'wet', 'dirty', 'wet', 'both', 'wet', 'dirty', 'wet',
];

// ─── Helpers ───

/** Simple seeded pseudo-random using a day offset for determinism */
function seededRand(dayOffset: number, slot: number): number {
  const x = Math.sin(dayOffset * 127.1 + slot * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function dateAt(daysAgo: number, hours: number, minutes: number = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/** Pick `count` items from an array using seeded randomness */
function pickN<T>(items: T[], count: number, daySeed: number): T[] {
  if (count >= items.length) return [...items];
  if (count <= 0) return [];
  // Shuffle with seed, then take first `count`
  const indexed = items.map((item, i) => ({ item, sort: seededRand(daySeed, i * 13) }));
  indexed.sort((a, b) => a.sort - b.sort);
  return indexed.slice(0, count).map((x) => x.item);
}

// ─── Feeding ───

export function generateSeedFeedingData(
  baby: Baby,
  feedingMethod: PrimaryFeedingMethod,
): FeedingLog[] {
  const logs: FeedingLog[] = [];
  const now = new Date();
  let sideToggle = 0;

  for (let dayIdx = 0; dayIdx < SEED_DAYS; dayIdx++) {
    const daysAgo = SEED_DAYS - 1 - dayIdx;
    const completeness = DAILY_COMPLETENESS[dayIdx];
    if (completeness === 0) continue;

    const feedCount = Math.round(FEED_HOURS.length * completeness);
    const selectedHours = pickN(FEED_HOURS, feedCount, daysAgo);

    for (const hour of selectedHours) {
      const minuteOffset = Math.floor(seededRand(daysAgo, hour) * 30);
      const startDate = dateAt(daysAgo, hour, minuteOffset);

      // Skip future entries
      if (startDate > now) continue;

      const durationMin = 15 + Math.floor(seededRand(daysAgo, hour + 100) * 15); // 15-30 min
      const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

      const isBreast =
        feedingMethod === 'breast_only' ||
        (feedingMethod === 'mixed' && sideToggle % 2 === 0);

      const side = sideToggle % 2 === 0 ? 'left' as const : 'right' as const;
      const sideDuration = (8 + Math.floor(seededRand(daysAgo, hour + 200) * 10)) * 60; // 8-18 min in seconds

      const log: FeedingLog = {
        id: generateUUID(),
        baby_id: baby.id,
        family_id: baby.family_id,
        logged_by: 'seed-data',
        type: isBreast ? 'breast' : 'bottle',
        started_at: startDate.toISOString(),
        ended_at: endDate.toISOString(),
        breast_side: isBreast ? side : null,
        left_duration_seconds: isBreast && side === 'left' ? sideDuration : null,
        right_duration_seconds: isBreast && side === 'right' ? sideDuration : null,
        bottle_amount_ml: !isBreast ? 80 + Math.floor(seededRand(daysAgo, hour + 300) * 80) : null, // 80-160ml
        bottle_content: !isBreast ? (feedingMethod === 'formula_only' ? 'formula' : 'breast_milk') : null,
        bottle_temperature: !isBreast ? 'warm' : null,
        solid_foods: null,
        sensitivity_notes: null,
        notes: null,
        baby_response: seededRand(daysAgo, hour + 400) > 0.8 ? 'fussy' : 'good',
        photo_url: null,
        created_at: startDate.toISOString(),
        updated_at: startDate.toISOString(),
      };

      logs.push(log);
      sideToggle++;
    }
  }

  return logs;
}

// ─── Sleep ───

export function generateSeedSleepData(baby: Baby): SleepLog[] {
  const logs: SleepLog[] = [];
  const now = new Date();

  for (let dayIdx = 0; dayIdx < SEED_DAYS; dayIdx++) {
    const daysAgo = SEED_DAYS - 1 - dayIdx;
    const completeness = DAILY_COMPLETENESS[dayIdx];
    if (completeness === 0) continue;

    // Night sleep (always included if day is not skipped)
    const nightVariation = Math.floor(seededRand(daysAgo, 50) * 60) - 30; // -30 to +30 min
    const nightStartHour = 21 + (seededRand(daysAgo, 51) > 0.5 ? 1 : 0); // 9pm or 10pm
    const nightStart = dateAt(daysAgo + 1, nightStartHour, 30 + Math.floor(seededRand(daysAgo, 52) * 30));
    const nightDuration = 420 + nightVariation + Math.floor(seededRand(daysAgo, 53) * 60); // 390-510 min (~6.5-8.5h)
    const nightEnd = new Date(nightStart.getTime() + nightDuration * 60 * 1000);
    const wakings = 1 + Math.floor(seededRand(daysAgo, 54) * 3); // 1-3 wakings

    if (nightEnd <= now) {
      logs.push({
        id: generateUUID(),
        baby_id: baby.id,
        family_id: baby.family_id,
        logged_by: 'seed-data',
        type: 'night',
        started_at: nightStart.toISOString(),
        ended_at: nightEnd.toISOString(),
        duration_minutes: nightDuration,
        method: seededRand(daysAgo, 55) > 0.5 ? 'nursed' : null,
        location: 'crib',
        quality: Math.ceil(seededRand(daysAgo, 56) * 3) + 2 as 1 | 2 | 3 | 4 | 5, // 3-5
        night_wakings: wakings,
        room_temperature_celsius: null,
        notes: null,
        created_at: nightStart.toISOString(),
        updated_at: nightEnd.toISOString(),
      });
    }

    // Naps — based on completeness
    const napCount = Math.max(0, Math.round(NAP_TEMPLATES.length * completeness) - 1); // 0-3 naps (night counts as 1)
    const selectedNaps = pickN(NAP_TEMPLATES, napCount, daysAgo + 1000);

    for (const [napHour, baseDuration] of selectedNaps) {
      const napMinuteOffset = Math.floor(seededRand(daysAgo, napHour * 7) * 20);
      const napStart = dateAt(daysAgo, napHour, napMinuteOffset);

      if (napStart > now) continue;

      const durationVariation = Math.floor(seededRand(daysAgo, napHour * 7 + 1) * 20) - 10; // -10 to +10 min
      const napDuration = Math.max(20, baseDuration + durationVariation);
      const napEnd = new Date(napStart.getTime() + napDuration * 60 * 1000);

      if (napEnd > now) continue;

      const methods = ['nursed', 'rocked', 'held', 'self_soothed', 'patted'] as const;
      const locations = ['crib', 'bassinet', 'carrier', 'stroller'] as const;

      logs.push({
        id: generateUUID(),
        baby_id: baby.id,
        family_id: baby.family_id,
        logged_by: 'seed-data',
        type: 'nap',
        started_at: napStart.toISOString(),
        ended_at: napEnd.toISOString(),
        duration_minutes: napDuration,
        method: methods[Math.floor(seededRand(daysAgo, napHour * 7 + 2) * methods.length)],
        location: locations[Math.floor(seededRand(daysAgo, napHour * 7 + 3) * locations.length)],
        quality: null,
        night_wakings: null,
        room_temperature_celsius: null,
        notes: null,
        created_at: napStart.toISOString(),
        updated_at: napEnd.toISOString(),
      });
    }
  }

  return logs;
}

// ─── Diapers ───

export function generateSeedDiaperData(baby: Baby): DiaperLog[] {
  const logs: DiaperLog[] = [];
  const now = new Date();

  for (let dayIdx = 0; dayIdx < SEED_DAYS; dayIdx++) {
    const daysAgo = SEED_DAYS - 1 - dayIdx;
    const completeness = DAILY_COMPLETENESS[dayIdx];
    if (completeness === 0) continue;

    const diaperCount = Math.round(DIAPER_HOURS.length * completeness);
    const selectedIndices = pickN(
      DIAPER_HOURS.map((_, i) => i),
      diaperCount,
      daysAgo + 2000,
    );

    for (const idx of selectedIndices) {
      const hour = DIAPER_HOURS[idx];
      const minuteOffset = Math.floor(seededRand(daysAgo, hour * 11) * 30);
      const logTime = dateAt(daysAgo, hour, minuteOffset);

      if (logTime > now) continue;

      const type = DIAPER_TYPES[idx];
      const isDirty = type === 'dirty' || type === 'both';

      const stoolColors = ['yellow', 'green', 'brown'] as const;
      const consistencies = ['seedy', 'soft', 'liquid'] as const;

      logs.push({
        id: generateUUID(),
        baby_id: baby.id,
        family_id: baby.family_id,
        logged_by: 'seed-data',
        logged_at: logTime.toISOString(),
        type,
        stool_color: isDirty ? stoolColors[Math.floor(seededRand(daysAgo, hour * 11 + 1) * stoolColors.length)] : null,
        stool_consistency: isDirty ? consistencies[Math.floor(seededRand(daysAgo, hour * 11 + 2) * consistencies.length)] : null,
        has_rash: seededRand(daysAgo, hour * 11 + 3) > 0.92, // ~8% chance of rash
        notes: null,
        created_at: logTime.toISOString(),
        updated_at: logTime.toISOString(),
      });
    }
  }

  return logs;
}

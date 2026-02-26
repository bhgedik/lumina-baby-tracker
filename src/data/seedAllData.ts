// ============================================================
// Nodd — Seed Data Generators
// Generates realistic demo data for all tracking domains
// ============================================================

import { generateUUID } from '../stores/createSyncedStore';
import type { Baby } from '../modules/baby/types';
import type { FeedingLog } from '../modules/feeding/types';
import type { SleepLog } from '../modules/sleep/types';
import type { DiaperLog } from '../modules/diaper/types';
import type { MoodEntry, MoodEmoji } from '../stores/motherMoodStore';
import type { SymptomEntry, WeightEntry, BodyArea, SeverityLevel } from '../stores/motherWellnessStore';
import type { PrimaryFeedingMethod } from '../shared/types/common';

// ─── Helpers ───

function todayAt(hours: number, minutes: number = 0): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function yesterdayAt(hours: number, minutes: number = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function daysAgo(days: number, hours: number = 12, minutes: number = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// ─── Feeding ───

export function generateSeedFeedingData(
  baby: Baby,
  feedingMethod: PrimaryFeedingMethod,
): FeedingLog[] {
  const logs: FeedingLog[] = [];
  const now = new Date();

  // 8 feeds spread across today, every 2-3 hours starting from midnight
  const feedTimes = [0, 3, 6, 8, 11, 14, 17, 20];
  let side: 'left' | 'right' = 'left';

  for (let i = 0; i < feedTimes.length; i++) {
    const hour = feedTimes[i];
    const startDate = todayAt(hour, Math.floor(Math.random() * 30));

    // Only include feeds that are in the past
    if (startDate > now) continue;

    const durationMin = 15 + Math.floor(Math.random() * 11); // 15-25 min
    const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

    const isBreast = feedingMethod === 'breast_only' ||
      (feedingMethod === 'mixed' && i % 2 === 0);

    const log: FeedingLog = {
      id: generateUUID(),
      baby_id: baby.id,
      family_id: baby.family_id,
      logged_by: 'seed-data',
      type: isBreast ? 'breast' : 'bottle',
      started_at: startDate.toISOString(),
      ended_at: endDate.toISOString(),
      breast_side: isBreast ? side : null,
      left_duration_seconds: isBreast && side === 'left' ? (8 + Math.floor(Math.random() * 8)) * 60 : null,
      right_duration_seconds: isBreast && side === 'right' ? (8 + Math.floor(Math.random() * 8)) * 60 : null,
      bottle_amount_ml: !isBreast ? 90 + Math.floor(Math.random() * 61) : null, // 90-150ml
      bottle_content: !isBreast ? 'formula' : null,
      bottle_temperature: !isBreast ? 'warm' : null,
      solid_foods: null,
      notes: null,
      baby_response: null,
      photo_url: null,
      created_at: startDate.toISOString(),
      updated_at: startDate.toISOString(),
    };

    logs.push(log);
    side = side === 'left' ? 'right' : 'left';
  }

  return logs;
}

// ─── Sleep ───

export function generateSeedSleepData(baby: Baby): SleepLog[] {
  const logs: SleepLog[] = [];
  const now = new Date();

  // Night sleep: ~10pm yesterday to ~6am today (480 min)
  const nightStart = yesterdayAt(22, 0);
  const nightEnd = todayAt(6, 0);
  logs.push({
    id: generateUUID(),
    baby_id: baby.id,
    family_id: baby.family_id,
    logged_by: 'seed-data',
    type: 'night',
    started_at: nightStart.toISOString(),
    ended_at: nightEnd.toISOString(),
    duration_minutes: 480,
    method: null,
    location: 'crib',
    quality: null,
    night_wakings: 2,
    room_temperature_celsius: null,
    notes: null,
    created_at: nightStart.toISOString(),
    updated_at: nightEnd.toISOString(),
  });

  // Nap 1: 9am–10am (60 min)
  const nap1Start = todayAt(9, 0);
  const nap1End = todayAt(10, 0);
  if (nap1End <= now) {
    logs.push({
      id: generateUUID(),
      baby_id: baby.id,
      family_id: baby.family_id,
      logged_by: 'seed-data',
      type: 'nap',
      started_at: nap1Start.toISOString(),
      ended_at: nap1End.toISOString(),
      duration_minutes: 60,
      method: null,
      location: 'crib',
      quality: null,
      night_wakings: null,
      room_temperature_celsius: null,
      notes: null,
      created_at: nap1Start.toISOString(),
      updated_at: nap1End.toISOString(),
    });
  }

  // Nap 2: 1pm–2:15pm (75 min)
  const nap2Start = todayAt(13, 0);
  const nap2End = todayAt(14, 15);
  if (nap2End <= now) {
    logs.push({
      id: generateUUID(),
      baby_id: baby.id,
      family_id: baby.family_id,
      logged_by: 'seed-data',
      type: 'nap',
      started_at: nap2Start.toISOString(),
      ended_at: nap2End.toISOString(),
      duration_minutes: 75,
      method: null,
      location: 'crib',
      quality: null,
      night_wakings: null,
      room_temperature_celsius: null,
      notes: null,
      created_at: nap2Start.toISOString(),
      updated_at: nap2End.toISOString(),
    });
  }

  return logs;
}

// ─── Diapers ───

export function generateSeedDiaperData(baby: Baby): DiaperLog[] {
  const logs: DiaperLog[] = [];
  const now = new Date();

  // 7 diapers spread across today: 4 wet, 2 dirty, 1 both
  const schedule: { hour: number; type: 'wet' | 'dirty' | 'both' }[] = [
    { hour: 1, type: 'wet' },
    { hour: 4, type: 'dirty' },
    { hour: 7, type: 'wet' },
    { hour: 10, type: 'both' },
    { hour: 13, type: 'wet' },
    { hour: 16, type: 'dirty' },
    { hour: 19, type: 'wet' },
  ];

  for (const entry of schedule) {
    const logTime = todayAt(entry.hour, Math.floor(Math.random() * 30));
    if (logTime > now) continue;

    const isDirty = entry.type === 'dirty' || entry.type === 'both';

    logs.push({
      id: generateUUID(),
      baby_id: baby.id,
      family_id: baby.family_id,
      logged_by: 'seed-data',
      logged_at: logTime.toISOString(),
      type: entry.type,
      stool_color: isDirty ? 'yellow' : null,
      stool_consistency: isDirty ? 'seedy' : null,
      has_rash: false,
      notes: null,
      created_at: logTime.toISOString(),
      updated_at: logTime.toISOString(),
    });
  }

  return logs;
}

// ─── Mood ───

export function generateSeedMoodData(): MoodEntry[] {
  const moods: MoodEmoji[] = ['good', 'okay', 'good', 'struggling', 'okay', 'good', 'okay'];
  const entries: MoodEntry[] = [];

  for (let i = 0; i < moods.length; i++) {
    const dayOffset = moods.length - 1 - i; // 6 days ago → today
    const loggedAt = daysAgo(dayOffset, 9, 0).getTime();

    entries.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + i,
      mood: moods[i],
      loggedAt,
      notes: moods[i] === 'struggling' ? 'Rough night, very tired' : null,
    });
  }

  return entries;
}

// ─── Wellness (Symptoms + Weight) ───

export function generateSeedWellnessData(): {
  symptoms: SymptomEntry[];
  weights: WeightEntry[];
} {
  const symptoms: SymptomEntry[] = [
    {
      id: Date.now().toString(36) + 'sw1',
      bodyArea: 'back' as BodyArea,
      symptom: 'Lower back pain',
      severity: 3 as SeverityLevel,
      notes: 'Worse after sitting for a long time',
      loggedAt: daysAgo(2, 10).getTime(),
    },
    {
      id: Date.now().toString(36) + 'sw2',
      bodyArea: 'breast' as BodyArea,
      symptom: 'Breast tenderness',
      severity: 2 as SeverityLevel,
      notes: null,
      loggedAt: daysAgo(1, 14).getTime(),
    },
    {
      id: Date.now().toString(36) + 'sw3',
      bodyArea: 'head' as BodyArea,
      symptom: 'Headache',
      severity: 2 as SeverityLevel,
      notes: 'Mild, probably dehydration',
      loggedAt: daysAgo(0, 8).getTime(),
    },
  ];

  const weights: WeightEntry[] = [
    {
      id: Date.now().toString(36) + 'wt1',
      weightKg: 72,
      loggedAt: daysAgo(7, 8).getTime(),
      notes: null,
    },
    {
      id: Date.now().toString(36) + 'wt2',
      weightKg: 71.2,
      loggedAt: daysAgo(0, 8).getTime(),
      notes: null,
    },
  ];

  return { symptoms, weights };
}

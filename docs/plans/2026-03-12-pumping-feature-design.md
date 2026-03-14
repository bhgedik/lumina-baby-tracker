# Pumping (Expressing Milk) Feature Design

**Date**: 2026-03-12
**Status**: Approved

## Overview

Add a dedicated Pumping module for mothers to log expressing milk sessions. Includes timer support, per-side volume tracking, and full integration across home screen, calendar/timeline views, and database.

## Architecture

Dedicated module at `src/modules/pumping/` following the same pattern as feeding/sleep/diaper modules. Separate Zustand store, types, DB table, and sheet component.

## 1. Home Screen Button

Add 5th button to `PRIMARY_ACTIONS` in `home.tsx`:
- **id**: `pumping`
- **label**: `Pump`
- **icon**: `droplet` (Feather)
- **bg**: `#F0EBF5` (lavender tint)
- **tint**: `#A78BBA` (primary lavender)

Sheet state: `showPumpingSheet` boolean, opened on tap.

## 2. Pumping Sheet Modal (`PumpingSheet.tsx`)

Bottom sheet with two entry cards:

### Card A: "Start Timer"
- Starts a pumping timer with elapsed time display
- Side selector: Left / Right / Both (toggleable mid-session)
- Stop button reveals volume entry screen

### Card B: "Log Past Session"
- Time picker for when it happened
- Duration input (minutes)
- Falls through to volume entry screen

### Volume Entry Screen
- **Left breast**: numeric input (ml), large touch target, stepper buttons (+10 / -10)
- **Right breast**: numeric input (ml), same pattern
- **Total**: auto-calculated (left + right), manually editable override
- **Save** button with toast: "Pumped 120 ml logged"

Accent color throughout: `#A78BBA` (primary lavender)

## 3. Types

### `src/shared/types/common.ts`
```typescript
export type PumpingSide = 'left' | 'right' | 'both';
```

### `src/modules/pumping/types.ts`
```typescript
export interface PumpingLog extends Timestamps {
  id: UUID;
  baby_id: UUID;
  family_id: UUID;
  logged_by: UUID;
  started_at: ISO8601;
  ended_at: ISO8601 | null;
  duration_seconds: number | null;
  side: PumpingSide;
  left_volume_ml: number | null;
  right_volume_ml: number | null;
  total_volume_ml: number;
  notes: string | null;
}
```

## 4. Store (`src/stores/pumpingStore.ts`)

Zustand store following feedingStore pattern:
- `items: PumpingLog[]`
- `syncQueue: SyncQueueItem[]`
- `activeTimer: PumpingTimer | null`
- Methods: `addItem`, `startTimer`, `pauseTimer`, `resumeTimer`, `stopTimer`, `clearTimer`, `getSummaryToday`
- Persisted via AsyncStorage (`@sprout/pumping-logs`, `@sprout/pumping-timer`)
- Sync queue targets `pumping_logs` table

## 5. Database Migration

New file: `supabase/migrations/00019_create_pumping_logs.sql`

```sql
CREATE TABLE pumping_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  side TEXT NOT NULL CHECK (side IN ('left', 'right', 'both')) DEFAULT 'both',
  left_volume_ml NUMERIC(5,1),
  right_volume_ml NUMERIC(5,1),
  total_volume_ml NUMERIC(5,1) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pumping_logs_baby_time ON pumping_logs(baby_id, started_at DESC);
CREATE INDEX idx_pumping_logs_family ON pumping_logs(family_id);
```

RLS policies using `get_user_family_id()` boundary (same pattern as other tables).

## 6. Calendar/Timeline Integration

### Event type registration in `calendar.tsx`:
```typescript
pumping: { color: '#A78BBA', bg: '#F0EBF5', icon: 'droplet', label: 'Pumping' }
```

### Display format:
- Daily view: "Pumped — 120 ml" (or "L: 50ml, R: 70ml" in expanded view)
- Weekly grid: lavender-colored blocks
- Monthly summary: included in feed totals

### Sample events added to mock data for development.

## Constraints

- Respects `feedingMethod` content safety (formula_only parents may still pump)
- Uses `family_id` RLS boundary for all queries
- Offline-first: all data goes through sync queue
- Timer persists across app backgrounding (AsyncStorage)

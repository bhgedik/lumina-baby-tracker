# Navigation Overhaul & Header Polish — Design

## Goal

Shift from "Content-First" to "Action-First" navigation. Merge the header into a compact single row, rename Daily to Journal (calendar/history view), and migrate educational content to the Guide tab.

## Header

- Large bold screen title (left-aligned) in the nav bar — replaces both the empty `headerTitle` and the in-screen header
- Profile icon moves from left to right
- Calendar header button removed (absorbed into Journal tab)
- Result: single compact header row, no wasted whitespace

## Tab Structure

| # | Name | Icon | Purpose |
|---|---|---|---|
| 1 | Home | `home` | Quick actions & real-time status |
| 2 | Journal | `book` | Health Check card + Calendar timeline (Daily/Weekly/Monthly) |
| 3 | Lumina | FAB | AI Chat |
| 4 | Guide | `book-open` | Today's Insight + Current Focus + Knowledge + Myths |
| 5 | Milestones/Checklist | `trending-up`/`check-square` | Growth & development |

## Content Migration

### Daily → Journal
- Keep: Health Check card (sleep/feeding/diaper signals) at top
- Add: Calendar/Timeline content from `calendar.tsx` (Daily/Weekly/Monthly segmented views) as main content
- Remove: Educational cards (Smart Suggestions, Daily Note, Developmental Nudges)

### Daily → Guide
- Move: Smart Suggestions (`generateSmartSuggestions`) as "Today's Insight" section at the very top of Guide
- Move: Daily Note card and Developmental Nudges into "Today's Insight"
- These are time-sensitive, age-aware educational cards that belong in the knowledge layer

### Deletions
- Old `daily.tsx` content replaced entirely by Journal
- `calendar.tsx` standalone route becomes redundant after inlining into Journal

## Files Affected

- `app/(app)/(tabs)/_layout.tsx` — header restructure, tab rename, icon changes
- `app/(app)/(tabs)/daily.tsx` — rewrite as Journal (Health Check + Calendar)
- `app/(app)/(tabs)/guide.tsx` — add Today's Insight section at top
- `app/(app)/(tabs)/home.tsx` — remove in-screen header (use nav bar title)
- `app/(app)/(tabs)/lumina-hub.tsx` — remove in-screen header if applicable
- `app/(app)/calendar.tsx` — content moves into Journal tab
- All other tab screens — remove duplicate in-screen headers

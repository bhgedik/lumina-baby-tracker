# Nodd — Logic Ledger

> A comprehensive map of every hidden rule, conditional behavior, data transformation, and AI decision in the app.
> Generated: 2026-03-01

---

## Table of Contents

1. [Conditional UI & Hidden States](#1-conditional-ui--hidden-states)
2. [AI System Rules & Persona](#2-ai-system-rules--persona)
3. [Data Transformations & Calculations](#3-data-transformations--calculations)
4. [Intent Routing](#4-intent-routing)

---

## 1. Conditional UI & Hidden States

### 1.1 Pregnancy vs Postpartum — The Master Switch

**File:** `app/(app)/(tabs)/_layout.tsx`

The entire app flips based on `baby.is_pregnant`:

| Tab | Pregnancy | Postpartum |
|-----|-----------|------------|
| Home | Visible | Visible |
| Checklist | **Visible** | Hidden |
| Insights | Hidden | **Visible** |
| Nurse | Hidden | **Visible** |
| Progress | Hidden | **Visible** |
| Profile | Visible | Visible |

**Home Screen also bifurcates:**
- **Pregnancy mode:** PrepDashboard + CelebrationModal + birth date sheet
- **Postpartum mode:** Omni-Input + greeting + 6-button action grid + AI chat

### 1.2 Milestone State Machine (Progress Tab)

**File:** `app/(app)/(tabs)/progress.tsx`

Each milestone has 3 states:

| State | Visual | Interactions |
|-------|--------|-------------|
| `future` | Opacity 0.5, lock icon | Disabled — not expandable |
| `current` | Pulsing glow border | Expandable, "We saw this!" button |
| `celebrated` | Check icon, sparkle badge | Expandable, no action button |

**Trigger:** `effectiveAgeMonths >= milestone.expectedStartMonth`
**Sorting:** celebrated → current → future
**Confetti:** Only fires when `state === 'current'` and user taps celebrate

### 1.3 Insight Card Dismiss Tracking

**File:** `src/stores/insightDismissStore.ts`

- Dismiss keyed by **content hash** (not card ID)
- Hidden if `isDismissed(hash) && !isExpired(dismissedAt)`
- **Auto-prune:** Dismissed entries expire after **7 days**
- **Persistence:** AsyncStorage `@nodd/insight-dismiss-v1`
- If content changes (new hash), card re-appears even if previously dismissed

### 1.4 Content Filtering by Feeding Method

**File:** `src/ai/contentFilter.ts`

| Parent's Method | Content **Removed** |
|-----------------|---------------------|
| `formula_only` | breastfeeding, nursing, latching, breast_pump, milk_supply, nursing_position, nipple_care, lactation |
| `breast_only` | formula_selection, formula_comparison, bottle_brand, formula_preparation |
| `mixed` | Nothing filtered |

### 1.5 Allergy-Based Content Filtering (Strict — Liability)

**File:** `src/ai/contentFilter.ts`

If `baby.known_allergies` includes any allergen, ALL content with matching tags is removed:

| Allergen | Blocked Tags |
|----------|-------------|
| `cma` | dairy, milk, cheese, yogurt, butter, cream |
| `egg` | egg, eggs, mayonnaise |
| `peanut` | peanut, peanut_butter |
| `tree_nut` | almond, cashew, walnut, pecan, pistachio |
| `wheat` | wheat, bread, pasta, flour |
| `soy` | soy, tofu, edamame |
| `fish` | fish, salmon, tuna, cod |
| `shellfish` | shrimp, crab, lobster, shellfish |
| `sesame` | sesame, tahini |

### 1.6 Experience Level Filter

| Level | Effect |
|-------|--------|
| `first_time` | Show all content including beginner/basics tags |
| `experienced` | Remove tags `beginner`, `basics` |

### 1.7 Age-Based Recommendations

**File:** `app/(app)/(tabs)/insights.tsx`

| Age Range | Recommendations Shown |
|-----------|----------------------|
| ≤4 weeks | Contrast cards + Tummy time |
| 1–3 months | Social smile + Sleep routine |
| 3–6 months | Reaching & grasping |
| 4–6 months | Solids readiness |
| No match | Generic "Log more data" |

### 1.8 Smart Suggestions (Nurse Tab)

**File:** `app/(app)/(tabs)/nurse.tsx`

| Condition | Suggestions Shown |
|-----------|-------------------|
| Age ≤2 weeks | Colostrum + Newborn sleep |
| 3–6 weeks | Growth spurt |
| 6–12 weeks | Social milestones |
| 12–20 weeks | Flexible routine |
| `sleepHours < 3` | Wake windows tip (with visual guide) |
| `totalFeeds ≥ 10` | Cluster feeding message |
| Always | "A moment for you" wellness tip |

### 1.9 Health Signal Indicators (Nurse Tab)

| Signal | Shown If | Green If | Orange If |
|--------|----------|----------|-----------|
| Sleep | `sleepHours !== null` | `sleepHours ≥ 3` | `< 3` |
| Feeding | `totalFeeds > 0` | `totalFeeds ≥ 6` | `< 6` |
| Diapers | `totalWet + totalDirty > 0` | Always green | — |

### 1.10 Voice Input — Simulator vs Device

**File:** `app/(app)/(tabs)/home.tsx`

| Context | Behavior |
|---------|----------|
| `__DEV__` (Simulator) | 2s delay → auto-inject random mock transcription |
| Production | Real audio capture & transcription (TODO) |

### 1.11 Corrected Age Display

**File:** `app/(app)/(tabs)/progress.tsx`

When baby is preterm (`gestational_age_weeks < 37`), age labels append `" (corrected)"`.

### 1.12 Platform-Specific Rendering

| Element | iOS | Android |
|---------|-----|---------|
| Serif font | Georgia | serif |
| Picker style | 200h wheel | 56h dropdown |
| Keyboard behavior | `padding` | `undefined` or `height` |

### 1.13 Empty States

| Screen | Condition | Shown |
|--------|-----------|-------|
| Insights | `totalCards === 0` | "Insights are brewing" placeholder |
| Progress | `celebratedCount === 0` | "Your journey begins here" |
| Nurse health | `healthSignals.length === 0` | "Log feeds, sleep, diapers..." |

### 1.14 Active Timer Bar

**File:** `src/shared/components/ActiveTimerBar.tsx`

- Rendered only when `activeTimer` exists
- Icon: feeding → `coffee`, sleep → `moon`
- Pause button visible only for feeding timers when not already paused

### 1.15 Onboarding — Gestational Age Step

```
canContinue = isPregnant
  ? weeks !== null
  : wasPreterm !== null && (!wasPreterm || weeks !== null)
```

Pregnant parents must enter weeks. Non-pregnant parents must answer preterm question, then weeks only if preterm.

---

## 2. AI System Rules & Persona

### 2.1 Execution Flow — Safety Architecture

```
Log Entry Created
       ↓
[RED FLAG INTERCEPTOR] ← Runs FIRST (hardcoded, synchronous)
  ↓           ↓
MATCH      NO MATCH
  ↓           ↓
HALT      [VETERAN NURSE RULES] ← Expert pattern matching
Show         ↓         ↓
Emergency  MATCH    NO MATCH
State        ↓         ↓
          Display   [INTERVENTION ENGINE]
          Card      Evaluate engagement level
                       ↓
                    PASSIVE / REACTIVE / EMPATHIC / PROACTIVE
                       ↓
                    Should Call AI?
                    ↓          ↓
                   NO         YES
                    ↓          ↓
                 Static    [CONTENT FILTER] → [LIFECYCLE PROMPT] → [CLAUDE API]
                 Content
```

### 2.2 Red Flag Interceptor (Hardcoded — No AI)

**File:** `src/ai/redFlagInterceptor.ts`

Runs synchronously BEFORE any AI. First match short-circuits.

| Flag | Trigger | Action |
|------|---------|--------|
| `fever_under_3mo` | Temp ≥38.3°C AND age <90 days | **Go to ER** — "Do NOT give fever reducers" |
| `projectile_vomiting` | Symptom in baby <180 days | **Call pediatrician** — "May indicate pyloric stenosis" |
| `lethargy` | Symptom in baby <365 days | **Go to ER** — "NOT normal sleepiness" |
| `no_wet_diaper_12h_newborn` | No wet >12h AND age <30 days | **Call pediatrician** — "Sign of severe dehydration" |
| `breathing_difficulty` | Breathing/blue lips/grunting AND age <365 days | **Call 911** — Immediate emergency |
| `epds_self_harm` | EPDS Q10 score ≥1 | **Crisis resources** — PSI 1-800-944-4773, Text 741741, 988 Lifeline |

### 2.3 Intervention Engine (4-Tier)

**File:** `src/ai/interventionEngine.ts`

#### Level 1: PASSIVE
- No risk conditions → no AI call → static content only

#### Level 2: REACTIVE (High Priority)
| Trigger | Threshold | Priority |
|---------|-----------|----------|
| Feeding gap | >5h (if <3mo) or >8h (if ≥3mo) | high |
| Low wet diapers | <4 (if <1mo) or <6 (if ≥1mo) | high |
| EPDS score | ≥13 | **critical** |

#### Level 3: EMPATHIC (Medium Priority)
| Trigger | Pattern |
|---------|---------|
| Night exhaustion | >6 logs in last 3 nights |
| Anxiety spiral | Burst logging pattern detected |
| Gap-then-burst | 48h+ gap followed by 2× avg daily logs |

#### Level 4: PROACTIVE
- Scheduled tasks (eye exams, hearing tests)

### 2.4 Veteran Nurse Rules

**File:** `src/ai/veteranInsights.ts`

Rules fire one at a time (first match). Matched by log_type → age_range → condition evaluation.

#### Feeding Rules

| Rule | Trigger | Age | Key Insight |
|------|---------|-----|-------------|
| `urate_crystals` | Orange/pink stain + wet diaper | 0–5 days | Concentrated urine, not blood. Track wet diapers (6+ by day 4) |
| `feeding_refusal_nasal` | Baby refuses breast/bottle | 0–365 days | Check nose first — babies are obligate nose breathers. 5-step nasal aspirator guide |

#### Bathing & Grooming

| Rule | Trigger | Age | Key Insight |
|------|---------|-----|-------------|
| `bath_hair_drying` | Bath logged | 0–365 days | Never use hair dryer. Pat dry + 100% cotton hat. Replace if damp after 10 min |
| `newborn_nail_care` | Nail/grooming logged | 0–30 days | No clippers first month. Use glass file or gentle peeling |

#### Medication

| Rule | Trigger | Age | Key Insight |
|------|---------|-----|-------------|
| `antipyretic_checkin` | Calpol/paracetamol/ibuprofen logged | 0–3 years | Temp drop to ~35°C is normal. Re-measure 30 min. Don't redose 4h (paracetamol) / 6h (ibuprofen). **Timer: 45 minutes** |
| `medication_syringe_rule` | Any medication logged | 0–2 years | NEVER mix in bottle. Oral syringe aimed at inner cheek, not throat |

#### Skin Care

| Rule | Trigger | Age | Key Insight |
|------|---------|-----|-------------|
| `diaper_rash_cream_rule` | `has_rash=true` | 0–3 years | Apply cream ONLY on completely dry skin. Pat dry or cool hairdryer 30cm away |

#### Sleep & Environment

| Rule | Trigger | Age | Key Insight |
|------|---------|-----|-------------|
| `tog_layering_advice` | Room temp recorded | 0–3 years | TOG scale: >27°C (0.2 TOG) → <18°C (3.5 TOG). Target: 20–22°C, 40–60% humidity |

#### Health Checkups (Proactive)

| Rule | Trigger | Age | Key Insight |
|------|---------|-----|-------------|
| `eye_exam_year1` | No eye exam logged | 11–13 months | AOA recommends 12mo comprehensive exam. Early strabismus/amblyopia detection |
| `eye_exam_year3` | No eye exam logged | 35–37 months | Last window for amblyopia treatment. Success drops after age 7 |
| `hearing_test_newborn` | No hearing test logged | 0–30 days | Must complete before hospital discharge |

### 2.5 Pre-Birth Quest System (Prenatal)

7 prioritized preparation tasks:

| Priority | Quest | Category |
|----------|-------|----------|
| 1 | Remove all tags from newborn clothes | preparation |
| 2 | Check clothing for plastic prints | preparation |
| 3 | Set up room thermometer & hygrometer (20–22°C, 40–60% humidity) | nursery |
| 4 | Get a digital baby scale | equipment |
| 5 | Get a rectal thermometer (gold standard <3mo) | equipment |
| 6 | Get a nasal aspirator | equipment |
| 7 | Prepare 5–6 cotton hats | clothing |

### 2.6 Lifecycle-Specific AI Prompts

**Files:** `src/ai/promptTemplates/*.ts`

| Stage | Age | Focus Areas |
|-------|-----|-------------|
| **Prenatal** | Pre-birth | Birth prep, hospital bag, nursery, Pre-Birth Quests. Adjust for experience level |
| **4th Trimester** | 0–3 mo | Feeding establishment, survival sleep, postpartum recovery, EPDS awareness, newborn care basics |
| **Transition** | 3–6 mo | Sleep windows, routine building, tummy time, social development, 4-month regression |
| **Exploration** | 6–12 mo | Solid foods, allergy introduction (3-day rule), motor skills, separation anxiety, babyproofing |
| **Toddler** | 12+ mo | Language (sportscasting), boundaries, tantrums-are-normal, potty readiness, play-based learning |

### 2.7 AI Chat Persona (Edge Function)

**File:** `supabase/functions/ai-chat/index.ts`

**Model:** Claude Sonnet 4 | **Max tokens:** 512

**Core Rules:**
- **POSITIVITY FIRST** — Always start with validation. Never induce panic.
- **Medical callout format:** `**🩺 PLEASE CONSULT YOUR DOCTOR:** [reason]` — on its own line, never buried
- **ACTIONABLE GUIDANCE** — Never give advice without HOW. Numbered steps, one action each.
- **STRICT:** Never diagnose. Never contradict AAP/WHO/ACOG. Self-harm → 988 Lifeline immediately.
- **Length:** 2–4 short paragraphs + steps. Bold key terms.

**Context Enrichment:**
- `babyAgeDays`: Formatted as Day X (0–14) / Week X (3–12) / Month X (after)
- `feedingMethod`: formula_only → "NEVER mention breastfeeding" / breast_only → "NEVER mention formula"

### 2.8 Diaper Vision Analysis (2-Pass Safety)

**File:** `supabase/functions/analyze-diaper/index.ts`

| Pass | Purpose | If Fails |
|------|---------|----------|
| 1 | Privacy check — "SAFE or UNSAFE?" | Return `{ safe: false, error: 'privacy' }` |
| 2 | Stool analysis — color + consistency | Return JSON with validated enums |

Valid colors: yellow, green, brown, black, red, white, orange
Valid consistencies: liquid, soft, formed, hard, mucousy, seedy

### 2.9 Prep Suggestions (Pregnancy)

**File:** `supabase/functions/prep-suggestions/index.ts`

**SCIENCE-ONLY rule:** Every suggestion must cite ACOG, AAP, WHO, CDC, or peer-reviewed sources. NO cultural traditions, folk remedies, superstitions. Strictly evidence-based.

### 2.10 Activity Suggestions

**File:** `supabase/functions/ai-activity-suggestions/index.ts`

Returns exactly 3 categories × 3 suggestions:
- **Reading:** Age-appropriate books (0–3mo high-contrast → 12+mo simple stories)
- **Sensory:** Multi-sense activities (real brand names OK)
- **Music:** Nursery rhymes + developmental instruments

---

## 3. Data Transformations & Calculations

### 3.1 Corrected Age — THE Critical Calculation

**File:** `src/modules/baby/utils/correctedAge.ts`

```
Corrected Age = Chronological Age - (280 days - Gestational Age at Birth)
```

**Output properties:**
- `chronological` / `corrected`: days, weeks, months, display string
- `isPreterm`: true if gestational weeks < 37
- `useCorrected`: true if corrected age < 730 days (24 months)
- `effectiveAgeMonths`: THE value used for milestones, sleep, growth, AI prompts

**Critical rules:**
- Preterm babies: corrected age for ALL milestones/sleep/growth until 24 months
- Vaccinations: ALWAYS chronological age (never corrected)
- After 24 months corrected: switch to chronological

### 3.2 Growth Percentiles — WHO Interpolation

**File:** `src/modules/growth/utils/percentileCalculation.ts`

**Data source:** WHO Multicentre Growth Reference (0–24 months, half-month intervals)

**Algorithm:**
- Below p3: `percentile = 3 × (value / p3)`
- Between bands: linear interpolation `t = (value - lo) / (hi - lo)`
- Above p97: `percentile = 97 + 3 × ((value - p97) / p97) × 10`

**Metrics:** weight (grams), length (cm), head circumference (cm)
**Percentile bands:** p3, p15, p50, p85, p97

### 3.3 Breastfeeding Volume Estimation

**File:** `src/modules/insights/hooks/useInsightsChartData.ts`

```
Estimated ML = duration_minutes × 15
```

Priority:
1. If `bottle_amount_ml` exists → use directly (not estimated)
2. If breast feed → calculate from `left_duration_seconds + right_duration_seconds`
3. Fallback: calculate from `started_at` / `ended_at` timestamps
4. Result flagged as `estimated: true`

### 3.4 Wake Windows (Age-Based)

**File:** `src/stores/sleepStore.ts`

| Age | Min–Max Window | Naps/Day |
|-----|---------------|----------|
| 0–2 mo | 45–75 min | 5 |
| 2–4 mo | 75–120 min | 4 |
| 4–6 mo | 120–150 min | 3 |
| 6–9 mo | 150–210 min | 3 |
| 9–12 mo | 180–240 min | 2 |
| 12–18 mo | 210–300 min | 2 |
| 18–36 mo | 300–360 min | 1 |

**Status:**
- `minutesSinceWake < min` → `early`
- `minutesSinceWake ≤ max` → `ideal`
- `minutesSinceWake > max` → `overdue`

### 3.5 Gestational Progress (Pregnancy Ring)

**File:** `src/modules/dashboard/hooks/useDashboardData.ts`

```
daysLeft = max(0, ceil((dueDate - now) / 86400000))
totalGestDays = max(0, 280 - daysLeft)
week = clamp(floor(totalGestDays / 7), 4, 42)
dayOfWeek = max(0, totalGestDays - week * 7)
progress = min(1, totalGestDays / 280)   // 0–1 for ring animation
```

### 3.6 Pet State Resolution (Visual Feedback)

**File:** `src/shared/utils/petState.ts`

| Domain | Neutral Threshold | Urgent Threshold |
|--------|-------------------|------------------|
| Feeding | 2h | 4h |
| Sleep | 2h | 3.5h |
| Diaper | 2h | 4h |

- `hoursSince < neutral` → **happy** (domain color, 15% opacity)
- `neutral ≤ hoursSince < urgent` → **neutral** (gold tint)
- `hoursSince ≥ urgent` → **urgent** (red tint)

### 3.7 Lifecycle Stage Determination

**File:** `src/lifecycle/lifecycleEngine.ts`

| Effective Age (months) | Stage | AI Prompt |
|------------------------|-------|-----------|
| < 0 | `prenatal` | prenatal.ts |
| 0–3 | `fourth_trimester` | fourthTrimester.ts |
| 3–6 | `transition` | transition.ts |
| 6–12 | `exploration` | exploration.ts |
| 12+ | `toddler` | toddler.ts |

### 3.8 Unit Conversions

**File:** `src/shared/utils/dateTime.ts`

| Measurement | Metric | Imperial |
|-------------|--------|----------|
| Weight | `X.XX kg` (if ≥1000g) or `X g` | `X lb Y oz` (÷ 453.592) |
| Length | `X.X cm` | `X.X in` (÷ 2.54) |
| Temperature | `X.X°C` | `X.X°F` (× 9/5 + 32) |
| Volume | `X ml` | `X.X oz` (÷ 29.5735) |

### 3.9 Age Display Formatting

| Age in Days | Format |
|-------------|--------|
| 0–14 | "Day X" |
| 15–84 (weeks 3–12) | "Week X" |
| 85+ | "Month X" |

### 3.10 Seed Data Generation (Deterministic)

**File:** `src/data/seedAllData.ts`

Uses seeded pseudo-random: `sin(dayOffset × 127.1 + slot × 311.7) × 43758.5453`

| Domain | Pattern |
|--------|---------|
| Feeding | Every 3h (0, 3, 6, 9, 12, 15, 18, 21). Duration 15–30 min. Bottle 80–160 ml |
| Sleep | Night 390–510 min with 1–3 wakings. 3 nap templates (9:00, 13:00, 17:00) |
| Diapers | ~3h spacing. Types cycle: wet, dirty, wet, both, ... |
| Growth | Monthly at percentiles 33–40, ±2 drift/month, clamped 25–45 |

---

## 4. Intent Routing

### 4.1 Omni-Input Classification

**File:** `app/(app)/(tabs)/home.tsx`

User text is classified into 3 intents (first match wins):

#### Priority 1: Logging Intent (confidence: 0.9)

| Pattern | Sub-Type |
|---------|----------|
| `/changed?.*wet\|dirty\|poopy\|diaper\|poop/i` | `diaper` |
| `/fed\|nursed\|breastfed\|gave.*bottle\|drank.*ml/i` | `feed` |
| `/\d+.*ml\|oz.*milk\|formula/i` | `feed_amount` |
| `/fell\s+asleep\|went\s+to\s+sleep\|started.*nap/i` | `sleep_start` |
| `/woke\s+up\|just\s+woke\|finished.*nap/i` | `sleep_end` |

#### Priority 2: Data Query Intent (confidence: 0.85)

| Pattern |
|---------|
| `/show\|display\|see\|view\|how.*much\|chart\|data\|history/i` |
| `/last\|past\|previous.*day\|week.*of.*feed\|sleep\|diaper/i` |
| `/average\|total.*feed\|sleep\|diaper\|milk\|intake/i` |

#### Priority 3: Medical Intent — Default (confidence: 0.7)

Any text that doesn't match logging or data query patterns is treated as a question for the AI nurse.

### 4.2 Intent → Action Mapping

| Intent | Action |
|--------|--------|
| `log` | Navigate to appropriate logging screen |
| `data_query` | Navigate to insights/charts |
| `medical` | Open AI chat with question |

---

## Appendix: Safety Mechanism Summary

| Mechanism | Type | Hardcoded? | AI? | Runs When | Can Override? |
|-----------|------|-----------|-----|-----------|--------------|
| Red Flag Interceptor | Emergency | YES | NO | Every log | NO |
| Content Filter | Safety | YES | NO | Before render | NO |
| Allergy Filter | Liability | YES | NO | Before render | NO |
| Intervention Engine | Routing | YES | NO | Every log | NO |
| Veteran Nurse Rules | Knowledge | YES | NO | After log | NO |
| Lifecycle Prompts | Behavior | YES | NO | Before AI call | NO |
| Diaper Privacy Check | Privacy | Partial | YES | Image upload | NO |
| AI Chat System Prompt | Persona | YES | NO | Every chat | NO |
| Daily Nurse Insights | Content | Static | NO | Page load | NO |

---

## Appendix: Key File Reference

| Domain | File |
|--------|------|
| **Corrected Age** | `src/modules/baby/utils/correctedAge.ts` |
| **Red Flags** | `src/ai/redFlagInterceptor.ts` |
| **Content Filter** | `src/ai/contentFilter.ts` |
| **Intervention Engine** | `src/ai/interventionEngine.ts` |
| **Veteran Rules** | `src/ai/veteranInsights.ts` |
| **Lifecycle Engine** | `src/lifecycle/lifecycleEngine.ts` |
| **AI Chat Function** | `supabase/functions/ai-chat/index.ts` |
| **Diaper Analysis** | `supabase/functions/analyze-diaper/index.ts` |
| **Prep Suggestions** | `supabase/functions/prep-suggestions/index.ts` |
| **Activity Suggestions** | `supabase/functions/ai-activity-suggestions/index.ts` |
| **Prompt: Prenatal** | `src/ai/promptTemplates/prenatal.ts` |
| **Prompt: 4th Trimester** | `src/ai/promptTemplates/fourthTrimester.ts` |
| **Prompt: Transition** | `src/ai/promptTemplates/transition.ts` |
| **Prompt: Exploration** | `src/ai/promptTemplates/exploration.ts` |
| **Prompt: Toddler** | `src/ai/promptTemplates/toddler.ts` |
| **Growth Percentiles** | `src/modules/growth/utils/percentileCalculation.ts` |
| **Intent Routing** | `app/(app)/(tabs)/home.tsx` |
| **Wake Windows** | `src/stores/sleepStore.ts` |
| **Date/Time Utils** | `src/shared/utils/dateTime.ts` |
| **Pet State** | `src/shared/utils/petState.ts` |
| **Seed Data** | `src/data/seedAllData.ts` |
| **Dismiss Store** | `src/stores/insightDismissStore.ts` |
| **Daily Nurse Insights** | `src/ai/dailyNurseInsights.ts` |
| **Onboarding Store** | `src/stores/onboardingStore.ts` |
| **Dashboard Data** | `src/modules/dashboard/hooks/useDashboardData.ts` |
| **Insight Chat Service** | `src/modules/insights/services/insightChatService.ts` |

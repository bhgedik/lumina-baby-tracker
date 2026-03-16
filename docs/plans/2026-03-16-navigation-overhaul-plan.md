# Navigation Overhaul & Header Polish — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the app from Content-First to Action-First navigation by merging headers, renaming Daily→Journal (with calendar content), and migrating educational cards to Guide.

**Architecture:** Modify the tab layout to swap header positions (profile icon left→right), inject screen titles into the nav bar, rename Daily→Journal with inlined calendar content, and add a "Today's Insight" section to Guide with the migrated educational cards from Daily.

**Tech Stack:** React Native, Expo Router (Tabs), TypeScript, Feather icons

---

### Task 1: Restructure Tab Layout Header

**Files:**
- Modify: `app/(app)/(tabs)/_layout.tsx`

**What to do:**
1. Move `SettingsButton` (profile icon) from `headerLeft` to `headerRight`
2. Remove `CalendarButton` entirely (calendar is now the Journal tab)
3. Set `headerLeft` to render the screen title text (large, bold, left-aligned)
4. Rename the Daily tab to "Journal" with `book` icon
5. Reduce header padding for compact look

**Complete code for `_layout.tsx`:**

```tsx
import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../src/shared/constants/theme';
import { useBabyStore } from '../../../src/stores/babyStore';

function ProfileButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/(app)/(tabs)/profile')}
      hitSlop={10}
      style={styles.headerButton}
      accessibilityRole="button"
      accessibilityLabel="Profile"
    >
      <Feather name="user" size={22} color={colors.neutral[500]} />
    </Pressable>
  );
}

function HeaderTitle({ title }: { title: string }) {
  return (
    <View style={styles.headerTitleWrap}>
      <Text style={styles.headerTitleText}>{title}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const isHydrated = useBabyStore((s) => s.isHydrated);

  const isPregnant = useMemo(() => {
    if (!isHydrated) return false;
    const baby = activeBabyId
      ? babies.find((b) => b.id === activeBabyId) ?? babies[0]
      : babies[0];
    return baby?.is_pregnant ?? false;
  }, [babies, activeBabyId, isHydrated]);

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: true,
        headerTransparent: false,
        headerTitle: '',
        headerStyle: { backgroundColor: colors.background, elevation: 0, shadowOpacity: 0 },
        headerLeft: () => null,
        headerRight: () => <ProfileButton />,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {/* 1. Home */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerLeft: () => <HeaderTitle title="Home" />,
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={26} color={color} />
          ),
        }}
      />
      {/* 2. Journal */}
      <Tabs.Screen
        name="daily"
        options={{
          title: 'Journal',
          headerLeft: () => <HeaderTitle title="Journal" />,
          tabBarIcon: ({ color }) => (
            <Feather name="book" size={26} color={color} />
          ),
        }}
      />
      {/* 3. Lumina Hub — FAB-style center tab */}
      <Tabs.Screen
        name="lumina-hub"
        options={{
          title: '',
          headerShown: false,
          tabBarIcon: () => (
            <View style={styles.fabContainer}>
              <View style={styles.fabCircle}>
                <Feather name="message-circle" size={26} color="#FFFFFF" />
              </View>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      {/* 4. Guide */}
      <Tabs.Screen
        name="guide"
        options={{
          title: 'Guide',
          headerLeft: () => <HeaderTitle title="Guide" />,
          tabBarIcon: ({ color }) => (
            <Feather name="book-open" size={26} color={color} />
          ),
        }}
      />
      {/* 5a. Checklist — pregnancy only */}
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'Checklist',
          headerLeft: () => <HeaderTitle title="Checklist" />,
          href: isPregnant ? undefined : null,
          tabBarIcon: ({ color }) => (
            <Feather name="check-square" size={26} color={color} />
          ),
        }}
      />
      {/* 5b. Milestones — postpartum only */}
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Milestones',
          headerLeft: () => <HeaderTitle title="Milestones" />,
          href: isPregnant ? null : undefined,
          tabBarIcon: ({ color }) => (
            <Feather name="trending-up" size={26} color={color} />
          ),
        }}
      />
      {/* Profile — hidden from tab bar */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 82 : 60,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 22 : 6,
    paddingHorizontal: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginTop: 1,
  },
  tabItem: {
    flex: 1,
    paddingTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButton: {
    marginHorizontal: spacing.base,
    padding: spacing.xs,
  },
  headerTitleWrap: {
    marginLeft: spacing.base + 4,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[800],
    letterSpacing: -0.3,
  },
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

**Verify:** Run `npx tsc --noEmit` — should pass.

---

### Task 2: Remove In-Screen Headers

**Files:**
- Modify: `app/(app)/(tabs)/home.tsx` — Home uses a greeting block which is personal content, NOT a duplicate header. Leave it as-is.
- Modify: `app/(app)/(tabs)/guide.tsx` — Remove the `<View style={styles.header}>` block containing "Lumina Guide" title and subtitle. Remove associated `header`, `headerTitle`, `headerSubtitle` styles.

**In `guide.tsx`, remove this block (around lines 267-275):**
```tsx
{/* ── Header ── */}
<View style={styles.header}>
  <Text style={styles.headerTitle}>Lumina Guide</Text>
  <Text style={styles.headerSubtitle}>
    Expert guides for every stage, at your own pace
  </Text>
</View>
```

**And remove these styles:**
```tsx
header: { ... },
headerTitle: { ... },
headerSubtitle: { ... },
```

**Verify:** Run `npx tsc --noEmit` — should pass.

---

### Task 3: Rewrite Daily as Journal Tab

**Files:**
- Modify: `app/(app)/(tabs)/daily.tsx` — Complete rewrite

**What it should contain:**
1. Health Check card at the top (from current Daily screen — the `buildHealthSignals` section)
2. Below that: the full Calendar/Timeline content from `app/(app)/calendar.tsx` (Daily/Weekly/Monthly segmented view with timeline, charts, growth data)

**Approach:**
- Keep the Health Check card logic (`buildHealthSignals`, `HealthSignal` interface, the health card JSX and styles)
- Keep the pregnancy view (`PregnancyDailyView`) since it's the Journal equivalent for pregnant users
- Import and inline the calendar content (segment tabs, timeline, weekly charts, monthly growth)
- Remove: `SuggestionCard`, `DailyNoteCard`, `generateSmartSuggestions`, `SmartSuggestion`, the "SUGGESTED FOR YOU" section, developmental nudges section, daily note section, `ChatSheet` integration (these move to Guide)
- Remove: The in-screen header (`<View style={styles.header}>` with "Daily" title)

**The new daily.tsx structure:**
```
Journal Tab
├── [Pregnancy mode] PregnancyDailyView (keep as-is)
├── [Postpartum mode]
│   ├── Health Check Card (sleep/feeding/diaper signals)
│   ├── Segment Tabs (Daily | Weekly | Monthly)
│   ├── Daily View: color-coded timeline
│   ├── Weekly View: pattern grid + bar charts + sleep trend
│   └── Monthly View: growth chart
```

Copy all content from `calendar.tsx` (segment tabs, `SAMPLE_EVENTS`, weekly data, monthly data, all view components and styles) into `daily.tsx`, placing it below the Health Check card. Remove the back button and SafeAreaView wrapper from the calendar content since it's now inline in a tab.

**Verify:** Run `npx tsc --noEmit` — should pass. Visual check: Journal tab shows health summary + calendar timeline.

---

### Task 4: Add "Today's Insight" Section to Guide

**Files:**
- Modify: `app/(app)/(tabs)/guide.tsx`

**What to add:**
Move the educational content from Daily into Guide as a "Today's Insight" section at the very top (above "Current Focus"). This includes:
- `SuggestionCard` component (expandable cards with "Read more" + "Ask Lumina" button)
- `generateSmartSuggestions()` function
- The `SmartSuggestion` interface
- `VisualGuide` import and integration
- `ChatSheet` integration for "Ask Lumina about this"

**Section placement in Guide's ScrollView:**
```
Guide Tab
├── "Today's Insight" section (NEW — migrated from Daily)
│   ├── Section header with sparkle icon
│   ├── Suggestion cards (age-aware, trend-based)
│   └── "Ask Lumina" triggers ChatSheet
├── Current Focus (existing horizontal carousel)
├── Filter Pills (existing)
├── Category Sections (existing)
├── Common Misconceptions carousel (existing)
├── Scientific Sources footer (existing)
```

**Add imports to guide.tsx:**
```tsx
import { ChatSheet } from '../../../src/modules/insights/components/ChatSheet';
import { VisualGuide } from '../../../src/modules/insights/components/VisualGuide';
import { useNurseSaysData } from '../../../src/modules/insights/hooks/useNurseSaysData';
import { useDashboardData } from '../../../src/modules/dashboard/hooks/useDashboardData';
import type { VisualGuide as VisualGuideData } from '../../../src/modules/insights/types';
```

**Add the SmartSuggestion interface, generateSmartSuggestions function, and SuggestionCard component** (copy from current daily.tsx).

**Add state and hooks in GuideScreen:**
```tsx
const { babyAgeDays, totalFeedsToday, sleepSummary } = useDashboardData();
const sleepHours = sleepSummary?.total_sleep_hours ?? null;
const smartSuggestions = useMemo(
  () => generateSmartSuggestions(babyAgeDays, totalFeedsToday, sleepHours),
  [babyAgeDays, totalFeedsToday, sleepHours],
);
const [showChat, setShowChat] = useState(false);
const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>();
```

**Add JSX before Current Focus section:**
```tsx
{/* ── Today's Insight ── */}
{smartSuggestions.length > 0 && (
  <View style={styles.insightSection}>
    <View style={styles.insightHeader}>
      <Feather name="sunrise" size={13} color={UI.stageAccent} />
      <Text style={styles.insightLabel}>Today's Insight</Text>
    </View>
    {smartSuggestions.map((suggestion) => (
      <SuggestionCard
        key={suggestion.id}
        suggestion={suggestion}
        onAskAI={(s) => {
          setChatInitialMessage(`Tell me more about: ${s.title}`);
          setShowChat(true);
        }}
      />
    ))}
  </View>
)}
```

**Add ChatSheet at the end (before closing SafeAreaView):**
```tsx
<ChatSheet
  visible={showChat}
  onClose={() => { setShowChat(false); setChatInitialMessage(undefined); }}
  babyName={undefined}
  babyAgeDays={babyAgeDays}
  feedingMethod={undefined}
  initialMessage={chatInitialMessage}
/>
```

**Add styles for the insight section and suggestion cards** (copy suggestion styles from daily.tsx, prefixed into guide's StyleSheet).

**Verify:** Run `npx tsc --noEmit` — should pass.

---

### Task 5: Clean Up and Final Verification

**Files:**
- Optionally remove or keep `app/(app)/calendar.tsx` as a standalone route (it still works for deep links, but the header CalendarButton that linked to it is gone)

**Steps:**
1. Run `npx tsc --noEmit` — full project type check
2. Verify no remaining references to removed components
3. Verify tab order: Home | Journal | Lumina | Guide | Milestones

**Commit:**
```bash
git add "app/(app)/(tabs)/_layout.tsx" "app/(app)/(tabs)/daily.tsx" "app/(app)/(tabs)/guide.tsx"
git commit -m "feat: navigation overhaul — merge headers, Daily→Journal, migrate insights to Guide"
```

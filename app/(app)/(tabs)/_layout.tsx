import { useMemo } from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { colors, typography } from '../../../src/shared/constants/theme';
import { useBabyStore } from '../../../src/stores/babyStore';

// ── 3D Clay Tab Icons (Recraft v3) ─────────────────────────
const tabIcons = {
  home: require('../../../assets/icons/tab-home.png'),
  journal: require('../../../assets/icons/tab-journal.png'),
  lumina: require('../../../assets/illustrations/lumina-mascot.png'),
  guide: require('../../../assets/icons/tab-guide.png'),
  milestones: require('../../../assets/icons/tab-milestones.png'),
  checklist: require('../../../assets/icons/tab-checklist.png'),
};

const TAB_ICON_SIZE = 30;

function TabIcon({ source, focused }: { source: any; focused: boolean }) {
  return (
    <Image
      source={source}
      style={[styles.tabIcon, !focused && styles.tabIconInactive]}
      resizeMode="contain"
    />
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
        headerShown: false,
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
          tabBarIcon: ({ focused }) => (
            <TabIcon source={tabIcons.home} focused={focused} />
          ),
        }}
      />
      {/* 2. Journal */}
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={tabIcons.journal} focused={focused} />
          ),
        }}
      />
      {/* 3. Lumina Hub — elevated center tab */}
      <Tabs.Screen
        name="lumina-hub"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.fabContainer}>
              <Image
                source={tabIcons.lumina}
                style={styles.fabIcon}
                resizeMode="contain"
              />
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
          tabBarIcon: ({ focused }) => (
            <TabIcon source={tabIcons.guide} focused={focused} />
          ),
        }}
      />
      {/* 5a. Checklist — pregnancy only */}
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'Checklist',
          href: isPregnant ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={tabIcons.checklist} focused={focused} />
          ),
        }}
      />
      {/* 5b. Milestones — postpartum only */}
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Milestones',
          href: isPregnant ? null : undefined,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={tabIcons.milestones} focused={focused} />
          ),
        }}
      />
      {/* Daily — hidden from tab bar */}
      <Tabs.Screen
        name="daily"
        options={{ href: null, headerShown: false }}
      />
      {/* Profile — hidden from tab bar */}
      <Tabs.Screen
        name="profile"
        options={{ href: null, headerShown: false }}
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
  tabIcon: {
    width: TAB_ICON_SIZE,
    height: TAB_ICON_SIZE,
    marginTop: -4,
  },
  tabIconInactive: {
    opacity: 0.45,
  },
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  fabIcon: {
    width: 88,
    height: 88,
  },
});

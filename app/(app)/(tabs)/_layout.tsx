import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { useBabyStore } from '../../../src/stores/babyStore';

export default function TabsLayout() {
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const isHydrated = useBabyStore((s) => s.isHydrated);

  const isPregnant = useMemo(() => {
    // Don't flip tab visibility until store is hydrated
    if (!isHydrated) return false;
    const baby = activeBabyId
      ? babies.find((b) => b.id === activeBabyId) ?? babies[0]
      : babies[0];
    return baby?.is_pregnant ?? false;
  }, [babies, activeBabyId, isHydrated]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'Checklist',
          href: isPregnant ? undefined : null,
          tabBarIcon: ({ color }) => (
            <Feather name="check-square" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          href: null,
          tabBarIcon: ({ color }) => (
            <Feather name="plus" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="milestones"
        options={{
          title: 'Milestones',
          href: isPregnant ? null : undefined,
          tabBarIcon: ({ color }) => (
            <Feather name="award" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          href: isPregnant ? null : undefined,
          tabBarIcon: ({ color }) => (
            <Feather name="zap" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="nurse-says"
        options={{
          title: 'Nurse Says',
          href: isPregnant ? null : undefined,
          tabBarIcon: ({ color }) => (
            <Feather name="book-open" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: spacing.base,
    right: spacing.base,
    height: 68,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['3xl'],
    borderTopWidth: 0,
    paddingBottom: 0,
    paddingTop: spacing.sm,
    ...shadows.soft,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  tabItem: {
    paddingTop: 6,
  },
});

import { useMemo } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../../src/shared/constants/theme';
import { useBabyStore } from '../../../src/stores/babyStore';

function SettingsButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/(app)/(tabs)/profile')}
      hitSlop={10}
      style={styles.settingsButton}
      accessibilityRole="button"
      accessibilityLabel="Settings"
    >
      <Feather name="settings" size={22} color={colors.neutral[500]} />
    </Pressable>
  );
}

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
      initialRouteName="home"
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerTitle: '',
        headerLeft: () => null,
        headerRight: () => <SettingsButton />,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {/* 1. Home — default landing, far left */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={26} color={color} />
          ),
        }}
      />
      {/* 2. Insights — always visible */}
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => (
            <Feather name="zap" size={26} color={color} />
          ),
        }}
      />
      {/* 3. Lumina Hub — FAB-style center tab */}
      <Tabs.Screen
        name="lumina-hub"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.fabContainer}>
              <View style={styles.fabCircle}>
                <Feather
                  name="message-circle"
                  size={26}
                  color="#FFFFFF"
                />
              </View>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      {/* 4. Daily — postpartum only */}
      <Tabs.Screen
        name="daily"
        options={{
          title: 'Daily',
          href: isPregnant ? null : undefined,
          tabBarIcon: ({ color }) => (
            <Feather name="sun" size={26} color={color} />
          ),
        }}
      />
      {/* 5. Progress — postpartum only */}
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          href: isPregnant ? null : undefined,
          tabBarIcon: ({ color }) => (
            <Feather name="trending-up" size={26} color={color} />
          ),
        }}
      />
      {/* 5b. Checklist — pregnancy only (replaces Progress slot) */}
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'Checklist',
          href: isPregnant ? undefined : null,
          tabBarIcon: ({ color }) => (
            <Feather name="check-square" size={26} color={color} />
          ),
        }}
      />
      {/* Profile — hidden from tab bar, accessed via gear icon */}
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
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginTop: 1,
  },
  tabItem: {
    paddingTop: 2,
  },
  settingsButton: {
    marginRight: spacing.base,
    padding: spacing.xs,
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

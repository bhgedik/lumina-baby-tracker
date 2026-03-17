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
      <Text style={styles.headerTitleText} numberOfLines={1}>{title}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const isHydrated = useBabyStore((s) => s.isHydrated);

  const activeBaby = useMemo(() => {
    if (!isHydrated) return null;
    return activeBabyId
      ? babies.find((b) => b.id === activeBabyId) ?? babies[0]
      : babies[0];
  }, [babies, activeBabyId, isHydrated]);

  const isPregnant = activeBaby?.is_pregnant ?? false;
  const babyName = activeBaby?.name || null;

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
          headerLeft: () => <HeaderTitle title={babyName ? `${babyName}'s Journal` : 'Journal'} />,
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

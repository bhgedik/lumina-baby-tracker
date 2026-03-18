import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Image } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const TAB_ICONS = {
  home: require('../../../assets/icons/tab_home.png'),
  journal: require('../../../assets/icons/tab_journal.png'),
  lumina: require('../../../assets/icons/lumina.png'),
  guide: require('../../../assets/icons/tab_guide.png'),
  milestones: require('../../../assets/icons/tab_milestones.png'),
  checklist: require('../../../assets/icons/tab_milestones.png'),
};
import { colors, typography, spacing } from '../../../src/shared/constants/theme';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useDashboardData } from '../../../src/modules/dashboard/hooks/useDashboardData';

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

  const { greeting, parentName } = useDashboardData();
  const homeGreeting = `${greeting}${parentName ? `, ${parentName}` : ''}.`;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: true,
        headerTransparent: false,
        headerTitle: '',
        headerStyle: { backgroundColor: '#F0EDE8', elevation: 0, shadowOpacity: 0 },
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
          headerTitle: () => <HeaderTitle title={homeGreeting} />,
          headerTitleAlign: 'left' as const,
          headerLeft: () => null,
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.tabIconActive : styles.tabIconInactive}>
              <Image source={TAB_ICONS.home} style={styles.tabIcon} />
            </View>
          ),
        }}
      />
      {/* 2. Journal */}
      <Tabs.Screen
        name="daily"
        options={{
          title: 'Journal',
          headerLeft: () => <HeaderTitle title={babyName ? `${babyName}'s Journal` : 'Journal'} />,
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.tabIconActive : styles.tabIconInactive}>
              <Image source={TAB_ICONS.journal} style={styles.tabIcon} />
            </View>
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
                <Image source={TAB_ICONS.lumina} style={styles.fabIcon} />
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
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.tabIconActive : styles.tabIconInactive}>
              <Image source={TAB_ICONS.guide} style={styles.tabIcon} />
            </View>
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
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.tabIconActive : styles.tabIconInactive}>
              <Image source={TAB_ICONS.checklist} style={styles.tabIcon} />
            </View>
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
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.tabIconActive : styles.tabIconInactive}>
              <Image source={TAB_ICONS.milestones} style={styles.tabIcon} />
            </View>
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 82 : 60,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 22 : 6,
    paddingHorizontal: 8,
    marginHorizontal: 12,
    marginBottom: Platform.OS === 'ios' ? 0 : 8,
    borderRadius: 32,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    borderTopColor: 'rgba(255,255,255,0.9)',
    borderLeftColor: 'rgba(255,255,255,0.6)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
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
    flex: 1,
  },
  headerTitleText: {
    fontSize: 26,
    fontFamily: typography.fontFamily.bold,
    color: '#4A3F60',
    letterSpacing: -0.3,
  },
  tabIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  tabIconActive: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
    transform: [{ scale: 1.15 }],
    shadowColor: '#B199CE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  tabIconInactive: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#C8B8DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  fabIcon: {
    width: 50,
    height: 50,
    resizeMode: 'cover',
  },
});

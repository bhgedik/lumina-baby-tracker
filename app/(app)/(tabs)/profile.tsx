import { View, Text, Pressable, StyleSheet, ScrollView, Alert, Linking, Platform } from 'react-native';
import { Image as RNImage } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const babyIcon = require('../../../assets/illustrations/pregnancy-baby.png');
const settingsIcon = require('../../../assets/illustrations/settings-icon.png');
const premiumIcon = require('../../../assets/illustrations/premium-icon.png');
const signoutIcon = require('../../../assets/illustrations/signout-icon.png');
const profileImg = require('../../../assets/illustrations/profile-icon.png');
import { useBabyStore } from '../../../src/stores/babyStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import { fromISO } from '../../../src/shared/utils/dateFormat';

// ── Claymorphism design tokens ──────────────────────────────
const UI = {
  bg: '#F7F4F0',
  text: '#2D2A26',
  textSecondary: '#3D3D3D',
  textMuted: '#8A8A8A',
  sectionHeader: '#8E8A9F',
  card: '#FFFFFF',
};

const CLAY_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 6,
};

const CLAY_INNER = {
  borderTopWidth: 2,
  borderLeftWidth: 1.5,
  borderTopColor: 'rgba(255,255,255,0.9)',
  borderLeftColor: 'rgba(255,255,255,0.6)',
  borderBottomWidth: 1.5,
  borderRightWidth: 1,
  borderBottomColor: 'rgba(0,0,0,0.04)',
  borderRightColor: 'rgba(0,0,0,0.02)',
};

const CLAY_PRESSED = {
  transform: [{ scale: 0.98 }] as const,
  shadowOpacity: 0.04,
};

// Pastel icon circle palettes
const ICON_BG = {
  peach: '#FEE8DC',
  lavender: '#E8DDF3',
  sage: '#E8F0E8',
  gold: '#FFF3D6',
  sky: '#DCE8F8',
  rose: '#F8E0E6',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { getActiveBaby } = useBabyStore();
  const { profile, signOut } = useAuthStore();
  const baby = getActiveBaby();
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const status = useSubscriptionStore((s) => s.status);
  const restorePurchases = useSubscriptionStore((s) => s.restorePurchases);

  const handleLogout = async () => {
    await signOut();
    router.replace('/(onboarding)/welcome');
  };

  const babySubtitle = baby
    ? baby.is_pregnant
      ? `Due ${fromISO(baby.due_date ?? '') || 'date not set'}`
      : `Born ${fromISO(baby.date_of_birth) || 'date not set'}`
    : 'No baby profile';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.title}>Profile</Text>
        {profile?.display_name ? (
          <Text style={styles.greeting}>Hi, {profile.display_name}</Text>
        ) : null}

        {/* ── Baby & Account Section ── */}
        <Text style={styles.sectionHeader}>BABY & ACCOUNT</Text>

        {/* Baby card */}
        <Pressable
          style={({ pressed }) => [
            styles.clayCard,
            pressed && styles.clayPressed,
          ]}
          onPress={() => router.push('/(app)/profile/edit-baby')}
        >
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: ICON_BG.peach }]}>
              <RNImage source={babyIcon} style={styles.iconImg} resizeMode="contain" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>{baby?.name || 'Baby'}</Text>
              <Text style={styles.cardDescription}>{babySubtitle}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#C5C0D0" />
          </View>
        </Pressable>

        {/* Subscription card */}
        <Pressable
          style={({ pressed }) => [
            styles.clayCard,
            pressed && styles.clayPressed,
          ]}
          onPress={() => {
            if (isPremium) {
              const url = Platform.OS === 'ios'
                ? 'https://apps.apple.com/account/subscriptions'
                : 'https://play.google.com/store/account/subscriptions';
              Linking.openURL(url);
            } else {
              router.push('/(onboarding)/paywall');
            }
          }}
        >
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: isPremium ? ICON_BG.gold : ICON_BG.lavender }]}>
              <RNImage source={premiumIcon} style={styles.iconImg} resizeMode="contain" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>
                {isPremium ? 'Premium' : 'Upgrade to Premium'}
              </Text>
              <Text style={styles.cardDescription}>
                {status === 'trial' ? 'Free trial active' : isPremium ? 'Manage subscription' : 'Unlock all features'}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#C5C0D0" />
          </View>
        </Pressable>

        {/* ── Settings Section ── */}
        <Text style={styles.sectionHeader}>SETTINGS</Text>

        {/* Settings card */}
        <Pressable
          style={({ pressed }) => [
            styles.clayCard,
            pressed && styles.clayPressed,
          ]}
          onPress={() => router.push('/(app)/profile/settings')}
        >
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: ICON_BG.sage }]}>
              <RNImage source={settingsIcon} style={styles.iconImg} resizeMode="contain" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>Settings</Text>
              <Text style={styles.cardDescription}>Notifications, units, privacy</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#C5C0D0" />
          </View>
        </Pressable>

        {/* ── Actions Section ── */}
        <Text style={styles.sectionHeader}>ACTIONS</Text>

        {/* Restore purchases */}
        {!isPremium && (
          <Pressable
            style={({ pressed }) => [
              styles.clayCard,
              pressed && styles.clayPressed,
            ]}
            onPress={async () => {
              const restored = await restorePurchases();
              if (restored) {
                Alert.alert('Restored!', 'Your premium access has been restored.');
              } else {
                Alert.alert('No purchases found', 'We could not find any previous purchases to restore.');
              }
            }}
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: ICON_BG.sky }]}>
                <RNImage source={profileImg} style={styles.iconImg} resizeMode="contain" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Restore Purchases</Text>
                <Text style={styles.cardDescription}>Recover previous subscriptions</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#C5C0D0" />
            </View>
          </Pressable>
        )}

        {/* Sign Out */}
        <Pressable
          style={({ pressed }) => [
            styles.clayCard,
            pressed && styles.clayPressed,
          ]}
          onPress={handleLogout}
        >
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: ICON_BG.rose }]}>
              <RNImage source={signoutIcon} style={styles.iconImg} resizeMode="contain" />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, { color: '#9B8A90' }]}>Sign Out</Text>
              <Text style={styles.cardDescription}>Log out of your account</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#C5C0D0" />
          </View>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },

  // Header — matches home.tsx greeting style
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: UI.textSecondary,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '500',
    color: UI.textMuted,
    marginBottom: 24,
  },

  // Section headers
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: UI.sectionHeader,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 4,
  } as any,

  // Clay card
  clayCard: {
    backgroundColor: UI.card,
    borderRadius: 24,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  } as any,

  clayPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.04,
  },

  // Card row layout
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  // 52x52 icon circles
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImg: {
    width: 40,
    height: 40,
  },

  cardContent: {
    flex: 1,
  },

  // Typography
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: UI.text,
  },
  cardDescription: {
    fontSize: 13,
    color: UI.textMuted,
    marginTop: 2,
  },
});

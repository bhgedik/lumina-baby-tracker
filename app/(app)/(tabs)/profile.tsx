import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { fromISO } from '../../../src/shared/utils/dateFormat';

export default function ProfileScreen() {
  const router = useRouter();
  const { getActiveBaby } = useBabyStore();
  const { profile, signOut } = useAuthStore();
  const baby = getActiveBaby();

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const babySubtitle = baby
    ? baby.is_pregnant
      ? `Due ${fromISO(baby.due_date ?? '') || 'date not set'}`
      : `Born ${fromISO(baby.date_of_birth) || 'date not set'}`
    : 'No baby profile';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>
        {profile?.display_name ? (
          <Text style={styles.greeting}>Hi, {profile.display_name}</Text>
        ) : null}

        {/* Baby card */}
        <Pressable
          style={[styles.card, shadows.sm]}
          onPress={() => router.push('/(app)/profile/edit-baby')}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardIcon}>
              <Feather name="heart" size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{baby?.name || 'Baby'}</Text>
              <Text style={styles.cardSubtitle}>{babySubtitle}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textTertiary} />
          </View>
        </Pressable>

        {/* Caregivers card */}
        <Pressable
          style={[styles.card, shadows.sm]}
          onPress={() => router.push('/(app)/profile/caregivers')}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardIcon}>
              <Feather name="users" size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Caregivers</Text>
              <Text style={styles.cardSubtitle}>Invite partner or family members</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textTertiary} />
          </View>
        </Pressable>

        {/* Settings card */}
        <Pressable
          style={[styles.card, shadows.sm]}
          onPress={() => router.push('/(app)/profile/settings')}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardIcon}>
              <Feather name="settings" size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Settings</Text>
              <Text style={styles.cardSubtitle}>Notifications, units, privacy</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textTertiary} />
          </View>
        </Pressable>

        {/* Logout */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  greeting: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    gap: spacing.sm,
  },
  logoutText: {
    color: colors.error,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
});

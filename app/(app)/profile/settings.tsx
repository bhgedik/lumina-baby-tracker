// ============================================================
// Sprout — Settings Screen
// Notifications, units, privacy — offline-first
// ============================================================

import { View, Text, Pressable, Switch, StyleSheet, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { useAuthStore } from '../../../src/stores/authStore';
import { useMotherMedsStore } from '../../../src/stores/motherMedsStore';
import { SegmentControl } from '../../../src/shared/components/SegmentControl';

const UNIT_OPTIONS = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'Imperial' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, family, updateProfile, updateFamily } = useAuthStore();
  const isMedHidden = useMotherMedsStore((s) => s.isHidden);
  const setMedHidden = useMotherMedsStore((s) => s.setHidden);

  const prefs = profile?.notification_preferences ?? {
    feeding_reminders: true,
    milestone_alerts: true,
    ai_insights: true,
    wellness_checkins: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
  };

  const units = family?.preferred_units ?? 'metric';

  const toggleNotification = (key: keyof typeof prefs, value: boolean) => {
    updateProfile({
      notification_preferences: { ...prefs, [key]: value },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
            <Feather name="chevron-left" size={22} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.backButton} />
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={[styles.card, shadows.sm]}>
          <SettingRow
            label="Feeding Reminders"
            value={prefs.feeding_reminders}
            onToggle={(v) => toggleNotification('feeding_reminders', v)}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Milestone Alerts"
            value={prefs.milestone_alerts}
            onToggle={(v) => toggleNotification('milestone_alerts', v)}
          />
          <View style={styles.divider} />
          <SettingRow
            label="AI Insights"
            value={prefs.ai_insights}
            onToggle={(v) => toggleNotification('ai_insights', v)}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Wellness Check-ins"
            value={prefs.wellness_checkins}
            onToggle={(v) => toggleNotification('wellness_checkins', v)}
          />
        </View>

        {/* Dashboard */}
        <Text style={styles.sectionTitle}>Dashboard</Text>
        <View style={[styles.card, shadows.sm]}>
          <SettingRow
            label="Medication Tracker"
            value={!isMedHidden}
            onToggle={(v) => setMedHidden(!v)}
          />
        </View>

        {/* Units */}
        <Text style={styles.sectionTitle}>Units</Text>
        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.unitLabel}>Measurement system</Text>
          <SegmentControl
            options={UNIT_OPTIONS}
            selected={units}
            onSelect={(value) => updateFamily({ preferred_units: value as 'metric' | 'imperial' })}
          />
        </View>

        {/* Privacy */}
        <Text style={styles.sectionTitle}>Privacy</Text>
        <Pressable
          style={[styles.card, shadows.sm, styles.linkRow]}
          onPress={() => Linking.openURL('https://sprout.app/privacy')}
        >
          <View style={styles.linkContent}>
            <Feather name="shield" size={18} color={colors.textSecondary} />
            <Text style={styles.linkLabel}>Privacy Policy</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textTertiary} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.neutral[200], true: colors.primary[300] }}
        thumbColor={value ? colors.primary[500] : colors.neutral[50]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.base,
    paddingHorizontal: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
  },
  unitLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.md,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  linkLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
});

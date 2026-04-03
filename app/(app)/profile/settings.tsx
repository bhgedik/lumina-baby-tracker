// ============================================================
// Nodd — Settings Screen (Claymorphism Design)
// Notifications, units, privacy — offline-first
// ============================================================

import { View, Text, Pressable, Switch, StyleSheet, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/stores/authStore';
import { useMotherMedsStore } from '../../../src/stores/motherMedsStore';
import { SegmentControl } from '../../../src/shared/components/SegmentControl';

// ── Claymorphism Design Tokens ──────────────────────────────
const CLAY = {
  bg: '#F7F4F0',
  card: '#FFFFFF',
  cardRadius: 24,
  label: '#2D2A26',
  desc: '#8A8A8A',
  sectionHeader: '#8E8A9F',
  lavender: '#A78BBA',
  lavenderLight: '#C9B8D9',
  divider: 'rgba(0,0,0,0.04)',
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
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Feather name="chevron-left" size={22} color={CLAY.label} />
          </Pressable>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <SettingRow
            label="Feeding Reminders"
            description="Get reminded when it's time to feed"
            value={prefs.feeding_reminders}
            onToggle={(v) => toggleNotification('feeding_reminders', v)}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Milestone Alerts"
            description="Developmental milestone notifications"
            value={prefs.milestone_alerts}
            onToggle={(v) => toggleNotification('milestone_alerts', v)}
          />
          <View style={styles.divider} />
          <SettingRow
            label="AI Insights"
            description="Personalized tips and observations"
            value={prefs.ai_insights}
            onToggle={(v) => toggleNotification('ai_insights', v)}
          />
        </View>

        {/* Dashboard */}
        <Text style={styles.sectionTitle}>DASHBOARD</Text>
        <View style={styles.card}>
          <SettingRow
            label="Medication Tracker"
            description="Show medication card on dashboard"
            value={!isMedHidden}
            onToggle={(v) => setMedHidden(!v)}
          />
        </View>

        {/* Units */}
        <Text style={styles.sectionTitle}>UNITS</Text>
        <View style={styles.card}>
          <Text style={styles.unitLabel}>Measurement system</Text>
          <SegmentControl
            options={UNIT_OPTIONS}
            selected={units}
            onSelect={(value) => updateFamily({ preferred_units: value as 'metric' | 'imperial' })}
          />
        </View>

        {/* Privacy */}
        <Text style={styles.sectionTitle}>PRIVACY</Text>
        <Pressable
          style={({ pressed }) => [
            styles.card,
            styles.linkRow,
            pressed && styles.pressed,
          ]}
          onPress={() => Linking.openURL('https://nodd.app/privacy')}
        >
          <View style={styles.linkContent}>
            <View style={styles.iconCircle}>
              <Feather name="shield" size={16} color={CLAY.lavender} />
            </View>
            <Text style={styles.linkLabel}>Privacy Policy</Text>
          </View>
          <Feather name="chevron-right" size={18} color={CLAY.desc} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingTextGroup}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E2DE', true: CLAY.lavenderLight }}
        thumbColor={value ? CLAY.lavender : '#FAFAFA'}
        ios_backgroundColor="#E5E2DE"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLAY.bg,
  },
  scrollView: {
    flex: 1,
    backgroundColor: CLAY.bg,
  },
  content: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 120,
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CLAY.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: CLAY.label,
  },

  // ── Sections ────────────────────────────────────────────
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: CLAY.sectionHeader,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 20,
    paddingHorizontal: 4,
  },

  // ── Card (claymorphism) ─────────────────────────────────
  card: {
    backgroundColor: CLAY.card,
    borderRadius: CLAY.cardRadius,
    padding: 4,
    marginBottom: 14,
    ...CLAY_SHADOW,
    ...CLAY_INNER,
  },

  // ── Setting Row ─────────────────────────────────────────
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingTextGroup: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: CLAY.label,
  },
  settingDescription: {
    fontSize: 13,
    color: CLAY.desc,
    marginTop: 2,
  },

  // ── Divider ─────────────────────────────────────────────
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: CLAY.divider,
    marginHorizontal: 16,
  },

  // ── Units ───────────────────────────────────────────────
  unitLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: CLAY.label,
    paddingHorizontal: 16,
    paddingTop: 14,
    marginBottom: 12,
  },

  // ── Link Row (Privacy) ─────────────────────────────────
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3EFF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: CLAY.label,
  },

  // ── Pressed state ───────────────────────────────────────
  pressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.04,
  },
});

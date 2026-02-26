// ============================================================
// Sprout — Caregivers Screen
// Invite code generation + sharing + family member list
// ============================================================

import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Share, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
// TODO: re-enable after running `npx expo prebuild` to link native module
// import * as Clipboard from 'expo-clipboard';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { useAuthStore } from '../../../src/stores/authStore';
import { useInviteStore } from '../../../src/stores/inviteStore';
import { isSupabaseConfigured } from '../../../src/data/supabase/client';

export default function CaregiversScreen() {
  const router = useRouter();
  const { profile, family, session } = useAuthStore();
  const { inviteCode, expiresAt, isGenerating, error, generateCode, fetchExistingCode, clearError } = useInviteStore();

  useEffect(() => {
    if (family?.id) {
      fetchExistingCode(family.id);
    }
  }, [family?.id]);

  const handleGenerate = () => {
    if (family?.id && session?.user?.id) {
      generateCode(family.id, session.user.id);
    }
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `Join our family on Sprout! Use this invite code: ${inviteCode}`,
      });
    } catch {}
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    // await Clipboard.setStringAsync(inviteCode);
    // Fallback: use Share as a copy workaround until native module is linked
    try { await Share.share({ message: inviteCode }); } catch {}
  };

  const expiryDisplay = expiresAt
    ? `Expires ${new Date(expiresAt).toLocaleDateString()}`
    : 'Expires in 7 days';

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
          <Text style={styles.title}>Caregivers</Text>
          <View style={styles.backButton} />
        </View>

        {!isSupabaseConfigured ? (
          /* Offline message */
          <View style={[styles.offlineCard, shadows.sm]}>
            <Feather name="wifi-off" size={32} color={colors.textTertiary} />
            <Text style={styles.offlineTitle}>Requires Internet</Text>
            <Text style={styles.offlineText}>
              Partner invites require an internet connection. Please connect and try again.
            </Text>
          </View>
        ) : inviteCode ? (
          /* Show existing code */
          <>
            <Text style={styles.sectionTitle}>Invite Code</Text>
            <View style={[styles.codeCard, shadows.sm]}>
              <Text style={styles.codeLabel}>Share this code with your partner</Text>
              <Text style={styles.codeDisplay}>{inviteCode}</Text>
              <Text style={styles.expiryText}>{expiryDisplay}</Text>
              <View style={styles.codeActions}>
                <Pressable style={[styles.actionButton, styles.shareButton]} onPress={handleShare}>
                  <Feather name="share" size={18} color={colors.textInverse} />
                  <Text style={styles.shareButtonText}>Share</Text>
                </Pressable>
                <Pressable style={[styles.actionButton, styles.copyButton]} onPress={handleCopy}>
                  <Feather name="copy" size={18} color={colors.primary[600]} />
                  <Text style={styles.copyButtonText}>Copy</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : (
          /* Generate new code */
          <View style={[styles.emptyCard, shadows.sm]}>
            <Feather name="user-plus" size={32} color={colors.primary[400]} />
            <Text style={styles.emptyTitle}>Invite a Partner</Text>
            <Text style={styles.emptyText}>
              Generate an invite code so your partner can join your family and help track your baby's journey.
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Pressable
              style={[styles.generateButton, shadows.sm, isGenerating && styles.generateButtonDisabled]}
              onPress={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <>
                  <Feather name="plus" size={18} color={colors.textInverse} />
                  <Text style={styles.generateButtonText}>Generate Invite Code</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* Family members */}
        <Text style={styles.sectionTitle}>Family Members</Text>
        <View style={[styles.memberCard, shadows.sm]}>
          <View style={styles.memberRow}>
            <View style={styles.memberAvatar}>
              <Feather name="user" size={18} color={colors.primary[600]} />
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{profile?.display_name || 'You'}</Text>
              <Text style={styles.memberRole}>{profile?.role === 'primary' ? 'Primary Caregiver' : profile?.role ?? 'Caregiver'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  // Offline state
  offlineCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  offlineTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  offlineText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Code display
  codeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  codeLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  codeDisplay: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: spacing.sm,
  },
  expiryText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginBottom: spacing.lg,
  },
  codeActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  shareButton: {
    backgroundColor: colors.primary[500],
  },
  shareButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  copyButton: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  copyButtonText: {
    color: colors.primary[600],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  // Empty state
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  generateButtonDisabled: { opacity: 0.6 },
  generateButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  // Members
  memberCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  memberRole: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

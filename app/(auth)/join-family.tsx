// ============================================================
// Sprout — Join Family Screen
// Signup + invite code redemption — bypasses onboarding
// ============================================================

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/shared/constants/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { useInviteStore } from '../../src/stores/inviteStore';
import { useBabyStore } from '../../src/stores/babyStore';
import { supabase } from '../../src/data/supabase/client';

export default function JoinFamilyScreen() {
  const router = useRouter();
  const { signUp, setProfile, setFamily, completeOnboarding } = useAuthStore();
  const { redeemCode } = useInviteStore();
  const { setBabies, setActiveBaby } = useBabyStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    displayName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    inviteCode.trim().length === 6;

  const handleJoin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up
      const { error: signUpError } = await signUp(email.trim(), password, displayName.trim());
      if (signUpError) {
        setError(signUpError);
        setLoading(false);
        return;
      }

      // 2. Get the new session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please check your email to confirm your account, then sign in.');
        setLoading(false);
        return;
      }

      // 3. Redeem invite code
      const result = await redeemCode(inviteCode.trim(), session.user.id);
      if (!result.success) {
        setError(result.error ?? 'Failed to redeem invite code');
        setLoading(false);
        return;
      }

      // 4. Fetch the shared family's data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setProfile(profile);

        const { data: family } = await supabase
          .from('families')
          .select('*')
          .eq('id', result.familyId)
          .single();

        if (family) setFamily(family);

        const { data: babies } = await supabase
          .from('babies')
          .select('*')
          .eq('family_id', result.familyId)
          .eq('is_active', true);

        if (babies && babies.length > 0) {
          setBabies(babies);
          setActiveBaby(babies[0].id);
        }
      }

      // 5. Mark onboarding complete + navigate
      completeOnboarding();
      router.replace('/(app)/(tabs)/home');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format invite code: uppercase, no spaces
  const handleCodeChange = (text: string) => {
    setInviteCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Join a Family</Text>
        <Text style={styles.subtitle}>Enter your invite code to join an existing family</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.textTertiary}
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min 8 characters)"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>Invite Code</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="XXXXXX"
              placeholderTextColor={colors.textTertiary}
              value={inviteCode}
              onChangeText={handleCodeChange}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]}
            onPress={handleJoin}
            disabled={!canSubmit || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Joining...' : 'Join Family'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing['2xl'] },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
  },
  form: { gap: spacing.base },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  codeSection: {
    marginTop: spacing.sm,
  },
  codeLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  codeInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    textAlign: 'center',
    letterSpacing: 6,
    borderWidth: 2,
    borderColor: colors.primary[200],
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  backLink: { alignSelf: 'center', marginTop: spacing.base },
  backLinkText: { color: colors.primary[500], fontSize: typography.fontSize.sm },
});

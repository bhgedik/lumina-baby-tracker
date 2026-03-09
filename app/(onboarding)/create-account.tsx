// ============================================================
// Sprouty — Create Account (Post-Paywall Auth)
// Personalized auth screen — flushes onboarding data on success
// ============================================================

import { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/shared/constants/theme';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase, isSupabaseConfigured } from '../../src/data/supabase/client';
import { flushOnboardingToStores } from '../../src/services/onboardingFlush';

export default function CreateAccountScreen() {
  const router = useRouter();
  const babyName = useOnboardingStore((s) => s.babyName) || 'your baby';
  const parentName = useOnboardingStore((s) => s.parentName);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignIn, setIsSignIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const emailFocusAnim = useRef(new Animated.Value(0)).current;
  const [passwordFocused, setPasswordFocused] = useState(false);
  const passwordFocusAnim = useRef(new Animated.Value(0)).current;

  const animateFocus = (anim: Animated.Value, focused: boolean) => {
    Animated.timing(anim, { toValue: focused ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  };
  const emailBorderColor = emailFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.neutral[100], colors.primary[400]],
  });
  const passwordBorderColor = passwordFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.neutral[100], colors.primary[400]],
  });

  const isEmailValid = email.includes('@') && email.includes('.');
  const isPasswordValid = password.length >= 8;
  const canSubmit = isEmailValid && isPasswordValid && !loading;

  const handleAuth = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    try {
      let result;
      if (isSignIn) {
        result = await signIn(email.trim(), password);
      } else {
        result = await signUp(email.trim(), password, parentName);
      }

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (isSupabaseConfigured) {
        // Get session to confirm auth succeeded
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please check your email to confirm your account.');
          setLoading(false);
          return;
        }

        // Flush onboarding data to stores with real user ID
        await flushOnboardingToStores({
          userId: session.user.id,
          userEmail: session.user.email ?? email.trim(),
        });
      } else {
        // Dev mode — no Supabase, flush with placeholder IDs
        await flushOnboardingToStores({
          userId: 'dev-user-id',
          userEmail: email.trim(),
        });
      }

      router.replace('/(app)/(tabs)/home');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Skip auth entirely in dev mode
  const handleSkipAuth = async () => {
    if (!isSupabaseConfigured) {
      await flushOnboardingToStores({
        userId: 'dev-user-id',
        userEmail: 'dev@sprouty.app',
      });
      router.replace('/(app)/(tabs)/home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
            <Feather name="chevron-left" size={22} color={colors.textSecondary} />
          </Pressable>

          {/* Header */}
          <View style={styles.headerIcon}>
            <Feather name="shield" size={24} color={colors.primary[500]} />
          </View>
          <Text style={styles.title}>Save {babyName}'s Profile</Text>
          <Text style={styles.subtitle}>
            {isSignIn
              ? 'Sign in to access your saved data'
              : 'Create an account to sync your data across devices'
            }
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <Animated.View
              style={[
                styles.inputWrap,
                { borderColor: emailBorderColor },
                emailFocused && styles.inputWrapFocused,
              ]}
            >
              <Feather name="mail" size={18} color={emailFocused ? colors.primary[500] : colors.neutral[300]} />
              <TextInput
                style={styles.inputField}
                placeholder="Email address"
                placeholderTextColor={colors.neutral[300]}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                onFocus={() => { setEmailFocused(true); animateFocus(emailFocusAnim, true); }}
                onBlur={() => { setEmailFocused(false); animateFocus(emailFocusAnim, false); }}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.inputWrap,
                { borderColor: passwordBorderColor },
                passwordFocused && styles.inputWrapFocused,
              ]}
            >
              <Feather name="lock" size={18} color={passwordFocused ? colors.primary[500] : colors.neutral[300]} />
              <TextInput
                style={styles.inputField}
                placeholder="Password (8+ characters)"
                placeholderTextColor={colors.neutral[300]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                onFocus={() => { setPasswordFocused(true); animateFocus(passwordFocusAnim, true); }}
                onBlur={() => { setPasswordFocused(false); animateFocus(passwordFocusAnim, false); }}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.neutral[300]} />
              </Pressable>
            </Animated.View>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* CTA */}
          <Pressable
            style={[styles.button, shadows.md, !canSubmit && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={!canSubmit}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <>
                <Feather name="check-circle" size={20} color={colors.textInverse} />
                <Text style={styles.buttonText}>
                  {isSignIn ? 'Sign In' : `Save ${babyName}'s Data`}
                </Text>
              </>
            )}
          </Pressable>

          {/* Toggle sign in / sign up */}
          <Pressable style={styles.toggleLink} onPress={() => { setIsSignIn(!isSignIn); setError(null); }}>
            <Text style={styles.toggleText}>
              {isSignIn ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.toggleTextBold}>{isSignIn ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </Pressable>

          {/* Dev skip (only when Supabase not configured) */}
          {!isSupabaseConfigured && (
            <Pressable style={styles.devSkip} onPress={handleSkipAuth}>
              <Text style={styles.devSkipText}>Skip (Dev Mode)</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollView: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: 120 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
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
    marginBottom: spacing['2xl'],
    lineHeight: 22,
  },
  form: { gap: spacing.md, marginBottom: spacing.lg },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputWrapFocused: {
    shadowColor: colors.primary[500],
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputField: {
    flex: 1,
    paddingVertical: spacing.base + 2,
    paddingLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  toggleLink: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  toggleText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  toggleTextBold: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
  },
  devSkip: {
    alignSelf: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
  },
  devSkipText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontWeight: typography.fontWeight.medium,
  },
});

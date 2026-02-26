import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/shared/constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    // TODO: Implement Supabase auth signup
    // On success, redirect to onboarding
    // router.replace('/(onboarding)/welcome');
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Join Sprout</Text>
        <Text style={styles.subtitle}>Create your parenting companion account</Text>

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

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing['2xl'] },
  title: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontSize: typography.fontSize.base, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing['3xl'] },
  form: { gap: spacing.base },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, paddingHorizontal: spacing.base, paddingVertical: spacing.md, fontSize: typography.fontSize.base, color: colors.textPrimary, borderWidth: 1, borderColor: colors.neutral[200] },
  button: { backgroundColor: colors.primary[500], borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.textInverse, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
  backLink: { alignSelf: 'center', marginTop: spacing.base },
  backLinkText: { color: colors.primary[500], fontSize: typography.fontSize.sm },
});

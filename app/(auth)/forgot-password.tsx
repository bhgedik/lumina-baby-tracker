import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/shared/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    // TODO: supabase.auth.resetPasswordForEmail(email)
    setSent(true);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text style={styles.title}>Reset Password</Text>
        {sent ? (
          <View>
            <Text style={styles.successText}>Check your email for a password reset link.</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.button}>
              <Text style={styles.buttonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity style={styles.button} onPress={handleReset}>
              <Text style={styles.buttonText}>Send Reset Link</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
              <Text style={styles.backLinkText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing['2xl'] },
  title: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.base },
  subtitle: { fontSize: typography.fontSize.base, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  form: { gap: spacing.base },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, paddingHorizontal: spacing.base, paddingVertical: spacing.md, fontSize: typography.fontSize.base, color: colors.textPrimary, borderWidth: 1, borderColor: colors.neutral[200] },
  button: { backgroundColor: colors.primary[500], borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  buttonText: { color: colors.textInverse, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
  successText: { fontSize: typography.fontSize.base, color: colors.success, textAlign: 'center', marginBottom: spacing.xl },
  backLink: { alignSelf: 'center', marginTop: spacing.base },
  backLinkText: { color: colors.primary[500], fontSize: typography.fontSize.sm },
});

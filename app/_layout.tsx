import React from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography, spacing } from '../src/shared/constants/theme';
import { HydrationProvider } from '../src/stores/HydrationProvider';

/**
 * Root-level error boundary — catches JS errors anywhere in the tree
 * and shows a recoverable screen instead of a white screen crash.
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Sprout] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

/**
 * Root Layout — Provider hierarchy and auth gate.
 *
 * Provider order (outermost to innermost):
 * ErrorBoundary > HydrationProvider > Slot
 *
 * HydrationProvider hydrates all Zustand stores before rendering.
 * PowerSync, React Query, Timer, and Notification providers
 * will be added in subsequent phases.
 */
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <HydrationProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <Slot />
        </View>
      </HydrationProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing['2xl'],
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  errorMessage: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  retryButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 9999,
  },
  retryText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});

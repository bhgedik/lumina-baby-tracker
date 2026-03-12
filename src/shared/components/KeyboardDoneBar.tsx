// ============================================================
// Lumina — Keyboard Done Bar
// iOS InputAccessoryView with a "Done" button to dismiss keyboard
// Android: no-op (keyboard has built-in dismiss)
// ============================================================

import React from 'react';
import { InputAccessoryView, View, Text, Pressable, Keyboard, StyleSheet, Platform } from 'react-native';
import { colors, typography, spacing } from '../constants/theme';

export const KEYBOARD_DONE_ID = 'nodd-keyboard-done';

export function KeyboardDoneBar() {
  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={KEYBOARD_DONE_ID}>
      <View style={styles.bar}>
        <View style={styles.spacer} />
        <Pressable onPress={Keyboard.dismiss} hitSlop={8} style={styles.button}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[300],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  spacer: {
    flex: 1,
  },
  button: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  doneText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
});

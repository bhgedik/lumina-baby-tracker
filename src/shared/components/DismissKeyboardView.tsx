// ============================================================
// Lumina — Dismiss Keyboard View
// Wrap screens to allow tap-anywhere keyboard dismissal
// ============================================================

import React from 'react';
import { TouchableWithoutFeedback, Keyboard, View, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}

export function DismissKeyboardView({ children }: Props) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.flex}>{children}</View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

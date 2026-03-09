// ============================================================
// Sprouty — Diaper Quick Action Sheet
// 4+1 instant log grid: Dry / Wet / Dirty / Both + AI Photo
// ============================================================

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { DiaperDetailsSheet } from './DiaperDetailsSheet';
import { useDiaperStore } from '../../../stores/diaperStore';
import { isSupabaseConfigured } from '../../../data/supabase/client';
import { colors, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import type { DiaperType } from '../../../shared/types/common';

const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

interface Props {
  visible: boolean;
  onClose: () => void;
  babyId: string;
  familyId: string;
  loggedBy: string;
  onLogged?: (type: DiaperType, msg: string) => void;
}

const OPTIONS: { type: DiaperType; icon: keyof typeof Feather.glyphMap; label: string; sub: string; color: string }[] = [
  { type: 'dry', icon: 'sun', label: 'Dry', sub: 'No output', color: '#C4943A' },
  { type: 'wet', icon: 'droplet', label: 'Wet', sub: 'Wet only', color: '#5E8A72' },
  { type: 'dirty', icon: 'cloud', label: 'Dirty', sub: 'Soiled', color: '#FF9800' },
  { type: 'both', icon: 'layers', label: 'Both', sub: 'Wet + dirty', color: '#F17C4C' },
];

const TOAST_LABELS: Record<DiaperType, string> = {
  dry: 'Dry diaper logged',
  wet: 'Wet diaper logged',
  dirty: 'Dirty diaper logged',
  both: 'Wet + dirty logged',
};

export function DiaperSheet({ visible, onClose, babyId, familyId, loggedBy, onLogged }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const { quickLog, updateItem } = useDiaperStore();

  const handleTap = (type: DiaperType) => {
    quickLog(babyId, familyId, loggedBy, type);
    onLogged?.(type, TOAST_LABELS[type]);
    onClose();
  };

  const handlePhotoTap = () => {
    onClose();
    setTimeout(() => setShowDetails(true), 350);
  };

  const handleDetailsSave = (details: {
    stool_color: import('../../../shared/types/common').StoolColor | null;
    stool_consistency: import('../../../shared/types/common').StoolConsistency | null;
    has_rash: boolean;
    notes: string | null;
  }) => {
    const log = quickLog(babyId, familyId, loggedBy, 'dirty');
    updateItem(log.id, {
      stool_color: details.stool_color,
      stool_consistency: details.stool_consistency,
      has_rash: details.has_rash,
      notes: details.notes,
    });
    onLogged?.('dirty', 'Dirty diaper logged');
    setShowDetails(false);
  };

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose} title="Log Diaper">
        <View style={styles.grid}>
          {OPTIONS.map((opt) => (
            <Pressable
              key={opt.type}
              style={styles.card}
              onPress={() => handleTap(opt.type)}
            >
              <View style={[styles.iconWrap, { backgroundColor: opt.color + '18' }]}>
                <Feather name={opt.icon} size={24} color={opt.color} />
              </View>
              <Text style={[styles.cardLabel, { color: opt.color }]}>{opt.label}</Text>
              <Text style={styles.cardSub}>{opt.sub}</Text>
            </Pressable>
          ))}
        </View>

        {isSupabaseConfigured && (
          <Pressable style={styles.photoRow} onPress={handlePhotoTap}>
            <View style={styles.photoIconWrap}>
              <Feather name="camera" size={18} color={colors.primary[500]} />
            </View>
            <View style={styles.photoTextWrap}>
              <Text style={styles.photoLabel}>AI Photo Analysis</Text>
              <Text style={styles.photoSub}>Tap to scan diaper</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.neutral[400]} />
          </Pressable>
        )}
      </BottomSheet>

      <DiaperDetailsSheet
        visible={showDetails}
        onClose={() => setShowDetails(false)}
        onSave={handleDetailsSave}
      />
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 6,
    ...shadows.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  cardSub: {
    fontSize: 12,
    color: '#8A8A8A',
    fontFamily: SERIF_FONT,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    gap: 12,
  },
  photoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTextWrap: {
    flex: 1,
    gap: 2,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
  },
  photoSub: {
    fontSize: 12,
    color: '#8A8A8A',
    fontFamily: SERIF_FONT,
  },
});

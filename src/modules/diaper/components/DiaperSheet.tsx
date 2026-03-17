// ============================================================
// Lumina — Diaper Quick Action Sheet
// 4+1 instant log grid: Dry / Wet / Dirty / Both + AI Photo
// ============================================================

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { ClayIcon, ClayIconName } from '../../../shared/components/ClayIcons';
import { DiaperDetailsSheet } from './DiaperDetailsSheet';
import { useDiaperStore } from '../../../stores/diaperStore';
import { isSupabaseConfigured } from '../../../data/supabase/client';
import { colors } from '../../../shared/constants/theme';
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

const OPTIONS: { type: DiaperType; clayIcon: ClayIconName; label: string; sub: string; color: string }[] = [
  { type: 'dry', clayIcon: 'sun-dry', label: 'Dry', sub: 'No output', color: '#C4943A' },
  { type: 'wet', clayIcon: 'droplet-wet', label: 'Wet', sub: 'Wet only', color: '#A78BBA' },
  { type: 'dirty', clayIcon: 'cloud-dirty', label: 'Dirty', sub: 'Soiled', color: '#FF9800' },
  { type: 'both', clayIcon: 'layers-both', label: 'Both', sub: 'Wet + dirty', color: '#F2B89C' },
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
              <ClayIcon name={opt.clayIcon} size={56} />
              <Text style={[styles.cardLabel, { color: '#2D2A26' }]}>{opt.label}</Text>
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
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#B0A090',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardSub: {
    fontSize: 12,
    color: '#A08060',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#EDE8E2',
    gap: 12,
    shadowColor: '#B0A090',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  photoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTextWrap: {
    flex: 1,
    gap: 2,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7B5EA7',
  },
  photoSub: {
    fontSize: 12,
    color: '#A08060',
    fontFamily: SERIF_FONT,
  },
});

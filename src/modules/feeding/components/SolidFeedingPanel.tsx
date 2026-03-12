// ============================================================
// Lumina — Solid Feeding Panel
// Food entry with reaction tracking
// ============================================================

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { ChipSelector } from '../../../shared/components/ChipSelector';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import { detectAllergens, ALLERGEN_DISPLAY } from '../../../ai/contentFilter';
import type { SolidFoodEntry } from '../types';

const FOOD_GROUP_OPTIONS = [
  { value: 'fruit', label: 'Fruit' },
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'grain', label: 'Grain' },
  { value: 'protein', label: 'Protein' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'other', label: 'Other' },
];

const AMOUNT_OPTIONS = [
  { value: 'taste', label: 'Taste' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const REACTION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'mild_rash', label: 'Mild Rash' },
  { value: 'vomiting', label: 'Vomiting' },
  { value: 'diarrhea', label: 'Diarrhea' },
  { value: 'swelling', label: 'Swelling' },
];

interface Props {
  foods: SolidFoodEntry[];
  onFoodsChange: (foods: SolidFoodEntry[]) => void;
  knownAllergies?: string[];
}

export function SolidFeedingPanel({ foods, onFoodsChange, knownAllergies = [] }: Props) {
  const [showAddFood, setShowAddFood] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [foodGroup, setFoodGroup] = useState<SolidFoodEntry['food_group']>('fruit');
  const [amount, setAmount] = useState<SolidFoodEntry['amount']>('small');
  const [isNewFood, setIsNewFood] = useState(false);
  const [reaction, setReaction] = useState<SolidFoodEntry['reaction']>('none');

  const commitFood = (entry: SolidFoodEntry) => {
    onFoodsChange([...foods, entry]);
    setFoodName('');
    setFoodGroup('fruit');
    setAmount('small');
    setIsNewFood(false);
    setReaction('none');
    setShowAddFood(false);
  };

  const handleAddFood = () => {
    if (!foodName.trim()) return;
    const detectedFlags = detectAllergens(foodName.trim(), foodGroup);
    const entry: SolidFoodEntry = {
      food_name: foodName.trim(),
      food_group: foodGroup,
      amount,
      is_new_food: isNewFood,
      reaction,
      reaction_notes: null,
      allergen_flags: detectedFlags,
    };

    // Warn if any detected allergen is in knownAllergies
    const matchedKnown = detectedFlags.filter((f) => knownAllergies.includes(f));
    if (matchedKnown.length > 0) {
      const names = matchedKnown.map((k) => ALLERGEN_DISPLAY[k]?.label ?? k).join(', ');
      Alert.alert(
        '⚠️ Known Allergen Detected',
        `This food may contain a known allergen: ${names}. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Anyway', style: 'destructive', onPress: () => commitFood(entry) },
        ],
      );
      return;
    }

    commitFood(entry);
  };

  const handleRemoveFood = (index: number) => {
    onFoodsChange(foods.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      {/* Added foods */}
      {foods.length > 0 && (
        <View style={styles.foodList}>
          {foods.map((food, index) => (
            <View key={index} style={styles.foodItem}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>
                  {food.food_name}
                  {food.allergen_flags.length > 0 && (
                    <Text> {food.allergen_flags.map((f) => ALLERGEN_DISPLAY[f]?.emoji ?? '').join('')}</Text>
                  )}
                  {food.is_new_food && <Text style={styles.newBadge}> NEW</Text>}
                </Text>
                <Text style={styles.foodMeta}>
                  {food.food_group} · {food.amount}
                  {food.reaction && food.reaction !== 'none' ? ` · ⚠️ ${food.reaction}` : ''}
                </Text>
              </View>
              <Pressable onPress={() => handleRemoveFood(index)} style={styles.removeButton}>
                <Feather name="x" size={14} color={colors.textTertiary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Recent foods quick-add */}
      {foods.length === 0 && (
        <Text style={styles.emptyText}>No foods added yet</Text>
      )}

      <Pressable
        style={styles.addButton}
        onPress={() => setShowAddFood(true)}
        accessibilityRole="button"
      >
        <Feather name="plus-circle" size={18} color={colors.primary[500]} />
        <Text style={styles.addButtonText}>Add Food</Text>
      </Pressable>

      {/* Add food bottom sheet */}
      <BottomSheet
        visible={showAddFood}
        onClose={() => setShowAddFood(false)}
        title="Add Food"
      >
        <View style={styles.formSection}>
          <TextInput
            style={styles.nameInput}
            placeholder="Food name"
            placeholderTextColor={colors.textTertiary}
            value={foodName}
            onChangeText={setFoodName}
            autoFocus
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Food Group</Text>
          <ChipSelector
            options={FOOD_GROUP_OPTIONS}
            selected={foodGroup}
            onSelect={(v) => setFoodGroup(v as SolidFoodEntry['food_group'])}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Amount</Text>
          <ChipSelector
            options={AMOUNT_OPTIONS}
            selected={amount}
            onSelect={(v) => setAmount(v as SolidFoodEntry['amount'])}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Reaction</Text>
          <ChipSelector
            options={REACTION_OPTIONS}
            selected={reaction ?? 'none'}
            onSelect={(v) => setReaction(v as SolidFoodEntry['reaction'])}
          />
        </View>

        <Pressable
          style={styles.newFoodToggle}
          onPress={() => setIsNewFood(!isNewFood)}
          accessibilityRole="switch"
        >
          <View style={[styles.toggleDot, isNewFood && styles.toggleDotActive]} />
          <Text style={styles.toggleLabel}>First time trying this food</Text>
        </Pressable>

        <Pressable style={styles.saveButton} onPress={handleAddFood} accessibilityRole="button">
          <Text style={styles.saveButtonText}>Add</Text>
        </Pressable>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.base,
  },
  foodList: {
    gap: spacing.sm,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.sm,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  newBadge: {
    fontSize: typography.fontSize.xs,
    color: colors.secondary[500],
    fontWeight: typography.fontWeight.bold,
  },
  foodMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: spacing.lg,
  },
  addButton: {
    height: 56,
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius['2xl'],
    borderWidth: 1.5,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
  },
  formSection: {
    marginBottom: spacing.base,
  },
  formLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  nameInput: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    backgroundColor: colors.neutral[50],
  },
  newFoodToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.base,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    backgroundColor: colors.surface,
  },
  toggleDotActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  toggleLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  saveButton: {
    height: 56,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textInverse,
  },
});

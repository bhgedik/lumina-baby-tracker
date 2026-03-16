// ============================================================
// Lumina — Myth Buster (Full List)
// Expandable accordion of common baby care misconceptions
// with science-backed facts and medical sources
// ============================================================

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Design tokens ──

const UI = {
  bg: '#FDFCF5',
  card: '#FFFFFF',
  text: '#33302B',
  textSecondary: '#5C5C5C',
  textMuted: '#8A8A8A',
  textLight: '#B0AAA2',
  mythAmber: '#B8860B',
  mythAmberBg: '#FDF6E8',
  mythAmberBorder: '#F0E0C0',
  factGreen: '#4A8C5E',
  factGreenBg: '#EFF8F2',
  factGreenBorder: '#D0E8D6',
  sourceBlue: '#5A7A9E',
  sourceBlueBg: '#EEF3F8',
};

const SOFT_SHADOW = {
  shadowColor: '#8A7A6A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 16,
  elevation: 3,
};

// ── Myth Data ──

interface MythFact {
  id: string;
  myth: string;
  fact: string;
  source: string;
  severity: 'warning' | 'danger';
  category: 'feeding' | 'health' | 'sleep' | 'development';
}

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  feeding: 'droplet',
  health: 'shield',
  sleep: 'moon',
  development: 'zap',
};

const CATEGORY_COLORS: Record<string, string> = {
  feeding: '#D4A36A',
  health: '#B8860B',
  sleep: '#8A7A5E',
  development: '#A78BBA',
};

export const MYTHS_DATABASE: MythFact[] = [
  {
    id: 'sugar-water-colic',
    myth: 'Adding sugar to water helps with colic.',
    fact: 'Strictly avoid sugar. It doesn\'t help with colic and causes severe damage to developing teeth and immune systems. Effective colic strategies include the 5 S\'s (swaddle, side, shush, swing, suck), probiotics (L. reuteri), and holding baby upright after feeds.',
    source: 'WHO Guidelines on Sugars Intake for Adults and Children; AAP Section on Gastroenterology',
    severity: 'danger',
    category: 'feeding',
  },
  {
    id: 'juice-vitamins',
    myth: 'Babies need fruit juice for vitamins.',
    fact: 'Whole fruit or breastmilk/formula provides all needed vitamins. Juice is high in concentrated sugar and can lead to obesity, early tooth decay, and diarrhea. The AAP recommends NO juice before 12 months.',
    source: 'AAP Policy Statement: Fruit Juice in Infants, Children, and Adolescents (2017); WHO Guidelines on Sugars Intake',
    severity: 'danger',
    category: 'feeding',
  },
  {
    id: 'teething-fever',
    myth: 'Teething causes high fever.',
    fact: 'Teething only causes mild discomfort, slight drooling, and low-grade temperature (below 38°C / 100.4°F). If there\'s a high fever, it\'s likely an infection — consult a doctor immediately.',
    source: 'AAP HealthyChildren.org; Pediatrics Vol. 137, Issue 3 (2016); NHS: Baby Teething Symptoms',
    severity: 'warning',
    category: 'health',
  },
  {
    id: 'rice-cereal-sleep',
    myth: 'Adding rice cereal to a bottle helps babies sleep longer.',
    fact: 'Studies show no improvement in sleep duration. It increases calorie intake unnecessarily, can cause choking, and delays proper introduction to solid foods. Follow age-appropriate feeding guidelines instead.',
    source: 'AAP Committee on Nutrition; JAMA Pediatrics (2019); NHS Start4Life',
    severity: 'danger',
    category: 'sleep',
  },
  {
    id: 'walkers-walking',
    myth: 'Baby walkers help babies learn to walk faster.',
    fact: 'Baby walkers actually delay walking by 2-3 weeks and cause thousands of injuries annually. They strengthen the wrong muscles and prevent crucial floor time. The AAP has called for a ban on their sale.',
    source: 'AAP Policy Statement on Baby Walkers (2018); Pediatrics Vol. 142, Issue 5; NHS: Baby Safety Tips',
    severity: 'danger',
    category: 'development',
  },
  {
    id: 'crying-it-out',
    myth: 'Letting a newborn "cry it out" teaches independence.',
    fact: 'Newborns (0-3 months) cannot self-soothe and are not capable of manipulation. Responding promptly to cries builds secure attachment, which is the true foundation of independence. Responsive caregiving is supported by all major developmental research.',
    source: 'Bowlby: Attachment Theory (1969); Ainsworth: Strange Situation Study; AAP: Nurturing Care Framework; UNICEF Early Childhood Development',
    severity: 'warning',
    category: 'development',
  },
  {
    id: 'gripe-water',
    myth: 'Gripe water is a safe, natural remedy for gas.',
    fact: 'Many gripe water products contain alcohol, sugar, or sodium bicarbonate — none of which are safe for infants. Some have been recalled for contamination. Tummy massage, bicycle legs, and proper burping are safer alternatives.',
    source: 'FDA Safety Reporting Portal; AAP Committee on Drugs; NHS: Colic Overview',
    severity: 'danger',
    category: 'health',
  },
  {
    id: 'honey-cough',
    myth: 'A little honey soothes a baby\'s cough.',
    fact: 'NEVER give honey to babies under 12 months. It can cause infant botulism, a life-threatening illness. Even "pasteurized" honey is not safe. For cough, use saline drops, a humidifier, or consult your pediatrician.',
    source: 'WHO Complementary Feeding Guidelines; AAP Red Book (Infectious Diseases); CDC Botulism Prevention; NHS: Foods to Avoid',
    severity: 'danger',
    category: 'feeding',
  },
  {
    id: 'bumpers-safe',
    myth: 'Crib bumpers protect babies from injury.',
    fact: 'Crib bumpers are a suffocation and strangulation hazard. They have been linked to dozens of infant deaths. The AAP recommends a bare crib: firm mattress, fitted sheet, nothing else. Safe sleep saves lives.',
    source: 'AAP Policy: Safe Sleep Recommendations (2022); CPSC Crib Bumper Deaths Report; NHS: Reduce the Risk of SIDS',
    severity: 'danger',
    category: 'sleep',
  },
  {
    id: 'teeth-milk',
    myth: 'Baby teeth don\'t matter because they fall out anyway.',
    fact: 'Baby teeth guide permanent teeth into place, aid speech development, and affect nutrition through chewing. Decay in baby teeth can damage developing permanent teeth underneath. Start oral care from the first tooth.',
    source: 'AAPD Policy on Early Childhood Caries; ADA: Baby Teeth; NHS: Children\'s Teeth',
    severity: 'warning',
    category: 'health',
  },
  {
    id: 'blanket-cold',
    myth: 'Babies need a blanket to stay warm at night.',
    fact: 'Loose blankets are a suffocation risk for babies under 12 months. Use a sleep sack or wearable blanket instead. The room should be 68-72°F (20-22°C). A good rule: dress baby in one more layer than you\'d wear.',
    source: 'AAP Safe Sleep Policy Statement (2022); NHS: Reduce the Risk of SIDS; UNICEF Baby Friendly Initiative',
    severity: 'danger',
    category: 'sleep',
  },
  {
    id: 'water-newborn',
    myth: 'Newborns need extra water, especially in summer.',
    fact: 'Breastmilk or formula provides all the hydration a baby needs until 6 months. Giving water to young infants can cause water intoxication, which dangerously dilutes sodium levels and can cause seizures.',
    source: 'WHO Exclusive Breastfeeding Guidelines; AAP Committee on Nutrition; NHS Start4Life: Drinks and Cups',
    severity: 'danger',
    category: 'feeding',
  },
  {
    id: 'jaundice-sunlight',
    myth: 'Putting a jaundiced baby in sunlight is the best treatment.',
    fact: 'While sunlight contains the right wavelengths, it also exposes newborns to harmful UV radiation and temperature instability. Clinical phototherapy is far more effective and safe. Always have jaundice evaluated by a doctor — untreated severe jaundice can cause brain damage.',
    source: 'AAP Clinical Practice Guidelines for Management of Hyperbilirubinemia in the Newborn (2022); NHS: Newborn Jaundice Treatment',
    severity: 'danger',
    category: 'health',
  },
];

// ── Accordion Card ──

function MythAccordion({ myth, isExpanded, onToggle }: {
  myth: MythFact;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    onToggle();
  }, [isExpanded, onToggle, rotateAnim]);

  const chevronRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const catColor = CATEGORY_COLORS[myth.category] ?? UI.mythAmber;

  return (
    <View style={[s.card, SOFT_SHADOW]}>
      <Pressable style={s.mythHeader} onPress={handleToggle}>
        <View style={[s.mythIconWrap, { borderColor: catColor + '40' }]}>
          <Feather name="help-circle" size={16} color={UI.mythAmber} />
        </View>
        <View style={s.mythTextWrap}>
          <View style={s.mythLabelRow}>
            <View style={s.mythBadge}>
              <Text style={s.mythBadgeText}>DID YOU KNOW?</Text>
            </View>
            <View style={s.categoryPill}>
              <Feather name={CATEGORY_ICONS[myth.category] ?? 'info'} size={10} color={catColor} />
              <Text style={[s.categoryText, { color: catColor }]}>
                {myth.category.charAt(0).toUpperCase() + myth.category.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={s.mythTitle}>{myth.myth}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Feather name="chevron-down" size={18} color={UI.textMuted} />
        </Animated.View>
      </Pressable>

      {isExpanded && (
        <View style={s.factSection}>
          <View style={s.factDivider} />
          <View style={s.factContent}>
            <View style={s.factLabelRow}>
              <View style={s.factBadge}>
                <Feather name="shield" size={11} color={UI.factGreen} />
                <Text style={s.factBadgeText}>VERIFIED FACT</Text>
              </View>
            </View>
            <Text style={s.factText}>{myth.fact}</Text>
            <View style={s.sourceRow}>
              <Feather name="book-open" size={11} color={UI.sourceBlue} />
              <Text style={s.sourceText}>{myth.source}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Main Screen ──

export default function MythListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ expandId?: string }>();
  const [expandedMyths, setExpandedMyths] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (params.expandId) initial.add(params.expandId);
    return initial;
  });

  const toggleMyth = useCallback((id: string) => {
    setExpandedMyths((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back + Header */}
        <View style={s.headerRow}>
          <Pressable
            style={[s.backButton, SOFT_SHADOW]}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Feather name="arrow-left" size={22} color={UI.text} />
          </Pressable>
        </View>

        <View style={s.heroSection}>
          <View style={s.heroIconWrap}>
            <Feather name="help-circle" size={28} color={UI.mythAmber} />
          </View>
          <Text style={s.heroTitle}>Common Misconceptions</Text>
          <Text style={s.heroSubtitle}>
            Things you may have heard — but aren't quite right.{'\n'}
            Every fact is verified by WHO, AAP, NHS, or UNICEF.
          </Text>

          <View style={s.legendRow}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: UI.mythAmber }]} />
              <Text style={s.legendText}>Common Belief</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: UI.factGreen }]} />
              <Text style={s.legendText}>Verified Fact</Text>
            </View>
          </View>
        </View>

        {/* All Myths */}
        <View style={s.listSection}>
          {MYTHS_DATABASE.map((myth) => (
            <MythAccordion
              key={myth.id}
              myth={myth}
              isExpanded={expandedMyths.has(myth.id)}
              onToggle={() => toggleMyth(myth.id)}
            />
          ))}
        </View>

        {/* Disclaimer */}
        <View style={s.disclaimerBox}>
          <Feather name="shield" size={14} color="#8A9DB0" />
          <Text style={s.disclaimerText}>
            Lumina provides information based on international pediatric guidelines (WHO, AAP, NHS, UNICEF). However, every baby is unique. This is not medical advice. Always consult your pediatrician before making health decisions.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ──

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: UI.card,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 24,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: UI.mythAmberBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: UI.mythAmberBorder,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: UI.text,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: UI.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    color: UI.textMuted,
  },

  // List
  listSection: {
    paddingHorizontal: 20,
  },

  // Card
  card: {
    backgroundColor: UI.card,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  mythHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  mythIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: UI.mythAmberBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  mythTextWrap: {
    flex: 1,
  },
  mythLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  mythBadge: {
    backgroundColor: UI.mythAmberBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: UI.mythAmberBorder,
  },
  mythBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: UI.mythAmber,
    letterSpacing: 0.8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mythTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: UI.text,
    lineHeight: 19,
  },

  // Fact
  factSection: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  factDivider: {
    height: 1,
    backgroundColor: '#F0EDE8',
    marginBottom: 12,
  },
  factContent: {
    backgroundColor: UI.factGreenBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: UI.factGreenBorder,
  },
  factLabelRow: {
    marginBottom: 8,
  },
  factBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: UI.factGreenBorder,
  },
  factBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: UI.factGreen,
    letterSpacing: 0.6,
  },
  factText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#2D4A35',
    lineHeight: 21,
    marginBottom: 10,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: UI.sourceBlueBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sourceText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: UI.sourceBlue,
    lineHeight: 16,
  },

  // Disclaimer
  disclaimerBox: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: '#F5F4F2',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  disclaimerText: {
    fontSize: 12,
    fontWeight: '400',
    fontStyle: 'italic',
    color: '#8A8A8A',
    lineHeight: 18,
    textAlign: 'center',
  },
});

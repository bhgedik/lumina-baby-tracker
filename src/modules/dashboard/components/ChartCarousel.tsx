// ============================================================
// Sprouty — Chart Carousel
// Horizontal paging ScrollView with 3 chart cards + dots
// ============================================================

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { HabitsChart } from './HabitsChart';
import { SleepChart } from './SleepChart';
import { GrowthPercentileChart } from './GrowthPercentileChart';
import type { ChartData } from '../hooks/useChartData';

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PADDING = 24;
const CARD_WIDTH = SCREEN_WIDTH - H_PADDING * 2;

const UI = {
  text: '#3D3D3D',
  textMuted: '#8A8A8A',
  accent: '#8BA88E',
  card: '#FFFFFF',
  dotInactive: '#D4CFC8',
};

const SOFT_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
};

const PAGE_COUNT = 3;

interface ChartCarouselProps {
  data: ChartData;
  todayFeeds: number;
  todayWet: number;
  todayDirty: number;
}

export function ChartCarousel({ data, todayFeeds, todayWet, todayDirty }: ChartCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    setActiveIndex(Math.max(0, Math.min(index, PAGE_COUNT - 1)));
  }, []);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Card 1: Habits */}
        <View style={[styles.card, { width: CARD_WIDTH }]}>
          <Text style={styles.cardTitle}>This Week's Habits</Text>
          <HabitsChart data={data.habits} />
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Feather name="coffee" size={13} color={UI.textMuted} />
              <Text style={styles.statText}>{todayFeeds} feeds</Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.stat}>
              <Feather name="droplet" size={13} color={UI.textMuted} />
              <Text style={styles.statText}>{todayWet} wet</Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.stat}>
              <Feather name="cloud" size={13} color={UI.textMuted} />
              <Text style={styles.statText}>{todayDirty} dirty</Text>
            </View>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8BA88E' }]} />
              <Text style={styles.legendLabel}>Feeds</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F17C4C' }]} />
              <Text style={styles.legendLabel}>Diapers</Text>
            </View>
          </View>
        </View>

        {/* Card 2: Growth */}
        <View style={[styles.card, { width: CARD_WIDTH }]}>
          <Text style={styles.cardTitle}>Growth Percentile</Text>
          <GrowthPercentileChart data={data.growth} hasData={data.hasGrowthData} />
        </View>

        {/* Card 3: Sleep */}
        <View style={[styles.card, { width: CARD_WIDTH }]}>
          <Text style={styles.cardTitle}>Night Sleep (2 Weeks)</Text>
          <SleepChart data={data.sleep} />
        </View>
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.dots}>
        {Array.from({ length: PAGE_COUNT }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 0,
  },
  card: {
    backgroundColor: UI.card,
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 8,
    ...SOFT_SHADOW,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: UI.text,
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
    color: UI.textMuted,
    letterSpacing: 0.1,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: UI.textMuted,
    opacity: 0.35,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: UI.textMuted,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: UI.accent,
  },
  dotInactive: {
    backgroundColor: UI.dotInactive,
  },
});

// ============================================================
// Lumina — Play & Bonding Screen
// Warm, plush activity logger: Tummy Time, Fresh Air,
// + AI-powered Reading, Sensory Play, Music & Sound cards
// ============================================================

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  Modal,
  Linking,
  Dimensions,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { LuminaWhisper } from '../../../src/shared/components/LuminaWhisper';
import { KeyboardDoneBar, KEYBOARD_DONE_ID } from '../../../src/shared/components/KeyboardDoneBar';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useCorrectedAge } from '../../../src/modules/baby/hooks/useCorrectedAge';
import { ChatSheet } from '../../../src/modules/insights/components/ChatSheet';
import {
  fetchActivitySuggestions,
  type ActivitySuggestions,
} from '../../../src/modules/activity/services/activitySuggestionsService';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

// ── AI Play Suggestions by Age (months) ──
interface PlaySuggestion {
  activity: string;
  tip: string;
  icon: keyof typeof Feather.glyphMap;
}

function getPlaySuggestion(ageMonths: number, babyName: string): PlaySuggestion {
  if (ageMonths < 1) {
    return {
      activity: 'Skin-to-Skin Time',
      tip: `${babyName || 'Baby'}'s vision is blurry right now — about 8–12 inches. Get close, talk softly, and just be present. That's all the play ${babyName || 'she'} needs today.`,
      icon: 'heart',
    };
  }
  if (ageMonths < 2) {
    return {
      activity: 'Face Gazing',
      tip: `Hold ${babyName || 'baby'} about 10 inches from your face and make slow, exaggerated expressions. Stick out your tongue — ${babyName || 'baby'} might just copy you!`,
      icon: 'eye',
    };
  }
  if (ageMonths < 3) {
    return {
      activity: 'Contrast Cards',
      tip: `Black-and-white patterns are fascinating at this age. Hold a high-contrast card 10 inches away and slowly move it side to side. ${babyName || 'Baby'}'s eyes will follow!`,
      icon: 'grid',
    };
  }
  if (ageMonths < 4) {
    return {
      activity: 'Tummy Time Chat',
      tip: `Lie face-to-face with ${babyName || 'baby'} during tummy time and narrate your day. "Now mama's going to tell you about the birds outside." Two activities in one!`,
      icon: 'message-circle',
    };
  }
  if (ageMonths < 6) {
    return {
      activity: 'Reach & Grab',
      tip: `Dangle a colorful rattle or crinkly toy just within ${babyName || 'baby'}'s reach. The concentration on their face when they grab it is priceless. Celebrate every attempt!`,
      icon: 'gift',
    };
  }
  if (ageMonths < 9) {
    return {
      activity: 'Peek-a-Boo',
      tip: `The classic — and there's real science behind it! ${babyName || 'Baby'} is learning object permanence: you still exist even when hidden. Try it with a cloth or your hands.`,
      icon: 'smile',
    };
  }
  if (ageMonths < 12) {
    return {
      activity: 'Container Play',
      tip: `Give ${babyName || 'baby'} a bowl and some safe objects to put in and take out. Stacking cups, wooden blocks, even big pasta shapes. They could do this for 20 minutes!`,
      icon: 'box',
    };
  }
  return {
    activity: 'Stack & Knock',
    tip: `Build a tower of blocks together and let ${babyName || 'baby'} knock it down. The crash is the best part! This teaches cause and effect while building fine motor skills.`,
    icon: 'layers',
  };
}

// ── Duration presets ──
const TUMMY_PRESETS = [
  { value: '2', label: '2 min' },
  { value: '5', label: '5 min' },
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
];

const OUTSIDE_PRESETS = [
  { value: '10', label: '10 min' },
  { value: '20', label: '20 min' },
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hr' },
];

// ── Skeleton shimmer for loading state ──
function SkeletonRow() {
  const opacity = useMemo(() => new Animated.Value(0.3), []);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeletonRow, { opacity }]}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonReason} />
    </Animated.View>
  );
}

// ── Suggestion chip (selectable) ──
function SuggestionChip({
  label,
  reason,
  product,
  isSelected,
  onPress,
  accentColor,
}: {
  label: string;
  reason: string;
  product?: string | null;
  isSelected: boolean;
  onPress: () => void;
  accentColor: string;
}) {
  return (
    <Pressable
      style={[
        styles.aiChip,
        isSelected && { backgroundColor: accentColor + '12', borderColor: accentColor },
      ]}
      onPress={onPress}
    >
      <View style={styles.aiChipHeader}>
        <View style={[
          styles.aiChipCheck,
          isSelected && { backgroundColor: accentColor, borderColor: accentColor },
        ]}>
          {isSelected && <Feather name="check" size={12} color="#FFFFFF" />}
        </View>
        <Text style={[styles.aiChipTitle, isSelected && { color: accentColor }]} numberOfLines={2}>
          {label}
        </Text>
        <Feather name="chevron-right" size={14} color={isSelected ? accentColor : colors.neutral[300]} />
      </View>
      <Text style={styles.aiChipReason} numberOfLines={2}>{reason}</Text>
      {product ? (
        <View style={styles.aiChipProductRow}>
          <Feather name="shopping-bag" size={11} color={colors.textTertiary} />
          <Text style={styles.aiChipProduct} numberOfLines={1}>{product}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// ── Colors for the 3 new sections ──
const READING_COLOR = '#2E7D6F';
const SENSORY_COLOR = '#7B61A6';
const MUSIC_COLOR = '#C2703E';

// ── Age-Appropriate Board Book Database ──

interface BoardBook {
  title: string;
  author: string;
  bg: string;
  textColor: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  description: string;
  affiliateLink: string;
  coverImageUrl: string;
}

type AgeRange = '0-3m' | '3-6m' | '6-12m' | '12m+';

const BOARD_BOOKS: Record<AgeRange, BoardBook[]> = {
  '0-3m': [
    { title: 'Look, Look!', author: 'Peter Linenthal', bg: '#1A1A1A', textColor: '#FFFFFF', icon: 'eye', description: 'Bold black-and-white images designed for newborn eyes. Perfect for those early weeks when high-contrast is all they can see.', affiliateLink: 'https://www.amazon.com/dp/0525420282?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0525420282-M.jpg' },
    { title: 'Black on White', author: 'Tana Hoban', bg: '#2C2C2C', textColor: '#F0F0F0', icon: 'square', description: 'Simple silhouette shapes on stark white. A classic for visual development in the first weeks of life.', affiliateLink: 'https://www.amazon.com/dp/0688119182?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0688119182-M.jpg' },
    { title: 'White on Black', author: 'Tana Hoban', bg: '#F5F5F0', textColor: '#1A1A1A', icon: 'circle', description: 'The inverse companion — white shapes on black pages. Newborns are mesmerized by the contrast.', affiliateLink: 'https://www.amazon.com/dp/0688119190?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0688119190-M.jpg' },
    { title: 'Hello, Bugs!', author: 'Smriti Prasadam-Halls', bg: '#E8F8E0', textColor: '#3A6B2E', icon: 'star', description: 'Bright, cheerful bugs with tactile textures. Great for early sensory exploration and tummy time.', affiliateLink: 'https://www.amazon.com/dp/0763693812?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0763693812-M.jpg' },
    { title: 'Art for Baby', author: 'Yana Peel', bg: '#E8E8E8', textColor: '#333333', icon: 'grid', description: 'Actual modern art curated for developing eyes. Stimulates visual tracking and early focus skills.', affiliateLink: 'https://www.amazon.com/dp/0714862126?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0714862126-M.jpg' },
    { title: 'Faces', author: 'DK Publishing', bg: '#FEF0E0', textColor: '#6B4020', icon: 'users', description: 'Real baby faces showing emotions. Newborns are wired to stare at faces — this book plays to that instinct.', affiliateLink: 'https://www.amazon.com/dp/1465409106?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/1465409106-M.jpg' },
    { title: 'I Love You to the Moon', author: 'Amelia Hepworth', bg: '#DDE3F3', textColor: '#3A4A7A', icon: 'moon', description: 'A tender bedtime read with soft illustrations. Perfect for winding down and bonding before sleep.', affiliateLink: 'https://www.amazon.com/dp/1680105205?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/1680105205-M.jpg' },
    { title: 'High Contrast Baby', author: 'Roger Priddy', bg: '#1F1F1F', textColor: '#FFFFFF', icon: 'sun', description: 'Designed by experts in infant vision. Bold patterns that captivate from day one.', affiliateLink: 'https://www.amazon.com/dp/0312514735?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0312514735-M.jpg' },
    { title: 'Just Like Me', author: 'Lauren Child', bg: '#FFF5E8', textColor: '#6B4C2A', icon: 'smile', description: 'Charming illustrations celebrating individuality. Gentle rhymes perfect for reading aloud.', affiliateLink: 'https://www.amazon.com/dp/1536214930?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/1536214930-M.jpg' },
    { title: 'Hello, Baby!', author: 'Mem Fox', bg: '#F0E8F5', textColor: '#5B3E7C', icon: 'heart', description: 'Lyrical text and warm art from a master storyteller. A beautiful welcome-to-the-world read.', affiliateLink: 'https://www.amazon.com/dp/1416985131?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/1416985131-M.jpg' },
  ],
  '3-6m': [
    { title: 'Global Babies', author: 'Maya Ajmera', bg: '#E8F5F2', textColor: '#2E6B5A', icon: 'globe', description: 'Beautiful photos of babies from around the world. Encourages face recognition and cultural awareness early on.', affiliateLink: 'https://www.amazon.com/dp/1580891748?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/1580891748-M.jpg' },
    { title: 'Ten Little Fingers', author: 'Mem Fox', bg: '#FDEAEA', textColor: '#8B3A3A', icon: 'heart', description: 'A rhythmic, gentle read about all the things babies share. Perfect for counting fingers and toes together.', affiliateLink: 'https://www.amazon.com/dp/0547581076?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0547581076-M.jpg' },
    { title: 'Baby Faces', author: 'Margaret Miller', bg: '#FFF3D6', textColor: '#7A6020', icon: 'smile', description: 'Real photos of diverse baby expressions. Helps your little one learn to read emotions and social cues.', affiliateLink: 'https://www.amazon.com/dp/1416978879?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/1416978879-M.jpg' },
    { title: 'Peekaboo Morning', author: 'Rachel Isadora', bg: '#FEF0E0', textColor: '#8B5E2E', icon: 'sun', description: 'A joyful peekaboo game through the pages. Builds anticipation skills and object permanence.', affiliateLink: 'https://www.amazon.com/dp/0399254048?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0399254048-M.jpg' },
    { title: 'Indestructibles: Baby Faces', author: 'Amy Pixton', bg: '#E8DDF3', textColor: '#5B3E7C', icon: 'users', description: 'Literally indestructible — rip-proof, chew-proof, drool-proof. Perfect for grabby hands and gummy mouths.', affiliateLink: 'https://www.amazon.com/dp/0761168818?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0761168818-M.jpg' },
    { title: 'That\'s Not My Bunny', author: 'Fiona Watt', bg: '#F3E8E8', textColor: '#7A3A4A', icon: 'feather', description: 'Touchy-feely patches on every page. Babies love the textures and the repetitive "that\'s not my..." rhythm.', affiliateLink: 'https://www.amazon.com/dp/0794502792?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0794502792-M.jpg' },
    { title: 'Clap Hands', author: 'Helen Oxenbury', bg: '#FFF5E8', textColor: '#6B4C2A', icon: 'music', description: 'Simple action-based text that invites movement. Clap, stamp, dance — active reading at its best.', affiliateLink: 'https://www.amazon.com/dp/1442466197?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/1442466197-M.jpg' },
    { title: 'I Kissed the Baby', author: 'Mary Murphy', bg: '#E8F8E0', textColor: '#3A6B2E', icon: 'heart', description: 'Bold graphic illustrations with a sweet surprise ending. The call-and-response format is perfect for this age.', affiliateLink: 'https://www.amazon.com/dp/0763623849?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0763623849-M.jpg' },
    { title: 'Peek-a-Who?', author: 'Nina Laden', bg: '#F0E8F5', textColor: '#5B3E7C', icon: 'search', description: 'Rhyming peek-a-boo with die-cut pages. Babies love guessing what\'s behind each flap.', affiliateLink: 'https://www.amazon.com/dp/0811826023?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0811826023-M.jpg' },
    { title: 'Baby Touch: Faces', author: 'Ladybird', bg: '#DDE8F3', textColor: '#3A5A8B', icon: 'eye', description: 'Textured faces with raised elements to explore. Combines visual and tactile stimulation beautifully.', affiliateLink: 'https://www.amazon.com/dp/0241273137?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0241273137-M.jpg' },
  ],
  '6-12m': [
    { title: 'Where\'s Spot?', author: 'Eric Hill', bg: '#FFF3D6', textColor: '#7A6020', icon: 'search', description: 'The original lift-the-flap book. Teaches cause and effect as baby discovers who\'s hiding under each flap.', affiliateLink: 'https://www.amazon.com/dp/0399240462?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0399240462-M.jpg' },
    { title: 'Dear Zoo', author: 'Rod Campbell', bg: '#FDEAEA', textColor: '#8B3A3A', icon: 'box', description: 'Lift-the-flap animal fun with a satisfying ending. Builds vocabulary and anticipation with each page turn.', affiliateLink: 'https://www.amazon.com/dp/1416947370?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/1416947370-M.jpg' },
    { title: 'Pat the Bunny', author: 'Dorothy Kunhardt', bg: '#F0E8F5', textColor: '#5B3E7C', icon: 'feather', description: 'The classic touch-and-feel. Pat the bunny, feel daddy\'s scratchy face, look in the mirror — pure interactive magic.', affiliateLink: 'https://www.amazon.com/dp/0307120007?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0307120007-M.jpg' },
    { title: 'That\'s Not My Puppy', author: 'Fiona Watt', bg: '#E8F5F2', textColor: '#2E6B5A', icon: 'heart', description: 'Tactile patches with a simple repetitive structure. Builds sensory awareness and the joy of "that IS my puppy!"', affiliateLink: 'https://www.amazon.com/dp/0794502768?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0794502768-M.jpg' },
    { title: 'Lift-the-Flap Farm', author: 'Rod Campbell', bg: '#FEF0E0', textColor: '#8B5E2E', icon: 'sun', description: 'Sturdy flaps hiding farm animals and sounds. Perfect for practicing fine motor skills and animal vocabulary.', affiliateLink: 'https://www.amazon.com/dp/1447210913?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/1447210913-M.jpg' },
    { title: 'Touch & Feel Animals', author: 'DK', bg: '#E8DDF3', textColor: '#5B3E7C', icon: 'star', description: 'Real animal photos with textured patches. Bridges the gap between pictures and real-world recognition.', affiliateLink: 'https://www.amazon.com/dp/0756634687?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0756634687-M.jpg' },
    { title: 'Moo, Baa, La La La!', author: 'Sandra Boynton', bg: '#DDE8F3', textColor: '#3A5A8B', icon: 'music', description: 'Silly animal sounds with Boynton\'s iconic humor. Babies giggle at "la la la" every single time.', affiliateLink: 'https://www.amazon.com/dp/067144901X?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/067144901X-M.jpg' },
    { title: 'First 100 Words', author: 'Roger Priddy', bg: '#E8F8E0', textColor: '#3A6B2E', icon: 'book', description: 'Bright photos organized by category. A word-building powerhouse for the pre-verbal stage.', affiliateLink: 'https://www.amazon.com/dp/0312510780?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0312510780-M.jpg' },
    { title: 'Tickle, Tickle', author: 'Helen Oxenbury', bg: '#FFF5E8', textColor: '#6B4C2A', icon: 'smile', description: 'Warm, playful illustrations of daily baby routines. Reading this one naturally leads to cuddles and giggles.', affiliateLink: 'https://www.amazon.com/dp/1442466189?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/1442466189-M.jpg' },
    { title: 'The Snowman', author: 'Raymond Briggs', bg: '#DDE3F3', textColor: '#3A4A7A', icon: 'cloud-snow', description: 'Wordless picture story of wonder and adventure. You narrate in your own words — baby watches you, enchanted.', affiliateLink: 'https://www.amazon.com/dp/0394839730?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0394839730-M.jpg' },
  ],
  '12m+': [
    { title: 'The Very Hungry Caterpillar', author: 'Eric Carle', bg: '#E8F8E0', textColor: '#3A6B2E', icon: 'sun', description: 'A timeless journey of transformation. Teaches counting, days of the week, and healthy eating through sheer joy.', affiliateLink: 'https://www.amazon.com/dp/0399226907?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0399226907-M.jpg' },
    { title: 'Goodnight Moon', author: 'Margaret Wise Brown', bg: '#DDE3F3', textColor: '#3A4A7A', icon: 'moon', description: 'The ultimate bedtime ritual book. The gentle rhythm of "goodnight" teaches winding down and mindfulness.', affiliateLink: 'https://www.amazon.com/dp/0694003611?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0694003611-M.jpg' },
    { title: 'Moo, Baa, La La La!', author: 'Sandra Boynton', bg: '#DDE8F3', textColor: '#3A5A8B', icon: 'music', description: 'Silly animal sounds meet Boynton\'s goofy charm. A fan favorite that toddlers want to hear on repeat.', affiliateLink: 'https://www.amazon.com/dp/067144901X?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/067144901X-M.jpg' },
    { title: 'Guess How Much I Love You', author: 'Sam McBratney', bg: '#FEF0E0', textColor: '#8B5E2E', icon: 'heart', description: 'A beautiful back-and-forth about the immeasurable nature of love. "I love you to the moon and back."', affiliateLink: 'https://www.amazon.com/dp/0763642649?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0763642649-M.jpg' },
    { title: 'Brown Bear, Brown Bear', author: 'Bill Martin Jr.', bg: '#FDEAEA', textColor: '#8B3A3A', icon: 'eye', description: 'Rhythmic, predictable text builds language skills. Eric Carle\'s vivid collage art makes every page a masterpiece.', affiliateLink: 'https://www.amazon.com/dp/0805047905?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0805047905-M.jpg' },
    { title: 'Each Peach Pear Plum', author: 'Janet Ahlberg', bg: '#FFF5E8', textColor: '#8B5030', icon: 'star', description: 'A delightful I-spy game through nursery rhyme characters. Builds observation skills and narrative understanding.', affiliateLink: 'https://www.amazon.com/dp/0670882194?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0670882194-M.jpg' },
    { title: 'We\'re Going on a Bear Hunt', author: 'Michael Rosen', bg: '#E8F5F2', textColor: '#2E6B5A', icon: 'map', description: 'An adventure with irresistible sound effects — squelch! swish! Toddlers love acting it out physically.', affiliateLink: 'https://www.amazon.com/dp/0689853491?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0689853491-M.jpg' },
    { title: 'The Gruffalo', author: 'Julia Donaldson', bg: '#E8DDF3', textColor: '#5B3E7C', icon: 'feather', description: 'A clever mouse outsmarts everyone in the forest. Teaches storytelling structure and builds confidence.', affiliateLink: 'https://www.amazon.com/dp/0142403873?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0142403873-M.jpg' },
    { title: 'Owl Babies', author: 'Martin Waddell', bg: '#F3E8E8', textColor: '#7A3A4A', icon: 'moon', description: 'Three owlets wait for their mother. A gentle exploration of separation anxiety — "I want my mummy!"', affiliateLink: 'https://www.amazon.com/dp/1564029166?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/1564029166-M.jpg' },
    { title: 'Hug', author: 'Jez Alborough', bg: '#FFF3D6', textColor: '#7A6020', icon: 'heart', description: 'A nearly wordless story about a little chimp who just wants a hug. Ends in the sweetest embrace imaginable.', affiliateLink: 'https://www.amazon.com/dp/0763615765?tag=noddapp-20', coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0763615765-M.jpg' },
  ],
};

function getAgeRange(ageMonths: number): AgeRange {
  if (ageMonths < 3) return '0-3m';
  if (ageMonths < 6) return '3-6m';
  if (ageMonths < 12) return '6-12m';
  return '12m+';
}

const AGE_RANGE_LABELS: Record<AgeRange, string> = {
  '0-3m': 'High-contrast & faces',
  '3-6m': 'Faces & rhymes',
  '6-12m': 'Flaps & touch-and-feel',
  '12m+': 'Simple stories & language',
};

// ── Book Detail Bottom Sheet ──

function BookDetailSheet({
  book,
  ageRange,
  visible,
  onClose,
  isOwned,
  onToggleOwned,
}: {
  book: BoardBook | null;
  ageRange: AgeRange;
  visible: boolean;
  onClose: () => void;
  isOwned: boolean;
  onToggleOwned: () => void;
}) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(sheetTranslateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    } else {
      overlayOpacity.setValue(0);
      sheetTranslateY.setValue(400);
    }
  }, [visible, overlayOpacity, sheetTranslateY]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: 400, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(() => onClose());
  }, [overlayOpacity, sheetTranslateY, onClose]);

  const handleViewOnAmazon = useCallback(() => {
    if (book?.affiliateLink) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Linking.openURL(book.affiliateLink);
    }
  }, [book]);

  if (!book) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <View style={sheetStyles.container}>
        {/* Overlay */}
        <Animated.View style={[sheetStyles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[sheetStyles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
          {/* Handle */}
          <View style={sheetStyles.handleRow}>
            <View style={sheetStyles.handle} />
          </View>

          {/* Book cover preview */}
          <View style={sheetStyles.coverSection}>
            <View style={[sheetStyles.coverBook, { backgroundColor: book.bg }]}>
              <Image
                source={{ uri: book.coverImageUrl }}
                style={sheetStyles.coverImage}
                resizeMode="cover"
              />
              <View style={sheetStyles.coverSpine} />
              <View style={sheetStyles.coverBottom} />
            </View>
          </View>

          {/* Book info */}
          <View style={sheetStyles.infoSection}>
            <Text style={sheetStyles.infoTitle}>{book.title}</Text>
            <Text style={sheetStyles.infoAuthor}>by {book.author}</Text>
            <View style={sheetStyles.ageBadge}>
              <Feather name="star" size={11} color={colors.primary[500]} />
              <Text style={sheetStyles.ageBadgeText}>Perfect for {ageRange}</Text>
            </View>
            <Text style={sheetStyles.bookDescription}>{book.description}</Text>
          </View>

          {/* Own / Amazon row */}
          <View style={sheetStyles.actionRow}>
            <Pressable
              style={[sheetStyles.ownedButton, isOwned && sheetStyles.ownedButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleOwned();
              }}
            >
              <Feather
                name={isOwned ? 'check-circle' : 'bookmark'}
                size={16}
                color={isOwned ? '#5A9E6F' : colors.textSecondary}
              />
              <Text style={[sheetStyles.ownedButtonText, isOwned && sheetStyles.ownedButtonTextActive]}>
                {isOwned ? 'Owned' : 'We have this'}
              </Text>
            </Pressable>

            <Pressable style={sheetStyles.amazonButton} onPress={handleViewOnAmazon}>
              <Text style={sheetStyles.amazonButtonText}>View on Amazon</Text>
              <Feather name="external-link" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Disclaimer */}
          <Text style={sheetStyles.disclaimer}>
            As an Amazon Associate, we earn from qualifying purchases.
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
    maxHeight: '75%' as const,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[200],
  },
  coverSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  coverBook: {
    width: 140,
    height: 175,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  coverSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    zIndex: 2,
  },
  coverBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 2,
  },
  infoSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  infoTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  infoAuthor: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    marginBottom: spacing.base,
  },
  ageBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary[600],
  },
  bookDescription: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
  ownedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.surface,
  },
  ownedButtonActive: {
    borderColor: '#5A9E6F',
    backgroundColor: '#F0F8F2',
  },
  ownedButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  ownedButtonTextActive: {
    color: '#5A9E6F',
  },
  amazonButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2C2C2E',
    borderRadius: borderRadius.full,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  amazonButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 10,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
    letterSpacing: 0.1,
  },
});

// ── Baby Toy Data ──

interface BabyToy {
  title: string;
  category: string;
  bg: string;
  textColor: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  description: string;
  affiliateLink: string;
  coverImageUrl: string;
}

const TOY_AGE_RANGE_LABELS: Record<AgeRange, string> = {
  '0-3m': 'Sensory & soothing',
  '3-6m': 'Grasping & exploring',
  '6-12m': 'Cause & effect',
  '12m+': 'Problem-solving & pretend',
};

const BABY_TOYS: Record<AgeRange, BabyToy[]> = {
  '0-3m': [
    { title: 'Manhattan Toy Winkel', category: 'Teether & Rattle', bg: '#E8F5F2', textColor: '#2E6B5A', icon: 'circle', description: 'The iconic loop teether that doubles as a rattle. Soft, BPA-free plastic loops are easy for tiny hands to grab. The center rattle rewards every movement.', affiliateLink: 'https://www.amazon.com/dp/B000BNCA4K?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/winkel/200/250' },
    { title: 'Lamaze Freddie the Firefly', category: 'Clip & Go', bg: '#FEF0E0', textColor: '#8B5E2E', icon: 'star', description: 'Crinkle wings, a squeaker, clinking rings, and a peek-a-boo mirror. Clips to car seat or stroller — sensory overload in the best way.', affiliateLink: 'https://www.amazon.com/dp/B000I2Q0F0?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/firefly/200/250' },
    { title: 'Baby Einstein Tunes Globe', category: 'Musical Toy', bg: '#DDE3F3', textColor: '#3A4A7A', icon: 'music', description: 'Seven classical melodies from a colorful, easy-to-grasp rattle. Light-up button teaches cause and effect from the very first press.', affiliateLink: 'https://www.amazon.com/dp/B000NE30GS?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/tunesglobe/200/250' },
    { title: 'Montessori High Contrast Cards', category: 'Visual Stimulation', bg: '#1A1A1A', textColor: '#FFFFFF', icon: 'eye', description: 'Black-and-white card set designed for newborn visual development. Bold patterns and shapes captivate from the first weeks of life.', affiliateLink: 'https://www.amazon.com/dp/B09PMWMQMZ?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/contrast/200/250' },
    { title: 'O-Ball Classic Rattle', category: 'Easy-Grab Ball', bg: '#E8DDF3', textColor: '#5B3E7C', icon: 'target', description: 'Flexible, lightweight, and full of finger holes — even a newborn can grab it. The rattle beads add auditory feedback to every shake.', affiliateLink: 'https://www.amazon.com/dp/B001UXDMZQ?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/oball/200/250' },
    { title: 'Lovevery Play Gym', category: 'Activity Gym', bg: '#F3E8E8', textColor: '#7A3A4A', icon: 'layout', description: 'Montessori-designed play gym with developmental zones. Organic cotton mat, wooden batting toys, and black-and-white cards included.', affiliateLink: 'https://www.amazon.com/dp/B07QBJHPR3?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/playgym/200/250' },
    { title: 'Wrist Rattles & Foot Finders', category: 'Wearable Toy', bg: '#FFF3D6', textColor: '#7A6020', icon: 'smile', description: 'Soft plush animals that strap to wrists and feet. Baby discovers their own hands and feet while hearing gentle rattling sounds.', affiliateLink: 'https://www.amazon.com/dp/B07KW9TBMK?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/wristrattle/200/250' },
    { title: 'Jellycat Bashful Bunny', category: 'Comfort Plush', bg: '#F0E8F5', textColor: '#5B3E7C', icon: 'heart', description: 'Impossibly soft plush bunny with floppy ears. Becomes baby\'s first comfort object — the one they\'ll reach for at bedtime.', affiliateLink: 'https://www.amazon.com/dp/B002CCE4NC?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/jellycat/200/250' },
    { title: 'VTech Lil\' Critters Moosical', category: 'Musical Crib Toy', bg: '#FDEAEA', textColor: '#8B3A3A', icon: 'music', description: 'Attaches to crib with soothing lullabies and nature sounds. The soft cow face and dangling toys encourage reaching and batting.', affiliateLink: 'https://www.amazon.com/dp/B002ORRBL8?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/moosical/200/250' },
    { title: 'Tummy Time Mirror', category: 'Development Aid', bg: '#E8F8E0', textColor: '#3A6B2E', icon: 'users', description: 'Floor mirror with high-contrast frame. Makes tummy time engaging — baby lifts their head to see the most interesting person in the room: themselves.', affiliateLink: 'https://www.amazon.com/dp/B07581JV9G?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/tummymirror/200/250' },
  ],
  '3-6m': [
    { title: 'Fat Brain SpinAgain', category: 'Stacking Spinner', bg: '#E8F5F2', textColor: '#2E6B5A', icon: 'refresh-cw', description: 'Colorful discs spiral down a corkscrew pole. Mesmerizing to watch, satisfying to stack, and impossible to get wrong — perfect first stacker.', affiliateLink: 'https://www.amazon.com/dp/B07N6MTPQH?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/spinagain/200/250' },
    { title: 'Sophie la Girafe', category: 'Teether', bg: '#FFF5E8', textColor: '#6B4C2A', icon: 'heart', description: 'The world\'s most famous teether. 100% natural rubber, easy for little hands to grip. Sophie has been soothing gums since 1961.', affiliateLink: 'https://www.amazon.com/dp/B000IDSLOG?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/sophie/200/250' },
    { title: 'Baby Einstein Curiosity Clutch', category: 'Sensory Rattle', bg: '#DDE8F3', textColor: '#3A5A8B', icon: 'star', description: 'BPA-free beads in a clear case make satisfying sounds. Different textures and shapes on each side keep curious fingers exploring.', affiliateLink: 'https://www.amazon.com/dp/B07P7LGWDX?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/clutch/200/250' },
    { title: 'Sassy Stacks of Circles', category: 'Ring Stacker', bg: '#FDEAEA', textColor: '#8B3A3A', icon: 'layers', description: 'Soft, textured rings with a rocking base. Each ring is a different size, texture, and weight — a full sensory experience.', affiliateLink: 'https://www.amazon.com/dp/B000F1M7BG?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/stacks/200/250' },
    { title: 'Skip Hop Activity Gym', category: 'Play Mat', bg: '#E8DDF3', textColor: '#5B3E7C', icon: 'layout', description: 'Five hanging toys with a supportive tummy time pillow. The celestial theme with mirror, rattle, and crinkle textures keeps baby engaged.', affiliateLink: 'https://www.amazon.com/dp/B07N67GNHC?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/skiphop/200/250' },
    { title: 'VTech Sit-to-Stand Walker', category: 'Activity Panel', bg: '#FEF0E0', textColor: '#8B5E2E', icon: 'zap', description: 'Removable activity panel for floor play now, walker for later. Piano keys, spinning gears, and shape sorter in one sturdy toy.', affiliateLink: 'https://www.amazon.com/dp/B000NZQ1K0?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/walker/200/250' },
    { title: 'Bright Starts Oball Shaker', category: 'Easy-Grab Rattle', bg: '#E8F8E0', textColor: '#3A6B2E', icon: 'target', description: 'Oball design with built-in rattle beads. Flexible, lightweight, and satisfying to shake. Perfect bridge from batting to intentional grasping.', affiliateLink: 'https://www.amazon.com/dp/B07RD2YQK9?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/oballshaker/200/250' },
    { title: 'Infantino Textured Multi Ball Set', category: 'Sensory Balls', bg: '#F3E8E8', textColor: '#7A3A4A', icon: 'circle', description: 'Six balls with different textures, sizes, and colors. Roll, squeeze, and explore — builds hand strength and tactile awareness.', affiliateLink: 'https://www.amazon.com/dp/B005HHKO3Y?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/ballset/200/250' },
    { title: 'Nuby Ice Gel Teether Keys', category: 'Teether', bg: '#DDE3F3', textColor: '#3A4A7A', icon: 'key', description: 'Ice gel filled keys that can be chilled in the fridge. Multiple textures soothe sore gums while the key shape is easy to grip.', affiliateLink: 'https://www.amazon.com/dp/B003N9M6YI?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/teetherkeys/200/250' },
    { title: 'Fisher-Price Laugh & Learn Controller', category: 'Pretend Play', bg: '#FFF3D6', textColor: '#7A6020', icon: 'play', description: 'Colorful game controller with light-up buttons, songs, and phrases. Introduces numbers, colors, and shapes through music and play.', affiliateLink: 'https://www.amazon.com/dp/B076FH48MV?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/controller/200/250' },
  ],
  '6-12m': [
    { title: 'Melissa & Doug Shape Sorter', category: 'Problem Solving', bg: '#FEF0E0', textColor: '#8B5E2E', icon: 'box', description: 'Classic wooden shape sorting cube with 12 chunky shapes. Builds spatial reasoning, hand-eye coordination, and the joy of "I did it!"', affiliateLink: 'https://www.amazon.com/dp/B00005RF5G?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/shapesorter/200/250' },
    { title: 'Stacking Cups', category: 'Nesting Toy', bg: '#E8F8E0', textColor: '#3A6B2E', icon: 'layers', description: 'Ten colorful cups that stack, nest, and pour. Teaches size ordering, cause-and-effect, and provides endless bath time fun.', affiliateLink: 'https://www.amazon.com/dp/B00005RHYX?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/stackcups/200/250' },
    { title: 'Fisher-Price Rock-a-Stack', category: 'Classic Stacker', bg: '#FDEAEA', textColor: '#8B3A3A', icon: 'layers', description: 'The iconic rainbow ring stacker. The rocking base and bat-at top ring make it perfect for babies just learning to stack.', affiliateLink: 'https://www.amazon.com/dp/B00000IZOR?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/rockastack/200/250' },
    { title: 'VTech Turn & Learn Driver', category: 'Pretend Play', bg: '#DDE8F3', textColor: '#3A5A8B', icon: 'truck', description: 'Steering wheel with traffic signals, mirrors, and animal buttons. Over 60 songs and sounds turn every car ride into an adventure.', affiliateLink: 'https://www.amazon.com/dp/B01COBJ1ZI?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/driver/200/250' },
    { title: 'Hape Pound & Tap Bench', category: 'Musical Toy', bg: '#E8DDF3', textColor: '#5B3E7C', icon: 'music', description: 'Pound the balls and they roll down to a xylophone below. Teaches cause-and-effect and introduces musical tones. Pure wooden magic.', affiliateLink: 'https://www.amazon.com/dp/B00712NJJM?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/poundbench/200/250' },
    { title: 'Fat Brain Dimpl', category: 'Sensory Push Toy', bg: '#E8F5F2', textColor: '#2E6B5A', icon: 'circle', description: 'Five silicone bubbles that pop in and out with a satisfying "pop!" Irresistible for tiny fingers. Fits perfectly in a diaper bag.', affiliateLink: 'https://www.amazon.com/dp/B06XC84LJM?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/dimpl/200/250' },
    { title: 'Mega Bloks Big Building Bag', category: 'Building Blocks', bg: '#FFF3D6', textColor: '#7A6020', icon: 'grid', description: '80 oversized blocks in a handy storage bag. Perfect for chunky baby hands to stack, connect, and joyfully knock down.', affiliateLink: 'https://www.amazon.com/dp/B007GE75HY?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/megabloks/200/250' },
    { title: 'Push & Go Crawl Toys', category: 'Crawling Motivator', bg: '#F3E8E8', textColor: '#7A3A4A', icon: 'arrow-right', description: 'Press-and-go vehicles that zip across the floor. Give baby a reason to crawl — the best motivation is a toy that moves away.', affiliateLink: 'https://www.amazon.com/dp/B07KFQM89G?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/crawltoy/200/250' },
    { title: 'Infantino Activity Ball', category: 'Multi-Sensory', bg: '#F0E8F5', textColor: '#5B3E7C', icon: 'star', description: 'Textured ball with built-in rattle, mirror, and spinning bead sections. Multiple activities packed into one easy-to-grab sphere.', affiliateLink: 'https://www.amazon.com/dp/B08QDKH15X?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/activityball/200/250' },
    { title: 'Wooden Peg Puzzle', category: 'First Puzzle', bg: '#FFF5E8', textColor: '#6B4C2A', icon: 'square', description: 'Chunky knob puzzles with familiar shapes or animals. The large pegs make it graspable, and the "aha!" moment of fitting a piece is priceless.', affiliateLink: 'https://www.amazon.com/dp/B000GKB8W6?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/pegpuzzle/200/250' },
  ],
  '12m+': [
    { title: 'Lovevery Block Set', category: 'Wooden Blocks', bg: '#E8F5F2', textColor: '#2E6B5A', icon: 'grid', description: '70 wooden blocks including shapes, vehicles, and people. Open-ended play that grows with your child through years of building adventures.', affiliateLink: 'https://www.amazon.com/dp/B08L3YMBMJ?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/blockset/200/250' },
    { title: 'Melissa & Doug Wooden Bead Maze', category: 'Fine Motor', bg: '#FEF0E0', textColor: '#8B5E2E', icon: 'activity', description: 'Colorful beads glide along curving wire paths. Builds hand-eye coordination and spatial awareness while keeping toddler hands busy.', affiliateLink: 'https://www.amazon.com/dp/B000GKAU1K?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/beadmaze/200/250' },
    { title: 'Fisher-Price Little People Farm', category: 'Imaginative Play', bg: '#E8F8E0', textColor: '#3A6B2E', icon: 'home', description: 'Barn doors open to reveal animals with realistic sounds. Encourages pretend play, vocabulary building, and learning animal names.', affiliateLink: 'https://www.amazon.com/dp/B00NO4O2RM?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/lpfarm/200/250' },
    { title: 'Green Toys Stacking Cups', category: 'Nesting & Stacking', bg: '#DDE8F3', textColor: '#3A5A8B', icon: 'layers', description: 'Six 100% recycled cups in rainbow colors. Stack, nest, pour, scoop — endlessly versatile. Dishwasher safe and made in the USA.', affiliateLink: 'https://www.amazon.com/dp/B004K6TBIY?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/greentoys/200/250' },
    { title: 'VTech Sort & Discover Drum', category: 'Musical Sorter', bg: '#E8DDF3', textColor: '#5B3E7C', icon: 'music', description: 'Shape sorter meets drum! Drop shapes in and drum the lid to hear them tumble. Combines problem-solving with musical exploration.', affiliateLink: 'https://www.amazon.com/dp/B01N9J3NJA?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/drum/200/250' },
    { title: 'Step2 Push Around Buggy', category: 'Ride-On Toy', bg: '#FDEAEA', textColor: '#8B3A3A', icon: 'truck', description: 'Parent-push ride-on with seat belt and horn. Perfect for neighborhood walks when baby wants independence but isn\'t quite walking yet.', affiliateLink: 'https://www.amazon.com/dp/B001OAQSDY?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/buggy/200/250' },
    { title: 'Crayola My First Washable Crayons', category: 'Art Supplies', bg: '#FFF3D6', textColor: '#7A6020', icon: 'edit-3', description: 'Egg-shaped crayons for palmar grip. Won\'t roll off the table, easy to hold, and truly washable. First art supplies for first masterpieces.', affiliateLink: 'https://www.amazon.com/dp/B00004UB9G?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/crayons/200/250' },
    { title: 'Hape Pull-Along Frog', category: 'Walking Toy', bg: '#E8F8E0', textColor: '#3A6B2E', icon: 'arrow-right', description: 'A cheerful wooden frog that opens its mouth and makes clicking sounds when pulled. Makes walking practice irresistible for new walkers.', affiliateLink: 'https://www.amazon.com/dp/B006WZNE64?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/pullfrog/200/250' },
    { title: 'Magna-Tiles Clear Colors', category: 'Magnetic Building', bg: '#DDE3F3', textColor: '#3A4A7A', icon: 'grid', description: 'Translucent magnetic tiles that snap together. Start with flat designs, graduate to 3D structures. A toy that grows with your child for years.', affiliateLink: 'https://www.amazon.com/dp/B000CBSNLA?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/magnatiles/200/250' },
    { title: 'Water Wow Activity Pad', category: 'Mess-Free Art', bg: '#F3E8E8', textColor: '#7A3A4A', icon: 'droplet', description: 'Fill the pen with water and watch colors magically appear. Dries blank so it\'s reusable. Perfect mess-free activity for restaurants.', affiliateLink: 'https://www.amazon.com/dp/B00CHMJ3SA?tag=noddapp-20', coverImageUrl: 'https://picsum.photos/seed/waterwow/200/250' },
  ],
};

// ── Toy Detail Bottom Sheet ──

function ToyDetailSheet({
  toy,
  ageRange,
  visible,
  onClose,
  isOwned,
  onToggleOwned,
}: {
  toy: BabyToy | null;
  ageRange: AgeRange;
  visible: boolean;
  onClose: () => void;
  isOwned: boolean;
  onToggleOwned: () => void;
}) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(sheetTranslateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    } else {
      overlayOpacity.setValue(0);
      sheetTranslateY.setValue(400);
    }
  }, [visible, overlayOpacity, sheetTranslateY]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: 400, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(() => onClose());
  }, [overlayOpacity, sheetTranslateY, onClose]);

  const handleViewOnAmazon = useCallback(() => {
    if (toy?.affiliateLink) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Linking.openURL(toy.affiliateLink);
    }
  }, [toy]);

  if (!toy) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <View style={sheetStyles.container}>
        <Animated.View style={[sheetStyles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[sheetStyles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
          <View style={sheetStyles.handleRow}>
            <View style={sheetStyles.handle} />
          </View>

          {/* Toy cover preview */}
          <View style={sheetStyles.coverSection}>
            <View style={[sheetStyles.coverBook, { backgroundColor: toy.bg }]}>
              <Image
                source={{ uri: toy.coverImageUrl }}
                style={sheetStyles.coverImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Toy info */}
          <View style={sheetStyles.infoSection}>
            <Text style={sheetStyles.infoTitle}>{toy.title}</Text>
            <Text style={sheetStyles.infoAuthor}>{toy.category}</Text>
            <View style={sheetStyles.ageBadge}>
              <Feather name="star" size={11} color={colors.primary[500]} />
              <Text style={sheetStyles.ageBadgeText}>Great for {ageRange}</Text>
            </View>
            <Text style={sheetStyles.bookDescription}>{toy.description}</Text>
          </View>

          {/* Own / Amazon row */}
          <View style={sheetStyles.actionRow}>
            <Pressable
              style={[sheetStyles.ownedButton, isOwned && sheetStyles.ownedButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleOwned();
              }}
            >
              <Feather
                name={isOwned ? 'check-circle' : 'bookmark'}
                size={16}
                color={isOwned ? '#5A9E6F' : colors.textSecondary}
              />
              <Text style={[sheetStyles.ownedButtonText, isOwned && sheetStyles.ownedButtonTextActive]}>
                {isOwned ? 'Owned' : 'We have this'}
              </Text>
            </Pressable>

            <Pressable style={sheetStyles.amazonButton} onPress={handleViewOnAmazon}>
              <Text style={sheetStyles.amazonButtonText}>View on Amazon</Text>
              <Feather name="external-link" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={sheetStyles.disclaimer}>
            As an Amazon Associate, we earn from qualifying purchases.
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Toy Box Card (carousel) ──

function ToyBoxCard({
  babyName,
  ageMonths,
  onAskLumina,
}: {
  babyName: string;
  ageMonths: number;
  onAskLumina: () => void;
}) {
  const ageRange = getAgeRange(ageMonths);
  const [selectedToy, setSelectedToy] = useState<BabyToy | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [ownedTitles, setOwnedTitles] = useState<Set<string>>(new Set());

  const toggleOwned = useCallback((title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOwnedTitles((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }, []);

  const sortedToys = useMemo(() => {
    const all = BABY_TOYS[ageRange];
    const unowned = all.filter((t) => !ownedTitles.has(t.title));
    const owned = all.filter((t) => ownedTitles.has(t.title));
    return [...shuffleArray(unowned), ...shuffleArray(owned)];
  }, [ageRange, ownedTitles]);

  const handleToyPress = useCallback((toy: BabyToy) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedToy(toy);
    setSheetVisible(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetVisible(false);
    setSelectedToy(null);
  }, []);

  const handleAskLumina = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAskLumina();
  }, [onAskLumina]);

  return (
    <View style={[styles.activityCard, bookStyles.card, shadows.sm]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, { backgroundColor: '#FDF2EB' }]}>
          <Feather name="gift" size={20} color={colors.secondary[500]} />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>
            {babyName ? `${babyName}'s` : "Baby's"} First Toy Box
          </Text>
          <Text style={styles.cardSubtitle}>{TOY_AGE_RANGE_LABELS[ageRange]}</Text>
        </View>
      </View>

      {/* Toy carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={bookStyles.carousel}
        style={bookStyles.carouselScroll}
      >
        {sortedToys.map((toy, i) => {
          const isOwned = ownedTitles.has(toy.title);
          return (
            <View key={`${toy.title}-${i}`} style={{ opacity: isOwned ? 0.55 : 1 }}>
              <Pressable onPress={() => handleToyPress(toy)} style={bookStyles.bookShadow}>
                <View style={[bookStyles.boardBook, { backgroundColor: toy.bg }]}>
                  <Image
                    source={{ uri: toy.coverImageUrl }}
                    style={bookStyles.coverImage}
                    resizeMode="cover"
                  />
                  <View style={bookStyles.coverGradient} />
                  <View style={bookStyles.coverTextOverlay}>
                    <Text style={bookStyles.coverTitle} numberOfLines={2}>
                      {toy.title}
                    </Text>
                    <Text style={bookStyles.coverAuthor} numberOfLines={1}>
                      {toy.category}
                    </Text>
                  </View>
                  <Pressable
                    style={bookStyles.ownedBadge}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleOwned(toy.title);
                    }}
                    hitSlop={6}
                  >
                    <Feather
                      name={isOwned ? 'check-circle' : 'bookmark'}
                      size={14}
                      color={isOwned ? '#5A9E6F' : 'rgba(255,255,255,0.6)'}
                    />
                  </Pressable>
                </View>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      {/* Description */}
      <Text style={bookStyles.body}>
        The best toys spark curiosity. Simple, open-ended, and age-appropriate wins every time.
      </Text>

      {/* AI CTA — Purple rule */}
      <Pressable style={bookStyles.aiButton} onPress={handleAskLumina}>
        <Feather name="zap" size={16} color="#FFFFFF" />
        <Text style={bookStyles.aiButtonText}>Ask Lumina for Toy Ideas</Text>
      </Pressable>

      {/* Toy Detail Bottom Sheet */}
      <ToyDetailSheet
        toy={selectedToy}
        ageRange={ageRange}
        visible={sheetVisible}
        onClose={handleCloseSheet}
        isOwned={selectedToy ? ownedTitles.has(selectedToy.title) : false}
        onToggleOwned={() => {
          if (selectedToy) toggleOwned(selectedToy.title);
        }}
      />
    </View>
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function BookLibraryCard({
  babyName,
  ageMonths,
  onAskLumina,
}: {
  babyName: string;
  ageMonths: number;
  onAskLumina: () => void;
}) {
  const ageRange = getAgeRange(ageMonths);
  const [selectedBook, setSelectedBook] = useState<BoardBook | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [ownedTitles, setOwnedTitles] = useState<Set<string>>(new Set());

  const toggleOwned = useCallback((title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOwnedTitles((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }, []);

  // Shuffle with owned books pushed to the end
  const sortedBooks = useMemo(() => {
    const all = BOARD_BOOKS[ageRange];
    const unowned = all.filter((b) => !ownedTitles.has(b.title));
    const owned = all.filter((b) => ownedTitles.has(b.title));
    return [...shuffleArray(unowned), ...shuffleArray(owned)];
  }, [ageRange, ownedTitles]);

  const handleBookPress = useCallback((book: BoardBook) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBook(book);
    setSheetVisible(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetVisible(false);
    setSelectedBook(null);
  }, []);

  const handleAskLumina = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAskLumina();
  }, [onAskLumina]);

  return (
    <View style={[styles.activityCard, bookStyles.card, shadows.sm]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, { backgroundColor: colors.primary[50] }]}>
          <Feather name="book-open" size={20} color={colors.primary[600]} />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>
            {babyName ? `${babyName}'s` : "Baby's"} First Library
          </Text>
          <Text style={styles.cardSubtitle}>{AGE_RANGE_LABELS[ageRange]}</Text>
        </View>
      </View>

      {/* Book carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={bookStyles.carousel}
        style={bookStyles.carouselScroll}
      >
        {sortedBooks.map((book, i) => {
          const isOwned = ownedTitles.has(book.title);
          return (
            <View key={`${book.title}-${i}`} style={{ opacity: isOwned ? 0.55 : 1 }}>
              <Pressable onPress={() => handleBookPress(book)} style={bookStyles.bookShadow}>
                <View style={[bookStyles.boardBook, { backgroundColor: book.bg }]}>
                  {/* Cover image */}
                  <Image
                    source={{ uri: book.coverImageUrl }}
                    style={bookStyles.coverImage}
                    resizeMode="cover"
                  />
                  {/* Thick spine edge */}
                  <View style={bookStyles.bookSpine} />
                  {/* Bottom gradient overlay for text readability */}
                  <View style={bookStyles.coverGradient} />
                  {/* Title + Author over image */}
                  <View style={bookStyles.coverTextOverlay}>
                    <Text style={bookStyles.coverTitle} numberOfLines={2}>
                      {book.title}
                    </Text>
                    <Text style={bookStyles.coverAuthor} numberOfLines={1}>
                      {book.author}
                    </Text>
                  </View>
                  {/* Bottom thickness strip */}
                  <View style={bookStyles.bookBottom} />
                  {/* Owned badge */}
                  <Pressable
                    style={bookStyles.ownedBadge}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleOwned(book.title);
                    }}
                    hitSlop={6}
                  >
                    <Feather
                      name={isOwned ? 'check-circle' : 'bookmark'}
                      size={14}
                      color={isOwned ? '#5A9E6F' : 'rgba(255,255,255,0.6)'}
                    />
                  </Pressable>
                </View>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      {/* Description */}
      <Text style={bookStyles.body}>
        Your voice is the best story there is. Read, sing, or just narrate your day together.
      </Text>

      {/* AI CTA — Purple rule */}
      <Pressable style={bookStyles.aiButton} onPress={handleAskLumina}>
        <Feather name="zap" size={16} color="#FFFFFF" />
        <Text style={bookStyles.aiButtonText}>Ask Lumina for Book Ideas</Text>
      </Pressable>

      {/* Book Detail Bottom Sheet */}
      <BookDetailSheet
        book={selectedBook}
        ageRange={ageRange}
        visible={sheetVisible}
        onClose={handleCloseSheet}
        isOwned={selectedBook ? ownedTitles.has(selectedBook.title) : false}
        onToggleOwned={() => {
          if (selectedBook) toggleOwned(selectedBook.title);
        }}
      />
    </View>
  );
}

const bookStyles = StyleSheet.create({
  card: {
    paddingBottom: spacing.lg + 4,
  },
  carouselScroll: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.lg,
  },
  carousel: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  bookShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  boardBook: {
    width: 96,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    zIndex: 2,
  },
  coverGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    ...Platform.select({
      ios: { backgroundColor: 'rgba(0,0,0,0.45)' },
      android: { backgroundColor: 'rgba(0,0,0,0.5)' },
      default: { backgroundColor: 'rgba(0,0,0,0.45)' },
    }),
    zIndex: 3,
  },
  coverTextOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 4,
    zIndex: 4,
    gap: 1,
  },
  coverTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 13,
    letterSpacing: -0.1,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  coverAuthor: {
    fontSize: 7.5,
    fontWeight: '500',
    letterSpacing: 0.1,
    color: 'rgba(255,255,255,0.8)',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bookBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 5,
  },
  ownedBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  body: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    marginBottom: spacing.base,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  aiButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

// ── Hero Play Card (charming, animated) ──

function HeroPlayCard({
  suggestion,
  onLogged,
}: {
  suggestion: PlaySuggestion;
  onLogged: () => void;
}) {
  const [captured, setCaptured] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const heartFill = useRef(new Animated.Value(0)).current;
  const buttonWidth = useRef(new Animated.Value(0)).current;
  const capturedOpacity = useRef(new Animated.Value(0)).current;
  const logOpacity = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    if (captured) return;
    setCaptured(true);

    // Double heartbeat haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);

    // Heart burst animation
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.4, duration: 150, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, tension: 200, friction: 6, useNativeDriver: true }),
    ]).start();

    // Fill the heart
    Animated.timing(heartFill, { toValue: 1, duration: 300, useNativeDriver: false }).start();

    // Crossfade text
    Animated.parallel([
      Animated.timing(logOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(capturedOpacity, { toValue: 1, duration: 300, delay: 150, useNativeDriver: true }),
    ]).start();

    // Delayed toast
    setTimeout(() => onLogged(), 1200);

    // Reset after toast
    setTimeout(() => {
      setCaptured(false);
      heartFill.setValue(0);
      capturedOpacity.setValue(0);
      logOpacity.setValue(1);
    }, 3500);
  }, [captured, heartScale, heartFill, logOpacity, capturedOpacity, onLogged]);

  const heartColor = heartFill.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.primary[300], '#E8756D'],
  });

  return (
    <View style={heroStyles.card}>
      {/* Decorative top-right accent */}
      <View style={heroStyles.accentCircle} />
      <View style={heroStyles.accentCircleSmall} />

      {/* Label */}
      <View style={heroStyles.labelRow}>
        <Feather name="star" size={12} color={colors.primary[500]} />
        <Text style={heroStyles.label}>Today's Play Idea</Text>
      </View>

      {/* Icon + Title */}
      <View style={heroStyles.titleRow}>
        <View style={heroStyles.iconWrap}>
          <Feather name={suggestion.icon} size={24} color={colors.primary[600]} />
        </View>
        <Text style={heroStyles.title}>{suggestion.activity}</Text>
      </View>

      {/* Description — breathable, broken text */}
      <Text style={heroStyles.description}>{suggestion.tip}</Text>

      {/* Charming Log Button */}
      <Pressable
        style={[heroStyles.logButton, captured && heroStyles.logButtonCaptured]}
        onPress={handlePress}
        disabled={captured}
      >
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <Animated.Text style={{ color: heartColor }}>
            <Feather name={captured ? 'heart' : 'heart'} size={18} color={captured ? '#E8756D' : colors.primary[400]} />
          </Animated.Text>
        </Animated.View>
        <View style={heroStyles.logButtonTextWrap}>
          <Animated.Text style={[heroStyles.logButtonText, { opacity: logOpacity, position: captured ? 'absolute' : 'relative' }]}>
            Log this moment
          </Animated.Text>
          {captured && (
            <Animated.Text style={[heroStyles.logButtonTextCaptured, { opacity: capturedOpacity }]}>
              Moment Captured
            </Animated.Text>
          )}
        </View>
      </Pressable>

      {/* Footer */}
      <View style={heroStyles.footer}>
        <Feather name="zap" size={11} color={colors.primary[400]} />
        <Text style={heroStyles.footerText}>
          Age-appropriate suggestion from Lumina
        </Text>
      </View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F2FA',
    borderRadius: 28,
    padding: 24,
    paddingTop: 20,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(167,139,186,0.12)',
  },
  accentCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(167,139,186,0.08)',
  },
  accentCircleSmall: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(242,184,156,0.1)',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(167,139,186,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#2C2C2E',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4A4A4C',
    lineHeight: 23,
    marginBottom: 20,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,186,0.25)',
    shadowColor: '#A78BBA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  logButtonCaptured: {
    backgroundColor: '#FEF4F3',
    borderColor: 'rgba(232,117,109,0.3)',
  },
  logButtonTextWrap: {
    minWidth: 120,
  },
  logButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[700],
  },
  logButtonTextCaptured: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E8756D',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167,139,186,0.1)',
  },
  footerText: {
    fontSize: 11,
    color: colors.primary[400],
    fontStyle: 'italic',
  },
});

export default function ActivityLogScreen() {
  const router = useRouter();
  const baby = useBabyStore((s) => s.getActiveBaby());
  const age = useCorrectedAge(baby);

  const effectiveAgeMonths = age?.effectiveAgeMonths ?? 0;
  const chronoAgeMonths = age?.chronological.months ?? 0;
  const babyName = baby?.name ?? '';

  const suggestion = useMemo(
    () => getPlaySuggestion(effectiveAgeMonths, babyName),
    [effectiveAgeMonths, babyName],
  );

  // Tummy time
  const [tummyMinutes, setTummyMinutes] = useState('');
  const [tummyTipExpanded, setTummyTipExpanded] = useState(false);

  // Fresh air
  const [outsideMinutes, setOutsideMinutes] = useState('');
  const [outsideTipExpanded, setOutsideTipExpanded] = useState(false);

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<ActivitySuggestions | null>(null);
  const [aiLoading, setAiLoading] = useState(true);

  // Selections for activity sections
  const [selectedSensory, setSelectedSensory] = useState<string[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<string[]>([]);

  // ChatSheet for book ideas
  const [showChat, setShowChat] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>(undefined);

  // Whisper
  const [showWhisper, setShowWhisper] = useState(false);
  const [whisperMsg, setWhisperMsg] = useState('');

  // Fetch AI suggestions on mount
  useEffect(() => {
    let cancelled = false;
    setAiLoading(true);
    fetchActivitySuggestions(chronoAgeMonths, effectiveAgeMonths, babyName).then((result) => {
      if (!cancelled) {
        setAiSuggestions(result.suggestions);
        setAiLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [chronoAgeMonths, effectiveAgeMonths, babyName]);

  const toggleSelection = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  };

  const showWhisperToast = (msg: string) => {
    setWhisperMsg(msg);
    setShowWhisper(true);
  };

  const handleLogTummy = () => {
    showWhisperToast(`\u2728 Tummy time saved. ${tummyMinutes} min.`);
    setTummyMinutes('');
  };

  const handleLogOutside = () => {
    showWhisperToast(`\u2728 Fresh air tracked. ${outsideMinutes} min.`);
    setOutsideMinutes('');
  };

  const handleLogSensory = () => {
    showWhisperToast('\u2728 Sensory play saved.');
    setSelectedSensory([]);
  };

  const handleLogMusic = () => {
    showWhisperToast('\u2728 Music session saved.');
    setSelectedMusic([]);
  };

  const handleGetBookIdeas = () => {
    setChatInitialMessage(
      `What are the best books for a ${effectiveAgeMonths}-month-old baby? I'd love age-appropriate recommendations for ${babyName || 'my baby'}.`
    );
    setShowChat(true);
  };

  const handleGetToyIdeas = () => {
    setChatInitialMessage(
      `What are the best developmental toys for a ${effectiveAgeMonths}-month-old baby? I'd love age-appropriate toy recommendations for ${babyName || 'my baby'}.`
    );
    setShowChat(true);
  };

  const headerLeft = useCallback(
    () => (
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
        <Feather name="chevron-left" size={26} color={colors.primary[600]} />
        <Text style={styles.backLabel}>Home</Text>
      </Pressable>
    ),
    [router],
  );

  // Render 3 skeleton rows while loading
  const renderSkeletons = () => (
    <>
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Play Time',
          headerTintColor: colors.primary[600],
          headerBackTitle: 'Home',
          headerLeft,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* ── Hero: Today's Play Idea ── */}
        <HeroPlayCard
          suggestion={suggestion}
          onLogged={() => showWhisperToast(`\u2728 ${suggestion.activity} saved.`)}
        />

        {/* ── Card 1: Tummy Time ── */}
        <View style={[styles.activityCard, shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: colors.primary[50] }]}>
              <Feather name="target" size={20} color={colors.primary[600]} />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>Tummy Time</Text>
              <Text style={styles.cardSubtitle}>Build strength at their own pace</Text>
            </View>
          </View>

          <Text style={styles.durationLabel}>How long?</Text>
          <View style={styles.presetRow}>
            {TUMMY_PRESETS.map((preset) => {
              const isSelected = tummyMinutes === preset.value;
              return (
                <Pressable
                  key={preset.value}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => setTummyMinutes(isSelected ? '' : preset.value)}
                >
                  <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
            <View style={styles.customInputWrap}>
              <TextInput
                style={styles.customInput}
                placeholder="min"
                placeholderTextColor={colors.textTertiary}
                value={TUMMY_PRESETS.some((p) => p.value === tummyMinutes) ? '' : tummyMinutes}
                onChangeText={(v) => setTummyMinutes(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={3}
                inputAccessoryViewID={KEYBOARD_DONE_ID}
              />
            </View>
          </View>

          <Pressable
            style={styles.tipToggle}
            onPress={() => setTummyTipExpanded((p) => !p)}
          >
            <Feather name="heart" size={13} color={colors.primary[500]} />
            <Text style={styles.tipToggleText}>Lumina's Tip</Text>
            <Feather
              name={tummyTipExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.primary[400]}
            />
          </Pressable>
          {tummyTipExpanded && (
            <View style={styles.tipBody}>
              <Text style={styles.tipText}>
                Lying on your chest completely counts as tummy time for newborns! Skin-to-skin while you rest on the couch? That's tummy time.{'\n\n'}
                Start with 2–3 minutes at a time and build up gradually. If baby fusses, that's okay — try again later. Every little bit counts.
              </Text>
            </View>
          )}

          {tummyMinutes !== '' && (
            <Pressable style={styles.inlineLogButton} onPress={handleLogTummy}>
              <Feather name="check" size={16} color="#FFFFFF" />
              <Text style={styles.inlineLogText}>Log {tummyMinutes} min</Text>
            </Pressable>
          )}
        </View>

        {/* ── Card 2: Fresh Air & Sunlight ── */}
        <View style={[styles.activityCard, shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: colors.secondary[50] }]}>
              <Feather name="sun" size={20} color={colors.secondary[500]} />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>Fresh Air & Sunlight</Text>
              <Text style={styles.cardSubtitle}>Good for baby's rhythm and mama's mood</Text>
            </View>
          </View>

          <Text style={styles.durationLabel}>Time outside?</Text>
          <View style={styles.presetRow}>
            {OUTSIDE_PRESETS.map((preset) => {
              const isSelected = outsideMinutes === preset.value;
              return (
                <Pressable
                  key={preset.value}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => setOutsideMinutes(isSelected ? '' : preset.value)}
                >
                  <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={styles.tipToggle}
            onPress={() => setOutsideTipExpanded((p) => !p)}
          >
            <Feather name="heart" size={13} color={colors.primary[500]} />
            <Text style={styles.tipToggleText}>Why this matters</Text>
            <Feather
              name={outsideTipExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.primary[400]}
            />
          </Pressable>
          {outsideTipExpanded && (
            <View style={styles.tipBody}>
              <Text style={styles.tipText}>
                Natural sunlight helps set your baby's circadian rhythm — making nighttime sleep come more naturally. Even 10–15 minutes of indirect daylight (not direct sun on a newborn) makes a real difference.{'\n\n'}
                Bonus: getting outside does wonders for your own mood and energy too. A short walk around the block counts. Fresh air is medicine for both of you.
              </Text>
            </View>
          )}

          {outsideMinutes !== '' && (
            <Pressable style={styles.inlineLogButton} onPress={handleLogOutside}>
              <Feather name="check" size={16} color="#FFFFFF" />
              <Text style={styles.inlineLogText}>Log {outsideMinutes} min</Text>
            </Pressable>
          )}
        </View>

        {/* ── Card 3: Reading (Book Carousel + AI CTA) ── */}
        <BookLibraryCard
          babyName={babyName}
          ageMonths={effectiveAgeMonths}
          onAskLumina={handleGetBookIdeas}
        />

        {/* ── Card 3b: Toy Box (Toy Carousel + AI CTA) ── */}
        <ToyBoxCard
          babyName={babyName}
          ageMonths={effectiveAgeMonths}
          onAskLumina={handleGetToyIdeas}
        />

        {/* ── Card 4: Sensory Play ── */}
        <View style={[styles.activityCard, shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: '#F3EFF9' }]}>
              <Feather name="star" size={20} color={SENSORY_COLOR} />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>Sensory Play</Text>
              <Text style={styles.cardSubtitle}>Touch, see, explore — build new pathways</Text>
            </View>
          </View>

          <Text style={styles.durationLabel}>Ideas for today</Text>
          {aiLoading ? renderSkeletons() : (
            aiSuggestions?.sensory.map((item) => (
              <SuggestionChip
                key={item.name}
                label={item.name}
                reason={item.reason}
                product={item.product}
                isSelected={selectedSensory.includes(item.name)}
                onPress={() => toggleSelection(item.name, setSelectedSensory)}
                accentColor={SENSORY_COLOR}
              />
            ))
          )}

          {selectedSensory.length > 0 && (
            <Pressable style={styles.inlineLogButton} onPress={handleLogSensory}>
              <Feather name="check" size={16} color="#FFFFFF" />
              <Text style={styles.inlineLogText}>Log Activity</Text>
            </Pressable>
          )}
        </View>

        {/* ── Card 5: Music & Sound ── */}
        <View style={[styles.activityCard, shadows.sm]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: '#FDF2EB' }]}>
              <Feather name="music" size={20} color={MUSIC_COLOR} />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>Music & Sound</Text>
              <Text style={styles.cardSubtitle}>Rhythm, melody, and joyful noise</Text>
            </View>
          </View>

          <Text style={styles.durationLabel}>Sing, shake, or listen</Text>
          {aiLoading ? renderSkeletons() : (
            aiSuggestions?.music.map((item) => (
              <SuggestionChip
                key={item.name}
                label={item.name}
                reason={item.reason}
                product={item.product}
                isSelected={selectedMusic.includes(item.name)}
                onPress={() => toggleSelection(item.name, setSelectedMusic)}
                accentColor={MUSIC_COLOR}
              />
            ))
          )}

          {selectedMusic.length > 0 && (
            <Pressable style={styles.inlineLogButton} onPress={handleLogMusic}>
              <Feather name="check" size={16} color="#FFFFFF" />
              <Text style={styles.inlineLogText}>Log Activity</Text>
            </Pressable>
          )}
        </View>

        {/* Encouragement footer */}
        <Text style={styles.footerText}>
          You don't need expensive toys or perfect activities.{'\n'}
          Being present is the best thing you can do.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ChatSheet
        visible={showChat}
        onClose={() => {
          setShowChat(false);
          setChatInitialMessage(undefined);
        }}
        insight={null}
        babyName={babyName}
        babyAgeDays={age?.chronological.days ?? null}
        feedingMethod={baby?.primary_feeding_method ?? 'unknown'}
        initialMessage={chatInitialMessage}
      />

      <LuminaWhisper
        visible={showWhisper}
        message={whisperMsg}
        onDismiss={() => setShowWhisper(false)}
      />
      <KeyboardDoneBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },

  // Back button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Platform.OS === 'ios' ? -spacing.sm : 0,
  },
  backLabel: {
    fontSize: typography.fontSize.md,
    color: colors.primary[600],
    marginLeft: -2,
  },

  // (Hero card styles are in heroStyles above)

  // ── Activity Cards ──
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // Duration
  durationLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  presetChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  presetText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  presetTextActive: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
  customInputWrap: {
    flex: 1,
  },
  customInput: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    textAlign: 'center',
    backgroundColor: colors.neutral[50],
  },

  // Nurse tip toggle
  tipToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tipToggleText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium,
  },
  tipBody: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  tipText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },

  // ── AI Suggestion Chips ──
  aiChip: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.neutral[50],
  },
  aiChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  aiChipCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiChipTitle: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  aiChipReason: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
    marginLeft: 30,
  },
  aiChipProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
    marginLeft: 30,
  },
  aiChipProduct: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },

  // ── Skeleton Loading ──
  skeletonRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.neutral[100],
  },
  skeletonTitle: {
    width: '60%',
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.neutral[200],
    marginBottom: spacing.sm,
  },
  skeletonReason: {
    width: '90%',
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neutral[200],
  },

  // ── Inline Log Button ──
  inlineLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  inlineLogText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },

  // (Book library styles are in bookStyles above)

  // Footer
  footerText: {
    fontFamily: SERIF_FONT,
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    marginTop: spacing.xl,
  },
});

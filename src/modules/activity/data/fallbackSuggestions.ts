// ============================================================
// Sprouty — Fallback Activity Suggestions (Offline / Timeout)
// Static, age-bucketed suggestions used when AI is unavailable
// ============================================================

import type { ActivitySuggestions } from '../services/activitySuggestionsService';

interface AgeRange {
  maxMonths: number;
  suggestions: ActivitySuggestions;
}

const AGE_RANGES: AgeRange[] = [
  {
    maxMonths: 3,
    suggestions: {
      reading: [
        { title: 'Black White Red by Tana Hoban', reason: 'High-contrast images perfect for developing newborn vision' },
        { title: 'Look Look! by Peter Linenthal', reason: 'Bold black-and-white patterns that captivate babies under 3 months' },
        { title: 'Hello, Baby! by Mem Fox', reason: 'Rhythmic text and simple faces that encourage bonding during reading' },
      ],
      sensory: [
        { name: 'Crinkle Cloth Exploration', reason: 'The sound and texture of crinkle fabric stimulates hearing and touch together', product: 'Manhattan Toy Wimmer-Ferguson Crinkle' },
        { name: 'High-Contrast Mobile Gazing', reason: 'Black-and-white patterns strengthen visual tracking at this age', product: 'Montessori Munari Mobile' },
        { name: 'Gentle Skin Stroking', reason: 'Use different fabrics (silk, cotton, fleece) across baby\'s arms and legs to build body awareness', product: null },
      ],
      music: [
        { name: 'Heartbeat Lullaby', reason: 'Mimics the womb — play soft heartbeat sounds during calm-down time', product: 'Baby Shusher or white noise machine' },
        { name: 'Twinkle Twinkle with Finger Touches', reason: 'Sing slowly while gently tapping each of baby\'s fingers — combines music with touch', product: null },
        { name: 'Soft Rattle Shaking', reason: 'Gentle rattle sounds help baby start tracking sound direction', product: 'Hape Rattle' },
      ],
    },
  },
  {
    maxMonths: 6,
    suggestions: {
      reading: [
        { title: 'Pat the Bunny by Dorothy Kunhardt', reason: 'Touch-and-feel elements encourage active participation during reading' },
        { title: 'Dear Zoo by Rod Campbell', reason: 'Lift-the-flap format builds anticipation and fine motor skills' },
        { title: 'Baby Touch: Colors by Ladybird', reason: 'Bold colors and textures keep grabby hands engaged with the book' },
      ],
      sensory: [
        { name: 'Texture Board Exploration', reason: 'Tape different fabrics to cardboard and let baby reach and feel each one', product: 'Lovevery Sensory Strands' },
        { name: 'Splash Time in Shallow Water', reason: 'Warm water in a shallow tray lets baby kick and splash — great for leg strength too', product: null },
        { name: 'Crinkle Paper Grabbing', reason: 'Tissue paper or crinkle material builds grip strength while making satisfying sounds', product: null },
      ],
      music: [
        { name: 'If You\'re Happy and You Know It', reason: 'Move baby\'s hands through the clapping motions — builds the music-movement connection', product: null },
        { name: 'Egg Shaker Play', reason: 'Easy to grip at this age and makes baby feel like they\'re making music', product: 'Hape Egg Shakers' },
        { name: 'Singing During Diaper Changes', reason: 'A consistent song during routines creates comfort and anticipation', product: null },
      ],
    },
  },
  {
    maxMonths: 12,
    suggestions: {
      reading: [
        { title: 'Where\'s Spot? by Eric Hill', reason: 'Lift-the-flap pages reward curiosity and build object permanence' },
        { title: 'Brown Bear, Brown Bear by Bill Martin Jr', reason: 'Repetitive pattern helps babies anticipate what comes next — early literacy skill' },
        { title: 'Moo, Baa, La La La! by Sandra Boynton', reason: 'Animal sounds encourage babbling and sound imitation' },
      ],
      sensory: [
        { name: 'Safe Food Exploration', reason: 'Let baby squish cooked pasta, banana pieces, or yogurt — it\'s messy but builds crucial sensory pathways', product: null },
        { name: 'Stacking and Knocking Down', reason: 'Stack soft blocks and let baby demolish them — teaches cause and effect', product: 'Infantino Squeeze and Stack Block Set' },
        { name: 'Ice Cube Tray Exploration', reason: 'Fill an ice cube tray with water, pom poms, or safe objects for poking and dumping practice', product: null },
      ],
      music: [
        { name: 'Baby Drum Circle', reason: 'Banging on pots, boxes, or toy drums builds rhythm sense and arm coordination', product: 'Hape Pound & Tap Bench' },
        { name: 'Row, Row, Row Your Boat with Rocking', reason: 'Sit baby in your lap and rock together — vestibular input combined with rhythm', product: null },
        { name: 'Peek-a-Boo Song', reason: 'Combine the classic game with a simple sung melody — doubles the developmental benefit', product: null },
      ],
    },
  },
  {
    maxMonths: 999,
    suggestions: {
      reading: [
        { title: 'Goodnight Moon by Margaret Wise Brown', reason: 'The bedtime ritual of naming objects builds vocabulary and creates comfort' },
        { title: 'The Very Hungry Caterpillar by Eric Carle', reason: 'Counting, colors, and finger-hole pages encourage active participation' },
        { title: 'Each Peach Pear Plum by Janet & Allan Ahlberg', reason: 'I-spy format encourages pointing and naming — perfect for early talkers' },
      ],
      sensory: [
        { name: 'Finger Painting with Yogurt', reason: 'Safe, edible, and endlessly entertaining — let toddler explore color mixing on a highchair tray', product: null },
        { name: 'Sand and Water Table Play', reason: 'Pouring, scooping, and dumping builds hand-eye coordination and teaches volume concepts', product: 'Step2 Rain Showers Water Table' },
        { name: 'Playdough Squishing', reason: 'Strengthens hands for future writing while encouraging creativity', product: 'Eco-Kids Eco-Dough' },
      ],
      music: [
        { name: 'Dance Party', reason: 'Put on music and dance together — toddlers learn rhythm through their whole body', product: null },
        { name: 'Xylophone Color Matching', reason: 'Name the colors as toddler hits each bar — combines music, color learning, and fine motor', product: 'Hape Pound & Tap Bench with Xylophone' },
        { name: 'Head, Shoulders, Knees and Toes', reason: 'Body awareness + following instructions + music — a developmental triple win', product: null },
      ],
    },
  },
];

export function getFallbackSuggestions(ageMonths: number): ActivitySuggestions {
  const range = AGE_RANGES.find((r) => ageMonths < r.maxMonths) ?? AGE_RANGES[AGE_RANGES.length - 1];
  return range.suggestions;
}

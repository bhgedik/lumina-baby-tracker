// ============================================================
// Nodd — Milestone Definitions
// Curated CDC/WHO-informed milestones for the first 12+ months
// Each milestone includes nurse tips for at-home encouragement
// ============================================================

import type { DevelopmentalDomain } from '../../../shared/types/common';

export interface MilestoneDef {
  id: string;
  title: string;
  description: string;
  domain: DevelopmentalDomain;
  expectedStartMonth: number;
  expectedEndMonth: number;
  nurseTip: string;
  badgeIcon: string; // Feather icon name
  badgeLabel: string; // Short label for the badge
}

// Domain → Feather icon mapping
export const DOMAIN_ICONS: Record<DevelopmentalDomain, { icon: string; color: string; bg: string }> = {
  motor_gross: { icon: 'target', color: '#5E8A72', bg: '#F0F5F2' },
  motor_fine: { icon: 'edit-3', color: '#8B6914', bg: '#FFF8E7' },
  cognitive: { icon: 'zap', color: '#7B61A6', bg: '#F3EFF9' },
  language: { icon: 'message-circle', color: '#3B82C4', bg: '#EFF6FF' },
  social_emotional: { icon: 'heart', color: '#D4697A', bg: '#FEF2F4' },
  sensory: { icon: 'eye', color: '#C47A3B', bg: '#FFF5EB' },
};

export const DOMAIN_LABELS: Record<DevelopmentalDomain, string> = {
  motor_gross: 'Gross Motor',
  motor_fine: 'Fine Motor',
  cognitive: 'Cognitive',
  language: 'Language',
  social_emotional: 'Social & Emotional',
  sensory: 'Sensory',
};

export const MILESTONES: MilestoneDef[] = [
  // ── 0–2 Months (Fourth Trimester) ──
  {
    id: 'ms-social-smile',
    title: 'First Social Smile',
    description: 'Your baby smiles in response to your face or voice — not just reflexively but because they recognize you.',
    domain: 'social_emotional',
    expectedStartMonth: 1,
    expectedEndMonth: 3,
    nurseTip: 'Get close — about 8 to 12 inches from baby\'s face — and talk softly, sing, or make gentle expressions. Babies learn to smile by mirroring you. It\'s not about "training" — just be present and responsive.',
    badgeIcon: 'sun',
    badgeLabel: 'Sunshine',
  },
  {
    id: 'ms-lifts-head',
    title: 'Lifts Head During Tummy Time',
    description: 'During tummy time, your baby briefly lifts their head and turns it to one side. This builds neck and upper body strength.',
    domain: 'motor_gross',
    expectedStartMonth: 0,
    expectedEndMonth: 3,
    nurseTip: 'Start with short tummy time sessions (2–3 minutes) right after a diaper change. Lie face-to-face so baby has something interesting to look at. A rolled towel under the chest can help. If baby fusses, that\'s okay — try again later.',
    badgeIcon: 'arrow-up',
    badgeLabel: 'Strong',
  },
  {
    id: 'ms-follows-objects',
    title: 'Follows Moving Objects',
    description: 'Baby tracks a colorful toy or your face slowly moving across their field of vision.',
    domain: 'sensory',
    expectedStartMonth: 1,
    expectedEndMonth: 3,
    nurseTip: 'Hold a high-contrast toy (black and white works best at this age) about 10 inches from baby\'s face and slowly move it side to side. Their eyes should follow it. If one eye seems "stuck," mention it at the next checkup.',
    badgeIcon: 'eye',
    badgeLabel: 'Spotter',
  },

  // ── 2–4 Months ──
  {
    id: 'ms-coos',
    title: 'Coos and Makes Sounds',
    description: 'Your baby starts making vowel sounds like "ahh" and "ooo" — their first experiments with language.',
    domain: 'language',
    expectedStartMonth: 2,
    expectedEndMonth: 4,
    nurseTip: 'When baby coos, coo right back! This "serve and return" conversation teaches them that communication is a two-way street. Narrate your day — "Now we\'re putting on a clean diaper!" — even if it feels silly.',
    badgeIcon: 'music',
    badgeLabel: 'Songbird',
  },
  {
    id: 'ms-holds-head-steady',
    title: 'Holds Head Steady',
    description: 'When held upright, your baby can keep their head stable without wobbling.',
    domain: 'motor_gross',
    expectedStartMonth: 3,
    expectedEndMonth: 5,
    nurseTip: 'Practice holding baby upright against your chest or in a supported sitting position on your lap. Their neck muscles strengthen with each opportunity. Always support the head until you\'re confident it\'s steady.',
    badgeIcon: 'shield',
    badgeLabel: 'Steady',
  },
  {
    id: 'ms-hands-to-mouth',
    title: 'Brings Hands to Mouth',
    description: 'Baby discovers their hands and brings them to their mouth to explore — an important self-soothing skill.',
    domain: 'motor_fine',
    expectedStartMonth: 2,
    expectedEndMonth: 4,
    nurseTip: 'This is a wonderful self-regulation milestone! Don\'t discourage hand-to-mouth behavior — it\'s how babies learn about themselves. Keep those little hands clean and let them explore.',
    badgeIcon: 'star',
    badgeLabel: 'Explorer',
  },

  // ── 4–6 Months ──
  {
    id: 'ms-rolls-over',
    title: 'Rolls Over',
    description: 'Baby rolls from tummy to back (usually first) or from back to tummy. A major mobility milestone!',
    domain: 'motor_gross',
    expectedStartMonth: 4,
    expectedEndMonth: 6,
    nurseTip: 'Give baby lots of floor time on a clean blanket. Place a favorite toy just out of reach to encourage reaching and rolling. Once they start rolling, never leave them unattended on elevated surfaces — they\'re quick!',
    badgeIcon: 'refresh-cw',
    badgeLabel: 'Tumbler',
  },
  {
    id: 'ms-laughs',
    title: 'Laughs Out Loud',
    description: 'That first real belly laugh — one of the most magical sounds you\'ll ever hear.',
    domain: 'social_emotional',
    expectedStartMonth: 3,
    expectedEndMonth: 6,
    nurseTip: 'Peek-a-boo, funny faces, gentle tickles, and silly sounds are your best tools. Every baby has their own humor — some love unexpected sounds, others love visual surprises. Experiment and enjoy!',
    badgeIcon: 'smile',
    badgeLabel: 'Giggler',
  },
  {
    id: 'ms-reaches',
    title: 'Reaches for Objects',
    description: 'Baby intentionally reaches out and grasps a toy or object. Their hand-eye coordination is clicking into gear.',
    domain: 'motor_fine',
    expectedStartMonth: 4,
    expectedEndMonth: 6,
    nurseTip: 'Offer toys in different positions — above, to the side, in front. Rattles, soft toys, and crinkly objects are perfect. Let baby bat at hanging toys (a play gym is ideal). The more they practice, the more precise they get.',
    badgeIcon: 'gift',
    badgeLabel: 'Grabber',
  },

  // ── 6–9 Months ──
  {
    id: 'ms-sits',
    title: 'Sits Without Support',
    description: 'Your baby can sit upright independently for a stretch, freeing their hands to play and explore.',
    domain: 'motor_gross',
    expectedStartMonth: 6,
    expectedEndMonth: 9,
    nurseTip: 'Practice supported sitting with a nursing pillow around baby for a soft landing. Start on a soft surface with toys within reach. Sitting opens up a whole new world of play — they can finally use both hands!',
    badgeIcon: 'anchor',
    badgeLabel: 'Sitter',
  },
  {
    id: 'ms-babbles',
    title: 'Babbles (ma-ma, da-da)',
    description: 'Baby strings consonant-vowel combinations together — "ba-ba," "ma-ma," "da-da." They\'re practicing speech!',
    domain: 'language',
    expectedStartMonth: 6,
    expectedEndMonth: 9,
    nurseTip: 'When baby says "ma-ma," respond with excitement: "Yes! Ma-ma is here!" Read simple board books, sing songs, and have "conversations" — pause after you speak and let baby "reply." They\'re learning the rhythm of language.',
    badgeIcon: 'message-circle',
    badgeLabel: 'Chatter',
  },
  {
    id: 'ms-stranger-awareness',
    title: 'Stranger Awareness',
    description: 'Baby becomes cautious around unfamiliar people — a sign that they know and prefer their trusted caregivers.',
    domain: 'social_emotional',
    expectedStartMonth: 6,
    expectedEndMonth: 9,
    nurseTip: 'This is actually a healthy sign of secure attachment, not a setback! Don\'t force baby into unfamiliar arms. Let them warm up at their own pace. Stay calm and reassuring — your confidence helps them feel safe.',
    badgeIcon: 'users',
    badgeLabel: 'Bonded',
  },
  {
    id: 'ms-transfers-objects',
    title: 'Transfers Objects Between Hands',
    description: 'Baby passes a toy smoothly from one hand to the other — a cognitive and motor milestone.',
    domain: 'motor_fine',
    expectedStartMonth: 6,
    expectedEndMonth: 9,
    nurseTip: 'Offer toys of different sizes and shapes. Blocks, soft balls, and stacking cups are great. During play, gently offer toys to the "empty" hand to encourage transfer. This skill is a building block for feeding and dressing.',
    badgeIcon: 'repeat',
    badgeLabel: 'Juggler',
  },

  // ── 9–12 Months ──
  {
    id: 'ms-crawls',
    title: 'Crawls',
    description: 'Baby moves across the floor — army crawl, classic crawl, or scoot. The method doesn\'t matter; the mobility does!',
    domain: 'motor_gross',
    expectedStartMonth: 7,
    expectedEndMonth: 11,
    nurseTip: 'Some babies skip crawling entirely and go straight to cruising or walking — that\'s perfectly normal. Encourage floor exploration with toys placed slightly out of reach. Babyproof everything at floor level!',
    badgeIcon: 'navigation',
    badgeLabel: 'Mover',
  },
  {
    id: 'ms-first-words',
    title: 'First Words',
    description: 'Baby says a word with clear intention — "mama" for you, "dada" for dad, "ba" for ball. Language is here!',
    domain: 'language',
    expectedStartMonth: 9,
    expectedEndMonth: 14,
    nurseTip: 'Label everything! "That\'s a dog. The dog says woof." Use short, clear phrases. Don\'t correct — if baby says "ba" for ball, say "Yes, ball! You want the ball!" Expand, don\'t correct. Reading together every day is the single best thing for language.',
    badgeIcon: 'mic',
    badgeLabel: 'Speaker',
  },
  {
    id: 'ms-pulls-to-stand',
    title: 'Pulls to Stand',
    description: 'Baby grabs furniture, your hands, or anything sturdy and pulls themselves up to a standing position.',
    domain: 'motor_gross',
    expectedStartMonth: 9,
    expectedEndMonth: 12,
    nurseTip: 'Make sure furniture is stable and can\'t tip. A low, sturdy coffee table is perfect for practicing. Stand behind baby with your hands ready. They\'ll fall — a lot — that\'s how they learn. Celebrate every attempt!',
    badgeIcon: 'trending-up',
    badgeLabel: 'Riser',
  },
  {
    id: 'ms-pincer-grasp',
    title: 'Pincer Grasp',
    description: 'Baby picks up small objects between thumb and forefinger — a precise, skilled movement that unlocks self-feeding.',
    domain: 'motor_fine',
    expectedStartMonth: 9,
    expectedEndMonth: 12,
    nurseTip: 'Offer small, safe foods like puffed cereal or soft fruit pieces on the highchair tray. Picking up these tiny pieces is the best practice. Always supervise closely — this is the age when everything goes in the mouth.',
    badgeIcon: 'crosshair',
    badgeLabel: 'Precise',
  },
  {
    id: 'ms-waves',
    title: 'Waves Bye-Bye',
    description: 'Baby waves goodbye (or hello!) — showing they understand social gestures and can imitate them.',
    domain: 'social_emotional',
    expectedStartMonth: 9,
    expectedEndMonth: 13,
    nurseTip: 'Wave at every greeting and goodbye — baby learns through repetition. Make it fun and enthusiastic! Pair it with "bye-bye" every time. Clapping, pointing, and head-shaking are all social gestures that emerge around this time too.',
    badgeIcon: 'award',
    badgeLabel: 'Social',
  },
];

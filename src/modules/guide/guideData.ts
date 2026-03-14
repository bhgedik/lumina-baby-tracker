// ============================================================
// Lumina — Knowledge Library Data
// Comprehensive, non-linear baby care encyclopedia
// Rooted in: Karp, Siegel, Solter, Murkoff, Pantley, LLLI
// ============================================================

// ── Age ranges for content filtering ─────────────────────────

export type ApplicableAge =
  | '0-3m'    // Fourth trimester / newborn
  | '3-6m'    // Transition
  | '6-12m'   // Exploration
  | '12m+'    // Toddler
  | 'all';    // Universal

export interface GuideArticle {
  id: string;
  title: string;
  summary: string;
  tag: string;
  readTime: string;
  body: string;
  locked?: boolean;
}

export interface LibraryCard {
  id: string;
  title: string;
  subtitle: string;
  /** Feather icon name */
  icon: string;
  accentColor: string;
  cardBg: string;
  applicableAge: ApplicableAge;
  /** Renders as a larger "folder" card */
  isMaster?: boolean;
  /** Renders with an alert accent strip */
  isHighlighted?: boolean;
  articles: GuideArticle[];
}

export interface LibraryCategory {
  id: string;
  title: string;
  icon: string;
  accentColor: string;
  cards: LibraryCard[];
}

// Keep backward compat alias for topic hub screen
export type DiscoveryNode = LibraryCard & { iconBg: string; badge: string };

export const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Troubleshooting: { bg: '#FCE8E8', text: '#B54C4C' },
  Methodology: { bg: '#EEF0F7', text: '#5A6A9E' },
  Anatomy: { bg: '#FDF2E9', text: '#B87A3D' },
  Technique: { bg: '#F0EBF5', text: '#8E72A4' },
  Safety: { bg: '#F9EDED', text: '#A85050' },
  Diagnostics: { bg: '#FEF3E2', text: '#9A7030' },
  'Quick Ref': { bg: '#F0EDE8', text: '#7A7060' },
  Science: { bg: '#EEF0F7', text: '#5A6A9E' },
  Nutrition: { bg: '#EDF5F0', text: '#4A7A5E' },
  Neuroscience: { bg: '#F3EFF9', text: '#7B61A6' },
  Attachment: { bg: '#FEF2F4', text: '#C4697A' },
  Development: { bg: '#EFF6FF', text: '#3B82C4' },
};

// ── "For Baby's Stage" — featured card IDs per age ───────────

export const STAGE_FEATURED: Record<ApplicableAge, string[]> = {
  '0-3m': ['fourth-trimester-guide', 'mastering-5s', 'sleep-spectrum', 'breastfeeding-bible'],
  '3-6m': ['mental-leaps', 'wake-windows', 'pantley-nocry', 'starting-solids'],
  '6-12m': ['whole-brain-child', 'starting-solids', 'sleep-regressions', 'fever-redflag'],
  '12m+': ['whole-brain-child', 'secure-attachment', 'gentle-weaning', 'skin-eczema'],
  all: ['fourth-trimester-guide', 'mental-leaps', 'sleep-spectrum'],
};

// ── Categories ─────────────────────────────────────────────

export const LIBRARY_CATEGORIES: LibraryCategory[] = [

  // ═══════════════════════════════════════════════════════════
  // SOOTHING & 4TH TRIMESTER
  // ═══════════════════════════════════════════════════════════
  {
    id: 'soothing',
    title: 'Soothing & 4th Trimester',
    icon: 'wind',
    accentColor: '#7BABC4',
    cards: [
      {
        id: 'fourth-trimester-guide',
        title: 'The 4th Trimester Survival Guide',
        subtitle: 'Your baby just arrived from the coziest place on earth — here\'s how to ease the transition',
        icon: 'heart',
        accentColor: '#7BABC4',
        cardBg: '#F0F6FA',
        applicableAge: '0-3m',
        isMaster: true,
        articles: [
          {
            id: 'fourth-tri-intro',
            title: 'What Is the Fourth Trimester?',
            tag: 'Science',
            readTime: '5 min',
            summary: 'Human babies are born 3 months "early" compared to other mammals. Understanding this changes how you parent.',
            body: `**The most radical reframe in modern parenting:** Your newborn isn\u2019t being "difficult" \u2014 they\u2019re adjusting to existing outside your body. Dr. Harvey Karp calls the first 3 months the "Fourth Trimester" because human babies are born neurologically immature compared to nearly every other mammal.\n\n**Why this matters:**\nA horse foal walks within hours. A human baby can\u2019t even hold their head up. This isn\u2019t a design flaw \u2014 it\u2019s a trade-off. Our large brains require birth before the skull is fully formed, which means babies arrive needing womb-like conditions to thrive.\n\n**What your baby is experiencing:**\n- **Sensory overload:** They went from a warm, dark, muffled, constantly-rocking environment to bright lights, open space, silence, and stillness. Everything is overwhelming.\n- **No concept of self:** Newborns don\u2019t know where they end and you begin. Separation feels existentially threatening.\n- **Immature nervous system:** They cannot regulate their temperature, emotions, or digestion independently.\n\n**What this means for you:**\n- Holding your baby constantly is not spoiling \u2014 it\u2019s recreating the womb.\n- Movement (rocking, swaying, carrying) is not a "crutch" \u2014 it\u2019s what their nervous system needs.\n- Skin-to-skin contact regulates heart rate, breathing, temperature, and blood sugar.\n- Your baby\u2019s need for closeness is as real as their need for food.\n\n**The promise:** This phase is intense but finite. By 3-4 months, your baby\u2019s nervous system matures dramatically. They begin to smile, coo, and engage with the world. The fog lifts. You\u2019ve got this.`,
          },
          {
            id: 'newborn-expectations',
            title: 'Setting Real Expectations: The First 12 Weeks',
            tag: 'Quick Ref',
            readTime: '4 min',
            summary: 'What\'s truly normal (spoiler: most of what worries you is completely fine).',
            body: `**Weeks 1-2: Pure survival.**\nBaby feeds 8-12 times per day. Sleeps 16-17 hours in chaotic 1-3 hour chunks. Poops change color daily (black \u2192 green \u2192 yellow). You won\u2019t sleep more than 3 hours at a stretch. This is ALL normal.\n\n**Weeks 3-4: The "witching hour" arrives.**\nEvening fussiness peaks. Baby may cry 1-3 hours between 5-10 PM. This is not colic (unless it\u2019s 3+ hours, 3+ days/week). It\u2019s neural overload from a full day of stimulation. The 5 S\u2019s are your best friend here.\n\n**Weeks 5-6: Growth spurt + peak crying.**\nCrying typically peaks around 6 weeks, then gradually decreases. You\u2019ll also see the first real social smile \u2014 and it changes everything.\n\n**Weeks 7-8: Patterns emerge.**\nYou might notice a longer nighttime stretch (3-5 hours). Some babies start this earlier, some later. Both are normal.\n\n**Weeks 9-12: The emergence.**\nBaby becomes more alert, interactive, and social. Feeds become more efficient. Night stretches may lengthen. You start feeling like a parent instead of a survival machine.\n\n**Red flags at any point (call your pediatrician):**\n- Fewer than 6 wet diapers after day 5\n- Not regaining birth weight by day 14\n- Fever \u2265 38\u00B0C (100.4\u00B0F) under 3 months\n- Persistent lethargy or difficulty waking for feeds\n- Bile-green vomiting`,
          },
          { id: 'postpartum-recovery', title: 'Your Recovery Matters Too', tag: 'Safety', readTime: '5 min', summary: 'The physical and emotional healing timeline no one talks about enough.', body: '', locked: true },
          { id: 'partner-role', title: 'The Partner\'s Role in the 4th Trimester', tag: 'Attachment', readTime: '4 min', summary: 'You can\'t breastfeed, but you can do everything else \u2014 and baby needs you deeply.', body: '', locked: true },
        ],
      },
      {
        id: 'mastering-5s',
        title: 'Mastering the 5 S\'s',
        subtitle: 'Dr. Harvey Karp\'s calming reflex toolkit for newborns',
        icon: 'volume-2',
        accentColor: '#5A9BAF',
        cardBg: '#EDF5F8',
        applicableAge: '0-3m',
        articles: [
          {
            id: 'five-s-complete',
            title: 'The 5 S\'s: Complete Guide',
            tag: 'Technique',
            readTime: '7 min',
            summary: 'Swaddling, Side/Stomach, Shushing, Swinging, Sucking \u2014 the exact technique that triggers your baby\'s calming reflex.',
            body: `**Source:** Dr. Harvey Karp, "The Happiest Baby on the Block"\n\n**The calming reflex:** All babies are born with a powerful neurological "off switch" for crying. The 5 S\u2019s work by recreating womb conditions, activating this reflex. They work best in combination and in order.\n\n**1. SWADDLING**\nWrap baby snugly with arms at sides (not across chest). Use a thin, breathable blanket or swaddle pod.\n- WHY: Prevents the Moro (startle) reflex from waking baby. Recreates the firm, contained feeling of the womb.\n- HOW: Arms snug, hips loose. Baby should be able to bend legs at the hip.\n- SAFETY: Stop swaddling when baby shows signs of rolling (usually 3-4 months). Always place on back.\n\n**2. SIDE / STOMACH POSITION**\nHold baby on their side or stomach while IN YOUR ARMS (never in the crib).\n- WHY: The back-lying position triggers the Moro reflex. Side/stomach position calms the falling sensation.\n- HOW: Football hold (face-down along your forearm) or cradled on their side against your chest.\n- SAFETY: This is for HOLDING only. Baby always sleeps on their back.\n\n**3. SHUSHING**\nMake a loud, continuous "SHHHHH" right next to baby\u2019s ear.\n- WHY: The womb is louder than a vacuum cleaner. Silence is alarming to a newborn.\n- HOW: Match the volume of baby\u2019s cry. As they calm, gradually lower your volume. A white noise machine at 65-70 dB works too.\n- KEY: It must be LOUD enough. A gentle "shh" from across the room won\u2019t work.\n\n**4. SWINGING**\nSmall, jiggly movements of the head (always supporting the neck).\n- WHY: Baby was constantly rocked by your movement in utero. Stillness feels wrong.\n- HOW: Tiny, fast, 1-inch movements \u2014 like jiggling Jell-O, not shaking. Support the head and neck always.\n- CRITICAL SAFETY: NEVER shake a baby. These are tiny, gentle oscillations.\n\n**5. SUCKING**\nOffer breast, clean finger (pad up), or pacifier.\n- WHY: Sucking triggers the calming reflex and lowers heart rate.\n- HOW: After the first 4 S\u2019s have started calming baby, offer something to suck.\n\n**The magic combination:** Swaddle \u2192 Side hold \u2192 Shush loudly \u2192 Jiggle gently \u2192 Offer suck. Most babies calm within 1-2 minutes when all 5 are applied together.`,
          },
          { id: 'swaddle-guide', title: 'Swaddling: Technique & When to Stop', tag: 'Safety', readTime: '3 min', summary: 'The diamond wrap, arms-down method, and the exact signs that mean it\'s time to transition.', body: '', locked: true },
          { id: 'white-noise', title: 'White Noise: The Science & Safety', tag: 'Science', readTime: '3 min', summary: 'Optimal volume, placement distance, and why pink noise might be even better.', body: '', locked: true },
        ],
      },
      {
        id: 'colic-gas',
        title: 'Decoding Colic & Gas',
        subtitle: 'When crying feels endless \u2014 gentle relief strategies',
        icon: 'cloud',
        accentColor: '#8BAEC4',
        cardBg: '#EFF4F8',
        applicableAge: '0-3m',
        articles: [
          {
            id: 'colic-understanding',
            title: 'Understanding Colic: It\'s Not Your Fault',
            tag: 'Science',
            readTime: '5 min',
            summary: 'Colic affects 20% of babies. It has a beginning, a peak, and an end. Here\'s what the research actually shows.',
            body: `**First, the most important thing:** If your baby has colic, you are not doing anything wrong. Colic is not caused by bad parenting, bad milk, or bad luck. It\u2019s a normal (though excruciating) phase of neurological development.\n\n**What colic actually is:**\nThe "Rule of 3s": Crying for 3+ hours, 3+ days/week, for 3+ weeks, in an otherwise healthy baby. It typically starts around 2-3 weeks, peaks at 6-8 weeks, and resolves by 3-4 months.\n\n**What causes it (current understanding):**\nHonest answer: we don\u2019t fully know. The leading theories:\n- **Immature nervous system:** Baby\u2019s brain is overwhelmed by a full day of stimulation and "crashes" in the evening.\n- **Gut microbiome development:** The digestive system is still colonizing with bacteria. This can cause gas, discomfort, and cramping.\n- **Fourth trimester adjustment:** Some babies simply have a harder time with the sensory transition from womb to world.\n\n**What does NOT cause colic:**\n- Your breast milk (do NOT stop breastfeeding)\n- Maternal diet (in rare cases, dairy elimination helps, but don\u2019t assume this)\n- "Spoiling" the baby with too much holding\n- Formula vs. breastfeeding (rates are identical)\n\n**What helps:**\n1. **The 5 S\u2019s** (Dr. Karp\u2019s calming reflex \u2014 see our detailed guide)\n2. **Skin-to-skin contact** \u2014 direct chest-to-chest, as much as possible\n3. **Babywearing** \u2014 keeps baby upright, warm, and in motion\n4. **Warm bath together** \u2014 the water, warmth, and skin contact can break a crying cycle\n5. **Take turns** \u2014 if you have a partner, switch off every 20-30 minutes. Colic tests the strongest parents.\n6. **Walk away** \u2014 if you\u2019re at your limit, place baby safely in their crib and step away for 5 minutes. This is SAFE and RESPONSIBLE.\n\n**The light at the end:** Colic resolves. It always does. By 3-4 months, the crying drops dramatically. You will get through this.`,
          },
          { id: 'gas-relief', title: 'Gentle Gas Relief Techniques', tag: 'Technique', readTime: '4 min', summary: 'Bicycle legs, tummy massage, and the "I Love U" stroke pattern that helps trapped gas.', body: '', locked: true },
          { id: 'reflux-comfort', title: 'Reflux Comfort Positions', tag: 'Technique', readTime: '3 min', summary: 'Upright feeding, left-side lying, and the 30-minute post-feed hold that reduces spit-up.', body: '', locked: true },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // BRAIN & BEHAVIOR
  // ═══════════════════════════════════════════════════════════
  {
    id: 'brain',
    title: 'Brain & Behavior',
    icon: 'zap',
    accentColor: '#7B61A6',
    cards: [
      {
        id: 'mental-leaps',
        title: 'Mental Leaps Explained',
        subtitle: 'Why your baby is fussy, clingy, and amazing all at once',
        icon: 'zap',
        accentColor: '#7B61A6',
        cardBg: '#F3EFF9',
        applicableAge: 'all',
        isMaster: true,
        articles: [
          {
            id: 'leaps-overview',
            title: 'The Wonder Weeks: Your Baby\'s Brain Upgrades',
            tag: 'Neuroscience',
            readTime: '6 min',
            summary: 'Fussy phases aren\'t random \u2014 they\'re predictable cognitive leaps. Understanding them transforms frustration into awe.',
            body: `**Source:** "The Wonder Weeks" by Hetty van de Rijt & Frans Plooij\n\n**The beautiful truth:** Your baby\u2019s brain goes through predictable periods of rapid reorganization. During these leaps, the world literally looks different to your baby \u2014 they can suddenly perceive patterns, relationships, or categories that were invisible before.\n\n**Why it gets harder before it gets better:**\nImagine waking up and suddenly seeing a new color that didn\u2019t exist yesterday. That\u2019s what a mental leap feels like to your baby. This new perception is exciting but also overwhelming and scary. Baby copes by:\n- **Clinging:** Seeking your safe harbor while their world shifts\n- **Crying more:** Processing the sensory overload of new perception\n- **Sleep disruption:** The brain is literally rewiring during sleep \u2014 it needs more, but the process itself causes more waking\n- **Feeding changes:** Comfort nursing increases, or appetite fluctuates\n\n**The 10 major leaps in the first 20 months:**\n1. **Week 5 \u2014 Changing Sensations:** Baby discovers that the world has patterns\n2. **Week 8 \u2014 Patterns:** Simple patterns in sight, sound, and touch emerge\n3. **Week 12 \u2014 Smooth Transitions:** Movements become fluid, not jerky\n4. **Week 19 \u2014 Events:** Baby understands sequences (I push this, it falls)\n5. **Week 26 \u2014 Relationships:** Distance, spatial awareness, cause and effect\n6. **Week 37 \u2014 Categories:** Grouping things (food, animals, objects)\n7. **Week 46 \u2014 Sequences:** Understanding order (get dressed, then eat)\n8. **Week 55 \u2014 Programs:** Flexible strategies to achieve goals\n9. **Week 64 \u2014 Principles:** Understanding rules that govern behavior\n10. **Week 75 \u2014 Systems:** Complex thinking about how things relate\n\n**The reframe that changes everything:**\nInstead of "My baby is being so difficult this week," try: "My baby\u2019s brain is building incredible new connections right now. This fussiness is the beautiful, messy process of becoming more aware of the world. They need my closeness more than ever while this happens."\n\n**Your role during a leap:** Be the calm in the storm. Hold more. Rock more. Nurse more. Lower expectations. This is not regression \u2014 it\u2019s preparation for a breakthrough.`,
          },
          {
            id: 'leap-by-leap',
            title: 'Leap-by-Leap Guide (First 6 Months)',
            tag: 'Development',
            readTime: '5 min',
            summary: 'What to expect and how to support your baby through each of the first 5 cognitive leaps.',
            body: `**LEAP 1 \u2014 Week 5: Changing Sensations**\n*"The world suddenly has depth."*\nBaby notices that sensory experiences change \u2014 light shifts, sounds vary, textures differ. They may stare at things longer, seem startled by their own hands, or cry more than the previous weeks.\n**How to support:** Extra skin-to-skin. Slow, gentle movements. Reduce overstimulation.\n\n**LEAP 2 \u2014 Week 8: Patterns**\n*"I can see shapes and hear rhythms."*\nBaby discovers simple patterns \u2014 the stripes on a shirt, the rhythm of your voice. First real smiles appear. Hands begin to fascinate them.\n**How to support:** High-contrast images. Sing repetitive songs. Let them study your face up close.\n\n**LEAP 3 \u2014 Week 12: Smooth Transitions**\n*"My body can move fluidly."*\nMovements become smoother. Baby can track objects, reach deliberately, and make new sounds. They may seem frustrated when they can\u2019t do what their brain now envisions.\n**How to support:** Lots of floor time. Interesting objects just within reach. Patience with their frustration.\n\n**LEAP 4 \u2014 Week 19: Events**\n*"Things happen in sequences!"*\nThis is the BIG one. Baby understands that actions have consequences, that events unfold in order. They may become much fussier, more clingy, and sleep may regress significantly.\n**How to support:** This is the most demanding leap. Lower all expectations. It\u2019s okay if laundry waits. Hold your baby. The 4-month "sleep regression" is actually this leap.\n\n**LEAP 5 \u2014 Week 26: Relationships**\n*"Things are connected to each other."*\nBaby understands distance (things far away are smaller), spatial relationships, and cause-effect. Separation anxiety often begins here \u2014 this is a POSITIVE sign of healthy attachment.\n**How to support:** Peek-a-boo games (teaches object permanence). Stay close during transitions. Name what\u2019s happening: "I\u2019m going to the kitchen. I\u2019ll be right back."`,
          },
          { id: 'leap-second-year', title: 'Leaps 6-10: The Toddler Mind Explosions', tag: 'Development', readTime: '5 min', summary: 'Categories, programs, principles \u2014 the increasingly complex leaps of the second year.', body: '', locked: true },
          { id: 'supporting-leaps', title: 'How to Support Your Baby Through Every Leap', tag: 'Attachment', readTime: '4 min', summary: 'Practical strategies for the fussy phases: what to do more of, and what to let go.', body: '', locked: true },
        ],
      },
      {
        id: 'whole-brain-child',
        title: 'The Whole-Brain Child',
        subtitle: 'Understanding tantrums, meltdowns, and big emotions through neuroscience',
        icon: 'cpu',
        accentColor: '#6B5DA6',
        cardBg: '#F0EDF7',
        applicableAge: '6-12m',
        articles: [
          {
            id: 'upstairs-downstairs',
            title: 'The Upstairs & Downstairs Brain',
            tag: 'Neuroscience',
            readTime: '5 min',
            summary: 'Dr. Daniel Siegel\'s beautiful model: why your baby literally cannot "calm down" on command.',
            body: `**Source:** Dr. Daniel Siegel, "The Whole-Brain Child"\n\n**The model:** Think of the brain as a house with two floors.\n\n**Downstairs brain** (brainstem + limbic system): Fully operational from birth. Handles survival instincts, big emotions, fight-or-flight responses. This is where fear, anger, and distress live.\n\n**Upstairs brain** (prefrontal cortex): NOT fully developed until age 25. Handles logical thinking, emotional regulation, empathy, impulse control, and decision-making.\n\n**Why this matters enormously:**\nWhen your baby or toddler is having a meltdown, their downstairs brain has taken over completely. The upstairs brain \u2014 the part that could "calm down" or "use their words" \u2014 is literally offline. It\u2019s not that they WON\u2019T regulate. They CAN\u2019T.\n\n**What this means for you:**\n- Telling a screaming baby to "stop crying" is like asking them to solve algebra. The hardware isn\u2019t there yet.\n- Punishment during a meltdown doesn\u2019t teach \u2014 it adds fear to an already overwhelmed system.\n- Your calm, regulated presence is what helps their downstairs brain settle. You are their external regulation.\n\n**"Connect, then redirect":**\n1. **Connect:** Get on their level. Validate the feeling. "You\u2019re so upset. I see that."\n2. **Wait:** Hold space while the emotional wave passes. Don\u2019t rush this.\n3. **Redirect:** Only once calm, offer the lesson or alternative. "That was scary. Next time, let\u2019s try..."\n\n**The liberating truth:** Your child is not giving you a hard time. They are HAVING a hard time. Your job is not to fix the emotion, but to be present through it.`,
          },
          { id: 'connect-redirect', title: 'Connect Before You Redirect: Practical Scripts', tag: 'Technique', readTime: '4 min', summary: 'Exact words and actions for toddler meltdowns, based on Siegel\'s whole-brain approach.', body: '', locked: true },
          { id: 'name-it-tame-it', title: '"Name It to Tame It": Emotional Labeling', tag: 'Neuroscience', readTime: '3 min', summary: 'Why simply naming an emotion reduces its intensity \u2014 and how to start from infancy.', body: '', locked: true },
        ],
      },
      {
        id: 'secure-attachment',
        title: 'Building Secure Attachment',
        subtitle: 'The single most important gift you can give your child',
        icon: 'link',
        accentColor: '#C4697A',
        cardBg: '#FEF2F4',
        applicableAge: 'all',
        articles: [
          {
            id: 'attachment-science',
            title: 'What Secure Attachment Actually Means',
            tag: 'Attachment',
            readTime: '6 min',
            summary: 'It\'s not about being perfect. It\'s about being present, responsive, and good enough \u2014 and the research proves it.',
            body: `**Source:** Aletha Solter ("The Aware Baby"), John Bowlby (attachment theory), Dr. Daniel Siegel\n\n**Secure attachment is not:**\n- Never letting your baby cry\n- Being available every single second\n- Sacrificing your mental health for your child\n- Doing everything "right"\n\n**Secure attachment IS:**\n- Responding to your baby\u2019s needs consistently (not perfectly)\n- Being emotionally present and attuned most of the time\n- Repairing when you lose your temper or make a mistake\n- Treating your baby\u2019s emotions as valid communication\n\n**The "good enough" parent:**\nResearch by Edward Tronick shows that even the most attuned parent is only "in sync" with their baby about 30% of the time. The other 70% is misattunement followed by repair. It\u2019s the REPAIR that builds secure attachment, not perfection.\n\n**Why this matters for their entire life:**\nSecurely attached children become adults who:\n- Can regulate their own emotions\n- Form healthy relationships\n- Handle stress and adversity\n- Have higher self-esteem\n- Show greater empathy\n\n**How crying fits in (Aletha Solter\u2019s insight):**\nCrying is not just a signal for a need \u2014 it\u2019s also a natural stress-release mechanism. Sometimes, after all needs are met, a baby cries to release accumulated tension. Your role is not to STOP the crying at all costs, but to HOLD SPACE for it.\n\nThis means: holding your baby close, maintaining eye contact, speaking softly: "I\u2019m here. You\u2019re safe. I\u2019m listening." The message is: your feelings matter, you are not alone, and I can handle your big emotions.\n\n**The repair mantra:** You will lose your patience. You will feel overwhelmed. You will make mistakes. What matters is what you do AFTER. Coming back, reconnecting, and saying "I\u2019m sorry I got frustrated. I still love you" \u2014 that IS secure attachment.`,
          },
          { id: 'responsive-parenting', title: 'Responsive Parenting in Practice', tag: 'Attachment', readTime: '4 min', summary: 'Concrete daily actions that build security: feeding cues, bedtime rituals, rupture-repair cycles.', body: '', locked: true },
          { id: 'separation-anxiety', title: 'Separation Anxiety: A Beautiful Milestone', tag: 'Development', readTime: '3 min', summary: 'Your baby clings because they love you deeply. How to honor this while building confidence.', body: '', locked: true },
          { id: 'crying-solter', title: 'Holding Space for Tears (Aletha Solter)', tag: 'Attachment', readTime: '5 min', summary: 'The difference between distraction, silencing, and truly listening to your baby\'s emotional release.', body: '', locked: true },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // SLEEP (GENTLE METHODS ONLY)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'sleep',
    title: 'Sleep',
    icon: 'moon',
    accentColor: '#6B7DB3',
    cards: [
      {
        id: 'sleep-spectrum',
        title: 'The Sleep Spectrum',
        subtitle: 'Gentle, attachment-based approaches to healthy sleep',
        icon: 'moon',
        accentColor: '#6B7DB3',
        cardBg: '#F4F5FB',
        applicableAge: 'all',
        articles: [
          {
            id: 'sleep-science',
            title: 'Why Babies Wake: The Beautiful Science',
            tag: 'Science',
            readTime: '5 min',
            summary: 'Night waking is biologically normal, protective, and a sign of healthy brain development.',
            body: `**The most important thing to know:** Night waking in the first year is not a problem to solve \u2014 it\u2019s a feature of healthy infant development.\n\n**Why babies wake at night:**\n\n1. **Brain growth:** Babies spend up to 50% of sleep in REM (active sleep), compared to 25% for adults. This is when the brain is building neural connections at an astonishing rate \u2014 up to 1 million new synapses per second. Lighter sleep phases mean more brief wakings.\n\n2. **Feeding needs:** Infant stomachs are tiny and breast milk is digested quickly. Night feeding is biologically designed to support growth and maintain milk supply. Prolactin (the milk-making hormone) peaks between 1\u20135 AM.\n\n3. **Survival instinct:** Babies are hardwired to check that their caregiver is nearby. This is not manipulation \u2014 it\u2019s brilliant biology.\n\n4. **Circadian rhythm immaturity:** Newborns don\u2019t produce melatonin until around 3\u20134 months. Their internal clock is literally still forming.\n\n**What the research actually shows:**\n- A 2018 study in Pediatrics found that 57% of 6-month-olds and 43% of 12-month-olds still wake at night. This is NORMAL.\n- Responsive parenting at night builds secure attachment \u2014 the foundation for healthy independence later.\n- Babies who are responded to promptly actually cry LESS overall.\n\n**The reframe:** Instead of \u201cmy baby won\u2019t sleep through the night,\u201d try: \u201cmy baby\u2019s brain is growing so fast that they need me close while it happens.\u201d`,
          },
          {
            id: 'pantley-pulloff',
            title: 'The Pantley Gentle Removal (No-Cry Method)',
            tag: 'Technique',
            readTime: '6 min',
            summary: 'Elizabeth Pantley\u2019s signature technique \u2014 gently helping baby learn to fall asleep without the breast, bottle, or rocking.',
            body: `**Source:** Elizabeth Pantley, \u201cThe No-Cry Sleep Solution\u201d\n\n**The core idea:** Instead of abruptly removing a sleep association, you gradually and gently reduce it over days and weeks. Baby barely notices the shift because each step is so small.\n\n**The Pantley Pull-Off (for nursing/bottle to sleep):**\n\n1. **Night 1\u20133 \u2014 Observe:** Feed baby to sleep as usual but pay attention to when they transition from active sucking to \u201ccomfort sucking\u201d (light, fluttery, almost asleep).\n\n2. **Night 4\u20137 \u2014 Gentle removal:** When baby shifts to comfort sucking, gently break the latch by sliding your pinky into the corner of their mouth. Hold them close. If they root or fuss, let them relatch. Try again in a few minutes.\n\n3. **Night 8\u201314 \u2014 Earlier removal:** Start removing the breast/bottle slightly earlier. Hold, shush, pat gently.\n\n4. **Night 15+ \u2014 Drowsy but aware:** Gradually work toward removing the breast/bottle when baby is drowsy but still slightly aware.\n\n**Key principles:**\n- Never force it. If baby becomes upset, offer the breast/bottle again. There is no failure \u2014 only \u201cnot tonight.\u201d\n- Progress is measured in weeks, not days.\n- Baby never feels abandoned.\n\n**Why this works neurologically:** Micro-changes gently rewire the association without triggering the stress response (cortisol). The amygdala stays calm, and new neural pathways form gradually.`,
          },
          {
            id: 'responsive-settling',
            title: 'Responsive Settling: The Stay-and-Support Method',
            tag: 'Technique',
            readTime: '5 min',
            summary: 'Stay physically present, offering warmth and touch. Your presence IS the method.',
            body: `**The philosophy:** Your baby doesn\u2019t need to learn to sleep alone \u2014 they need to feel safe enough to let go into sleep.\n\n**Step by step:**\n\n1. **Complete your bedtime routine** \u2014 feed, bath, books, songs, whatever feels right for your family.\n2. **Place baby in their sleep space** when drowsy. Sit or lie right beside them.\n3. **Stay and support:** Hand on chest, gentle patting, shushing, humming. You\u2019re being their safe harbor.\n4. **If baby cries:** Pick them up, comfort fully, then try again when calm. No limit on how many times.\n5. **Gradually reduce input over weeks:** As baby becomes more comfortable, you may need less patting, less shushing. Let baby guide the pace.\n\n**Dr. Daniel Siegel\u2019s insight:** \u201cChildren need to feel felt.\u201d When you stay present during the vulnerable transition to sleep, you\u2019re teaching your child that their feelings matter and that they are not alone.\n\n**Timeline:** Most families see gradual improvement over 2\u20134 weeks. Some babies take longer. Both are normal.`,
          },
          {
            id: 'sleep-approach',
            title: 'Finding Your Family\u2019s Gentle Path',
            tag: 'Quick Ref',
            readTime: '4 min',
            summary: 'A framework for choosing the right gentle approach based on your baby\u2019s temperament.',
            body: `**Start with your baby\u2019s temperament:**\n\n- **High-need / sensitive baby** \u2192 Responsive Settling. Stay close, maximum comfort.\n- **Easy-going / adaptable baby** \u2192 Pantley Pull-Off or Bedtime Fading.\n- **Active / alert baby** \u2192 Bedtime Fading + strong wind-down routine.\n\n**Then consider your capacity:**\n- **Solo parenting** \u2192 Focus on routine consistency. Safe bedsharing may be most sustainable.\n- **Partner available** \u2192 Take turns with responsive settling.\n- **Feeling desperate** \u2192 Start with ONE change: a consistent 20-minute bedtime routine.\n\n**What all gentle approaches share:**\n- Baby is never left to cry alone\n- Parent responds to distress every time\n- Changes happen gradually over weeks\n- The attachment bond is protected\n- Night waking is normalized, not pathologized\n\n**The most important thing:** You cannot spoil a baby with too much love. Responding at 2 AM is building the foundation for a secure, emotionally healthy human being.`,
          },
          { id: 'sleep-regression', title: 'The 4-Month Sleep Leap', tag: 'Science', readTime: '5 min', summary: 'A magnificent brain upgrade that temporarily disrupts sleep.', body: '', locked: true },
        ],
      },
      {
        id: 'wake-windows',
        title: 'Wake Windows & Rhythms',
        subtitle: 'Finding your baby\'s natural flow and sleep cues',
        icon: 'sun',
        accentColor: '#C4973E',
        cardBg: '#FDFBF4',
        applicableAge: 'all',
        articles: [
          {
            id: 'wake-windows-ref',
            title: 'Wake Window Reference by Age',
            tag: 'Quick Ref',
            readTime: '3 min',
            summary: 'The exact ranges pediatric sleep consultants use, with signs baby is at their limit.',
            body: `**Wake windows = time from eyes open to next sleep onset.**\n\n**Age-specific ranges:**\n- 0-4 weeks: 35-60 minutes\n- 4-8 weeks: 45-75 minutes\n- 2-3 months: 60-90 minutes\n- 3-4 months: 75-120 minutes\n- 4-5 months: 1.5-2.5 hours\n- 5-7 months: 2-3 hours\n- 7-10 months: 2.5-3.5 hours\n- 10-12 months: 3-4 hours\n- 12-18 months: 3.5-5 hours\n\n**Early tired cues (act on these):**\n- Staring into space / zoning out\n- Turning away from stimulation\n- Pulling ears\n- The FIRST yawn\n- Decreased activity\n\n**Late tired cues (you\u2019ve missed the window):**\n- Rubbing eyes aggressively\n- Arching back\n- Inconsolable crying\n- Hyperactive behavior (counterintuitive \u2014 overtired babies get wired)\n\n**The #1 mistake:** Waiting for \u201cobvious\u201d tired signs. By the time a newborn is rubbing their eyes, they\u2019ve been overtired for 15-20 minutes.`,
          },
          {
            id: 'overtired-spiral',
            title: 'Breaking the Overtired Spiral',
            tag: 'Troubleshooting',
            readTime: '4 min',
            summary: 'When baby is too wired to sleep \u2014 the cortisol trap and the gentle 48-hour reset.',
            body: `**The cortisol trap:** When a baby stays awake too long, the body releases cortisol and adrenaline. This makes baby appear energetic but it\u2019s a stress response. Cortisol blocks sleep pressure, keeping them awake longer.\n\n**Signs you\u2019re in the spiral:**\n- Fighting every nap despite clear tiredness\n- Short naps only (20-30 minutes, waking crying)\n- Waking frequently at night\n- Seeming \u201cnot tired\u201d at bedtime despite short naps\n\n**The 48-72 hour gentle reset:**\n1. **Shorten ALL wake windows by 15-20 minutes**\n2. **Move bedtime 30-60 minutes earlier**\n3. **Allow rescue naps** \u2014 contact nap, car, stroller. Getting sleep volume up is priority.\n4. **Pitch black room** for all sleep\n5. **Reduce stimulation 15 minutes before every sleep**\n6. **Lots of holding and comfort** \u2014 baby needs to feel safe to let go\n\n**After the reset:** Once naps lengthen and nights improve, gradually extend wake windows \u2014 5 minutes at a time.`,
          },
          { id: 'bedtime-routine-science', title: 'The Science of Bedtime Routines', tag: 'Science', readTime: '4 min', summary: 'Why 20 minutes is ideal and the exact sequence that triggers melatonin.', body: '', locked: true },
          { id: 'sample-schedules', title: 'Sample Schedules by Age (0-18 Months)', tag: 'Quick Ref', readTime: '6 min', summary: 'Hour-by-hour templates from newborn to toddler, adjusted for nap count.', body: '', locked: true },
        ],
      },
      {
        id: 'pantley-nocry',
        title: 'The No-Cry Sleep Approach',
        subtitle: 'Elizabeth Pantley\'s complete gentle sleep toolkit',
        icon: 'feather',
        accentColor: '#8B7EC8',
        cardBg: '#F5F3FB',
        applicableAge: '3-6m',
        articles: [
          { id: 'pantley-logs', title: 'Sleep Logs: Pantley\'s Pattern-Finding Method', tag: 'Methodology', readTime: '4 min', summary: 'Track, analyze, then gently adjust \u2014 the data-driven no-cry approach.', body: '', locked: true },
          { id: 'bedtime-fading-deep', title: 'Bedtime Fading: The Complete Guide', tag: 'Methodology', readTime: '5 min', summary: 'Work with your baby\'s biology to find the natural sleep window, then shift it gently.', body: '', locked: true },
          { id: 'night-wean-gentle', title: 'Gentle Night Weaning (When Ready)', tag: 'Technique', readTime: '5 min', summary: 'Pantley\'s gradual approach to reducing night feeds \u2014 only when baby is developmentally ready.', body: '', locked: true },
          { id: 'nap-transitions', title: 'Nap Transitions Without Tears', tag: 'Quick Ref', readTime: '4 min', summary: 'Dropping naps gently: 4\u21923, 3\u21922, 2\u21921 with bridging strategies.', body: '', locked: true },
        ],
      },
      {
        id: 'sleep-regressions',
        title: 'Navigating Sleep Regressions',
        subtitle: 'They\'re not regressions \u2014 they\'re brain growth spurts',
        icon: 'trending-up',
        accentColor: '#5A7DB3',
        cardBg: '#EEF2FB',
        applicableAge: 'all',
        articles: [
          { id: 'regression-4mo', title: 'The 4-Month Leap: Sleep Architecture Matures', tag: 'Neuroscience', readTime: '5 min', summary: 'The biggest sleep change of the first year \u2014 why it happens and how to support it gently.', body: '', locked: true },
          { id: 'regression-8mo', title: 'The 8-Month Leap: Separation Awareness', tag: 'Neuroscience', readTime: '4 min', summary: 'Object permanence arrives and sleep gets bumpy. Your baby isn\'t manipulating \u2014 they\'re growing.', body: '', locked: true },
          { id: 'regression-12mo', title: 'The 12-Month Leap: Walking & Independence', tag: 'Development', readTime: '4 min', summary: 'When motor milestones keep baby practicing at 2 AM. This too shall pass.', body: '', locked: true },
          { id: 'regression-18mo', title: 'The 18-Month Regression: Autonomy & Boundaries', tag: 'Development', readTime: '4 min', summary: 'The toddler who suddenly fights bedtime \u2014 it\'s independence, not defiance.', body: '', locked: true },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FEEDING
  // ═══════════════════════════════════════════════════════════
  {
    id: 'feeding',
    title: 'Feeding',
    icon: 'droplet',
    accentColor: '#D4874E',
    cards: [
      {
        id: 'breastfeeding-bible',
        title: 'The Breastfeeding Bible',
        subtitle: 'Latching, supply, anatomy, and beyond \u2014 from La Leche League',
        icon: 'heart',
        accentColor: '#D4874E',
        cardBg: '#FDF8F3',
        applicableAge: '0-3m',
        isMaster: true,
        articles: [
          {
            id: 'asymmetric-latch',
            title: 'The Asymmetrical Latch',
            tag: 'Technique',
            readTime: '4 min',
            summary: 'The single most effective latch correction. Why leading with the chin changes everything.',
            body: `**Why symmetrical latching fails:** Most parents are taught to center the nipple in baby\u2019s mouth. This is biomechanically wrong. It positions the nipple against the hard palate (painful) and forces equal jaw pressure on both sides (inefficient).\n\n**The asymmetrical latch, step by step:**\n\n1. **Position:** Hold baby so their nose is level with your nipple (NOT their mouth \u2014 this feels too high but is correct).\n2. **Trigger the gape:** Brush your nipple from baby\u2019s nose down to upper lip. Wait for a WIDE gape.\n3. **Lead with the chin:** In the moment of the wide gape, bring baby to the breast chin-first. The lower jaw should land on the areola first, as far from the nipple as possible.\n4. **Flip the upper lip:** As the chin anchors, the head tilts slightly and the upper lip flanges over the top.\n\n**The result:**\n- More areola below the nipple than above (asymmetric)\n- Baby\u2019s chin buried in the breast, nose free\n- Lower lip flanged out like a fish lip\n- You hear swallowing, not clicking\n- No pain after the first 10-15 seconds\n\n**The motion is like eating a tall sandwich** \u2014 you lead with your lower jaw and tilt it in.`,
          },
          {
            id: 'supply-mechanics',
            title: 'How Milk Supply Actually Works',
            tag: 'Science',
            readTime: '5 min',
            summary: 'Prolactin, FIL, and why "just pump more" is often counterproductive.',
            body: `**The two-hormone system:**\n\n**Prolactin** (manufacturing): Stimulated by nipple stimulation and milk removal. Highest between 1-5 AM \u2014 nighttime feeds disproportionately drive supply.\n\n**FIL (Feedback Inhibitor of Lactation):** A whey protein in breastmilk itself. As milk accumulates, FIL rises and signals cells to slow production. When milk is removed, FIL drops and production resumes.\n\n**What this means practically:**\n1. **Empty breasts make milk faster.** \u201CSaving up\u201d milk backfires.\n2. **Frequency beats duration.** Eight 10-minute feeds > four 20-minute feeds.\n3. **Night feeds are non-negotiable for supply building.**\n4. **Power pumping** (20 on/10 off/10 on/10 off/10 on) for 2-3 days is more effective than constant pumping.\n5. **The first 14 days are irreplaceable.** Prolactin receptor density is determined in this period.`,
          },
          {
            id: 'jaw-alignment',
            title: 'Jaw Alignment & Recessed Chin',
            tag: 'Anatomy',
            readTime: '5 min',
            summary: 'A slightly recessed lower jaw makes standard latching mechanically impossible. How to identify and adapt.',
            body: `**The overlooked anatomy:** Up to 15% of newborns have some degree of mandibular retrognathia \u2014 a lower jaw that sits slightly further back than typical. This is completely normal and usually self-corrects by 6-12 months.\n\n**Why it matters mechanically:**\nA proper latch requires the lower jaw to compress the areola from underneath. When the chin is recessed, the baby compensates by:\n- Clamping with gums (causing nipple damage)\n- Sliding off the breast repeatedly\n- Making a clicking sound during feeds\n- Feeding for very long periods with poor transfer\n\n**How to check:**\n1. Look at baby\u2019s profile from the side. The lower lip should be roughly aligned with the upper.\n2. Place your pinky (nail down) in baby\u2019s mouth. A recessed jaw baby will have weak suction.\n\n**Adapted technique:**\n- Use cross-cradle hold for maximum jaw control\n- Support baby\u2019s chin with the web of your hand, gently pressing the jaw forward\n- Aim nipple toward the roof of baby\u2019s mouth\n- Consider laid-back/biological nurturing position \u2014 gravity assists jaw positioning`,
          },
          {
            id: 'tongue-lip-tie',
            title: 'Tongue & Lip Tie: Real vs. Overdiagnosed',
            tag: 'Diagnostics',
            readTime: '6 min',
            summary: 'Frenotomy rates increased 800% in a decade. Learn what actually requires intervention.',
            body: `**A visible frenulum is NOT the same as a functional tongue-tie.** Assess function, not anatomy:\n\n1. **Can the tongue elevate?** When baby cries, the tip should lift to at least midline.\n2. **Can the tongue extend?** It should extend over the lower gum and past the lower lip.\n3. **Can the tongue lateralize?** Move your finger side to side along the lower gum.\n4. **Cupping ability?** The tongue should form a groove to hold the nipple.\n\n**Signs that suggest functional tie:**\n- Persistent nipple pain despite correct positioning\n- Nipple comes out creased, flattened, or lipstick-shaped\n- Baby cannot maintain latch for more than a few sucks\n- Poor weight gain despite adequate frequency\n\n**Signs that do NOT indicate functional tie:**\n- A visible frenulum (almost all babies have one)\n- Fussiness at the breast (dozens of other causes)\n- Gas or reflux (not causally related)\n\n**Before agreeing to frenotomy:** Get a functional assessment from an IBCLC, not just a visual exam. Try position optimization and jaw support first.`,
          },
          { id: 'painful-letdown', title: 'Painful Letdown & Vasospasm', tag: 'Troubleshooting', readTime: '4 min', summary: 'Sharp, burning pain that isn\'t latch-related. The vascular cause most providers miss.', body: '', locked: true },
          { id: 'cluster-feeding', title: 'Cluster Feeding Survival Guide', tag: 'Quick Ref', readTime: '3 min', summary: 'Why evenings are relentless at 3 and 6 weeks \u2014 and when to worry.', body: '', locked: true },
          { id: 'mastitis', title: 'Mastitis: Prevention & Recovery', tag: 'Safety', readTime: '5 min', summary: 'The 48-hour protocol that prevents antibiotics in most cases.', body: '', locked: true },
        ],
      },
      {
        id: 'pumping-strategies',
        title: 'Pumping Strategies & Stash Building',
        subtitle: 'Flange sizing, schedules, and storage that actually work',
        icon: 'battery-charging',
        accentColor: '#B87A3D',
        cardBg: '#FDF5ED',
        applicableAge: '0-3m',
        articles: [
          { id: 'pumping-schedule', title: 'Exclusive Pumping Masterclass', tag: 'Methodology', readTime: '7 min', summary: 'The schedule, flange sizing, and storage rules that sustain supply long-term.', body: '', locked: true },
          { id: 'flange-fit', title: 'Flange Sizing: Why It Matters', tag: 'Technique', readTime: '3 min', summary: 'Wrong flange size = pain, poor output, and supply damage. How to measure correctly.', body: '', locked: true },
          { id: 'milk-storage', title: 'Milk Storage: The Complete Guide', tag: 'Safety', readTime: '3 min', summary: 'Room temp, fridge, freezer \u2014 exact time limits and the "rule of 4s."', body: '', locked: true },
          { id: 'stash-building', title: 'Building a Freezer Stash (Without Obsessing)', tag: 'Methodology', readTime: '4 min', summary: 'How much you actually need, when to start, and why less is more.', body: '', locked: true },
        ],
      },
      {
        id: 'gentle-weaning',
        title: 'Gentle Weaning',
        subtitle: 'No-cry transitions from breast or bottle, at baby\'s pace',
        icon: 'sunset',
        accentColor: '#C49A6B',
        cardBg: '#FBF6EF',
        applicableAge: '6-12m',
        articles: [
          { id: 'weaning-readiness', title: 'Weaning Readiness Signs', tag: 'Development', readTime: '3 min', summary: 'How to know when baby is ready \u2014 not when society says they "should" be.', body: '', locked: true },
          { id: 'weaning-gradual', title: 'The Gradual Drop Method', tag: 'Technique', readTime: '4 min', summary: 'Drop one feed at a time, 3-day spacing, replacing with comfort \u2014 not just food.', body: '', locked: true },
          { id: 'night-wean-pantley', title: 'Night Weaning the Pantley Way', tag: 'Methodology', readTime: '5 min', summary: 'Pantley\'s gentle night-weaning approach that honors the attachment bond.', body: '', locked: true },
          { id: 'bottle-transition', title: 'Bottle to Cup Transition', tag: 'Quick Ref', readTime: '3 min', summary: 'Open cup, straw cup, weighted straw \u2014 which to introduce when and how.', body: '', locked: true },
        ],
      },
      {
        id: 'starting-solids',
        title: 'Starting Solids',
        subtitle: 'When, what, and how to introduce food safely',
        icon: 'coffee',
        accentColor: '#7A9B6B',
        cardBg: '#F3F7F0',
        applicableAge: '6-12m',
        articles: [
          { id: 'solids-readiness', title: 'The 6 Signs of Readiness', tag: 'Development', readTime: '3 min', summary: 'Sitting up, tongue thrust reflex gone, interest in food \u2014 the full checklist before starting.', body: '', locked: true },
          { id: 'blw-vs-puree', title: 'BLW vs. Purees: A Balanced View', tag: 'Nutrition', readTime: '5 min', summary: 'The evidence for both approaches, and why most families end up doing a mix.', body: '', locked: true },
          { id: 'allergen-intro', title: 'Early Allergen Introduction Protocol', tag: 'Safety', readTime: '6 min', summary: 'The LEAP study protocol: peanut, egg, and milk before 12 months reduces allergy risk.', body: '', locked: true },
          { id: 'choking-vs-gagging', title: 'Gagging vs. Choking: Know the Difference', tag: 'Safety', readTime: '4 min', summary: 'Gagging is learning. Choking is silent. The visual cues every parent must recognize.', body: '', locked: true },
          { id: 'first-foods', title: 'First Foods: A Week-by-Week Plan', tag: 'Nutrition', readTime: '5 min', summary: 'Iron-rich foods first, then variety \u2014 a gentle, no-pressure introduction schedule.', body: '', locked: true },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // HEALTH & CARE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'health',
    title: 'Health & Care',
    icon: 'shield',
    accentColor: '#C4696B',
    cards: [
      {
        id: 'fever-redflag',
        title: 'Fever & Red Flags',
        subtitle: 'When to worry and when to call \u2014 from Heidi Murkoff',
        icon: 'alert-triangle',
        accentColor: '#C4696B',
        cardBg: '#FBF5F5',
        applicableAge: 'all',
        isHighlighted: true,
        articles: [
          {
            id: 'fever-decision',
            title: 'The Fever Decision Tree',
            tag: 'Safety',
            readTime: '4 min',
            summary: 'Age-specific thresholds that ER doctors use. Under 28 days, the rules are completely different.',
            body: `**Under 28 days old + rectal temp >= 38.0\u00B0C (100.4\u00B0F):**\nThis is a medical emergency. Go to the ER immediately. At this age, the immune system cannot localize infections.\n\n**28-90 days old + temp >= 38.0\u00B0C:**\nCall your pediatrician immediately (even at 2 AM).\n\n**3-6 months + temp >= 38.3\u00B0C (101\u00B0F):**\nCall pediatrician during office hours. ER if: fever + lethargy, fever + not feeding for 8+ hours, fever + non-blanching rash.\n\n**6-24 months + temp >= 39.0\u00B0C (102.2\u00B0F):**\nFocus on behavior, not the number. A baby with 39.5\u00B0C who is playing is safer than one with 38.5\u00B0C who is limp.\n\n**What doctors actually worry about:**\n- Duration: fever > 5 days warrants investigation\n- Pattern: fever that returns after 24+ hours suggests a new infection\n- Associated: stiff neck, bulging fontanelle, high-pitched crying, non-blanching rash`,
          },
          {
            id: 'dehydration',
            title: 'Dehydration: The Diaper Count',
            tag: 'Diagnostics',
            readTime: '3 min',
            summary: 'Wet diaper counts are the most reliable home hydration indicator.',
            body: `**Expected minimums (seek help if below):**\n- Day 1: 1 wet diaper\n- Day 2: 2 wet diapers\n- Day 3: 3 wet diapers\n- Day 4: 4 wet diapers\n- Day 5+: 6 or more per 24 hours\n\n**How to gauge \u201cwet enough\u201d:**\nPour 3 tablespoons (45ml) of water into a clean diaper. That weight is your reference.\n\n**Go to ER:**\n- No wet diaper for 6+ hours (under 6 months)\n- No wet diaper for 8+ hours (over 6 months)\n- Dark amber/orange urine\n- Dry mouth, no tears when crying, sunken eyes\n- Sunken fontanelle\n- Too tired to cry or feed`,
          },
          {
            id: 'jaundice',
            title: 'Jaundice: When Yellow Means Danger',
            tag: 'Diagnostics',
            readTime: '4 min',
            summary: '60% of newborns get jaundice. Most cases are harmless. Here\'s how to tell the difference.',
            body: `**Physiological jaundice (normal):**\n- Appears after 24 hours of life (usually day 2-3)\n- Progresses top-down: face \u2192 chest \u2192 abdomen\n- Peaks at day 3-5 (term) or day 5-7 (preterm)\n- Baby is feeding well and active\n- Resolves by 2 weeks\n\n**Pathological jaundice (urgent):**\n- Appears within the first 24 hours \u2014 this is NEVER normal\n- Reaches palms and soles (very high levels)\n- Baby is excessively sleepy, feeding poorly\n- Dark urine or pale/chalky stools\n\n**The blanch test:** Press your finger on baby\u2019s forehead for 2 seconds, release. If the blanched area appears yellow, jaundice is present.\n\n**Progression guide:**\n- Face only: ~5 mg/dL (usually safe)\n- Face + chest: ~10 mg/dL (monitor)\n- Face + chest + abdomen: ~12 mg/dL (needs blood test)\n- Arms/legs: ~15 mg/dL (likely needs treatment)\n- Palms/soles: ~20 mg/dL (urgent)`,
          },
          { id: 'rash-guide', title: 'The Rash Identification Guide', tag: 'Diagnostics', readTime: '6 min', summary: 'Eczema vs. hives vs. viral rash vs. fungal \u2014 a decision tree.', body: '', locked: true },
          { id: 'reflux-gerd', title: 'Reflux vs. GERD: When Spit-Up Needs Treatment', tag: 'Diagnostics', readTime: '5 min', summary: 'Happy spitters vs. suffering babies \u2014 the weight gain threshold.', body: '', locked: true },
          { id: 'first-aid', title: 'Infant First Aid: Choking & CPR', tag: 'Safety', readTime: '5 min', summary: 'Step-by-step back blows and chest thrusts \u2014 memorize before solids.', body: '', locked: true },
        ],
      },
      {
        id: 'diaper-decoding',
        title: 'Diaper Decoding',
        subtitle: 'What colors, consistency, and frequency actually mean',
        icon: 'clipboard',
        accentColor: '#8A7A60',
        cardBg: '#F7F4EE',
        applicableAge: '0-3m',
        articles: [
          { id: 'diaper-colors', title: 'Stool Color Guide by Age', tag: 'Quick Ref', readTime: '3 min', summary: 'Black meconium to seedy yellow \u2014 the full progression and when white/red/black means ER.', body: '', locked: true },
          { id: 'diaper-frequency', title: 'How Many Diapers Per Day?', tag: 'Quick Ref', readTime: '2 min', summary: 'Age-based expectations and when infrequency signals a problem.', body: '', locked: true },
          { id: 'diaper-rash', title: 'Diaper Rash: Types & Treatment', tag: 'Diagnostics', readTime: '4 min', summary: 'Contact vs. yeast vs. bacterial \u2014 different rashes need different treatments.', body: '', locked: true },
        ],
      },
      {
        id: 'skin-eczema',
        title: 'Baby Skin & Eczema Care',
        subtitle: 'The complete guide to your baby\'s most common skin concerns',
        icon: 'droplet',
        accentColor: '#9B8A7A',
        cardBg: '#F5F2ED',
        applicableAge: 'all',
        articles: [
          { id: 'eczema-basics', title: 'Eczema 101: The Barrier Is Broken', tag: 'Science', readTime: '5 min', summary: 'Why eczema happens, what triggers flares, and the "soak and seal" approach that dermatologists recommend.', body: '', locked: true },
          { id: 'bath-routine', title: 'The Optimal Baby Bath Routine', tag: 'Technique', readTime: '3 min', summary: 'Lukewarm, 5-10 minutes, fragrance-free \u2014 the dermatologist-approved approach.', body: '', locked: true },
          { id: 'cradle-cap', title: 'Cradle Cap: Harmless but Annoying', tag: 'Quick Ref', readTime: '2 min', summary: 'Oil, gentle brush, patience. When it\'s actually something else.', body: '', locked: true },
          { id: 'sun-protection', title: 'Sun Protection for Babies', tag: 'Safety', readTime: '3 min', summary: 'Under 6 months: shade and clothing only. Over 6 months: mineral sunscreen rules.', body: '', locked: true },
        ],
      },
    ],
  },
];

// ── Flat lookup for topic hub screen ─────────────────────

function getAllCards(): LibraryCard[] {
  return LIBRARY_CATEGORIES.flatMap((cat) => cat.cards);
}

/** Backward-compatible flat array of all cards (used by topic hub) */
export const DISCOVERY_NODES: DiscoveryNode[] = getAllCards().map((card) => ({
  ...card,
  iconBg: card.cardBg,
  badge: '',
}));

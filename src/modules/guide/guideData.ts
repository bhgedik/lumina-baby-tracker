// ============================================================
// Lumina — Guide Data
// Shared data & types for the Guide feature
// ============================================================

export interface GuideArticle {
  id: string;
  title: string;
  summary: string;
  tag: string;
  readTime: string;
  body: string;
  locked?: boolean;
}

export interface DiscoveryNode {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  accentColor: string;
  badge: string;
  cardBg: string;
  articles: GuideArticle[];
}

export const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Troubleshooting: { bg: '#FCE8E8', text: '#B54C4C' },
  Methodology: { bg: '#EEF0F7', text: '#5A6A9E' },
  Anatomy: { bg: '#FDF2E9', text: '#B87A3D' },
  Technique: { bg: '#EDF3EE', text: '#4A7A5E' },
  Safety: { bg: '#F9EDED', text: '#A85050' },
  Diagnostics: { bg: '#FEF3E2', text: '#9A7030' },
  'Quick Ref': { bg: '#F0EDE8', text: '#7A7060' },
  Science: { bg: '#EEF0F7', text: '#5A6A9E' },
};

export const DISCOVERY_NODES: DiscoveryNode[] = [
  {
    id: 'sleep',
    title: 'The Sleep Spectrum',
    subtitle: 'Every method, objectively explained',
    icon: '\u{1F319}',
    iconBg: '#EEF0F7',
    accentColor: '#6B7DB3',
    badge: '\u{2B50}',
    cardBg: '#F4F5FB',
    articles: [
      {
        id: 'ferber',
        title: 'Graduated Extinction (Ferber)',
        tag: 'Methodology',
        readTime: '6 min',
        summary: 'Timed check-ins at increasing intervals. The most studied method with robust evidence for babies 4+ months.',
        body: `**Core logic:** You place baby down drowsy but awake and leave the room. When crying starts, you wait a set interval (e.g., 3 minutes) before returning for a brief, boring check-in \u2014 no picking up. You then leave and extend the next interval (5 min, then 10 min). Each subsequent night, the starting interval increases.\n\n**Why it works:** The intervals give baby repeated opportunities to practice self-soothing while knowing you haven\u2019t disappeared. Most babies show dramatic improvement by night 3-4, with full self-settling by day 5-7.\n\n**Typical schedule:**\nNight 1: 3 min \u2192 5 min \u2192 10 min (then 10 min repeating)\nNight 2: 5 min \u2192 10 min \u2192 12 min\nNight 3: 10 min \u2192 12 min \u2192 15 min\n\n**Key nuances clinicians know:**\n- The second night is almost always the hardest (called the \u201cextinction burst\u201d) \u2014 crying often peaks before it drops dramatically on night 3.\n- Check-ins should be under 30 seconds. Do NOT pick up, rock, or feed. Brief verbal reassurance only (\u201cI love you, goodnight\u201d).\n- If baby is standing in the crib, lay them down once but do not make it a game.\n- Works best between 4-8 months. After 12 months, toddlers can escalate (vomiting, climbing) which requires modifications.\n\n**Not recommended if:** Baby is under 4 months, has reflux that worsens lying flat, or parents cannot commit to consistency for at least 5 nights.`,
      },
      {
        id: 'chair',
        title: 'The Chair Method (Sleep Lady Shuffle)',
        tag: 'Methodology',
        readTime: '5 min',
        summary: 'Stay in the room but gradually move further away over 2 weeks. Lower crying, slower results.',
        body: `**Core logic:** Place baby down awake. Sit in a chair right next to the crib. You can offer verbal comfort (\u201cShh, you\u2019re okay\u201d) and brief pats, but do NOT pick up. Every 3 nights, move the chair further away \u2014 beside the crib, then halfway to the door, then at the door, then outside the door.\n\n**Why it works:** Baby learns to fall asleep without being held, but your physical presence prevents the intense distress of extinction methods. The gradual withdrawal trains independence incrementally.\n\n**Timeline:**\nNights 1-3: Chair touching the crib\nNights 4-6: Chair 3 feet from crib\nNights 7-9: Chair at the doorway\nNights 10-12: Chair in the hallway (door open)\nNight 13+: Chair removed\n\n**Clinical reality:**\n- This method takes 2-3x longer than Ferber but involves significantly less intense crying.\n- The hardest part is NOT picking up when baby cries with you right there. Many parents break and restart, which extends the timeline.\n- Works well for anxious parents or high-sensitivity babies.\n- Not ideal for babies who escalate MORE with a parent visible but not responding.\n\n**Best for:** Parents who cannot tolerate leaving the room, babies with separation anxiety, or after failed attempts at extinction methods.`,
      },
      {
        id: 'pupd',
        title: 'Pick Up / Put Down (PUPD)',
        tag: 'Methodology',
        readTime: '5 min',
        summary: 'Maximum physical comfort \u2014 pick baby up until calm, then put down. Gentle but exhausting.',
        body: `**Core logic:** When baby cries, you immediately pick them up and comfort them until calm (not asleep). The moment they stop crying, put them back down. If they cry again, pick up again. Repeat until they fall asleep in the crib.\n\n**What actually happens:**\n- Night 1: You may pick up and put down 50-100+ times. This is normal.\n- Night 3-4: Pick-ups typically drop to 20-30.\n- Night 7-10: Most babies settle with 5-10 or fewer.\n- Full resolution: 10-14 days.\n\n**Critical technique details:**\n- Pick up ONLY until calm, not drowsy. The second crying stops, baby goes back down.\n- Do not rock, bounce, or feed during pick-ups. Hold upright against your shoulder.\n- If baby arches or fights the pick-up, put them down immediately.\n- Extremely physically demanding. Have a partner rotate if possible.\n\n**Not recommended for:** Babies over 8 months (they turn pick-up into a game), parents with back problems, or single parents without support.`,
      },
      {
        id: 'fading',
        title: 'Bedtime Fading (No-Cry)',
        tag: 'Methodology',
        readTime: '4 min',
        summary: 'Shift bedtime later until baby falls asleep instantly, then gradually move it earlier. Zero crying.',
        body: `**Core logic:** Instead of fighting baby at an arbitrary bedtime, you find their natural sleep onset time and make THAT the temporary bedtime. Once baby falls asleep within 15 minutes consistently, you shift bedtime 15 minutes earlier every 2-3 days.\n\n**Example timeline:**\n- Baby currently fights sleep until 9:30 PM despite 7 PM bedtime.\n- New temporary bedtime: 9:30 PM. Baby falls asleep in minutes.\n- After 3 days: shift to 9:15 PM.\n- Continue until you reach target bedtime (e.g., 7:00 PM).\n\n**Trade-offs:**\n- Zero crying \u2014 truly the gentlest method.\n- Very slow: reaching the target bedtime can take 4-6 weeks.\n- Requires extreme parental consistency with timing.\n\n**Best for:** Parents opposed to any crying, very young babies (under 4 months), or as a first step before trying more structured methods.`,
      },
      {
        id: 'sleep-when',
        title: 'Choosing the Right Method for You',
        tag: 'Quick Ref',
        readTime: '3 min',
        summary: 'A decision framework based on temperament, tolerance, and timeline.',
        body: `**There is no universally \u201cbest\u201d method.** The right choice depends on three factors:\n\n**1. Baby\u2019s temperament:**\n- High-intensity crier, escalates quickly \u2192 Chair Method or PUPD\n- Easily distracted by parent presence \u2192 Ferber\n- Under 4 months \u2192 Fading only\n\n**2. Your emotional tolerance:**\n- Cannot hear any crying \u2192 Bedtime Fading\n- Can handle some crying with reassurance \u2192 Chair Method\n- Can commit to structured intervals \u2192 Ferber\n- Want to respond to every cry \u2192 PUPD\n\n**3. Your timeline:**\n- Need results in 3-5 days \u2192 Ferber\n- Can commit to 2 weeks \u2192 Chair Method or PUPD\n- Willing to invest 4-6 weeks \u2192 Bedtime Fading\n\n**Critical truth:** ANY method works if applied consistently. The #1 cause of failure is inconsistency \u2014 doing Ferber for 2 nights, switching to PUPD, then co-sleeping out of exhaustion. Pick one method, commit for the full recommended duration.`,
      },
      // ── Locked premium content ──
      { id: 'sleep-regression', title: 'The 4-Month Sleep Regression', tag: 'Troubleshooting', readTime: '5 min', summary: 'Why it happens, when it ends, and the one mistake that makes it permanent.', body: '', locked: true },
      { id: 'daycare-naps', title: 'Daycare Nap Transition', tag: 'Methodology', readTime: '4 min', summary: 'How to maintain sleep training gains when daycare has different rules.', body: '', locked: true },
      { id: 'teething-sleep', title: 'Teething vs. Sleep Training', tag: 'Troubleshooting', readTime: '4 min', summary: 'When to pause training, when to push through, and how to tell the difference.', body: '', locked: true },
      { id: 'early-waking', title: 'Solving 5 AM Wake-Ups', tag: 'Troubleshooting', readTime: '5 min', summary: 'The counterintuitive fix: why a later bedtime often makes it worse.', body: '', locked: true },
      { id: 'nap-transition', title: 'The 3-to-2 and 2-to-1 Nap Transitions', tag: 'Quick Ref', readTime: '6 min', summary: 'Exact age windows, signs of readiness, and the 2-week bridging schedule.', body: '', locked: true },
      { id: 'cosleep-exit', title: 'Safely Exiting Co-Sleeping', tag: 'Methodology', readTime: '5 min', summary: 'A 10-night graduated plan that works without extinction crying.', body: '', locked: true },
      { id: 'travel-sleep', title: 'Sleep Training & Travel', tag: 'Quick Ref', readTime: '3 min', summary: 'Hotel rooms, jet lag, and grandparent visits without losing progress.', body: '', locked: true },
      { id: 'twins-sleep', title: 'Sleep Training Twins', tag: 'Methodology', readTime: '6 min', summary: 'Same room, different schedules: the staggered approach that actually works.', body: '', locked: true },
      { id: 'night-feeds-drop', title: 'Dropping Night Feeds by Age', tag: 'Quick Ref', readTime: '4 min', summary: 'Clinical thresholds for when night feeds are hunger vs. habit.', body: '', locked: true },
      { id: 'sleep-environment', title: 'The Perfect Sleep Environment', tag: 'Science', readTime: '4 min', summary: 'Light, sound, temperature, and humidity — the evidence-based setup.', body: '', locked: true },
    ],
  },
  {
    id: 'breastfeeding',
    title: 'Breastfeeding Diagnostics',
    subtitle: 'The anatomy most guides skip',
    icon: '\u{1F931}',
    iconBg: '#FDF2E9',
    accentColor: '#D4874E',
    badge: '\u{1F4A7}',
    cardBg: '#FDF8F3',
    articles: [
      {
        id: 'jaw-alignment',
        title: 'Jaw Alignment & Recessed Chin',
        tag: 'Anatomy',
        readTime: '5 min',
        summary: 'A slightly recessed lower jaw makes standard latching mechanically impossible. How to identify it and adapt.',
        body: `**The overlooked anatomy:** Up to 15% of newborns have some degree of mandibular retrognathia \u2014 a lower jaw that sits slightly further back than typical. This is completely normal and usually self-corrects by 6-12 months. But it makes breastfeeding dramatically harder.\n\n**Why it matters mechanically:**\nA proper latch requires the baby\u2019s lower jaw to drop down and compress the areola from underneath. When the chin is recessed, the lower jaw cannot reach far enough forward. The baby compensates by:\n- Clamping with gums (causing nipple damage)\n- Sliding off the breast repeatedly\n- Making a clicking sound during feeds\n- Feeding for very long periods with poor transfer\n\n**How to check:**\n1. Look at baby\u2019s profile from the side. The lower lip should be roughly aligned with the upper lip.\n2. If the chin slopes backward, retrognathia is likely.\n3. Place your pinky (nail down) in baby\u2019s mouth. A recessed jaw baby will have weak suction.\n\n**Adapted technique:**\n- Use cross-cradle hold exclusively for maximum jaw control.\n- Support baby\u2019s chin with the web of your hand, gently pressing the jaw forward during latch.\n- Aim nipple toward the roof of baby\u2019s mouth rather than straight in.\n- Consider laid-back/biological nurturing position \u2014 gravity assists jaw positioning.`,
      },
      {
        id: 'tongue-lip-tie',
        title: 'Tongue & Lip Tie: Real vs. Overdiagnosed',
        tag: 'Diagnostics',
        readTime: '6 min',
        summary: 'Frenotomy rates increased 800% in a decade. Learn what actually requires intervention.',
        body: `**The epidemic of overdiagnosis:** A visible frenulum is NOT the same as a functional tongue-tie. Assess function, not anatomy:\n\n1. **Can the tongue elevate?** When baby cries, the tip should lift to at least midline. If it stays flat or dips in a heart shape, function is restricted.\n2. **Can the tongue extend?** It should extend over the lower gum and past the lower lip.\n3. **Can the tongue lateralize?** Move your finger side to side along the lower gum. The tongue should follow.\n4. **Cupping ability?** The tongue should form a groove to hold the nipple. A tied tongue stays flat.\n\n**Signs that suggest functional tie:**\n- Persistent nipple pain despite correct positioning\n- Nipple comes out creased, flattened, or lipstick-shaped\n- Baby cannot maintain latch for more than a few sucks\n- Audible clicking during feeds\n- Poor weight gain despite adequate frequency\n\n**Signs that do NOT indicate functional tie:**\n- A visible frenulum (almost all babies have one)\n- Fussiness at the breast (dozens of other causes)\n- Gas or reflux (not causally related)\n\n**Before agreeing to frenotomy:**\n1. Get a functional assessment from an IBCLC, not just a visual exam.\n2. Try position optimization and jaw support first.\n3. If recommended, ensure the provider addresses compensatory muscle tension too.`,
      },
      {
        id: 'asymmetric-latch',
        title: 'The Asymmetrical Latch',
        tag: 'Technique',
        readTime: '4 min',
        summary: 'The single most effective latch correction. Why leading with the chin changes everything.',
        body: `**Why symmetrical latching fails:** Most parents are taught to center the nipple in baby\u2019s mouth. This is biomechanically wrong. It positions the nipple against the hard palate (painful) and forces equal jaw pressure on both sides (inefficient).\n\n**The asymmetrical latch, step by step:**\n\n1. **Position:** Hold baby so their nose is level with your nipple (NOT their mouth \u2014 this feels too high but is correct).\n2. **Trigger the gape:** Brush your nipple from baby\u2019s nose down to upper lip. Wait for a WIDE gape.\n3. **Lead with the chin:** In the moment of the wide gape, bring baby to the breast chin-first. The lower jaw should land on the areola first, as far from the nipple as possible.\n4. **Flip the upper lip:** As the chin anchors, the head tilts slightly and the upper lip flanges over the top.\n\n**The result:**\n- More areola below the nipple than above (asymmetric)\n- Baby\u2019s chin buried in the breast, nose free\n- Lower lip flanged out like a fish lip\n- You hear swallowing, not clicking\n- No pain after the first 10-15 seconds\n\n**The motion is like eating a tall sandwich** \u2014 you lead with your lower jaw and tilt it in. Baby does the same.`,
      },
      {
        id: 'supply-mechanics',
        title: 'How Milk Supply Actually Works',
        tag: 'Science',
        readTime: '5 min',
        summary: 'Prolactin, FIL, and why "just pump more" is often counterproductive.',
        body: `**The two-hormone system:**\n\n**Prolactin** (manufacturing): Stimulated by nipple stimulation and milk removal. Highest between 1-5 AM \u2014 nighttime feeds disproportionately drive supply. Prolactin receptor sites are established in the first 2 weeks postpartum.\n\n**FIL (Feedback Inhibitor of Lactation):** A whey protein in breastmilk itself. As milk accumulates, FIL rises and signals cells to slow production. When milk is removed, FIL drops and production resumes. Each breast regulates independently.\n\n**What this means practically:**\n\n1. **Empty breasts make milk faster.** \u201CSaving up\u201d milk backfires \u2014 you\u2019re slowing production rate.\n2. **Frequency beats duration.** Eight 10-minute feeds > four 20-minute feeds for prolactin stimulation.\n3. **Night feeds are non-negotiable for supply building.** Dropping night feeds before 8-12 weeks often triggers a supply dip.\n4. **\u201CJust pump more\u201d pitfalls:** Pumping after every feed when supply is adequate can cause oversupply \u2192 engorgement \u2192 mastitis. Power pumping (20 on/10 off/10 on/10 off/10 on) for 2-3 days is more effective.\n5. **The first 14 days are irreplaceable.** Prolactin receptor density is determined in this period. If supplementation is medically necessary, always pump during that feed.`,
      },
      {
        id: 'painful-letdown',
        title: 'Painful Letdown & Vasospasm',
        tag: 'Troubleshooting',
        readTime: '4 min',
        summary: 'Sharp, burning pain that isn\'t latch-related. The vascular cause most providers miss.',
        body: `**Nipple vasospasm** is one of the most underdiagnosed causes of breastfeeding pain. Frequently misdiagnosed as thrush.\n\n**What it looks like:**\n- After unlatching, nipple turns white \u2192 blue/purple \u2192 red\n- Sharp, burning, throbbing pain during color changes\n- Worsens with cold exposure\n- Often described as \u201cglass in the nipple\u201d\n- Worst AFTER the feed ends\n\n**The mechanism:** Small blood vessels in the nipple spasm, cutting off blood flow (white phase). Deoxygenated blood pools (blue). Vessels relax and blood rushes back (red, with throbbing). Identical to Raynaud\u2019s phenomenon.\n\n**What actually helps:**\n1. **Warmth immediately after unlatching** \u2014 press a warm cloth against the nipple before it\u2019s exposed to air.\n2. **Olive oil or coconut oil** between feeds prevents evaporative cooling.\n3. **Magnesium** (300-400mg/day) \u2014 relaxes vessel wall smooth muscle. Takes 1-2 weeks.\n4. **Eliminate caffeine** for 2 weeks as a diagnostic trial.\n5. **Nifedipine** (prescription) \u2014 calcium channel blocker that prevents spasm. Safe during breastfeeding.\n\n**When it\u2019s NOT vasospasm:** If pain occurs primarily during the feed (not after) with no color changes, the issue is latch mechanics, tongue-tie, or bacterial infection.`,
      },
      // ── Locked premium content ──
      { id: 'mastitis', title: 'Mastitis: Prevention & Recovery', tag: 'Safety', readTime: '5 min', summary: 'The 48-hour protocol that prevents antibiotics in most cases.', body: '', locked: true },
      { id: 'pumping-schedule', title: 'Exclusive Pumping Masterclass', tag: 'Methodology', readTime: '7 min', summary: 'The schedule, flange sizing, and storage rules that sustain supply long-term.', body: '', locked: true },
      { id: 'weaning', title: 'Gradual Weaning Without Engorgement', tag: 'Technique', readTime: '4 min', summary: 'Drop one feed at a time: the 3-day spacing rule and cabbage leaf method.', body: '', locked: true },
      { id: 'nursing-strike', title: 'Nursing Strikes vs. Self-Weaning', tag: 'Diagnostics', readTime: '4 min', summary: 'Under 12 months it is almost never self-weaning. How to get back on track.', body: '', locked: true },
      { id: 'cluster-feeding', title: 'Cluster Feeding Survival Guide', tag: 'Quick Ref', readTime: '3 min', summary: 'Why evenings are relentless at 3 and 6 weeks — and when to worry.', body: '', locked: true },
      { id: 'bottle-refusal', title: 'Bottle Refusal in Breastfed Babies', tag: 'Troubleshooting', readTime: '5 min', summary: 'The paced feeding technique and the 5 bottles worth trying.', body: '', locked: true },
      { id: 'combo-feeding', title: 'Combination Feeding Without Losing Supply', tag: 'Methodology', readTime: '5 min', summary: 'Strategic supplementation that protects prolactin receptors.', body: '', locked: true },
      { id: 'medication-bf', title: 'Medications Safe During Breastfeeding', tag: 'Safety', readTime: '4 min', summary: 'LactMed database guide — what your pharmacist often gets wrong.', body: '', locked: true },
    ],
  },
  {
    id: 'health',
    title: 'When to Worry',
    subtitle: 'Clinical decision frameworks',
    icon: '\u{1FA7A}',
    iconBg: '#F9EDED',
    accentColor: '#C4696B',
    badge: '\u{1F6E1}\u{FE0F}',
    cardBg: '#FBF5F5',
    articles: [
      {
        id: 'fever-decision',
        title: 'The Fever Decision Tree',
        tag: 'Safety',
        readTime: '4 min',
        summary: 'Age-specific thresholds that ER doctors use. Under 28 days, the rules are completely different.',
        body: `**Under 28 days old + rectal temp >= 38.0\u00B0C (100.4\u00B0F):**\nThis is a medical emergency. Go to the ER immediately. At this age, the immune system cannot localize infections. A \u201csimple fever\u201d can be meningitis, UTI, or bacteremia.\n\n**28-90 days old + temp >= 38.0\u00B0C:**\nCall your pediatrician immediately (even at 2 AM). Most will want to see baby within hours.\n\n**3-6 months + temp >= 38.3\u00B0C (101\u00B0F):**\nCall pediatrician during office hours. ER if: fever + lethargy, fever + not feeding for 8+ hours, fever + non-blanching rash.\n\n**6-24 months + temp >= 39.0\u00B0C (102.2\u00B0F):**\nFocus on behavior, not the number. A baby with 39.5\u00B0C who is playing is safer than one with 38.5\u00B0C who is limp.\n\n**What doctors actually worry about:**\n- Duration: fever > 5 days warrants investigation\n- Pattern: fever that returns after 24+ hours suggests a new infection\n- Associated: stiff neck, bulging fontanelle, high-pitched crying, non-blanching rash`,
      },
      {
        id: 'dehydration',
        title: 'Dehydration: The Diaper Count',
        tag: 'Diagnostics',
        readTime: '3 min',
        summary: 'Wet diaper counts are the most reliable home hydration indicator. Exact thresholds by age.',
        body: `**Expected minimums (seek help if below):**\n- Day 1: 1 wet diaper\n- Day 2: 2 wet diapers\n- Day 3: 3 wet diapers\n- Day 4: 4 wet diapers\n- Day 5+: 6 or more per 24 hours\n\n**How to gauge \u201cwet enough\u201d:**\nPour 3 tablespoons (45ml) of water into a clean diaper. That weight is your reference.\n\n**Go to ER:**\n- No wet diaper for 6+ hours (under 6 months)\n- No wet diaper for 8+ hours (over 6 months)\n- Dark amber/orange urine\n- Dry mouth, no tears when crying, sunken eyes\n- Sunken fontanelle\n- Too tired to cry or feed\n\n**Context:** Babies lose up to 7-10% of birth weight in the first 3-5 days. This is normal. But loss beyond 10%, or failure to regain birth weight by day 14 combined with low diaper counts, needs immediate evaluation.`,
      },
      {
        id: 'jaundice',
        title: 'Jaundice: When Yellow Means Danger',
        tag: 'Diagnostics',
        readTime: '4 min',
        summary: '60% of newborns get jaundice. Most cases are harmless. Here\'s how to tell the difference.',
        body: `**Physiological jaundice (normal):**\n- Appears after 24 hours of life (usually day 2-3)\n- Progresses top-down: face \u2192 chest \u2192 abdomen\n- Peaks at day 3-5 (term) or day 5-7 (preterm)\n- Baby is feeding well and active\n- Resolves by 2 weeks\n\n**Pathological jaundice (urgent):**\n- Appears within the first 24 hours \u2014 this is NEVER normal\n- Reaches palms and soles (very high levels)\n- Baby is excessively sleepy, feeding poorly\n- Dark urine or pale/chalky stools\n\n**The blanch test:** Press your finger on baby\u2019s forehead for 2 seconds, release. If the blanched area appears yellow, jaundice is present.\n\n**Progression guide:**\n- Face only: ~5 mg/dL (usually safe)\n- Face + chest: ~10 mg/dL (monitor)\n- Face + chest + abdomen: ~12 mg/dL (needs blood test)\n- Arms/legs: ~15 mg/dL (likely needs treatment)\n- Palms/soles: ~20 mg/dL (urgent)\n\n**Breastfeeding jaundice** (days 2-5): Caused by insufficient intake. Solution: increase feeding frequency.\n**Breast milk jaundice** (weeks 2-12): Substances in milk slow bilirubin breakdown. Baby is otherwise healthy. Do NOT stop breastfeeding.`,
      },
      // ── Locked premium content ──
      { id: 'rash-guide', title: 'The Rash Identification Guide', tag: 'Diagnostics', readTime: '6 min', summary: 'Photo-matched decision tree: eczema vs. hives vs. viral rash vs. fungal.', body: '', locked: true },
      { id: 'reflux-gerd', title: 'Reflux vs. GERD: When Spit-Up Needs Treatment', tag: 'Diagnostics', readTime: '5 min', summary: 'Happy spitters vs. suffering babies — the weight gain threshold.', body: '', locked: true },
      { id: 'colic-protocol', title: 'The 5 S\'s and Beyond: Evidence-Based Colic Relief', tag: 'Troubleshooting', readTime: '5 min', summary: 'What actually works when nothing seems to work.', body: '', locked: true },
      { id: 'allergies-intro', title: 'Early Allergen Introduction Protocol', tag: 'Safety', readTime: '6 min', summary: 'The LEAP study protocol: peanut, egg, and milk before 12 months.', body: '', locked: true },
      { id: 'first-aid', title: 'Infant First Aid: Choking & CPR', tag: 'Safety', readTime: '5 min', summary: 'Step-by-step back blows and chest thrusts — memorize before solids.', body: '', locked: true },
      { id: 'ear-infection', title: 'Ear Infections: Watch vs. Treat', tag: 'Diagnostics', readTime: '4 min', summary: 'AAP wait-and-see guidelines — when antibiotics help and when they don\'t.', body: '', locked: true },
      { id: 'vaccination-reactions', title: 'Post-Vaccination: Normal vs. Concerning', tag: 'Quick Ref', readTime: '3 min', summary: 'Expected reactions by vaccine type and when to call the pediatrician.', body: '', locked: true },
      { id: 'teething-symptoms', title: 'Teething: Real Symptoms vs. Myths', tag: 'Science', readTime: '4 min', summary: 'Drooling and irritability yes. Fever, diarrhea, and rash — actually no.', body: '', locked: true },
    ],
  },
  {
    id: 'routines',
    title: 'Wake Windows & Rhythm',
    subtitle: 'Timing that prevents overtiredness',
    icon: '\u{2600}\u{FE0F}',
    iconBg: '#FEF9E7',
    accentColor: '#C4973E',
    badge: '\u{23F0}',
    cardBg: '#FDFBF4',
    articles: [
      {
        id: 'wake-windows',
        title: 'Wake Window Reference by Age',
        tag: 'Quick Ref',
        readTime: '3 min',
        summary: 'The exact ranges pediatric sleep consultants use, with signs baby is at their limit.',
        body: `**Wake windows = time from eyes open to next sleep onset.**\n\n**Age-specific ranges:**\n- 0-4 weeks: 35-60 minutes\n- 4-8 weeks: 45-75 minutes\n- 2-3 months: 60-90 minutes\n- 3-4 months: 75-120 minutes\n- 4-5 months: 1.5-2.5 hours\n- 5-7 months: 2-3 hours\n- 7-10 months: 2.5-3.5 hours\n- 10-12 months: 3-4 hours\n- 12-18 months: 3.5-5 hours\n\n**Early tired cues (act on these):**\n- Staring into space / zoning out\n- Turning away from stimulation\n- Pulling ears\n- The FIRST yawn\n- Decreased activity\n\n**Late tired cues (you\u2019ve missed the window):**\n- Rubbing eyes aggressively\n- Arching back\n- Inconsolable crying\n- Hyperactive behavior (counterintuitive \u2014 overtired babies get wired)\n\n**The #1 mistake:** Waiting for \u201cobvious\u201d tired signs. By the time a newborn is rubbing their eyes, they\u2019ve been overtired for 15-20 minutes. Watch the clock AND the baby.`,
      },
      {
        id: 'overtired-spiral',
        title: 'Breaking the Overtired Spiral',
        tag: 'Troubleshooting',
        readTime: '4 min',
        summary: 'When baby is too wired to sleep, sleep deprivation breeds more sleep deprivation. How to reset.',
        body: `**The cortisol trap:** When a baby stays awake too long, the body releases cortisol and adrenaline as a second wind. This makes baby appear energetic but it\u2019s a stress response. Cortisol blocks sleep pressure, keeping them awake longer, triggering more cortisol.\n\n**Signs you\u2019re in the spiral:**\n- Fighting every nap despite clear tiredness\n- Short naps only (20-30 minutes, waking crying)\n- Waking frequently at night (every 45-90 minutes)\n- Waking at 4-5 AM unable to resettle\n- Seeming \u201cnot tired\u201d at bedtime despite short naps\n\n**The 48-72 hour reset:**\n1. **Shorten ALL wake windows by 15-20 minutes**\n2. **Move bedtime 30-60 minutes earlier**\n3. **Allow rescue naps** \u2014 contact nap, car, stroller. Getting sleep volume up is priority.\n4. **Pitch black room** for all sleep\n5. **Reduce stimulation 15 minutes before every sleep**\n\n**After the reset:** Once naps are 45+ minutes and nights improve, gradually extend wake windows back \u2014 5 minutes at a time, not in big jumps.`,
      },
      // ── Locked premium content ──
      { id: 'eat-play-sleep', title: 'Eat-Play-Sleep: Building Your First Routine', tag: 'Methodology', readTime: '5 min', summary: 'The foundational cycle and why feed timing matters more than clock time.', body: '', locked: true },
      { id: 'sample-schedules', title: 'Sample Schedules by Age (0-18 Months)', tag: 'Quick Ref', readTime: '6 min', summary: 'Hour-by-hour templates from newborn to toddler, adjusted for nap count.', body: '', locked: true },
      { id: 'bedtime-routine', title: 'The Science of Bedtime Routines', tag: 'Science', readTime: '4 min', summary: 'Why 20 minutes is ideal and the exact sequence that triggers melatonin.', body: '', locked: true },
      { id: 'witching-hour', title: 'Surviving the Witching Hour', tag: 'Troubleshooting', readTime: '4 min', summary: 'The 5-7 PM meltdown: why it happens and the sensory reset that helps.', body: '', locked: true },
      { id: 'growth-spurt', title: 'Growth Spurts & Schedule Disruptions', tag: 'Quick Ref', readTime: '3 min', summary: 'Predictable windows at 3, 6, 9, 12 weeks — what to expect and how long.', body: '', locked: true },
      { id: 'solids-timing', title: 'Starting Solids: The Readiness Checklist', tag: 'Safety', readTime: '5 min', summary: 'Six signs of readiness, first foods sequence, and the BLW vs. puree decision.', body: '', locked: true },
      { id: 'sibling-routine', title: 'Two Under Two: Syncing Sibling Schedules', tag: 'Methodology', readTime: '5 min', summary: 'The anchor nap strategy and staggered bedtime approach.', body: '', locked: true },
      { id: 'screen-time', title: 'Screen Time Guidelines by Age', tag: 'Science', readTime: '3 min', summary: 'WHO and AAP recommendations and what the research actually shows.', body: '', locked: true },
    ],
  },
];

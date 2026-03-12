// ============================================================
// Lumina — Daily Nurse Insights (Static)
// Offline-first: No API calls, pure static data
// Content is feeding-method neutral (covers breast + formula)
// ============================================================

export type InsightCategory = 'Feeding' | 'Recovery' | 'Sleep' | 'Bonding';

export interface NurseInsight {
  day: number;
  title: string;
  body: string;
  category: InsightCategory;
}

const DAILY_INSIGHTS: NurseInsight[] = [
  // Days 0–14: One per day
  {
    day: 0,
    title: 'Welcome to the world',
    body: 'Your baby may feed frequently in these first hours — this is normal and helps establish your routine. Skin-to-skin contact is the best thing you can do right now. If bottle feeding, small amounts (5–10 ml) are plenty for a tummy the size of a cherry.',
    category: 'Feeding',
  },
  {
    day: 1,
    title: 'Day 1: Colostrum is liquid gold',
    body: 'Whether nursing or using expressed colostrum, tiny amounts are perfectly normal. Your baby\'s stomach is only marble-sized. If formula feeding, 15–30 ml per feed is right on track. Focus on keeping baby warm, fed, and close.',
    category: 'Feeding',
  },
  {
    day: 2,
    title: 'Watch for wet diapers',
    body: 'By today you should see at least 2 wet diapers. Dark meconium stools are still normal. Your body is working hard — remember to drink water every time you feed baby. Pain medication on schedule helps you recover faster.',
    category: 'Recovery',
  },
  {
    day: 3,
    title: 'Hormonal shift ahead',
    body: 'Around day 3–5, a big hormonal shift happens. You may feel weepy, anxious, or overwhelmed — this is the "baby blues" and affects up to 80% of new parents. It\'s not a sign of weakness. Ask for help, rest when you can, and know it usually passes within two weeks.',
    category: 'Recovery',
  },
  {
    day: 4,
    title: 'Milk is transitioning',
    body: 'If breastfeeding, your milk may be coming in — expect breast fullness. If formula feeding, baby may be taking 30–60 ml per feed now. Either way, 8–12 feeds in 24 hours is normal. Baby\'s stomach is now walnut-sized.',
    category: 'Feeding',
  },
  {
    day: 5,
    title: 'Stools are changing color',
    body: 'Stools should be transitioning from dark meconium to greenish-brown, then to yellow or mustard (breast) or tan (formula). If still black tar by day 5, mention it to your pediatrician. Aim for 6+ wet diapers per day from here on.',
    category: 'Feeding',
  },
  {
    day: 6,
    title: 'Your recovery matters',
    body: 'Check in with yourself: Are you taking pain meds on schedule? Eating enough? Getting help with household tasks? Your recovery directly affects your ability to care for baby. You are not being selfish by resting — you are healing.',
    category: 'Recovery',
  },
  {
    day: 7,
    title: 'One week milestone',
    body: 'You\'ve survived the first week! Baby should be near or approaching birth weight by now. This is often when things start feeling a tiny bit more predictable. You\'re doing an incredible job — even when it doesn\'t feel like it.',
    category: 'Bonding',
  },
  {
    day: 8,
    title: 'Sleep in shifts',
    body: 'Newborns sleep 16–17 hours but in 2–3 hour stretches. If you have a partner, consider sleeping in shifts so each adult gets one 4-hour block. Sleep deprivation is cumulative — every hour counts.',
    category: 'Sleep',
  },
  {
    day: 9,
    title: 'Stitches and soreness',
    body: 'If you had stitches (perineal or C-section), soreness around day 7–10 is normal as nerves regenerate. Ice packs, sitz baths, and keeping the area clean help. Watch for increasing redness, fever, or discharge — those need a call to your provider.',
    category: 'Recovery',
  },
  {
    day: 10,
    title: 'Tummy time starts now',
    body: 'Even newborns benefit from brief tummy time — start with 1–2 minutes on your chest. This builds neck and shoulder strength. Baby might protest; that\'s normal. Try it after a diaper change when they\'re alert but not hungry.',
    category: 'Bonding',
  },
  {
    day: 11,
    title: 'Cluster feeding is normal',
    body: 'Baby may want to feed every hour for several hours — this is cluster feeding and is completely normal. It doesn\'t mean you\'re not producing enough. If bottle feeding, smaller more frequent feeds are fine too. This usually peaks around 2–3 weeks.',
    category: 'Feeding',
  },
  {
    day: 12,
    title: 'Check your emotional baseline',
    body: 'Baby blues should be easing. If sadness, anxiety, or intrusive thoughts are getting worse instead of better, please talk to your provider. Postpartum mood disorders are common, treatable, and never your fault. You deserve support.',
    category: 'Recovery',
  },
  {
    day: 13,
    title: 'Wake windows are tiny',
    body: 'Newborns can only stay awake about 45–60 minutes before needing sleep again. Watch for tired cues: yawning, looking away, fussing. Catching the window early makes settling much easier than waiting until overtired.',
    category: 'Sleep',
  },
  {
    day: 14,
    title: 'Two weeks — you did it',
    body: 'The hardest two weeks are behind you. Baby is likely back to birth weight. Your body is healing. Routines are starting to form. If breastfeeding, this is when supply usually stabilizes. Be proud of yourself.',
    category: 'Recovery',
  },
  // Weeks 3–12: One per week
  {
    day: 21,
    title: 'Growth spurt incoming',
    body: 'Around 2–3 weeks, many babies hit their first growth spurt. Extra fussiness and more frequent feeding for 2–3 days is normal. This isn\'t a supply issue — it\'s baby signaling your body (or you) to increase feeds. Ride it out.',
    category: 'Feeding',
  },
  {
    day: 28,
    title: 'The witching hour',
    body: 'Many babies become fussy in the late afternoon/evening — the "witching hour." It usually peaks around 6 weeks and fades by 3–4 months. Holding, swaddling, white noise, and movement all help. You are not doing anything wrong.',
    category: 'Sleep',
  },
  {
    day: 35,
    title: 'Social smiles are coming',
    body: 'Around 5–6 weeks, you\'ll see your first real social smile — and it changes everything. Keep talking and making faces at baby. These early interactions wire their brain for language and emotional connection.',
    category: 'Bonding',
  },
  {
    day: 42,
    title: 'Six-week checkup time',
    body: 'This week is usually your postpartum checkup. Be honest about your physical recovery AND your mental health. Write down questions beforehand. Ask about exercise clearance, contraception, and how you\'re really feeling emotionally.',
    category: 'Recovery',
  },
  {
    day: 56,
    title: 'Sleep patterns forming',
    body: 'Around 8 weeks, some babies start showing a longer stretch at night (3–5 hours). Not all babies do this yet — it\'s normal either way. A consistent bedtime routine (dim lights, feed, swaddle) helps signal "night is different."',
    category: 'Sleep',
  },
  {
    day: 70,
    title: 'Ten weeks: You know your baby',
    body: 'By now you can probably tell the difference between hungry, tired, and uncomfortable cries. Trust your instincts — you know this baby better than anyone. If something feels off, it probably is. Always trust your gut.',
    category: 'Bonding',
  },
  {
    day: 84,
    title: 'The fourth trimester ends',
    body: 'At 12 weeks, the "fourth trimester" is officially over. Baby is more alert, interactive, and starting to develop a schedule. You\'ve made it through the most intense period of new parenthood. The fog lifts from here.',
    category: 'Bonding',
  },
];

const FALLBACK_INSIGHT: NurseInsight = {
  day: 85,
  title: 'Growing every day',
  body: 'Every day brings new discoveries. Keep following your baby\'s cues, trust your instincts, and remember — you\'re the expert on your child. No app or book knows your baby better than you do.',
  category: 'Bonding',
};

/**
 * Get the nurse insight for a given baby age in days.
 * Returns the most recent insight that matches (day <= ageDays).
 */
export function getNurseInsightForDay(ageDays: number): NurseInsight {
  // Find the most recent insight that applies
  const applicable = DAILY_INSIGHTS.filter((i) => i.day <= ageDays);
  if (applicable.length === 0) return DAILY_INSIGHTS[0];

  // Return the one with the highest day value (most recent applicable)
  return applicable[applicable.length - 1];
}

/**
 * Format baby age for display in the insight card.
 * Returns "Day X" for first 14 days, "Week X" for weeks 3-12, "Month X" after.
 */
export function formatInsightAge(ageDays: number): string {
  if (ageDays <= 14) return `Day ${ageDays}`;
  const weeks = Math.floor(ageDays / 7);
  if (weeks <= 12) return `Week ${weeks}`;
  const months = Math.floor(ageDays / 30.44);
  return `Month ${months}`;
}

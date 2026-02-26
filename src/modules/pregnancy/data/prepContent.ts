// ============================================================
// Sprout — Pregnancy Prep Content
// Static tips indexed by gestational week + must-have checklist
// + baby size comparisons + initial prep suggestions
// ============================================================

import { PrepSuggestion } from '../types';

export interface DailyPrepCard {
  week: number;
  title: string;
  body: string;
}

export interface ChecklistItem {
  id: string;
  group: string;
  label: string;
  checked: boolean;
}

// ============================================================
// Baby Size by Week (weeks 4–41)
// Crown-to-rump length until ~20 weeks, then head-to-heel
// ============================================================

export const BABY_SIZE_BY_WEEK: Record<number, { name: string; emoji: string; length: string }> = {
  4:  { name: 'Poppy seed',       emoji: '🌰', length: '0.1 cm' },
  5:  { name: 'Sesame seed',      emoji: '🫘', length: '0.2 cm' },
  6:  { name: 'Lentil',           emoji: '🟤', length: '0.5 cm' },
  7:  { name: 'Blueberry',        emoji: '🫐', length: '1.0 cm' },
  8:  { name: 'Raspberry',        emoji: '🍇', length: '1.6 cm' },
  9:  { name: 'Cherry',           emoji: '🍒', length: '2.3 cm' },
  10: { name: 'Strawberry',       emoji: '🍓', length: '3.1 cm' },
  11: { name: 'Fig',              emoji: '🟣', length: '4.1 cm' },
  12: { name: 'Lime',             emoji: '🟢', length: '5.4 cm' },
  13: { name: 'Peach',            emoji: '🍑', length: '7.4 cm' },
  14: { name: 'Lemon',            emoji: '🍋', length: '8.7 cm' },
  15: { name: 'Apple',            emoji: '🍎', length: '10.1 cm' },
  16: { name: 'Avocado',          emoji: '🥑', length: '11.6 cm' },
  17: { name: 'Pear',             emoji: '🍐', length: '13.0 cm' },
  18: { name: 'Bell pepper',      emoji: '🫑', length: '14.2 cm' },
  19: { name: 'Mango',            emoji: '🥭', length: '15.3 cm' },
  20: { name: 'Banana',           emoji: '🍌', length: '25.6 cm' },
  21: { name: 'Carrot',           emoji: '🥕', length: '26.7 cm' },
  22: { name: 'Papaya',           emoji: '🫒', length: '27.8 cm' },
  23: { name: 'Grapefruit',       emoji: '🍊', length: '28.9 cm' },
  24: { name: 'Corn on the cob',  emoji: '🌽', length: '30.0 cm' },
  25: { name: 'Cauliflower',      emoji: '🥦', length: '34.6 cm' },
  26: { name: 'Lettuce head',     emoji: '🥬', length: '35.6 cm' },
  27: { name: 'Rutabaga',         emoji: '🟡', length: '36.6 cm' },
  28: { name: 'Eggplant',         emoji: '🍆', length: '37.6 cm' },
  29: { name: 'Butternut squash', emoji: '🎃', length: '38.6 cm' },
  30: { name: 'Cabbage',          emoji: '🥗', length: '39.9 cm' },
  31: { name: 'Coconut',          emoji: '🥥', length: '41.1 cm' },
  32: { name: 'Jicama',           emoji: '🟫', length: '42.4 cm' },
  33: { name: 'Pineapple',        emoji: '🍍', length: '43.7 cm' },
  34: { name: 'Cantaloupe',       emoji: '🍈', length: '45.0 cm' },
  35: { name: 'Honeydew melon',   emoji: '🍈', length: '46.2 cm' },
  36: { name: 'Romaine lettuce',  emoji: '🥬', length: '47.4 cm' },
  37: { name: 'Winter melon',     emoji: '🍉', length: '48.6 cm' },
  38: { name: 'Leek',             emoji: '🥒', length: '49.8 cm' },
  39: { name: 'Mini watermelon',  emoji: '🍉', length: '50.7 cm' },
  40: { name: 'Watermelon',       emoji: '🍉', length: '51.2 cm' },
  41: { name: 'Jackfruit',        emoji: '🟡', length: '51.7 cm' },
};

// ============================================================
// Daily Prep Cards — 38 tips indexed by gestational week
// Editorial guideline: gentle, calming, wellness-oriented.
// Max 3-4 sentences. No graphic medical procedures.
// Deeply medical topics belong in the Checklist, not here.
// ============================================================

export const DAILY_PREP_CARDS: DailyPrepCard[] = [
  // ── Weeks 4–12: First trimester ─────────────────────────

  {
    week: 4,
    title: 'A gentle beginning',
    body: 'Something wonderful is just getting started. This is a beautiful time to begin a simple prenatal vitamin routine and nourish yourself with whole, colorful foods. There is no rush to do everything at once — just take it one day at a time.',
  },
  {
    week: 5,
    title: 'Stay beautifully hydrated',
    body: 'Your body is doing incredible work right now, and staying hydrated helps it along. Try infusing your water with cucumber and mint, or sip warm lemon water in the morning. A pretty water bottle by your side can make it feel like a small act of self-care.',
  },
  {
    week: 6,
    title: 'Ease into your mornings',
    body: 'If mornings feel a little rough, keep crackers or dry toast by your bedside for a gentle start. Ginger tea, small frequent snacks, and fresh air can all help settle things. Be patient with yourself — this phase is temporary.',
  },
  {
    week: 7,
    title: 'Jot down your questions',
    body: 'Your first prenatal visit is coming up soon. Start a running list of questions in your phone — anything you are curious or uncertain about. Having your thoughts organized makes the appointment feel calm and productive.',
  },
  {
    week: 8,
    title: 'Rest is productive',
    body: 'First-trimester tiredness is your body working overtime behind the scenes. Give yourself full permission to nap, go to bed early, and say no to things that drain you. Rest is not laziness — it is exactly what this season calls for.',
  },
  {
    week: 9,
    title: 'Gentle movement',
    body: 'A short daily walk or a prenatal yoga flow can do wonders for your mood and energy. Swimming is another lovely option that feels weightless and refreshing. Listen to your body and move in ways that feel good, not forced.',
  },
  {
    week: 10,
    title: 'Nourish with color',
    body: 'Focus on filling your plate with vibrant, whole foods — leafy greens, berries, sweet potatoes, and salmon are all wonderful choices. Pair iron-rich foods with a squeeze of lemon to help absorption. Eating well can be simple and enjoyable.',
  },
  {
    week: 11,
    title: 'Check in with yourself',
    body: 'Pregnancy stirs up a beautiful mix of emotions, and all of them are valid. Take a few quiet minutes each day to notice how you are feeling — journaling, a short meditation, or simply a few deep breaths can help you stay grounded.',
  },
  {
    week: 12,
    title: 'A milestone worth celebrating',
    body: 'You have reached the end of the first trimester — what an accomplishment. Many parents feel a wave of relief and renewed energy around now. Celebrate this moment however feels right, whether that is sharing your news or simply savoring it privately.',
  },

  // ── Weeks 13–27: Second trimester ─────────────────────────

  {
    week: 13,
    title: 'Welcome to the golden stretch',
    body: 'The second trimester often brings a beautiful return of energy and appetite. If you have been waiting to start nursery planning or a babymoon, this is your window. Enjoy this lighter, brighter season of pregnancy.',
  },
  {
    week: 14,
    title: 'Start a bump journal',
    body: 'A weekly photo or a few sentences about how you are feeling creates something you will treasure for years. Some parents write little letters to their baby. There is no wrong format — just capture what feels meaningful to you.',
  },
  {
    week: 15,
    title: 'A little self-care goes far',
    body: 'Schedule something just for you this week — a gentle prenatal massage, a long bath with calming essential oils, or a quiet afternoon with a good book. Taking care of yourself is one of the most nurturing things you can do for your baby too.',
  },
  {
    week: 16,
    title: 'Those first tiny flutters',
    body: 'Sometime in the coming weeks, you may start to feel your baby\'s first movements — gentle flutters or bubbles that are easy to miss at first. It is one of the most magical moments of pregnancy. If you have not felt anything yet, that is perfectly normal.',
  },
  {
    week: 17,
    title: 'Cozy up your sleep',
    body: 'As your belly grows, a pregnancy pillow between your knees can make side-sleeping much more comfortable. Experiment with different setups — a wedge under your belly, a full-body pillow, or even just an extra standard pillow. Better sleep means better days.',
  },
  {
    week: 18,
    title: 'Dream up the nursery',
    body: 'Whether you are going for soft neutrals, nature-inspired tones, or something bold and playful, now is a lovely time to start dreaming about your baby\'s space. Start a mood board, browse inspiration, and choose a palette that feels calming and joyful to you.',
  },
  {
    week: 19,
    title: 'Stretch and breathe',
    body: 'Gentle stretching keeps your body flexible and comfortable as it changes. Try a prenatal yoga flow with cat-cow, child\'s pose, and hip circles — even five minutes in the morning and before bed makes a difference. Pair it with slow, deep breathing.',
  },
  {
    week: 20,
    title: 'Halfway there',
    body: 'You have reached the midpoint — take a moment to celebrate how far you have come. Your baby can now hear your heartbeat and your voice. This is a beautiful time to start reading aloud, playing your favorite music, or simply talking to your little one.',
  },
  {
    week: 21,
    title: 'Fuel yourself well',
    body: 'Iron-rich foods like spinach, lentils, and lean proteins support your growing blood volume and energy levels. Pair them with vitamin C — a squeeze of lemon on your salad, or berries alongside your oatmeal — for better absorption.',
  },
  {
    week: 22,
    title: 'Curate your essentials',
    body: 'If you are putting together a registry, focus on the items parents actually use every day — a safe car seat, a cozy sleep space, a good carrier, and plenty of simple onesies. Less is more. Ask trusted parents what they could not live without.',
  },
  {
    week: 23,
    title: 'Talk and sing to baby',
    body: 'Your baby\'s hearing is developing beautifully, and they are already getting to know your voice. Narrate your day, read a bedtime story aloud, or play a song you love. These simple moments are building a bond before you have even met.',
  },
  {
    week: 24,
    title: 'Nourishing snack ideas',
    body: 'Keep a stash of satisfying snacks within reach — trail mix, apple slices with nut butter, yogurt with granola, or cheese and whole-grain crackers. Eating small, balanced bites throughout the day keeps your energy steady and your mood lifted.',
  },
  {
    week: 25,
    title: 'Connect with your partner',
    body: 'Set aside some quiet time this week to talk about what excites you both — and what feels uncertain. The couples who thrive in new parenthood are the ones who keep communicating honestly. A simple date night or a walk together works wonders.',
  },
  {
    week: 26,
    title: 'Build your village',
    body: 'Whether it is a childbirth class, an online parent community, or a few friends who have been through it, building a support circle now gives you people to lean on later. You do not have to do this alone, and asking for help is a sign of strength.',
  },
  {
    week: 27,
    title: 'The home stretch begins',
    body: 'The third trimester is around the corner. This is a great week to start thinking about your birth preferences, your postpartum support plan, and who your baby\'s pediatrician will be. Tackling one thing at a time keeps it calm and manageable.',
  },

  // ── Weeks 28–41: Third trimester ──────────────────────────

  {
    week: 28,
    title: 'Bonding through movement',
    body: 'Your baby\'s kicks and rolls are getting stronger now. Try setting aside a quiet moment each evening to tune in and feel them move. Many parents find this nightly ritual deeply calming and connecting — a preview of the closeness to come.',
  },
  {
    week: 29,
    title: 'Fill your freezer with love',
    body: 'Batch-cooking a few favorite meals now is one of the kindest gifts you can give your future self. Soups, casseroles, and breakfast burritos all freeze beautifully. Label everything, and you will thank yourself on those first sleepy nights at home.',
  },
  {
    week: 30,
    title: 'Nest at your own pace',
    body: 'The nesting instinct is real, and it can feel wonderful to organize, tidy, and prepare your home. Wash those tiny clothes, set up the bassinet, arrange the changing station. Do what brings you joy, and skip whatever feels like a chore.',
  },
  {
    week: 31,
    title: 'Pelvic floor wellness',
    body: 'Gentle pelvic floor exercises support your body through pregnancy and recovery. Even a few minutes of mindful engagement each day makes a difference. If you would like guidance, a pelvic floor therapist can create a personalized routine.',
  },
  {
    week: 32,
    title: 'Choose your baby\'s doctor',
    body: 'If you have not chosen a pediatrician yet, now is a great time. Many practices offer free meet-and-greet visits for expecting parents. Look for someone who listens, makes you feel at ease, and aligns with your values.',
  },
  {
    week: 33,
    title: 'Pack your bag, peacefully',
    body: 'Having your hospital bag ready by the door brings real peace of mind. Keep it simple: comfortable clothes, toiletries, snacks, a long phone charger, and a going-home outfit for baby. Everything else is extra.',
  },
  {
    week: 34,
    title: 'Practice calm breathing',
    body: 'Try box breathing — inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Practicing for just five minutes a day builds a calming reflex you can use during labor, postpartum, and honestly any stressful moment in life.',
  },
  {
    week: 35,
    title: 'Trust your instincts',
    body: 'You know your body and your baby better than anyone. As you get closer to your due date, trust the signals your body sends you. If something ever feels off, your care team is always just a phone call away.',
  },
  {
    week: 36,
    title: 'Savor the quiet moments',
    body: 'These final weeks are a special, fleeting time. Take a slow morning walk, enjoy a peaceful cup of tea, or simply sit with your hand on your belly. Soon your world will be beautifully full — soak in this stillness while it is here.',
  },
  {
    week: 37,
    title: 'Every day matters',
    body: 'Your baby is growing stronger with each passing day, building the reserves they need for life outside the womb. Your patience during these final weeks is a gift to them. Rest, nourish yourself, and know that the finish line is close.',
  },
  {
    week: 38,
    title: 'Final preparations',
    body: 'Confirm your route to the hospital, make sure your support team knows the plan, and double-check that the car seat is installed. Once the logistics are handled, let yourself relax — you are more prepared than you think.',
  },
  {
    week: 39,
    title: 'You are ready',
    body: 'Everything your baby needs is simple — a safe place to sleep, a way to be fed, and your love. The nursery does not need to be perfect. The books do not all need to be read. You are ready, and you are going to be wonderful.',
  },
  {
    week: 40,
    title: 'Almost there',
    body: 'Your due date is here, but only about 5 percent of babies arrive on the exact day. Stay active if it feels comfortable, rest when you need to, and give yourself permission to set boundaries with well-meaning check-in texts. Your baby will come when they are ready.',
  },
  {
    week: 41,
    title: 'Patience and trust',
    body: 'Going past your due date is completely normal and more common than you might think. Your care team is keeping a close eye on you both. Rest, eat well, and stay in touch with your provider. The wait is almost over — you have been extraordinary.',
  },
];

// ============================================================
// Main Categories — Fixed categories that NEVER disappear
// Used for category-grouped journey view with progress counters
// ============================================================

export const MAIN_CATEGORIES = [
  'Safety',
  'Hospital Bag',
  'Diaper Station',
  'Feeding Prep',
  'Bath Time',
  'Postpartum Recovery',
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];

export const CHECKLIST_GROUPS = MAIN_CATEGORIES;

export const MUST_HAVE_CHECKLIST: ChecklistItem[] = [
  // Safety
  { id: 'sf-1', group: 'Safety', label: 'Car seat installed and inspected', checked: false },
  { id: 'sf-2', group: 'Safety', label: 'Safe sleep space set up (firm mattress, no loose items)', checked: false },
  { id: 'sf-3', group: 'Safety', label: 'Smoke & carbon monoxide detectors tested', checked: false },
  { id: 'sf-4', group: 'Safety', label: 'Baby monitor positioned and tested', checked: false },
  { id: 'sf-5', group: 'Safety', label: 'Pediatrician chosen & first visit scheduled', checked: false },
  { id: 'sf-6', group: 'Safety', label: 'Emergency numbers posted (pediatrician, poison control)', checked: false },

  // Hospital Bag (mother-centric comfort)
  { id: 'hb-1', group: 'Hospital Bag', label: 'Cozy robe or nursing gown', checked: false },
  { id: 'hb-2', group: 'Hospital Bag', label: 'Comfortable slippers & warm socks', checked: false },
  { id: 'hb-3', group: 'Hospital Bag', label: 'Lip balm, face mist & toiletries', checked: false },
  { id: 'hb-4', group: 'Hospital Bag', label: 'Nursing bra & breast pads', checked: false },
  { id: 'hb-5', group: 'Hospital Bag', label: 'Favorite snacks & water bottle', checked: false },
  { id: 'hb-6', group: 'Hospital Bag', label: 'Long phone charger & headphones', checked: false },
  { id: 'hb-7', group: 'Hospital Bag', label: 'Postpartum underwear & pads', checked: false },
  { id: 'hb-8', group: 'Hospital Bag', label: 'Going-home outfit (loose & comfy)', checked: false },

  // Diaper Station
  { id: 'ds-1', group: 'Diaper Station', label: 'Changing pad or mat set up', checked: false },
  { id: 'ds-2', group: 'Diaper Station', label: 'Diapers stocked (newborn + size 1)', checked: false },
  { id: 'ds-3', group: 'Diaper Station', label: 'Fragrance-free wipes ready', checked: false },
  { id: 'ds-4', group: 'Diaper Station', label: 'Diaper cream (zinc oxide based)', checked: false },
  { id: 'ds-5', group: 'Diaper Station', label: 'Diaper pail or disposal system', checked: false },
  { id: 'ds-6', group: 'Diaper Station', label: 'Spare change of clothes within reach', checked: false },

  // Feeding Prep
  { id: 'fp-1', group: 'Feeding Prep', label: 'Bottles purchased & sterilized', checked: false },
  { id: 'fp-2', group: 'Feeding Prep', label: 'Bottle brush & drying rack set up', checked: false },
  { id: 'fp-3', group: 'Feeding Prep', label: 'Formula or breast milk storage bags ready', checked: false },
  { id: 'fp-4', group: 'Feeding Prep', label: 'Burp cloths & bibs stocked', checked: false },
  { id: 'fp-5', group: 'Feeding Prep', label: 'Nighttime feeding station set up', checked: false },
  { id: 'fp-6', group: 'Feeding Prep', label: 'Lactation consultant contact saved (if breastfeeding)', checked: false },

  // Bath Time
  { id: 'bt-1', group: 'Bath Time', label: 'Baby bathtub or sink insert ready', checked: false },
  { id: 'bt-2', group: 'Bath Time', label: 'Gentle, fragrance-free baby wash', checked: false },
  { id: 'bt-3', group: 'Bath Time', label: 'Soft hooded towels', checked: false },
  { id: 'bt-4', group: 'Bath Time', label: 'Bath thermometer for water temperature', checked: false },
  { id: 'bt-5', group: 'Bath Time', label: 'Soft washcloths', checked: false },
  { id: 'bt-6', group: 'Bath Time', label: 'Baby lotion or moisturizer (fragrance-free)', checked: false },

  // Postpartum Recovery
  { id: 'pr-1', group: 'Postpartum Recovery', label: 'Peri bottle for gentle cleansing', checked: false },
  { id: 'pr-2', group: 'Postpartum Recovery', label: 'Soothing spray or witch hazel pads', checked: false },
  { id: 'pr-3', group: 'Postpartum Recovery', label: 'Freezer meals prepped for first week', checked: false },
  { id: 'pr-4', group: 'Postpartum Recovery', label: 'Support person lined up for first days', checked: false },
  { id: 'pr-5', group: 'Postpartum Recovery', label: 'Comfortable recovery clothing (loose, nursing-friendly)', checked: false },
  { id: 'pr-6', group: 'Postpartum Recovery', label: 'Stool softener & pain relief on hand', checked: false },
];

// ============================================================
// Initial Prep Suggestions — Veteran Nurse Persona
// 10–12 items per category · Practical · No-fluff · Mother-first
// Voice: 20-year L&D / NICU nurse giving you the real talk
// ============================================================

export const INITIAL_PREP_SUGGESTIONS: PrepSuggestion[] = [
  // ── Safety (10 items) ──────────────────────────────────────

  {
    id: 'init-1',
    title: 'Install the car seat rear-facing and get it inspected',
    body: 'Rear-facing, center of the back seat, at a 45-degree angle. I cannot tell you how many I have seen installed wrong by smart, capable people. Most fire stations inspect for free — book it. This is non-negotiable before baby comes home.',
    nurseInsight: 'I have personally uninstalled and corrected car seats that looked perfect to the parents. A crash at 30 mph exerts forces you cannot simulate by tugging on the base. One free inspection gives you certainty that no amount of confidence can replace.',
    actionSteps: [
      'Install the seat rear-facing in the center of the back seat at a 45-degree recline.',
      'Search "car seat inspection near me" or call your local fire station to book a free CPST check.',
      'Practice removing and reinstalling the seat until you can do it in under 5 minutes.',
    ],
    category: 'Safety',
    source: 'static',
  },
  {
    id: 'init-2',
    title: 'Set up a bare-bones safe sleep space',
    body: 'Firm mattress. Fitted sheet. That is it. No bumpers, no blankets, no stuffed animals, no positioners. I know it looks sad and bare — that is exactly what safe looks like. Room-share for the first 6 months, but baby sleeps on their own surface, on their back, every single time.',
    nurseInsight: 'Every NICU nurse has seen the aftermath of unsafe sleep environments. Bumpers, blankets, and lovies look cozy in photos but they are suffocation hazards. The bare crib is not depressing — it is the single environment where your baby is safest while you are not watching.',
    actionSteps: [
      'Remove everything from the crib except a firm mattress and a single fitted sheet.',
      'Set the crib or bassinet within arm\'s reach of your bed for the first 6 months.',
      'Show every caregiver — partner, grandparents, sitter — exactly how the sleep space should look.',
    ],
    category: 'Safety',
    source: 'static',
  },
  {
    id: 'init-3',
    title: 'Test every smoke and CO detector in the house',
    body: 'Replace batteries now, not "when you get around to it." Test every detector on every floor. This takes ten minutes and it is the kind of thing you will forget once baby is here. Set a phone reminder to retest every 6 months.',
    nurseInsight: 'Sleep deprivation makes you forget things that used to be automatic. If you do not replace those batteries now, you will not do it for months — and a dead detector is the same as no detector. Ten minutes of prevention now protects your family every night.',
    actionSteps: [
      'Walk through every room and press the test button on each smoke and CO detector.',
      'Replace any batteries older than 6 months with fresh ones today.',
      'Set a recurring 6-month phone reminder to retest all detectors.',
    ],
    category: 'Safety',
    source: 'static',
  },
  {
    id: 'init-4',
    title: 'Choose your pediatrician and schedule the first visit',
    body: 'Baby needs to be seen within 3-5 days of discharge. Do not wait until after birth to find a doctor — you will be too exhausted to interview anyone. Ask other parents, check if they take your insurance, and confirm they have same-day sick appointments. Save the after-hours number in your phone now.',
    nurseInsight: 'I have watched brand-new parents frantically calling pediatric offices at 48 hours postpartum because they did not have a doctor lined up. Your brain will not function well enough to make this decision while recovering. Do it now when you can think clearly.',
    actionSteps: [
      'Ask friends, your OB, or your insurance portal for 2-3 pediatrician recommendations.',
      'Call each office and confirm they accept your insurance, offer same-day sick visits, and have after-hours support.',
      'Schedule the first newborn appointment for 3-5 days after your due date.',
      'Save the office number AND after-hours line in your phone contacts now.',
    ],
    category: 'Safety',
    source: 'static',
  },
  {
    id: 'init-5',
    title: 'Post emergency numbers where you can see them',
    body: 'Pediatrician, Poison Control (1-800-222-1222), your hospital\'s nurse line, and the nearest ER. Tape them to the fridge and save them in your phone under favorites. In a panic at 2 AM, you will not be able to think clearly enough to search for these.',
    nurseInsight: 'Adrenaline kills your ability to remember basic information. I have seen parents who could not recall their own address during an emergency call. Having numbers visible means any caregiver in your home can act immediately without fumbling through a phone.',
    actionSteps: [
      'Write your pediatrician\'s number, Poison Control (1-800-222-1222), and nearest ER address on a card.',
      'Tape it to the fridge and photograph it for your phone\'s lock screen.',
      'Save all numbers as favorites in every caregiver\'s phone.',
    ],
    category: 'Safety',
    source: 'static',
  },
  {
    id: 'init-6',
    title: 'Take an infant CPR class — both parents',
    body: 'This is the one class I beg every parent to take. Infant CPR is different from adult CPR, and knowing it could save your child\'s life. The American Red Cross and local hospitals offer 2-hour courses. Do it before your due date when you can still concentrate.',
    nurseInsight: 'In 20 years I have seen three babies saved by parents who knew infant CPR. The technique is different from adult CPR — smaller compressions, gentler breaths, different hand placement. Two hours of your time could be the difference between the worst day of your life and a scary story you tell later.',
    actionSteps: [
      'Search the American Red Cross or your hospital for a 2-hour infant CPR course near you.',
      'Book it for both parents at least 4 weeks before your due date.',
      'Practice the technique on a pillow weekly until it feels automatic.',
    ],
    category: 'Safety',
    source: 'static',
  },
  {
    id: 'init-7',
    title: 'Anchor furniture and secure heavy items to walls',
    body: 'Your newborn is not mobile yet, but you will blink and they will be pulling up on everything. Bolt bookshelves, dressers, and TV stands to the wall now. It takes 20 minutes per piece and prevents the single most common fatal home accident for small children.',
    nurseInsight: 'Furniture tip-overs kill more children than any other home hazard. The transition from immobile newborn to furniture-climbing toddler happens so fast you will not see it coming. Doing this now while you have time and energy means it is done before it is urgent.',
    actionSteps: [
      'Buy furniture anchoring kits — one per bookshelf, dresser, and TV stand.',
      'Bolt every piece taller than 30 inches to the wall studs using L-brackets or anti-tip straps.',
      'Secure the TV to the wall or its stand with anti-tip straps.',
    ],
    category: 'Safety',
    source: 'static',
  },
  {
    id: 'init-8',
    title: 'Set your water heater to 120°F (49°C)',
    body: 'Newborn skin burns in seconds at temperatures adults barely notice. Check your water heater\'s thermostat — if it is above 120°F, turn it down today. Run the hot water and test with a thermometer if you are unsure. This one adjustment prevents the most common household burn in babies.',
    nurseInsight: 'I have treated infant burns from bath water that felt "warm" to the parent. Newborn skin is thinner than paper. Water at 140°F — a common factory setting — causes a full-thickness burn in 3 seconds. Adjusting the dial takes 30 seconds and eliminates the risk entirely.',
    actionSteps: [
      'Locate your water heater and check the temperature dial — adjust to 120°F or the "warm" setting.',
      'Run hot water at a faucet for 30 seconds, then test with a thermometer to verify.',
      'If you rent, email your landlord requesting the adjustment — they are legally required to comply.',
    ],
    category: 'Safety',
    source: 'static',
  },
  {
    id: 'init-9',
    title: 'Build a proper infant first aid kit',
    body: 'Rectal thermometer (the only accurate method for newborns), infant acetaminophen (ask your pediatrician about dosing), saline nasal drops, bulb syringe or NoseFrida, nail clippers with a magnifier, and a small flashlight. Pre-pack it and keep it in one spot. You will reach for it at 3 AM.',
    nurseInsight: 'At 3 AM with a feverish baby, you will not have the bandwidth to search through drawers. Every second of delay adds to your panic. A pre-packed kit in one known location lets you act on autopilot when your brain is running on fumes.',
    actionSteps: [
      'Buy a rectal thermometer, infant acetaminophen, saline drops, NoseFrida, baby nail clippers, and a small flashlight.',
      'Pack everything in a labeled ziplock bag or small container and store it in one consistent spot.',
      'Write your pediatrician\'s dosing guidance on an index card and tape it inside the kit.',
    ],
    category: 'Safety',
    source: 'static',
  },
  {
    id: 'init-10',
    title: 'Learn newborn warning signs by heart',
    body: 'Fever over 100.4°F (38°C) rectal in any baby under 3 months is an ER visit — no exceptions. Blue lips or fingernails, struggling to breathe, not wetting diapers, inconsolable crying for hours, or extreme lethargy also warrant immediate medical attention. Print this list and put it on the fridge.',
    nurseInsight: 'New parents second-guess themselves constantly — is this normal, should I call, am I overreacting? Having a clear list of "call now" symptoms eliminates the guesswork. When you know the red flags, you act faster when it matters and worry less when it does not.',
    actionSteps: [
      'Print the warning signs list: fever over 100.4°F rectal, blue lips, labored breathing, no wet diapers, inconsolable crying, or extreme lethargy.',
      'Tape it next to the emergency numbers on your fridge.',
      'Review the list with your partner and every regular caregiver so everyone knows when to call.',
    ],
    category: 'Safety',
    source: 'static',
  },

  // ── Hospital Bag (12 items) ────────────────────────────────

  {
    id: 'init-11',
    title: 'Bring your own pillow from home',
    body: 'Hospital pillows are flat, plastic-covered, and uncomfortable. Your own pillow from home will help you sleep, support you during breastfeeding, and just make you feel more human. Put a bright-colored pillowcase on it so it does not get lost in the hospital linens.',
    nurseInsight: 'Sleep is recovery. Hospital pillows are designed to be sanitized, not slept on. Your own pillow is the one thing that makes the hospital bed feel slightly less institutional — and those first nights of sleep between feeds are precious for healing.',
    actionSteps: [
      'Put a bright or patterned pillowcase on your pillow so it is not mixed into hospital laundry.',
      'Pack it on top of your bag so it is the first thing you grab when you arrive.',
      'Consider bringing a second small pillow for breastfeeding support.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },
  {
    id: 'init-12',
    title: 'Pack a robe that makes you feel like yourself',
    body: 'You are going to have a stream of nurses, doctors, and visitors walking in. A comfortable robe lets you feel pulled-together without effort. Choose something soft, machine-washable, and ideally with front access for nursing. This one item changes how you feel about the whole stay.',
    nurseInsight: 'I watch how differently women carry themselves when they put on their own clothes versus staying in a hospital gown. Feeling like yourself speeds recovery because your mental state directly affects your physical healing. A robe is not vanity — it is therapy.',
    actionSteps: [
      'Choose a knee-length, machine-washable robe with front buttons or a tie closure for easy nursing access.',
      'Pick a dark color to hide inevitable stains from bleeding and milk leaking.',
      'Pack it in a separate bag for quick access during the first hour postpartum.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },
  {
    id: 'init-13',
    title: 'Slippers with grip and warm socks',
    body: 'Hospital floors are cold and slippery. Non-skid slippers for the room and grippy socks for walking the halls are essential. You will be walking — especially after a C-section, early mobilization matters. Do not rely on the hospital socks; yours will be better.',
    nurseInsight: 'Early walking after delivery reduces blood clot risk and speeds recovery — especially after a C-section. But cold, slippery floors make new moms reluctant to get up. Comfortable grippy footwear removes one more barrier between you and the movement your body needs.',
    actionSteps: [
      'Pack non-skid slippers for your room and 2 pairs of grippy socks for hallway walks.',
      'Choose slip-on styles — bending over will be painful.',
      'Bring them in a side pocket for easy access even before you fully unpack.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },
  {
    id: 'init-14',
    title: 'Lip balm — yes, seriously',
    body: 'Labor and delivery rooms are kept cool and dry. Between the breathing, the air conditioning, and the oxygen, your lips will crack. I have seen more women ask for lip balm than anything else. Pack two — one for your bag and one for the bedside.',
    nurseInsight: 'This sounds trivial until you are 12 hours into labor with cracked, bleeding lips because the room humidity is 20%. It is the number one comfort item requested from nurses on L&D floors. Two dollars of prevention saves real discomfort.',
    actionSteps: [
      'Pack two lip balms — one in your labor bag, one on the bedside table.',
      'Choose a hydrating formula, not just a tinted gloss.',
      'Add a small tube of hand cream too — hospital air dries everything out.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },
  {
    id: 'init-15',
    title: 'A phone charger that reaches your bed',
    body: 'Hospital outlets are never where you need them. Bring a 10-foot charging cable. Your phone is your lifeline — camera, communication with family, music during labor, and clock-watching during feeds. A dead phone at 4 AM when you need to call the nurse is miserable.',
    nurseInsight: 'Your phone is your connection to everyone who loves you, your camera for first moments, and your clock for tracking feeds. A dead phone isolates you at the most vulnerable time of your life. The outlet will always be behind the bed, 8 feet from where you sit.',
    actionSteps: [
      'Buy a 10-foot USB-C or Lightning cable and test it reaches from your bedroom wall to your bed.',
      'Pack a portable battery bank as backup, fully charged.',
      'Put the charger in the outer pocket of your bag for immediate access.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },
  {
    id: 'init-16',
    title: 'Real snacks for labor and recovery',
    body: 'Hospital food arrives on a schedule that will never match your hunger. Pack protein bars, trail mix, dried fruit, crackers, nut butter packets, and electrolyte drinks. You need fuel — labor is the hardest physical work of your life, and recovery requires calories.',
    nurseInsight: 'Hospital meal trays arrive at 7 AM, noon, and 5 PM. Your hunger will hit at 2 AM during a feed or at 10 PM after a long day of visitors. Underfed mothers struggle to produce milk and heal from delivery. Your snack stash is not a luxury — it is your recovery fuel.',
    actionSteps: [
      'Pack a gallon ziplock with protein bars, trail mix, nut butter packets, crackers, and dried fruit.',
      'Add electrolyte drink packets or coconut water for hydration during and after labor.',
      'Include a few of your favorite comfort snacks — emotional nourishment counts too.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },
  {
    id: 'init-17',
    title: 'Nursing bra and breast pads',
    body: 'Even if you are not sure about breastfeeding, your milk is coming in regardless. A soft, wire-free nursing bra and disposable breast pads will keep you comfortable. Your breasts may double in size in the first few days — buy a size up from your current pregnancy size.',
    nurseInsight: 'Milk production is hormonal — it happens whether you breastfeed or not. Engorgement is painful and leaking is constant. Having the right bra and pads is not about a feeding choice, it is about managing a biological process your body is going to do regardless.',
    actionSteps: [
      'Buy 2 soft, wireless nursing bras one size up from your current pregnancy size.',
      'Pack a box of disposable breast pads — you will go through several per day.',
      'Try the bras on before your hospital bag is packed to make sure they are comfortable.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },
  {
    id: 'init-18',
    title: 'Your own postpartum underwear and pads',
    body: 'The hospital provides mesh underwear and industrial pads — functional but not great. Bring high-waisted disposable underwear or soft cotton briefs a size up from normal, plus overnight pads. Your comfort during recovery directly affects your ability to bond and rest.',
    nurseInsight: 'Postpartum bleeding is heavier than most women expect and lasts weeks, not days. Being comfortable in your own underwear and pads makes every trip to the bathroom less daunting. Discomfort in this area makes everything else — feeding, bonding, sleeping — harder.',
    actionSteps: [
      'Buy high-waisted disposable underwear or cotton briefs two sizes up from pre-pregnancy.',
      'Pack overnight-length pads with wings — at least 10 for the hospital stay.',
      'Bring a few pairs of dark, soft underwear for going home too.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },
  {
    id: 'init-19',
    title: 'Going-home outfit — maternity size, not pre-pregnancy',
    body: 'You will still look about 6 months pregnant when you leave the hospital. This is normal. Pack loose maternity leggings and a soft, stretchy top. Your body just performed a miracle — dress it in comfort, not expectations. Save the "bounce back" pressure for never.',
    nurseInsight: 'I have seen women in tears trying to fit into pre-pregnancy jeans on discharge day. Your uterus takes 6 weeks to shrink, your organs are shifting back, and you are still bloated from IV fluids. Wearing comfortable clothes is not giving up — it is respecting what your body just accomplished.',
    actionSteps: [
      'Pack maternity leggings and a loose, soft top — the same size you wore at 6 months pregnant.',
      'Choose something with easy nursing access if breastfeeding.',
      'Leave pre-pregnancy clothes at home entirely — removing the temptation removes the pressure.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },
  {
    id: 'init-20',
    title: 'Toiletries to feel human again',
    body: 'Face wash, deodorant, dry shampoo, toothbrush, and a hair tie. That first shower after delivery is genuinely one of the best showers of your life. Having your own products instead of hospital-issue ones makes it even better. Throw in a face mist for quick refreshes.',
    nurseInsight: 'That first postpartum shower is transformative. I have seen women go from defeated to determined after 10 minutes of warm water and their own shampoo. Feeling clean is not superficial — it resets your nervous system and gives you the strength to keep going.',
    actionSteps: [
      'Pack a small toiletry bag: face wash, deodorant, dry shampoo, toothbrush, toothpaste, and hair ties.',
      'Add a hydrating face mist for quick refreshes between showers.',
      'Request help from your nurse for your first shower — dizziness is common.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },
  {
    id: 'init-21',
    title: 'Pack a separate bag for your partner',
    body: 'They need a change of clothes, phone charger, toothbrush, snacks, and a small pillow. Hospital couches are brutal. If your partner is comfortable and fed, they can actually support you instead of being hangry and sore on a vinyl chair.',
    nurseInsight: 'An uncomfortable, hungry partner is useless to you. I have watched partners fall asleep during critical bonding moments because the hospital couch wrecked their back. Their job is to support you — they cannot do that if they are suffering too.',
    actionSteps: [
      'Pack a small bag: change of clothes, phone charger, toothbrush, deodorant, and snacks.',
      'Include a compact travel pillow and a light blanket for the hospital couch.',
      'Set the bag by the door next to yours so it is grabbed automatically.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },
  {
    id: 'init-22',
    title: 'Download entertainment offline before you go',
    body: 'Hospital WiFi is unreliable. Download playlists, podcasts, shows, and audiobooks before your admission. Early labor can last hours — having your comfort media ready passes time and keeps you calm. Noise-canceling earbuds are a bonus for postpartum ward noise.',
    nurseInsight: 'Early labor is long and boring. Postpartum wards are loud at night. Having your own entertainment offline means you are not dependent on spotty WiFi or whatever is on the wall TV. Distraction is a real pain management tool, and boredom amplifies anxiety.',
    actionSteps: [
      'Download 3-4 shows, a playlist, and 2-3 podcasts or audiobooks to your phone before admission.',
      'Pack noise-canceling earbuds or over-ear headphones.',
      'Create a calming labor playlist separately from your regular music.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },

  // ── Diaper Station (10 items) ──────────────────────────────

  {
    id: 'init-23',
    title: 'Set up the changing station at waist height',
    body: 'Your back is already going to take a beating from feeding positions. Do not add to it by leaning over a low surface 10-12 times a day. A dresser top with a contoured changing pad at your waist height is ideal. If you are short, use a lower surface. Ergonomics matter.',
    nurseInsight: 'Back pain is the number one physical complaint I hear from postpartum mothers. Every time you lean over a low changing surface 10-12 times a day, you are compounding the damage from feeding posture. Set this up correctly once and your body thanks you for months.',
    actionSteps: [
      'Measure your waist height and choose a surface that lets you stand straight while changing — a dresser or table at elbow height.',
      'Secure a contoured changing pad on top with anti-slip strips.',
      'Stock everything within arm\'s reach: diapers, wipes, cream, 2-3 spare onesies.',
    ],
    category: 'Diaper Station',
    source: 'static',
  },
  {
    id: 'init-24',
    title: 'Stock both newborn AND size 1 diapers',
    body: 'Every baby is different. Some blow through newborn size in a week; others wear it for a month. Have a pack of each ready. Do not open the size 1 pack until you need it — most stores accept returns on unopened diapers if you overbuy.',
    nurseInsight: 'Running out of diapers that fit at 11 PM with a screaming baby is a crisis that is completely preventable. Having both sizes on hand means you never make a desperate late-night store run during the hardest week of your life.',
    actionSteps: [
      'Buy one pack of newborn diapers and one pack of size 1 — keep the size 1 pack sealed.',
      'Check the weight range on each package so you know when to switch.',
      'Keep the receipt for the size 1 pack in case you need to exchange or return it.',
    ],
    category: 'Diaper Station',
    source: 'static',
  },
  {
    id: 'init-25',
    title: 'Fragrance-free wipes only — nothing fancy',
    body: 'Newborn skin reacts to everything. Use plain, unscented, alcohol-free wipes. For the first few weeks, warm water on a soft cloth is actually even better — especially for the face and cord area. Skip anything marketed as "soothing" with added ingredients.',
    nurseInsight: 'I have seen more rashes caused by "gentle" fragranced wipes than by anything else. Newborn skin has virtually no barrier — what you put on it goes into it. Plain and boring is exactly what you want for the first 8 weeks.',
    actionSteps: [
      'Buy fragrance-free, alcohol-free, unscented wipes — check the label for "no added fragrance."',
      'Keep a stack of soft cotton cloths and warm water near the changing pad for the first 2-3 weeks.',
      'Skip any wipe that lists parfum, fragrance, or essential oils in the ingredients.',
    ],
    category: 'Diaper Station',
    source: 'static',
  },
  {
    id: 'init-26',
    title: 'Zinc oxide barrier cream from day one',
    body: 'Do not wait for a rash to start using barrier cream. A thin layer of zinc oxide at every change creates a waterproof barrier that prevents irritation before it starts. The thick white paste is what works — the clear "lightweight" versions are mostly marketing.',
    nurseInsight: 'Preventing a rash is ten times easier than treating one. Once skin breaks down in the diaper area, every change becomes painful for baby and stressful for you. A thin smear of zinc oxide takes two seconds and creates an invisible shield that keeps moisture out.',
    actionSteps: [
      'Buy a tube of zinc oxide cream (at least 40% zinc) — the thick white paste, not the clear kind.',
      'Apply a thin layer at every single diaper change from day one.',
      'Keep a tube at each changing station so you never skip it.',
    ],
    category: 'Diaper Station',
    source: 'static',
  },
  {
    id: 'init-27',
    title: 'Build a portable diaper caddy for the living room',
    body: 'You are not going to walk to the nursery for every single change — especially at 3 AM or when you can barely stand up. Fill a portable caddy with 8-10 diapers, a travel pack of wipes, cream, and a change of clothes. Move it room to room with you.',
    nurseInsight: 'New mothers who have to walk to another room for every diaper change start delaying changes — and delayed changes cause rashes. A caddy that travels with you removes the friction and keeps baby dry and comfortable without you having to move more than arm\'s reach.',
    actionSteps: [
      'Fill a handled basket or caddy with 8-10 diapers, travel wipes, barrier cream, and a change of clothes.',
      'Move it to whichever room you and baby are spending time in.',
      'Restock it every evening so it is ready for the next day.',
    ],
    category: 'Diaper Station',
    source: 'static',
  },
  {
    id: 'init-28',
    title: 'Set up a nightstand mini station for overnight changes',
    body: 'A portable changing pad, a small stack of diapers, wipes, and a dim nightlight right next to your bed. Middle-of-the-night changes should be fast, quiet, and low-light. The less you wake baby (and yourself), the faster everyone falls back asleep.',
    nurseInsight: 'Bright lights and cold rooms during nighttime changes wake baby up fully — then you spend 45 minutes trying to get them back to sleep. A dim, warm, quiet change keeps everyone in "sleep mode" and gets you back to bed 30 minutes sooner.',
    actionSteps: [
      'Place a portable changing pad, 5-6 diapers, wipes, and cream on your nightstand or a small table next to your bed.',
      'Install a dim red or amber nightlight — avoid white or blue light that suppresses melatonin.',
      'Practice the change in low light before baby arrives so the motions are automatic.',
    ],
    category: 'Diaper Station',
    source: 'static',
  },
  {
    id: 'init-29',
    title: 'Keep spare onesies within arm\'s reach of every station',
    body: 'Blowouts happen. They happen at 2 AM, they happen right after you just changed them, and they happen when you have one hand holding a squirming baby. Having 2-3 clean onesies stashed at each changing spot means you are never scrambling.',
    nurseInsight: 'The panic of a blowout is not the mess — it is realizing you have nothing clean within reach while holding a dirty, screaming baby. Two spare onesies at each station eliminates the panic and lets you handle the situation calmly.',
    actionSteps: [
      'Stash 2-3 clean onesies at each changing location — nursery, living room caddy, and nightstand.',
      'Include a plastic bag at each station for soiled clothes.',
      'Restock clean onesies from the laundry pile every time you fold.',
    ],
    category: 'Diaper Station',
    source: 'static',
  },
  {
    id: 'init-30',
    title: 'Choose a diaper pail that actually contains odor',
    body: 'A basic trash can with a lid does not cut it once you hit solid foods. Invest in a diaper pail with a proper sealing mechanism — your nose and your guests will thank you. Empty it every other day at minimum, daily is better.',
    nurseInsight: 'You will change 8-12 diapers a day. In summer heat or a warm apartment, an inadequate pail turns the nursery into a biohazard zone within hours. A proper sealing pail is not a luxury — it is environmental sanity for the room where your baby sleeps.',
    actionSteps: [
      'Buy a diaper pail with a step-open lid and a sealing mechanism that traps odor.',
      'Place it within arm\'s reach of your main changing station.',
      'Empty it every other day minimum — set a phone reminder if needed.',
    ],
    category: 'Diaper Station',
    source: 'static',
  },
  {
    id: 'init-31',
    title: 'Learn the front-to-back wipe technique',
    body: 'For girls especially, always wipe front to back to prevent UTIs. For boys, point the diaper down before closing to prevent leaks. These two techniques will save you from the most common diaper-change problems I see new parents face.',
    nurseInsight: 'UTIs in newborn girls from improper wiping are more common than parents realize, and they are completely preventable with the right technique. For boys, one pointed-up diaper means a wet crib sheet at 3 AM. Learning these two things now saves you from both.',
    actionSteps: [
      'For girls: always wipe from front to back — never the reverse.',
      'For boys: point the diaper downward before fastening to prevent leaks.',
      'Watch a 2-minute video on proper newborn diaper technique to build confidence before baby arrives.',
    ],
    category: 'Diaper Station',
    source: 'static',
  },
  {
    id: 'init-32',
    title: 'Hand sanitizer at every changing spot',
    body: 'You will not always be near a sink. A pump of alcohol-based hand sanitizer at each station is a small thing that prevents the spread of germs — especially important in the first 8 weeks when baby\'s immune system is still developing.',
    nurseInsight: 'In the first 8 weeks, your baby has virtually no immune defense beyond what you gave them in the womb. Every diaper change is a germ exposure event. Sanitizer at arm\'s reach means you actually use it every time instead of telling yourself you will wash your hands in a minute.',
    actionSteps: [
      'Place a pump bottle of alcohol-based hand sanitizer at each changing location.',
      'Use it immediately after every diaper change, before picking baby back up.',
      'Replace the bottles when they get low — an empty sanitizer is useless.',
    ],
    category: 'Diaper Station',
    source: 'static',
  },

  // ── Feeding Prep (12 items) ────────────────────────────────

  {
    id: 'init-33',
    title: 'Have 6-8 bottles ready regardless of feeding plan',
    body: 'Even if you plan to exclusively breastfeed, have bottles on hand. Unexpected situations happen — a partner may need to feed, you may need a break, or you may pump. Having bottles sterilized and ready means you are never caught off guard at midnight.',
    nurseInsight: 'I have watched exclusive breastfeeding plans fall apart at 72 hours when milk has not come in yet and baby is losing too much weight. Having bottles ready is not lack of commitment — it is being prepared for reality. The mothers who cope best are the ones who planned for flexibility.',
    actionSteps: [
      'Buy 6-8 bottles with slow-flow newborn nipples, even if you plan to breastfeed.',
      'Sterilize them all and store them clean and ready before your due date.',
      'Know how to prepare formula or thaw breast milk — practice before you need it.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'init-34',
    title: 'Sterilize everything before first use',
    body: 'Boil all bottles, nipples, rings, and pump parts for 5 minutes before the very first use. After that, hot soapy water and a bottle brush after each use is sufficient for healthy full-term babies. Air-dry on a clean rack — do not towel-dry, you will just transfer bacteria.',
    nurseInsight: 'First-use sterilization kills manufacturing residue and bacteria from packaging. After that, thorough washing is enough for healthy term babies — you do not need to sterilize after every feed. Knowing the difference saves you 20 minutes a day of unnecessary work.',
    actionSteps: [
      'Boil all bottles, nipples, rings, and pump parts in water for 5 minutes before the very first use.',
      'Set up a clean drying rack and air-dry — never towel-dry.',
      'After first use, wash with hot soapy water and a bottle brush after each feed.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'init-35',
    title: 'Set up a dedicated nighttime feeding station',
    body: 'Dim lamp (red or warm light to preserve melatonin), comfortable chair, burp cloth, water bottle for you, and everything you need within reach. You will use this station 3-8 times per night for weeks. Make it a place you do not dread going to.',
    nurseInsight: 'You will sit in this spot 3-8 times per night for weeks straight. If it is uncomfortable, cold, or missing what you need, every feed becomes a misery you dread. Five minutes of setup now creates a space that keeps you sane during the hardest nights of your life.',
    actionSteps: [
      'Set up a comfortable chair with a dim red or amber lamp, a burp cloth, and your water bottle within reach.',
      'Add your phone charger, a snack basket, and a blanket for cool nights.',
      'Test the setup by sitting in the dark — can you reach everything without standing up?',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'init-36',
    title: 'Get a good nursing pillow — even for bottle feeding',
    body: 'A proper support pillow takes the weight off your arms and brings baby to the right height. After 30 minutes of feeding 8 times a day, your arms, shoulders, and back will thank you. This is not a luxury — it is ergonomic necessity.',
    nurseInsight: 'Repetitive strain from feeding without support causes shoulder, neck, and wrist pain that can take months to resolve. A nursing pillow is not a breastfeeding accessory — it is an ergonomic tool that prevents injury. Eight 30-minute feeds a day is 4 hours of sustained arm work.',
    actionSteps: [
      'Buy a firm, C-shaped nursing pillow that wraps around your waist.',
      'Practice positioning it before baby arrives — it should bring baby to nipple height without you leaning down.',
      'Use it for every feed, whether breast or bottle, to protect your posture.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'init-37',
    title: 'Scatter burp cloths in every room of the house',
    body: 'You will go through 8-12 burp cloths a day in the first months. Buy more than you think you need and stage them everywhere — by the couch, the bed, the feeding chair, the diaper station. Muslin cloths are absorbent and dry fast.',
    nurseInsight: 'Spit-up happens without warning. If there is no burp cloth within arm\'s reach, your shirt, the couch, and your sanity take the hit. Staging them everywhere means you grab one reflexively instead of scrambling while holding a spitting-up baby.',
    actionSteps: [
      'Buy at least 20 muslin burp cloths — you will use 8-12 per day.',
      'Place 2-3 in every room: couch, bed, feeding chair, changing station, diaper caddy.',
      'Throw them in the wash daily and restock each spot from the clean pile.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'init-38',
    title: 'Save a lactation consultant\'s number in your phone now',
    body: 'Do not wait until you are sobbing at 3 AM with cracked nipples and a screaming baby to look for help. Find an IBCLC (International Board Certified Lactation Consultant) now and save their number. Many do virtual consultations. Your insurance may cover visits.',
    nurseInsight: 'Breastfeeding problems escalate fast — a bad latch at 24 hours becomes cracked, bleeding nipples at 48 hours and a dehydrated baby at 72. Having a lactation consultant\'s number saved means you call for help before it becomes a crisis instead of after.',
    actionSteps: [
      'Search for an IBCLC near you — your hospital, OB office, or insurance portal can provide referrals.',
      'Save their number and check if they offer virtual visits or after-hours support.',
      'Call your insurance to verify lactation consultant coverage before delivery.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'init-39',
    title: 'If formula feeding: have a 2-week supply before baby arrives',
    body: 'Formula shortages happen and stores run out. Have at least 2 weeks\' worth of your chosen formula stocked before your due date. Ask your pediatrician which brand they recommend — and have a backup brand in mind in case your first choice is unavailable.',
    nurseInsight: 'I have seen formula shortages leave new parents driving to 5 stores at midnight. Having a 2-week supply means you never face that panic. Your pediatrician can also recommend equivalent backup brands so you are not starting from zero if your first choice is out.',
    actionSteps: [
      'Ask your pediatrician which formula brand they recommend and buy a 2-week supply.',
      'Identify a backup brand with the same formulation in case of shortages.',
      'Store formula in a cool, dry place and check expiration dates.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'init-40',
    title: 'Stock breast milk storage bags or containers',
    body: 'If you plan to pump even occasionally, have storage bags ready. Label every bag with the date and amount. Fresh breast milk is good for 4 hours at room temp, 4 days in the fridge, and 6-12 months in a deep freezer. Know these numbers.',
    nurseInsight: 'Pumped milk that is not stored correctly is wasted milk — and every ounce took effort to produce. Knowing the storage rules (4 hours room temp, 4 days fridge, 6-12 months freezer) prevents you from throwing away liquid gold out of uncertainty.',
    actionSteps: [
      'Buy breast milk storage bags and a permanent marker for labeling.',
      'Write the date and amount on every bag immediately after pumping.',
      'Post the storage times (4-4-6) on your fridge for quick reference.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'init-41',
    title: 'Build a one-handed snack station for yourself',
    body: 'You will be feeding baby with one hand and starving with the other. Fill a basket near your feeding spot with protein bars, trail mix, dried fruit, crackers, and nut butter packets. If you are not eating, your milk supply suffers and your patience disappears.',
    nurseInsight: 'Breastfeeding burns 500 extra calories a day. Skipping meals because both hands are busy causes your blood sugar to crash, your milk supply to dip, and your mood to spiral. A snack basket at arm\'s reach keeps you fueled without needing to put baby down.',
    actionSteps: [
      'Fill a basket or drawer near your feeding chair with protein bars, trail mix, crackers, nut butter packets, and dried fruit.',
      'Restock it every evening when you restock the diaper caddy.',
      'Include a few treats you love — emotional nourishment is real nourishment.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'init-42',
    title: 'Put a water bottle at every feeding spot',
    body: 'Breastfeeding makes you desperately thirsty — it is your body\'s signal that it needs fluid to produce milk. Have a large insulated water bottle at every place you feed. Aim for at least 80 oz of water daily. Dehydration tanks your milk supply fast.',
    nurseInsight: 'The letdown reflex triggers intense thirst — if there is no water within reach, you either unlatch baby to go get it or suffer through the feed dehydrated. Low fluid intake is the most easily preventable cause of low milk supply I see.',
    actionSteps: [
      'Buy 2-3 large insulated water bottles and place one at each feeding location.',
      'Fill them all every morning and refill throughout the day.',
      'Aim for at least 80 oz total — set a hydration reminder on your phone if needed.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'init-43',
    title: 'Learn proper latch or bottle angle before delivery',
    body: 'Watch a video on proper breastfeeding latch (baby takes the whole areola, not just the nipple) or paced bottle feeding (bottle at a 45-degree angle, baby in a semi-upright position). Learning the technique now, when you can focus, saves tears later.',
    nurseInsight: 'A bad latch causes cracked nipples, low transfer, and a frustrated baby — all within the first 24 hours. Learning the technique in advance, when your brain works and your body does not hurt, gives you a massive head start over figuring it out while exhausted.',
    actionSteps: [
      'Watch a 5-minute video on proper breastfeeding latch: baby takes the entire areola, chin pressed into breast, nose free.',
      'Watch a paced bottle-feeding video: bottle at 45 degrees, baby semi-upright, pausing every ounce.',
      'Practice the hold with a doll or stuffed animal to build muscle memory before delivery.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'init-44',
    title: 'Set up a bottle brush and drying rack by the sink',
    body: 'You will wash bottles 6-10 times a day. A dedicated bottle brush, a clean drying rack, and a small basin of hot soapy water near your kitchen sink turns this chore from annoying to automatic. Clean immediately after each feed — dried milk is cement.',
    nurseInsight: 'Dried breast milk or formula in a bottle is nearly impossible to scrub off and breeds bacteria fast. Washing immediately after each feed takes 30 seconds. Letting them pile up in the sink means a 20-minute scrubbing session you do not have the energy for.',
    actionSteps: [
      'Set up a dedicated bottle brush and a clean drying rack next to your kitchen sink.',
      'Wash every bottle immediately after each feed with hot soapy water.',
      'Replace the bottle brush every 4-6 weeks — they harbor bacteria over time.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },

  // ── Bath Time (10 items) ───────────────────────────────────

  {
    id: 'init-45',
    title: 'Get a baby bathtub or sink insert set up',
    body: 'A small infant tub or a foam insert for your kitchen sink works perfectly. The goal is a surface that keeps baby slightly reclined and secure so you always have one hand free. Do not use a full bathtub — newborns slip and it wastes water.',
    nurseInsight: 'A kitchen sink at counter height saves your back, which matters enormously when you are healing from delivery. Bending over a full bathtub with stitches or a C-section incision is painful and unsafe. The smaller the tub, the more secure baby feels and the more control you have.',
    actionSteps: [
      'Buy a small infant tub or a foam sink insert — test it in your sink before baby arrives.',
      'Position it near warm running water so you can adjust temperature easily.',
      'Practice filling it to hip-level depth on baby and check that the recline angle keeps their head above water.',
    ],
    category: 'Bath Time',
    source: 'static',
  },
  {
    id: 'init-46',
    title: 'Sponge baths ONLY until the cord stump falls off',
    body: 'The umbilical cord stump needs to stay dry to heal and detach (usually 1-3 weeks). Until then, warm sponge baths only — no submerging. Wash one area at a time and keep the rest wrapped in a towel. Face first, diaper area last.',
    nurseInsight: 'A wet umbilical stump takes longer to dry, detach, and heal — and a moist stump is a breeding ground for bacteria. I have seen stump infections that required antibiotics and hospital readmission, all because someone submerged the baby too early. Sponge baths are temporary — 1 to 3 weeks — and they protect your baby from a completely preventable complication.',
    actionSteps: [
      'Set up a sponge bath station: warm room, towel underneath, warm damp washcloth, dry towel ready.',
      'Wash one body area at a time, keeping the rest covered with a dry towel.',
      'Clean face and head first, diaper area last — always in that order.',
    ],
    category: 'Bath Time',
    source: 'static',
  },
  {
    id: 'init-47',
    title: 'Buy a bath thermometer — do not trust your hand',
    body: 'The ideal bath water temperature is 98-100°F (37-38°C). Your hand adapts to heat too quickly to be reliable. A simple floating thermometer takes the guesswork out. Water that feels "nice" to an adult can actually be too hot for newborn skin.',
    nurseInsight: 'Adult hands adapt to temperature within seconds — what feels lukewarm to you can actually be 105°F and cause a burn on newborn skin. I have seen bath burns in the ER that happened because a parent trusted their hand. A $5 thermometer eliminates this risk entirely.',
    actionSteps: [
      'Buy a simple floating bath thermometer or a tub with a built-in temperature indicator.',
      'Test the water every single time before baby goes in — aim for 98-100°F (37-38°C).',
      'Run your elbow (thinner skin than your hand) through the water as a secondary check.',
    ],
    category: 'Bath Time',
    source: 'static',
  },
  {
    id: 'init-48',
    title: 'Stock 3-4 soft hooded towels',
    body: 'Babies lose body heat fast when wet. Have a hooded towel ready to wrap them immediately when they come out of the water. You need at least 3 — one in use, one drying, one clean and ready. Regular towels are too rough and too big.',
    nurseInsight: 'Newborns lose body heat 4 times faster than adults, and wet skin accelerates heat loss dramatically. A hooded towel traps heat at the head — where most heat escapes — and wrapping immediately prevents the cold-shock crying that makes bath time stressful for everyone.',
    actionSteps: [
      'Buy 3-4 soft hooded towels and have one unfolded and ready before you start every bath.',
      'Wrap baby head-first the moment they come out of the water — do not pause to drain the tub first.',
      'Keep a spare in the dryer for an extra-warm wrap on cold days.',
    ],
    category: 'Bath Time',
    source: 'static',
  },
  {
    id: 'init-49',
    title: 'Choose fragrance-free, tear-free baby wash',
    body: 'One product — that is all you need. A gentle, fragrance-free, tear-free wash that works for hair and body. Newborn skin is thinner than yours and absorbs chemicals faster. For the first 4-6 weeks, plain warm water is honestly enough.',
    nurseInsight: 'Newborn skin is 30% thinner than adult skin and absorbs chemicals at a higher rate. Fragrances and dyes are the number one cause of contact dermatitis in infants. For the first month, warm water alone cleans a newborn perfectly. One gentle wash for hair and body is all you need after that.',
    actionSteps: [
      'Buy one fragrance-free, tear-free baby wash that works for both hair and body.',
      'For the first 4-6 weeks, use only warm water — no soap needed for a newborn.',
      'If baby develops dry patches or rash, stop the wash and return to water only.',
    ],
    category: 'Bath Time',
    source: 'static',
  },
  {
    id: 'init-50',
    title: 'Gather soft washcloths — at least 6-8',
    body: 'Soft cotton washcloths are your multi-tool. Use them for bathing, wiping spit-up, cleaning faces, and as a warm compress on baby\'s tummy. Dedicate some for bath use only and keep the rest scattered around the house.',
    nurseInsight: 'Washcloths are the most underrated item in your baby kit. You will use them for baths, spit-up, face wipes, warm compresses for gas pain, and cold compresses for teething later. Having too few means you are constantly washing. Buy more than you think you need.',
    actionSteps: [
      'Buy at least 8 soft cotton washcloths — dedicate half for bath use and half for general use.',
      'Keep bath washcloths separate to prevent cross-contamination from spit-up or diaper area.',
      'Wash them after every use in hot water — they harbor bacteria quickly when damp.',
    ],
    category: 'Bath Time',
    source: 'static',
  },
  {
    id: 'init-51',
    title: 'Set up a warm post-bath routine',
    body: 'Have everything ready before the bath ends: hooded towel, clean diaper, fragrance-free lotion, and a cozy outfit. Wrap baby immediately, pat dry gently (never rub), apply a thin layer of moisturizer, and dress them. Many babies find this routine beautifully soothing before bed.',
    nurseInsight: 'Babies thrive on predictable sequences. A consistent post-bath routine — towel, lotion, fresh diaper, pajamas — becomes a powerful sleep cue within weeks. The babies who develop the strongest sleep associations are the ones whose parents established a calm, identical routine from the very beginning.',
    actionSteps: [
      'Lay out the hooded towel, clean diaper, fragrance-free lotion, and pajamas before you start the bath.',
      'After wrapping baby, pat skin dry gently — never rub, which irritates newborn skin.',
      'Apply a thin layer of moisturizer, focusing on dry areas and skin folds, then dress baby warmly.',
    ],
    category: 'Bath Time',
    source: 'static',
  },
  {
    id: 'init-52',
    title: 'Never leave baby unattended in water — not even for a second',
    body: 'Not to grab a towel. Not to answer the phone. Not for anything. A baby can drown in one inch of water in under 60 seconds, silently. If you forgot something, wrap baby in a towel and take them with you. This is the one bath rule with zero flexibility.',
    nurseInsight: 'I need you to hear this: a baby can drown in one inch of water in under 60 seconds, and they do it silently — no splashing, no crying. This is not about being paranoid. This is the one rule in newborn care where there is absolutely zero room for exception. Not even for 5 seconds.',
    actionSteps: [
      'Gather every single item you need — towel, washcloth, soap, clean diaper, clothes — before putting baby in water.',
      'If you forgot something, wrap baby in a towel and take them with you. Period.',
      'Tell every caregiver this rule explicitly — do not assume they know.',
    ],
    category: 'Bath Time',
    source: 'static',
  },
  {
    id: 'init-53',
    title: 'Use fragrance-free baby lotion after baths',
    body: 'Newborn skin dries out quickly, especially in winter or air-conditioned rooms. A thin layer of fragrance-free, hypoallergenic moisturizer after each bath protects the skin barrier. Focus on creases — elbows, behind ears, neck folds — where dryness hides.',
    nurseInsight: 'The newborn skin barrier is immature and takes 6-12 months to fully develop. Fragrance, even natural fragrance, contains allergens that can trigger eczema flares in sensitive babies. A simple, fragrance-free moisturizer after baths maintains the skin barrier without introducing irritants.',
    actionSteps: [
      'Choose a fragrance-free, hypoallergenic baby lotion or cream — thicker creams protect better than thin lotions.',
      'Apply after every bath while skin is still slightly damp to lock in moisture.',
      'Pay extra attention to creases: elbows, behind ears, neck folds, and between fingers.',
    ],
    category: 'Bath Time',
    source: 'static',
  },
  {
    id: 'init-54',
    title: 'Bathe 2-3 times per week — daily baths dry out skin',
    body: 'New parents often think babies need a daily bath. They do not. Two to three baths per week is plenty for a newborn. Daily bathing strips natural oils from their delicate skin. In between, a warm washcloth wipe-down of face, hands, and diaper area is all you need.',
    nurseInsight: 'Over-bathing is the most common cause of dry skin and eczema flares in newborns that I see. Their skin produces less oil than ours and cannot replace it as quickly. Two to three baths per week is the pediatric recommendation — everything else is just daily spot-cleaning with a warm cloth.',
    actionSteps: [
      'Bathe baby 2-3 times per week maximum — mark bath days on your calendar if it helps.',
      'On non-bath days, wipe face, hands, neck folds, and diaper area with a warm damp cloth.',
      'If baby\'s skin looks dry or flaky, reduce baths to twice per week and increase moisturizer.',
    ],
    category: 'Bath Time',
    source: 'static',
  },

  // ── Postpartum Recovery (12 items) ─────────────────────────

  {
    id: 'init-55',
    title: 'Buy a real peri bottle — not the hospital freebie',
    body: 'The hospital gives you a basic squeeze bottle. Upgrade to an angled peri bottle that sprays upward — the difference is night and day. Fill it with warm water and use it every time you use the toilet for the first 2-4 weeks. Your perineum will heal faster.',
    nurseInsight: 'The hospital peri bottle is designed to barely function. An angled bottle that sprays upward lets you clean without reaching, which matters when you have stitches and everything hurts. This $12 upgrade is the single most recommended purchase by postpartum nurses everywhere.',
    actionSteps: [
      'Buy an angled peri bottle that sprays upward — order it before your due date.',
      'Fill with warm water and use every time you use the toilet for 2-4 weeks.',
      'Pat dry gently afterward — never wipe across stitches or irritated tissue.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'init-56',
    title: 'Stock witch hazel pads and cooling spray',
    body: 'Tuck witch hazel pads (like Tucks) between your pad and your skin for instant soothing relief. A perineal cooling spray gives you a hit of numbness when you need it most. Layer them: pad, witch hazel pad, then underwear. You will feel the difference immediately.',
    nurseInsight: 'Witch hazel is a natural anti-inflammatory that reduces swelling and soothes irritated tissue on contact. Layering it between your pad and skin provides continuous low-level relief. Combined with a cooling spray for acute moments, this two-step approach is what we recommend on every postpartum unit I have worked on.',
    actionSteps: [
      'Buy witch hazel pads (Tucks) and a perineal cooling spray before delivery.',
      'Layer them: maxi pad on the bottom, witch hazel pad on top, then underwear.',
      'Reapply with every pad change — the relief is immediate and cumulative.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'init-57',
    title: 'Get stool softeners — trust me on this one',
    body: 'That first postpartum bowel movement is genuinely scary for most women. Start taking a stool softener (docusate sodium) the day you deliver, and keep taking it for 1-2 weeks. Drink plenty of water, eat fiber. Do not push. Your body has been through enough.',
    nurseInsight: 'I am going to be direct with you: the first postpartum bowel movement terrifies almost every woman I have cared for, and for good reason — your body is swollen, sore, and scared. A stool softener removes the fear by removing the strain. Start it the day you deliver and do not stop for at least a week.',
    actionSteps: [
      'Buy docusate sodium (Colace) before delivery and start taking it the day baby is born.',
      'Drink at least 64 oz of water daily and eat fiber-rich foods: oatmeal, berries, whole grains.',
      'Do not push or strain — let the softener do its job. If you have not gone in 3 days, call your provider.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'init-58',
    title: 'Prep ice packs for your perineum',
    body: 'Frozen padsicles are a postpartum gift from the gods. Soak maxi pads with witch hazel and aloe, fold them, and freeze. Or buy pre-made perineal ice packs. Apply for 20 minutes on, 20 minutes off during the first 48-72 hours. The swelling is real and cold is the remedy.',
    nurseInsight: 'Perineal swelling peaks at 48-72 hours postpartum and cold is the most effective treatment. Frozen padsicles — pads soaked in witch hazel and aloe, then frozen — combine cold therapy with topical relief in one step. Every postpartum nurse I know swears by them.',
    actionSteps: [
      'Make padsicles: soak maxi pads with witch hazel and aloe vera gel, fold in plastic wrap, and freeze.',
      'Apply for 20 minutes on, 20 minutes off during the first 48-72 hours.',
      'If you do not want to DIY, buy pre-made perineal cold packs — they work just as well.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'init-59',
    title: 'Stock high-waisted postpartum underwear',
    body: 'Your abdomen needs gentle support, not compression. High-waisted, soft, stretchy underwear (disposable or washable) in a size larger than your pre-pregnancy size. You will bleed for 2-6 weeks postpartum — plan for it with comfortable, breathable coverage.',
    nurseInsight: 'Your abdomen needs gentle support, not compression — tight waistbands increase pressure on a healing pelvic floor and can worsen swelling. High-waisted, stretchy underwear holds your pad securely, supports your belly comfortably, and accommodates the 2-6 weeks of postpartum bleeding that no one warns you about.',
    actionSteps: [
      'Buy high-waisted, stretchy underwear in one size larger than your pre-pregnancy size.',
      'Stock both disposable (for the first week when bleeding is heaviest) and washable pairs.',
      'Avoid anything with tight elastic or compression panels — gentle support only.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'init-60',
    title: 'Fill the freezer with at least 7 days of meals',
    body: 'You will not cook for the first week, and probably not the second either. Batch-cook soups, pasta bakes, breakfast burritos, and casseroles. Label every container with contents and date. Single-serve portions mean you can eat whenever you are hungry — no coordinating meals.',
    nurseInsight: 'In 25 years of postpartum care, the single strongest predictor of how well a mother recovers is how well she eats in the first two weeks. You will not have the energy or time to cook. Freezer meals prepared in advance are the difference between eating well and surviving on crackers and cereal.',
    actionSteps: [
      'Batch-cook at least 7 days of meals: soups, casseroles, pasta bakes, and breakfast burritos.',
      'Freeze in single-serve portions and label every container with contents and date.',
      'Include high-protein, iron-rich meals — your body needs both for recovery and milk production.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'init-61',
    title: 'Line up a support person for the first two weeks',
    body: 'Not a visitor — a helper. Someone who will do laundry, cook meals, hold the baby while you shower, and let you nap. This person should make you feel calm, not judged. If you do not have someone, look into postpartum doulas. This is not weakness — it is what every culture except ours expects.',
    nurseInsight: 'The number one thing that separates mothers who recover well from those who struggle is having a reliable support person in the first two weeks. Not a visitor who wants to hold the baby — a helper who does laundry, cooks, and gives you permission to rest. In every other culture, this is expected. In ours, you have to insist on it.',
    actionSteps: [
      'Identify one person who can be present daily for the first two weeks — partner, family member, or postpartum doula.',
      'Give them a specific list: laundry, meals, dishes, holding baby while you shower or nap.',
      'If no one is available, research postpartum doulas now — many offer sliding-scale pricing.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'init-62',
    title: 'Buy comfortable nursing-friendly pajamas',
    body: 'You will live in pajamas for weeks. Get 3-4 sets of soft, button-front or pull-aside tops and loose bottoms. Dark colors hide stains better. Nursing-friendly means you can feed without fully undressing — because at 3 AM, every second of convenience matters.',
    nurseInsight: 'You will live in these clothes for weeks, and you will feed in them 8-12 times a day. Button-front or pull-aside tops mean you can nurse or pump without fully undressing at 3 AM. Dark colors hide the inevitable stains. This is not vanity — it is practical clothing that makes the hardest weeks slightly more bearable.',
    actionSteps: [
      'Buy 3-4 sets of soft, button-front or pull-aside tops with loose, stretchy bottoms.',
      'Choose dark colors — they hide milk, spit-up, and other stains better.',
      'Wash and have them ready before your due date so they are soft and broken in.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'init-63',
    title: 'Understand baby blues vs postpartum depression',
    body: 'Baby blues (mood swings, crying, anxiety) are normal and peak around day 3-5, fading by week 2. If feelings of hopelessness, rage, or disconnection from your baby last beyond 2 weeks or worsen, that is postpartum depression — and it is treatable. Tell your partner what to watch for. No shame, just get help.',
    nurseInsight: 'Baby blues affect up to 80% of new mothers and resolve by week 2. Postpartum depression is different — it is persistent, worsening, and it lies to you by saying this is just how motherhood feels. It is not. Tell your partner exactly what to watch for and agree in advance that if they see the signs, you will call your provider. No arguments, no shame.',
    actionSteps: [
      'Learn the difference: baby blues (tearfulness, mood swings, anxiety) peak day 3-5 and fade by week 2.',
      'Postpartum depression lasts beyond 2 weeks and includes hopelessness, rage, disconnection from baby, or intrusive thoughts.',
      'Tell your partner the warning signs now and agree together to call your OB or midwife immediately if they appear.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'init-64',
    title: 'Schedule your 6-week postpartum appointment now',
    body: 'Book it before baby arrives — you will not remember to do it later. This appointment checks your physical recovery, screens for postpartum depression, discusses contraception, and clears you for exercise and intimacy. It is YOUR check-up. Do not skip it.',
    nurseInsight: 'This appointment is the most skipped appointment in postpartum care, and it is one of the most important. It screens for depression, checks your physical healing, discusses contraception, and addresses any lingering pain. Book it before delivery — you will not remember afterward, and your recovery depends on this follow-up.',
    actionSteps: [
      'Call your OB or midwife now and schedule your 6-week postpartum visit before baby arrives.',
      'Write it on your calendar and set a phone reminder — sleep deprivation erases memory.',
      'Prepare a list of questions and concerns in advance: pain, bleeding, mood, contraception, exercise clearance.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'init-65',
    title: 'Have nipple cream on hand even if formula feeding',
    body: 'Your milk comes in whether you plan to breastfeed or not. Engorgement, leaking, and nipple sensitivity happen to every postpartum body. Lanolin cream or a gentle nipple balm soothes soreness. Cold cabbage leaves in your bra actually help with engorgement — old nurse trick that works.',
    nurseInsight: 'Your milk comes in around day 3-5 regardless of your feeding plan — it is a hormonal response, not a choice. Engorgement, leaking, and nipple sensitivity happen to every postpartum body. Having lanolin or nipple balm on hand prevents cracked, bleeding nipples from becoming a barrier to feeding or a source of unnecessary pain.',
    actionSteps: [
      'Buy lanolin cream or a gentle nipple balm and have it accessible before delivery.',
      'Apply after every feed or whenever nipples feel dry or sore — you do not need to wipe it off before feeding.',
      'For engorgement: cold cabbage leaves in your bra genuinely reduce swelling — this is nurse-tested and evidence-supported.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'init-66',
    title: 'Accept that recovery takes 6-8 weeks minimum',
    body: 'You grew a human being. Your organs shifted. Your abdominal muscles separated. Whether you delivered vaginally or via C-section, full recovery takes 6-8 weeks at minimum — often longer. Rest is not optional, it is medical. Anyone who pressures you to "bounce back" has no idea what your body just did.',
    nurseInsight: 'I tell every mother: you would not run a marathon and expect to feel normal the next day. You just grew a human being, your organs shifted, your muscles separated, and you either pushed a baby out or had major abdominal surgery. Six to eight weeks of recovery is the medical minimum. Rest is not lazy — it is how your body heals.',
    actionSteps: [
      'Accept that full recovery takes 6-8 weeks minimum — longer for C-sections or complicated deliveries.',
      'Prioritize rest, nutrition, and hydration above everything except baby care.',
      'Ignore anyone who pressures you to bounce back — your body is healing from a massive physical event.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
];

// ============================================================
// Surprise Pool — Extra suggestions drawn on demand when
// user completes items and the unchecked pool runs low
// 4-5 per category · Same veteran nurse voice
// ============================================================

export const SURPRISE_POOL: PrepSuggestion[] = [
  // ── Safety extras ──────────────────────────────────────────

  {
    id: 'sur-1',
    title: 'Cover all electrical outlets in reachable areas',
    body: 'Yes, your newborn cannot crawl yet. But these things are easy to forget once they start moving — and that day arrives faster than you expect. Outlet covers are cheap, take 5 minutes to install, and eliminate one of the top causes of electrical injury in homes with small children.',
    nurseInsight: 'Babies go from immobile to grabbing and crawling faster than any parent expects. The day your baby starts moving is not the day to start childproofing — it is already too late by then. Outlet covers take 5 minutes to install and prevent one of the most common household electrical injuries in children under 5.',
    actionSteps: [
      'Buy outlet covers for every reachable outlet in your home — they cost pennies each.',
      'Install them now, not when baby starts crawling — by then you will be too busy.',
      'Check that covers are flush and secure — loose covers become choking hazards themselves.',
    ],
    category: 'Safety',
    source: 'static',
  },
  {
    id: 'sur-2',
    title: 'Plan two escape routes from every room with baby',
    body: 'Walk through your home and identify two exit paths from the nursery, your bedroom, and the living room. In a fire, you will not think clearly — especially while holding a baby. Knowing your routes by muscle memory matters. Practice them once.',
    nurseInsight: 'In a fire, adrenaline destroys your ability to think clearly — especially when you are holding a baby. Families who have walked their escape routes once can execute them on autopilot. Families who have not freeze, backtrack, and waste precious seconds. A 5-minute walkthrough can save your family\'s life.',
    actionSteps: [
      'Walk through your home and identify two exit paths from the nursery, your bedroom, and the living room.',
      'Practice the routes once with your partner while carrying a bundle the weight of a baby.',
      'Agree on a meeting point outside and keep a pair of shoes by the bed for nighttime emergencies.',
    ],
    category: 'Safety',
    source: 'static',
  },
  {
    id: 'sur-3',
    title: 'Install a baby monitor and test it from every room',
    body: 'Set it up early so you can troubleshoot WiFi dead spots or camera angles before you are sleep-deprived. Video monitors give peace of mind, but audio-only works too. The important thing is that you can hear baby cry from wherever you are in the house.',
    nurseInsight: 'Setting up a baby monitor when you are sleep-deprived and baby is already here leads to frustration, WiFi troubleshooting at 2 AM, and a monitor you do not trust. Set it up early, test it from every room, and work out the bugs now — not when you actually need it.',
    actionSteps: [
      'Install the monitor in the nursery and test video and audio from every room in the house.',
      'Check for WiFi dead spots and adjust your router or monitor placement if needed.',
      'Test the night vision mode in full darkness to make sure you can see baby clearly.',
    ],
    category: 'Safety',
    source: 'static',
  },
  {
    id: 'sur-4',
    title: 'Create a safe sleep card for every caregiver',
    body: 'Grandparents, babysitters, and partners need to know the rules: back to sleep, nothing in the crib, room temperature 68-72°F. Write it on an index card and tape it near the crib. People mean well but often rely on outdated advice from their own parenting era.',
    nurseInsight: 'Grandparents raised children when belly sleeping was standard, bumpers were recommended, and blankets in the crib were normal. They mean well, but their instincts are based on outdated guidelines that we now know increase SIDS risk. A written card removes the awkwardness of correcting someone you love.',
    actionSteps: [
      'Write the safe sleep rules on an index card: back to sleep, nothing in the crib, room 68-72°F, firm flat mattress.',
      'Tape it near the crib where every caregiver can see it.',
      'Have a direct conversation with grandparents and regular babysitters — show them the card and explain why the rules have changed.',
    ],
    category: 'Safety',
    source: 'static',
  },

  // ── Hospital Bag extras ────────────────────────────────────

  {
    id: 'sur-5',
    title: 'Bring a nursing-friendly nightgown for the hospital',
    body: 'The hospital gown works for delivery, but afterward, change into your own soft, button-front nightgown. It makes skin-to-skin and breastfeeding easier, and you will feel more like a person and less like a patient. Dark colors hide stains.',
    nurseInsight: 'The hospital gown makes you feel like a patient. Changing into your own soft nightgown after delivery is one of the simplest things you can do to feel human again. Button-front means easy access for skin-to-skin and breastfeeding without wrestling fabric while you are exhausted and sore.',
    actionSteps: [
      'Pack a soft, button-front nightgown in your hospital bag — dark colors hide stains.',
      'Change out of the hospital gown as soon as you feel ready after delivery.',
      'Bring a second one in case the first gets stained during feeding or skin-to-skin.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },
  {
    id: 'sur-6',
    title: 'Pack a folder with your birth preferences and insurance cards',
    body: 'Birth plan, insurance card, ID, pre-registration paperwork, and your pediatrician\'s name and number — all in one folder. When you arrive in active labor, you will not want to dig through a bag. Hand the folder to your partner or nurse.',
    nurseInsight: 'When you arrive at the hospital in active labor, you will not want to fill out paperwork or remember your insurance number. A single folder with everything — birth plan, IDs, insurance, pediatrician info — that your partner can hand to the admissions nurse eliminates one entire source of stress during the most intense experience of your life.',
    actionSteps: [
      'Put your birth plan, insurance card, photo ID, and pre-registration paperwork in one folder.',
      'Add your pediatrician\'s name and phone number, plus your OB\'s after-hours number.',
      'Give the folder to your partner and tell them it goes to the admissions nurse when you arrive.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },
  {
    id: 'sur-7',
    title: 'Bring a small Bluetooth speaker for your room',
    body: 'Calm music during labor and soft background audio during recovery can genuinely help with pain management and relaxation. A small speaker is better than phone speakers and easier than managing earbuds during contractions.',
    nurseInsight: 'Music during labor is evidence-based pain management — studies show it reduces perceived pain intensity and anxiety. During recovery, soft background audio creates a calmer environment for both you and baby. A small speaker costs almost nothing and gives you control over your auditory environment in a noisy hospital.',
    actionSteps: [
      'Pack a small Bluetooth speaker in your hospital bag — charge it fully before you go.',
      'Create a calm playlist in advance: slow music for labor, soft background music for recovery.',
      'Keep the volume low — it should be soothing background, not entertainment.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },
  {
    id: 'sur-8',
    title: 'Pack a going-home outfit for baby with the car seat',
    body: 'A soft onesie, socks, a hat, and a light blanket. Keep it simple — you will be fumbling with the car seat buckle for the first time. Avoid anything with buttons up the back or complicated snaps. Zip-up sleepers are your friend.',
    nurseInsight: 'You will be fumbling with a car seat buckle for the first time while exhausted, emotional, and possibly in pain. A complicated outfit with a dozen snaps makes this moment harder. A simple zip-up sleeper is the single most practical going-home outfit — cute photos can happen later when you have slept.',
    actionSteps: [
      'Pack a simple zip-up sleeper, socks, a hat, and a light receiving blanket.',
      'Avoid outfits with buttons up the back, snaps, or multiple layers — you will struggle with the car seat.',
      'Practice buckling the car seat harness over this outfit before the hospital trip.',
    ],
    category: 'Hospital Bag',
    source: 'static',
  },

  // ── Diaper Station extras ──────────────────────────────────

  {
    id: 'sur-9',
    title: 'Know what normal newborn poop looks like',
    body: 'Day 1-2: black and tarry (meconium). Day 3-4: green and transitional. Day 5+: yellow, seedy, and loose (breastfed) or tan and firmer (formula-fed). This progression is a sign that baby is feeding well. Take a photo if you are concerned and show your pediatrician.',
    nurseInsight: 'New parents call about poop more than almost anything else — and most of the time, what they are seeing is completely normal. The color progression (black to green to yellow) is your best real-time indicator that baby is feeding well. Knowing what to expect prevents panic calls and helps you spot actual problems faster.',
    actionSteps: [
      'Learn the progression: days 1-2 black tarry meconium, days 3-4 green transitional, day 5+ yellow seedy (breastfed) or tan (formula).',
      'Take a photo of any diaper that concerns you — it is easier to show your pediatrician than to describe it.',
      'Call your pediatrician if you see white, red, or persistently black stool after day 3.',
    ],
    category: 'Diaper Station',
    source: 'static',
  },
  {
    id: 'sur-10',
    title: 'Track wet and dirty diapers the first week',
    body: 'Day 1: at least 1 wet diaper. Day 2: at least 2. Day 3: at least 3. By day 5, aim for 6+ wet diapers per day. This is the single best indicator that your newborn is getting enough milk. I have seen this chart save babies from dehydration. Track it.',
    nurseInsight: 'Diaper output is the most reliable indicator of whether your newborn is getting enough milk. I have seen this simple tracking chart catch dehydration before it became an ER visit. Day 1: 1 wet, Day 2: 2, Day 3: 3, and by day 5: 6 or more. This is the math that tells you feeding is working.',
    actionSteps: [
      'Track every wet and dirty diaper for the first week — use a simple tally on paper or in this app.',
      'Know the minimums: day 1 = 1 wet, day 2 = 2, day 3 = 3, day 5+ = 6 or more.',
      'If baby falls below these minimums, call your pediatrician or lactation consultant that day.',
    ],
    category: 'Diaper Station',
    source: 'static',
  },
  {
    id: 'sur-11',
    title: 'Keep the diaper area dry with air time',
    body: 'For mild rash or redness, the best treatment is air. Let baby lie diaper-free on a waterproof pad for 10-15 minutes a few times a day. Fresh air heals faster than any cream. Yes, you might get peed on. Lay a towel down and relax about it.',
    nurseInsight: 'The best treatment for mild diaper rash is the simplest: air. No cream, no powder — just exposed skin and fresh air for 10-15 minutes a few times a day. Every layer of cream or barrier you add traps moisture against the skin. Air dries the rash out and lets the skin heal naturally.',
    actionSteps: [
      'Lay baby on a waterproof pad or towel and leave the diaper off for 10-15 minutes, 2-3 times a day.',
      'Time it after a fresh diaper change to minimize accidents.',
      'If the rash does not improve in 2-3 days or develops blisters or raw patches, call your pediatrician.',
    ],
    category: 'Diaper Station',
    source: 'static',
  },
  {
    id: 'sur-12',
    title: 'Have a waterproof changing pad cover — or two',
    body: 'The changing pad will get dirty. A lot. A waterproof, machine-washable cover that you can rip off and replace in seconds saves you from scrubbing the pad itself. Buy at least two so one is always clean.',
    nurseInsight: 'The changing pad itself is nearly impossible to clean thoroughly once body fluids soak into the seams. A waterproof, machine-washable cover that you can rip off and replace in 10 seconds keeps the pad underneath sanitary. Having two means one is always clean while the other is in the wash.',
    actionSteps: [
      'Buy at least 2 waterproof, machine-washable changing pad covers.',
      'Keep the spare cover folded and ready near the changing station for instant swap.',
      'Wash covers in hot water after any blowout — do not just wipe and reuse.',
    ],
    category: 'Diaper Station',
    source: 'static',
  },

  // ── Feeding Prep extras ────────────────────────────────────

  {
    id: 'sur-13',
    title: 'Learn to recognize feeding cues before crying',
    body: 'Rooting (turning head, opening mouth), lip smacking, sucking on hands — these are early hunger cues. Crying is a late cue, and a screaming baby has a harder time latching. Feed early, feed often. You cannot overfeed a breastfed newborn.',
    nurseInsight: 'By the time a baby is crying from hunger, they are already past the point of easy feeding. A crying baby tenses up, has trouble latching, gulps air, and feeds poorly. Learning to recognize early cues — rooting, lip smacking, hand sucking — means calmer feeds, better latch, and less gas.',
    actionSteps: [
      'Learn early hunger cues: rooting (turning head with open mouth), lip smacking, and sucking on hands.',
      'Start feeding at the first early cue — do not wait for crying.',
      'If baby is crying, calm them first (skin-to-skin, gentle rocking) before attempting to latch or offer a bottle.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'sur-14',
    title: 'Know the pace of bottle feeding to prevent overfeeding',
    body: 'Hold the bottle at a slight angle (not vertical), let baby draw milk at their own pace, and pause every ounce or two. Paced feeding mimics breastfeeding and prevents baby from gulping too fast. Finish when baby shows fullness cues — turning away, relaxing hands.',
    nurseInsight: 'A vertical bottle pours milk faster than a baby can regulate, which leads to overfeeding, gas, and spit-up. Paced feeding — bottle at a slight angle, pausing every ounce — mimics the natural rhythm of breastfeeding and lets baby recognize their own fullness cues. It prevents the most common bottle-feeding problems I see.',
    actionSteps: [
      'Hold the bottle at a slight angle — never vertical — and let baby draw milk at their own pace.',
      'Pause every ounce or two: tilt the bottle down or remove it briefly so baby can rest.',
      'Stop when baby shows fullness cues: turning away, relaxing hands, slowing their suck.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'sur-15',
    title: 'Know when to wake a newborn to feed',
    body: 'For the first 2 weeks, do not let a newborn sleep longer than 3 hours without feeding — even at night. They need to regain their birth weight. After that, and after your pediatrician gives the green light, you can let them sleep until they wake. Until then: set an alarm.',
    nurseInsight: 'Newborns are sleepy — especially in the first 2 weeks — and some will happily sleep through meals they desperately need. Until baby has regained birth weight (usually by day 10-14), you must wake them every 3 hours to feed, even at night. I have seen dehydration and jaundice from letting sleepy newborns sleep too long.',
    actionSteps: [
      'For the first 2 weeks, set an alarm and wake baby to feed every 3 hours — day and night.',
      'To wake a sleepy baby: undress to the diaper, tickle the feet, place a cool washcloth on their forehead.',
      'After your pediatrician confirms birth weight has been regained, you can stop waking and let baby lead.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'sur-16',
    title: 'Prepare for cluster feeding — it is normal',
    body: 'Around days 2-3 and again at 2-3 weeks, your baby may want to feed every 30-60 minutes for hours on end. This is cluster feeding. It is normal, temporary, and essential for building your milk supply. Stock your feeding station, put on a show, and ride it out.',
    nurseInsight: 'Cluster feeding — nonstop feeding every 30-60 minutes for hours — is not a sign that your milk is insufficient. It is how babies signal your body to increase production. It happens around days 2-3 and again at 2-3 weeks, and it is temporary. The mothers who understand this do not panic and do not reach for formula out of fear.',
    actionSteps: [
      'Expect cluster feeding around days 2-3 and again at 2-3 weeks — it is normal and temporary.',
      'Stock your feeding station: water, snacks, phone charger, a show to watch.',
      'Feed on demand during clusters — this is how your body calibrates milk supply to your baby\'s needs.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },
  {
    id: 'sur-17',
    title: 'Have a backup feeding plan in case of complications',
    body: 'Sometimes breastfeeding does not go as planned — tongue tie, low supply, latch issues. Having formula on hand and a contact for a lactation consultant is not giving up. It is being prepared. Fed is best. Period.',
    nurseInsight: 'The mothers who cope best with feeding complications are the ones who planned for them. Tongue tie, low supply, latch issues, and medical complications can all disrupt breastfeeding. Having formula on hand and a lactation consultant\'s number is not giving up — it is having a safety net so your baby is fed regardless of what happens.',
    actionSteps: [
      'Have a small can of formula and bottles on hand, even if you plan to breastfeed exclusively.',
      'Save an IBCLC\'s number in your phone before delivery for immediate help if needed.',
      'Remember: feeding complications are medical events, not personal failures. Fed is best.',
    ],
    category: 'Feeding Prep',
    source: 'static',
  },

  // ── Bath Time extras ───────────────────────────────────────

  {
    id: 'sur-18',
    title: 'Wash baby\'s hair last to prevent heat loss',
    body: 'Babies lose most of their body heat through their heads. Wash the body first, save the hair for last, and immediately wrap them in a hooded towel when done. This simple sequence keeps baby warmer and calmer throughout the bath.',
    nurseInsight: 'Babies lose up to 75% of their body heat through their head. Washing the head first means baby spends the entire bath with a wet head, losing heat rapidly and becoming increasingly cold and upset. Saving hair for last — and immediately wrapping in a hooded towel — keeps baby warm and calm throughout.',
    actionSteps: [
      'Wash baby\'s body first: chest, arms, legs, back, diaper area.',
      'Wash hair and head last, just before lifting baby out of the water.',
      'Have the hooded towel ready and wrap baby head-first immediately after the final rinse.',
    ],
    category: 'Bath Time',
    source: 'static',
  },
  {
    id: 'sur-19',
    title: 'Know when to clean the umbilical cord stump',
    body: 'Keep it dry and exposed to air. Fold the diaper below it. Do not put alcohol on it (outdated advice). It will look dark and may smell slightly — that is normal. If it becomes red, swollen, oozes pus, or smells foul, call your pediatrician. Most stumps fall off in 1-3 weeks.',
    nurseInsight: 'The old advice was to clean the cord stump with rubbing alcohol. We stopped recommending that because alcohol actually delays healing and increases infection risk. The stump heals fastest when kept dry and exposed to air. It will look dark and crusty — that is normal. What is not normal is redness spreading around the base, pus, or a foul smell.',
    actionSteps: [
      'Keep the cord stump dry and exposed to air — fold the diaper below it.',
      'Do not apply alcohol, ointments, or any products to the stump.',
      'Call your pediatrician if you see redness spreading around the base, yellow or green pus, or a foul smell.',
    ],
    category: 'Bath Time',
    source: 'static',
  },
  {
    id: 'sur-20',
    title: 'Use a warm washcloth on baby\'s tummy during bath time',
    body: 'Place a warm, wet washcloth over baby\'s chest and tummy while you wash other areas. It keeps them warm and provides comfort. Re-warm it with fresh water as needed. This one trick is the difference between a screaming baby and a calm one in the bath.',
    nurseInsight: 'The difference between a baby who screams through every bath and one who stays calm is almost always temperature management. A warm washcloth on the chest and tummy provides continuous warmth and a comforting weight. This single trick transforms bath time from a dreaded event into a soothing routine.',
    actionSteps: [
      'Place a warm, wet washcloth over baby\'s chest and tummy as soon as they are in the tub.',
      'Re-warm the washcloth with fresh warm water every minute or two as it cools.',
      'Keep the washcloth in place while you wash other areas — baby stays warmer and calmer.',
    ],
    category: 'Bath Time',
    source: 'static',
  },
  {
    id: 'sur-21',
    title: 'Clean neck folds, behind ears, and between fingers daily',
    body: 'Milk, sweat, and lint collect in baby\'s neck folds, behind the ears, and between fingers and toes. You do not need a full bath — a warm damp cloth in these hidden spots prevents rashes and that sour-milk smell. Check these areas daily.',
    nurseInsight: 'Milk residue, sweat, and lint accumulate in baby\'s neck folds, behind the ears, and between fingers faster than most parents realize. These hidden spots are where rashes, yeast infections, and that distinctive sour-milk smell develop. A daily wipe-down of these areas prevents problems that would otherwise require medical treatment.',
    actionSteps: [
      'Once a day, gently open baby\'s neck folds, check behind the ears, and separate fingers and toes.',
      'Wipe with a warm damp cloth and pat completely dry — moisture trapped in folds causes rash.',
      'If you notice persistent redness or a yeasty smell in the folds, show your pediatrician.',
    ],
    category: 'Bath Time',
    source: 'static',
  },

  // ── Postpartum Recovery extras ─────────────────────────────

  {
    id: 'sur-22',
    title: 'Set up a meal train for friends and family',
    body: 'Use a free service like MealTrain or TakeThemAMeal and share the link. People want to help but do not know how. Give them a specific, easy way to do it. Include dietary preferences and delivery instructions. This is not charity — it is community, and you deserve it.',
    nurseInsight: 'Every person who says "Let me know if you need anything" means it — but they will never follow through unless you give them something specific and easy to do. A meal train link turns vague offers into actual food on your table. In 25 years, the best-fed postpartum families are the ones who were not too proud to accept help.',
    actionSteps: [
      'Set up a free meal train (MealTrain.com or TakeThemAMeal.com) with available dates and your dietary preferences.',
      'Share the link with friends, family, coworkers, and your partner\'s social circle.',
      'Include delivery instructions: where to leave food, what containers to use, and preferred drop-off times.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'sur-23',
    title: 'Create a cozy recovery station in your bedroom',
    body: 'Extra pillows, a soft blanket, your water bottle, phone charger, snacks, lip balm, nipple cream, and the TV remote — all within arm\'s reach of your bed. For the first 2 weeks, your bedroom is recovery HQ. Make it comfortable and well-stocked.',
    nurseInsight: 'For the first two weeks, your bedroom is not your bedroom — it is your recovery ward. Having everything you need within arm\'s reach means you actually rest instead of getting up 30 times a day. Every time you stand up unnecessarily, you extend your recovery. Build your station and stay in it.',
    actionSteps: [
      'Set up your bedside station: extra pillows, water bottle, phone charger, snacks, lip balm, nipple cream, and TV remote.',
      'Add a basket for diapers, wipes, and a change of baby clothes within reach.',
      'Restock the station every evening so it is fully loaded for nighttime feeds.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'sur-24',
    title: 'Start gentle pelvic floor exercises when cleared',
    body: 'Your pelvic floor just supported a pregnancy and a delivery. Gentle Kegels (not aggressive ones) can start within days of a vaginal birth, or when comfortable after a C-section. A pelvic floor physiotherapist is worth every penny if you have any leaking, pain, or heaviness.',
    nurseInsight: 'Your pelvic floor held the weight of a pregnancy and endured the trauma of delivery. It needs rehabilitation, not neglect. Gentle Kegels can begin within days of a vaginal birth. But if you have any leaking, pain, or heaviness, a pelvic floor physiotherapist is not a luxury — it is targeted medical care that prevents problems from becoming permanent.',
    actionSteps: [
      'Start gentle Kegels within days of vaginal birth, or when comfortable after C-section — squeeze for 5 seconds, release for 5.',
      'Do 10 repetitions, 3 times a day — you can do them while feeding baby.',
      'If you experience any leaking, pain during intimacy, or pelvic heaviness, book a pelvic floor physiotherapist.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'sur-25',
    title: 'Set boundaries with visitors — fiercely',
    body: 'You are not hosting. You are recovering. Visitors should be limited to people who make you feel calm, and they should come with food, not expectations. Short visits, no drop-ins without permission, and mandatory hand washing. Your baby\'s immune system and your mental health come first.',
    nurseInsight: 'In the hospital, I watch exhausted mothers smile through hour-long visits because they feel obligated to be gracious. Your postpartum recovery is not a social event. Every minute spent performing for visitors is a minute you are not sleeping, eating, or bonding. The mothers who recover best are the ones who protect their space fiercely.',
    actionSteps: [
      'Set clear rules before baby arrives: no unannounced visits, mandatory hand washing, 30-minute maximum.',
      'Designate your partner as the gatekeeper — they communicate boundaries so you do not have to.',
      'Visitors should come with food, help with a chore, and leave when you look tired — not when they are ready.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
  {
    id: 'sur-26',
    title: 'Know the signs of postpartum hemorrhage',
    body: 'Soaking through a pad in less than an hour, passing clots larger than a golf ball, dizziness, or a racing heart — call your provider or go to the ER immediately. Postpartum bleeding is normal; heavy, sudden bleeding is not. Trust your body if something feels wrong.',
    nurseInsight: 'Postpartum bleeding is normal. What is not normal is soaking through a pad in under an hour, passing clots larger than a golf ball, or feeling dizzy with a racing heart. These are signs of hemorrhage, and it is a medical emergency. I have seen women wait because they thought heavy bleeding was just part of recovery. It is not. Trust your body and call immediately.',
    actionSteps: [
      'Know the warning signs: soaking a pad in under an hour, clots larger than a golf ball, dizziness, rapid heart rate, or feeling faint.',
      'If you experience any of these, call your provider or go to the ER immediately — do not wait.',
      'Tell your partner these signs too — they may notice changes you are too tired or disoriented to recognize.',
    ],
    category: 'Postpartum Recovery',
    source: 'static',
  },
];

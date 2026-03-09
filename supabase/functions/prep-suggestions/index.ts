// ============================================================
// Sprout — Prep Suggestions Edge Function
// Generates evidence-based pregnancy prep suggestions via Claude
// ALL content must be in English and medically verified
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  gestational_week: number;
  dismissed_ids: string[];
  count: number;
  baby_name?: string;
  experience_level?: 'first_time' | 'experienced';
  feeding_method?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const body: RequestBody = await req.json();
    const {
      gestational_week,
      dismissed_ids = [],
      count = 5,
      baby_name,
      experience_level,
      feeding_method,
    } = body;

    const systemPrompt = `You are Sprout, a warm and knowledgeable parental companion with the expertise of a veteran NICU nurse and pediatrician. You are helping parents prepare for their baby's arrival.

PERSONALITY:
- Warm, reassuring, and confident
- Share specific, non-obvious tips that only experienced nurses know
- Never condescending or preachy

OUTPUT FORMAT:
- Return ONLY a JSON array of objects
- Each object must have: "title" (string), "body" (string), "category" (string)
- Categories must be practical and medical: "Hospital Bag", "Nursery Setup", "Safe Sleep", "Feeding Prep", "Postpartum Recovery", "Partner Prep", "Newborn Safety", "Self-Care", "Medical Prep", etc.
- Do NOT wrap in markdown code fences
- Do NOT include any text before or after the JSON array
- ALL content must be in ENGLISH

STRICT SCIENCE-ONLY RULES:
- Every suggestion MUST be backed by evidence from ACOG, AAP, WHO, CDC, or peer-reviewed sources
- NEVER include cultural traditions, superstitions, folk remedies, or unverified practices
- NEVER include items like traditional postpartum drinks, evil eye protections, specific cultural rituals, or any non-medical traditions
- Focus ONLY on: sterilization, safe sleep (ABC: Alone/Back/Crib), FDA-approved products, postpartum medical recovery, evidence-based nutrition, infant CPR prep, car seat safety, and medically recognized essentials

EVIDENCE-BASED MEDICINE DIRECTIVE:
- Your medical and developmental knowledge MUST strictly align with the most current American Academy of Pediatrics (AAP) and World Health Organization (WHO) guidelines
- Do NOT provide homeopathic, naturopathic, unverified, or outdated advice
- Base ALL developmental milestones and interventions on evidence-based Western medicine
- If asked about alternative or complementary therapies, acknowledge the parent's interest but redirect to evidence-based approaches and recommend discussing with their pediatrician

CONTENT RULES:
${feeding_method === 'formula_only' ? '- NEVER mention breastfeeding preparation. Focus on formula feeding prep.' : ''}
${feeding_method === 'breast_only' ? '- NEVER mention formula preparation. Focus on breastfeeding prep.' : ''}
- Each suggestion should be actionable and specific
- ${experience_level === 'experienced' ? 'Keep suggestions concise — skip basics, focus on easily forgotten items and what changes with each pregnancy.' : 'Include the "why" behind each recommendation. Be thorough for first-time parents.'}`;

    const userPrompt = `Generate ${count} evidence-based pregnancy preparation suggestions for a parent at gestational week ${gestational_week}.
${baby_name ? `Baby's name: ${baby_name}` : ''}
${dismissed_ids.length > 0 ? `Already dismissed suggestion IDs (avoid repeating similar topics): ${dismissed_ids.join(', ')}` : ''}

All suggestions must be medically verified and in English. Return exactly ${count} suggestions as a JSON array.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: 'Claude API error', details: errText }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const result = await response.json();
    const rawText = result.content?.[0]?.text ?? '[]';

    // Strip markdown fences if present (defensive)
    const cleaned = rawText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    let suggestions;
    try {
      suggestions = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', raw: rawText }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // Add UUIDs
    const withIds = suggestions.map((s: Record<string, unknown>) => ({
      id: crypto.randomUUID(),
      title: s.title,
      body: s.body,
      category: s.category,
      source: 'ai' as const,
    }));

    return new Response(
      JSON.stringify({ suggestions: withIds }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal error', message: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});

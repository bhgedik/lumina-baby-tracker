// ============================================================
// Nodd — Activity Suggestions Edge Function
// Generates age-appropriate reading, sensory, and music
// suggestions via Claude. Returns structured JSON.
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  age_months: number;
  corrected_age_months?: number;
  baby_name?: string;
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
      age_months,
      corrected_age_months,
      baby_name,
    } = body;

    const effectiveAge = corrected_age_months ?? age_months;

    const systemPrompt = `You are Nodd, a warm veteran pediatric nurse who helps parents discover age-appropriate activities for their baby. You have deep knowledge of child development, children's literature, and sensory play.

PERSONALITY:
- Warm, encouraging, specific
- Share WHY each suggestion is developmentally appropriate at this age
- Use plain language, never clinical jargon

OUTPUT FORMAT:
- Return ONLY a JSON object with exactly 3 keys: "reading", "sensory", "music"
- Each key contains an array of exactly 3 suggestion objects
- Do NOT wrap in markdown code fences
- Do NOT include any text before or after the JSON

READING suggestions format:
{ "title": "Book Title by Author", "reason": "Why this book is perfect for this age (1 sentence)" }
- Suggest REAL, published children's books appropriate for the baby's age
- Include author name in the title field
- For 0-3 months: high-contrast board books, simple faces
- For 3-6 months: touch-and-feel, crinkle books, bold colors
- For 6-12 months: lift-the-flap, interactive, repetitive rhymes
- For 12+ months: simple stories, animal sounds, daily routines

SENSORY suggestions format:
{ "name": "Activity Name", "reason": "Why and how to do it (1-2 sentences)", "product": "Optional product/toy name or null" }
- Age-appropriate sensory exploration activities
- Include specific products/toys when relevant (real brand names welcome)
- Cover different senses: touch, sight, sound, safe taste exploration
- For newborns: gentle textures, high-contrast visuals, skin contact
- For 3-6m: reaching, grasping, different textures, water play
- For 6-12m: messy play, stacking, filling/dumping, safe food exploration
- For 12m+: art materials, sand/water tables, shape sorting

MUSIC suggestions format:
{ "name": "Song or Activity Name", "reason": "Why it's good for this age + how to do it (1-2 sentences)", "product": "Optional instrument/toy name or null" }
- Specific songs, instruments, and musical activities
- Include classic nursery rhymes with developmental twists
- Suggest age-appropriate instruments or sound-making toys
- For newborns: white noise, lullabies, heartbeat sounds
- For 3-6m: rattles, shakers, singing with hand motions
- For 6-12m: drums, xylophones, action songs
- For 12m+: dancing, rhythm games, simple instruments`;

    const userPrompt = `Generate activity suggestions for a ${effectiveAge.toFixed(1)} month old baby${baby_name ? ` named ${baby_name}` : ''}.

Return a JSON object with "reading" (3 book suggestions), "sensory" (3 sensory play suggestions), and "music" (3 music/sound suggestions).`;

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
    const rawText = result.content?.[0]?.text ?? '{}';

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

    return new Response(
      JSON.stringify(suggestions),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal error', message: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});

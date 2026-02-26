// ============================================================
// Nodd — Diaper Analysis Edge Function
// Two-pass Claude Vision: privacy check → stool analysis
// Image is NEVER stored — processed in memory only
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_COLORS = ['yellow', 'green', 'brown', 'black', 'red', 'white', 'orange'];
const VALID_CONSISTENCIES = ['liquid', 'soft', 'formed', 'hard', 'mucousy', 'seedy'];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ safe: false, error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const { image } = await req.json();
    if (!image || typeof image !== 'string') {
      return new Response(
        JSON.stringify({ safe: false, error: 'Missing image data' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // Detect media type from base64 header or default to jpeg
    const mediaType = image.startsWith('/9j') ? 'image/jpeg' : 'image/png';

    // ── Pass 1: Privacy/Safety Check ──
    const safetyResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: image },
            },
            {
              type: 'text',
              text: 'Does this image contain nudity, a child\'s private parts, or any inappropriate content? Reply ONLY with the word SAFE or UNSAFE.',
            },
          ],
        }],
      }),
    });

    if (!safetyResponse.ok) {
      return new Response(
        JSON.stringify({ safe: false, error: 'ai_error' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const safetyResult = await safetyResponse.json();
    const safetyText = (safetyResult.content?.[0]?.text ?? '').trim().toUpperCase();

    if (safetyText !== 'SAFE') {
      return new Response(
        JSON.stringify({ safe: false, error: 'privacy' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ── Pass 2: Stool Analysis ──
    const analysisResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: image },
            },
            {
              type: 'text',
              text: `Analyze the stool in this diaper photo. Return ONLY a JSON object with two fields:
- "stool_color": one of ${JSON.stringify(VALID_COLORS)}
- "stool_consistency": one of ${JSON.stringify(VALID_CONSISTENCIES)}
Do not include any other text, explanation, or markdown formatting.`,
            },
          ],
        }],
      }),
    });

    if (!analysisResponse.ok) {
      return new Response(
        JSON.stringify({ safe: true, error: 'analysis_failed' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const analysisResult = await analysisResponse.json();
    const rawText = (analysisResult.content?.[0]?.text ?? '').trim();
    const cleaned = rawText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    let parsed: { stool_color?: string; stool_consistency?: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ safe: true, error: 'parse_failed' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const stoolColor = VALID_COLORS.includes(parsed.stool_color ?? '') ? parsed.stool_color : null;
    const stoolConsistency = VALID_CONSISTENCIES.includes(parsed.stool_consistency ?? '') ? parsed.stool_consistency : null;

    return new Response(
      JSON.stringify({
        safe: true,
        stool_color: stoolColor,
        stool_consistency: stoolConsistency,
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ safe: false, error: 'internal', message: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});

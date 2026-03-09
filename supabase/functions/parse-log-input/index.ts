// ============================================================
// Sprouty — Parse Log Input Edge Function
// Sends natural language to Claude for structured extraction
// Returns ParsedLogAction JSON for automatic log creation
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  text: string;
  feeding_method?: string;
  current_datetime: string;
}

const SYSTEM_PROMPT = `You are a structured data parser for the Sprouty baby tracking app. Your ONLY job is to extract logging data from natural language parental input and return a JSON object.

You are NOT a conversational assistant. Do NOT provide advice, commentary, or encouragement. Return ONLY the JSON object described below.

PARSING RULES:
1. Identify the ACTION TYPE from the input:
   - "feeding" keywords: fed, nursed, breastfed, bottle, formula, drank, ate, milk, oz, ml
   - "sleep" keywords: sleep, slept, nap, napped, woke, fell asleep, put down, bedtime
   - "diaper" keywords: diaper, poop, pooped, pee, wet, dirty, changed
   - "health" keywords: temperature, fever, medication, gave tylenol/motrin, rash, sick, threw up, vomit
   - "growth" keywords: weighs, weight, weighed, kg, lbs, pounds, grams, height, tall, length, cm, inches, head circumference, head circ

2. Extract specific data:
   - AMOUNTS: "4oz" = 118ml, "120ml" = 120ml. Always return ml. 1oz = 29.5735ml, round to nearest integer.
   - DURATIONS: "10 minutes" = 10, "half an hour" = 30, "2 hours" = 120. Always return minutes.
   - BREAST SIDE: "left", "right", "both sides"
   - DIAPER TYPE: "wet" (pee only), "dirty" (poop only), "both" (wet and dirty), "dry" (no output — dehydration check)
   - SLEEP TYPE: daytime mentions or "nap" = "nap", nighttime or "bedtime"/"night" = "night"
   - SLEEP EVENT: "fell asleep"/"put down"/"went to sleep"/"sleeping" = "start", "woke up" = "end", "napped for X"/"slept for X" = "completed"
   - TEMPERATURES: Convert F to C if value >= 90 (likely Fahrenheit). Formula: (F - 32) * 5/9, round to 1 decimal.
   - MEDICATIONS: Extract medication name (tylenol, motrin, ibuprofen, acetaminophen, etc.)
   - SYMPTOMS: Extract symptom descriptions as an array of strings
   - GROWTH WEIGHT: Convert to grams. "6.5 kg" = 6500. "14 lbs" = 6350 (1 lb = 453.592g). "14 lbs 3 oz" = 6463. Round to nearest integer.
   - GROWTH HEIGHT/LENGTH: Convert to cm. "24 inches" = 60.96 (1 in = 2.54cm). Round to 1 decimal.
   - GROWTH HEAD CIRCUMFERENCE: Convert to cm. Same conversion as height.
   - If input mentions ONLY a number + unit without specifying which growth metric, infer from value range:
     - 2000-15000g or 2-15kg or 4-33lbs → likely weight
     - 40-100cm or 15-40 inches → likely height
     - 30-55cm or 12-22 inches → likely head circumference
   - IMPORTANT: If the input contains a measurable growth value (number + unit like kg, lbs, cm, inches), ALWAYS set action_type to "growth" and intent to "log", even if phrased as a question. Prioritize data logging over conversation.

3. When the input is a QUESTION about baby care, health, or development (not a log entry) AND does NOT contain a measurable growth value:
   - Set intent to "medical"
   - Set action_type to "unknown"

4. When the input asks about data, history, trends, or statistics:
   - Set intent to "data_query"
   - Set action_type to "unknown"

5. For FEEDING type inference:
   - If "nursed", "breastfed", mentions a side, or no amount specified with feeding keywords: type = "breast"
   - If "bottle", "formula", or amount in ml/oz specified without breast keywords: type = "bottle"
   - If user says "formula": bottle_content = "formula"
   - If user says "breast milk" with bottle: bottle_content = "breast_milk"
   - FEEDING METHOD PREFERENCE: {{FEEDING_METHOD}}. If "formula_only" and ambiguous, prefer type = "bottle".

6. CONFIDENCE: Set 0.9+ for clear, unambiguous inputs. Set 0.5-0.8 for ambiguous inputs. Set below 0.5 if you're guessing.

7. SUMMARY: Write a brief, friendly confirmation string (max 40 chars). Examples:
   - "Breast feed, left side, 10 min"
   - "Dirty diaper logged"
   - "120ml bottle of formula"
   - "Nap started"
   - "Temp 38.5°C recorded"
   - "Weight: 6.5 kg logged"
   - "Height: 62 cm logged"
   - "Head circ: 42 cm logged"

RESPONSE SCHEMA:
{
  "action_type": "feeding" | "sleep" | "diaper" | "health" | "growth" | "unknown",
  "confidence": number (0 to 1),
  "intent": "log" | "medical" | "data_query",
  "feeding": { "type": "breast" | "bottle", "breast_side": "left" | "right" | "both" | null, "duration_minutes": number | null, "amount_ml": number | null, "bottle_content": "breast_milk" | "formula" | null } | null,
  "sleep": { "type": "nap" | "night", "event": "start" | "end" | "completed", "duration_minutes": number | null } | null,
  "diaper": { "type": "wet" | "dirty" | "both" | "dry" } | null,
  "health": { "type": "temperature" | "medication" | "symptom", "temperature_celsius": number | null, "medication_name": string | null, "symptoms": string[] | null } | null,
  "growth": { "weight_grams": number | null, "height_cm": number | null, "head_circumference_cm": number | null } | null,
  "summary": string
}

Return ONLY valid JSON. No markdown fences. No explanation. No text before or after.`;

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

    if (!body.text || body.text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'text is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const systemPrompt = SYSTEM_PROMPT
      .replace('{{FEEDING_METHOD}}', body.feeding_method ?? 'mixed');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: 'user', content: body.text.trim() }],
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

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', raw: rawText }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal error', message: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});

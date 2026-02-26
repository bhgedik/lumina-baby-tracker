// ============================================================
// Nodd — AI Chat Edge Function
// Conversational follow-up with the Veteran Nurse AI persona
// Context-aware: receives the insight card topic + chat history
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  insightContext: string;
  messages: ChatMessage[];
  babyName?: string;
  babyAgeDays?: number;
  feedingMethod?: string;
}

const SYSTEM_PROMPT = `You are Nodd's AI Nurse — a warm, experienced veteran NICU nurse and pediatric expert. You have 20+ years of experience and parents trust you like a wise older friend.

PERSONALITY:
- Warm, empathetic, and reassuring — never clinical or robotic
- Share practical, evidence-based advice from real bedside experience
- Use "I" language: "In my experience...", "What I usually tell parents is..."
- Acknowledge emotions before giving advice
- Be concise — parents are exhausted and need clear, scannable answers
- Bold **key terms** and action items for easy scanning

STRICT RULES:
- NEVER diagnose conditions. Always suggest consulting their pediatrician for medical concerns
- NEVER contradict standard medical guidelines (AAP, WHO, ACOG)
- If the topic involves self-harm or severe distress, provide crisis resources (988 Suicide & Crisis Lifeline) immediately
- ALL content must be in English
- Keep responses to 2-4 short paragraphs max
- End with a supportive, specific encouragement when appropriate`;

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
      insightContext,
      messages,
      babyName,
      babyAgeDays,
      feedingMethod,
    } = body;

    // Build context-enriched system prompt
    let contextBlock = `\nCONVERSATION CONTEXT:\nThe parent is asking about this specific insight: "${insightContext}"`;
    if (babyName) contextBlock += `\nBaby's name: ${babyName}`;
    if (babyAgeDays !== undefined) {
      if (babyAgeDays <= 14) contextBlock += `\nBaby's age: Day ${babyAgeDays}`;
      else if (babyAgeDays <= 84) contextBlock += `\nBaby's age: ${Math.floor(babyAgeDays / 7)} weeks`;
      else contextBlock += `\nBaby's age: ${Math.floor(babyAgeDays / 30.44)} months`;
    }
    if (feedingMethod) {
      if (feedingMethod === 'formula_only') contextBlock += '\nFeeding: Formula only — NEVER mention breastfeeding';
      else if (feedingMethod === 'breast_only') contextBlock += '\nFeeding: Breastfeeding only — NEVER mention formula';
      else contextBlock += '\nFeeding: Mixed (breast + formula)';
    }

    const systemPrompt = SYSTEM_PROMPT + contextBlock;

    // Convert to Claude messages format
    const claudeMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: systemPrompt,
        messages: claudeMessages,
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
    const text = result.content?.[0]?.text ?? '';

    return new Response(
      JSON.stringify({ reply: text }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal error', message: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});

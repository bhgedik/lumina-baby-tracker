// ============================================================
// Nodd — Insight Chat Service
// Client-side interface to the ai-chat edge function
// Falls back gracefully when offline or Supabase not configured
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../data/supabase/client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  insightContext: string;
  messages: ChatMessage[];
  babyName?: string;
  babyAgeDays?: number;
  feedingMethod?: string;
}

interface ChatResponse {
  reply: string | null;
  error?: string;
}

const OFFLINE_REPLIES: Record<string, string> = {
  default: "I'd love to help with that! Unfortunately, I need an internet connection to give you a proper answer. In the meantime, trust your instincts — you know your baby better than anyone.",
};

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  if (!isSupabaseConfigured) {
    return { reply: OFFLINE_REPLIES.default, error: 'offline' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: request,
    });

    if (error) {
      return { reply: null, error: error.message ?? 'network' };
    }

    return { reply: data?.reply ?? null };
  } catch {
    return { reply: null, error: 'network' };
  }
}

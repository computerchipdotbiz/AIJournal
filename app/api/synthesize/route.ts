import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { SYNTHESIS_SYSTEM_PROMPT } from '@/lib/prompts';
import { getSession } from '@/lib/auth';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Please sign in as everythingfunny@gmail.com.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { conversation, apiKey: userApiKey } = await req.json();

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    // Helper for graceful fallback when offline or model error
    const buildFallback = () => {
      const userLines = Array.isArray(conversation)
        ? conversation
            .filter((m: { sender: string; content: string }) => m.sender === 'user')
            .map((m: { content: string }) => m.content)
            .join(' ')
            .trim()
        : '';
      const firstSentence = userLines.split(/[.!?\n]/)[0]?.trim() || '';
      const titleWords = firstSentence.split(/\s+/).slice(0, 6).join(' ');
      const title = titleWords ? `${titleWords}...` : 'Daily Reflection';
      const summary = userLines.length > 200 ? `${userLines.slice(0, 197)}...` : userLines || 'Personal journal reflection.';
      return {
        title,
        summary,
        moodScore: 7,
        emotions: ['reflective', 'intentional'],
        tags: ['personal', 'reflection'],
        actionItems: []
      };
    };

    if (!apiKey) {
      // If no key configured, return fallback immediately so user can still save smoothly
      return new Response(
        JSON.stringify(buildFallback()),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const google = createGoogleGenerativeAI({
      apiKey: apiKey
    });

    const conversationTranscript = conversation
      .map((m: { sender: string; content: string }) => `${m.sender.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    let text = '';
    try {
      const res = await generateText({
        model: google('gemini-flash-latest'),
        system: SYNTHESIS_SYSTEM_PROMPT,
        prompt: `Here is the journal entry conversation transcript:\n\n${conversationTranscript}\n\nPlease generate the JSON synthesis:`,
        temperature: 0.3,
      });
      text = res.text;
    } catch {
      // Secondary fallback model
      try {
        const res2 = await generateText({
          model: google('gemini-3.8-flash'),
          system: SYNTHESIS_SYSTEM_PROMPT,
          prompt: `Here is the journal entry conversation transcript:\n\n${conversationTranscript}\n\nPlease generate the JSON synthesis:`,
          temperature: 0.3,
        });
        text = res2.text;
      } catch (innerErr) {
        console.warn('Both Gemini models failed, falling back to local synthesis heuristic:', innerErr);
        return new Response(JSON.stringify(buildFallback()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Clean JSON response (handling potential markdown fences ```json ... ```)
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }

    try {
      const parsed = JSON.parse(cleaned);
      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {
      return new Response(JSON.stringify(buildFallback()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: unknown) {
    console.error('Synthesis API Error:', error);
    // Even on uncaught error, return friendly fallback
    return new Response(JSON.stringify({
      title: 'Daily Reflection',
      summary: 'Personal journal reflection.',
      moodScore: 7,
      emotions: ['reflective'],
      tags: ['reflection'],
      actionItems: []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

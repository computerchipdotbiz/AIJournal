import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { SYNTHESIS_SYSTEM_PROMPT } from '@/lib/prompts';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { conversation, apiKey: userApiKey } = await req.json();

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'No Gemini API key found. Please add your GEMINI_API_KEY in .env.local or via Settings.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const google = createGoogleGenerativeAI({
      apiKey: apiKey
    });

    const conversationTranscript = conversation
      .map((m: { sender: string; content: string }) => `${m.sender.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const { text } = await generateText({
      model: google('gemini-3.8-flash'),
      system: SYNTHESIS_SYSTEM_PROMPT,
      prompt: `Here is the journal entry conversation transcript:\n\n${conversationTranscript}\n\nPlease generate the JSON synthesis:`,
      temperature: 0.3,
    });

    // Clean JSON response (handling potential markdown fences ```json ... ```)
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to synthesize journal entry';
    console.error('Synthesis API Error:', error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

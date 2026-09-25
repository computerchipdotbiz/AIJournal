import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { WEEKLY_INSIGHT_SYSTEM_PROMPT } from '@/lib/prompts';
import { JournalEntry } from '@/lib/types';
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

    const { entries, apiKey: userApiKey } = await req.json();

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'No Gemini API key found. Please add your GEMINI_API_KEY in .env.local or via Settings.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No journal entries provided for weekly analysis.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const google = createGoogleGenerativeAI({
      apiKey: apiKey
    });

    const formattedEntries = (entries as JournalEntry[])
      .map(e => `--- Date: ${new Date(e.date).toLocaleDateString()} | Title: ${e.title} | Mood: ${e.moodScore}/10 ---\nSummary: ${e.summary}\nEmotions: ${e.emotions.join(', ')}\nContent: ${e.content}`)
      .join('\n\n');

    let text = '';
    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-flash-lite-latest',
      'gemini-3-flash-preview',
    ];

    for (const modelName of candidateModels) {
      try {
        const res = await generateText({
          model: google(modelName),
          system: WEEKLY_INSIGHT_SYSTEM_PROMPT,
          prompt: `Here are the journal entries for this week:\n\n${formattedEntries}\n\nPlease generate the weekly insight synthesis JSON:`,
          temperature: 0.4,
        });
        text = res.text;
        break;
      } catch (err) {
        console.warn(`Insights model ${modelName} failed, trying next:`, err);
      }
    }

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
    const message = error instanceof Error ? error.message : 'Failed to generate weekly insight';
    console.error('Insights API Error:', error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

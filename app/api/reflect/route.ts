import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { REFLECTION_SYSTEM_PROMPT } from '@/lib/prompts';
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

    const { messages, apiKey: userApiKey, style = 'socratic' } = await req.json();

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'No Gemini API key found. Please add your GEMINI_API_KEY in .env.local or via Settings.',
          needsKey: true
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const google = createGoogleGenerativeAI({
      apiKey: apiKey
    });

    const styleInstructions = {
      cbt: "Emphasize Cognitive Behavioral insights: notice negative thought patterns (black-and-white thinking, catastrophizing), examine evidence, and invite gentle reframing.",
      socratic: "Use gentle inquiry to help them discover their own truths. Ask one piercing, compassionate question.",
      gentle: "Offer deep warmth, soothing presence, and emotional validation with minimal pressure.",
      direct: "Be concise, clear, and actionable. Cut straight to the core dilemma."
    }[style as 'cbt' | 'socratic' | 'gentle' | 'direct'] || '';

    const systemPrompt = `${REFLECTION_SYSTEM_PROMPT}\n\nUser Style Preference: ${styleInstructions}`;

    // Format messages for ai SDK
    const formattedMessages = messages.map((m: { sender: string; content: string }) => ({
      role: m.sender === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-flash-lite-latest',
      'gemini-3-flash-preview',
    ];

    for (const modelName of candidateModels) {
      try {
        const result = streamText({
          model: google(modelName),
          system: systemPrompt,
          messages: formattedMessages,
          temperature: 0.7,
        });
        return result.toTextStreamResponse();
      } catch (err) {
        console.warn(`Model ${modelName} stream init failed, trying next:`, err);
      }
    }

    // Final attempt if loop finished
    const finalResult = streamText({
      model: google('gemini-3.5-flash-lite'),
      system: systemPrompt,
      messages: formattedMessages,
      temperature: 0.7,
    });
    return finalResult.toTextStreamResponse();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown reflection error';
    console.error('Reflection API Error:', error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

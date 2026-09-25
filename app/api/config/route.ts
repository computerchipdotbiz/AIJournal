export const dynamic = 'force-dynamic';

export async function GET() {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  return Response.json({
    hasServerKey: hasKey,
  });
}

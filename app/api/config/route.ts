export const dynamic = 'force-dynamic';

const DEFAULT_SUPABASE_URL = 'https://spuwsjddirucwwbywlvh.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_TU7l-xgHZuCU_UsgLTG0Wg_0t6PFJ5z';

export async function GET() {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl !== 'https://your-project.supabase.co'
  );

  return Response.json({
    hasServerKey: hasKey,
    hasSupabase: isConfigured,
    supabaseUrl: isConfigured ? supabaseUrl : undefined,
    supabaseAnonKey: isConfigured ? supabaseAnonKey : undefined,
  });
}

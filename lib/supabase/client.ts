import { createClient, SupabaseClient } from '@supabase/supabase-js';

let runtimeUrl = '';
let runtimeKey = '';
let cachedClient: SupabaseClient | null = null;
let lastClientKey = '';

export const setRuntimeSupabaseConfig = (url: string, key: string) => {
  if (url && key && (runtimeUrl !== url || runtimeKey !== key)) {
    runtimeUrl = url.trim();
    runtimeKey = key.trim();
    cachedClient = null;
    lastClientKey = '';
  }
};

export const getSupabaseConfig = (): { url: string; key: string } => {
  if (runtimeUrl && runtimeKey) {
    return { url: runtimeUrl, key: runtimeKey };
  }

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (envUrl && envKey && envUrl !== 'https://your-project.supabase.co') {
    return { url: envUrl.trim(), key: envKey.trim() };
  }

  if (typeof window !== 'undefined') {
    try {
      const raw =
        localStorage.getItem('chipmind_journal_settings') ||
        localStorage.getItem('rosebud_journal_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed.supabaseUrl &&
          parsed.supabaseAnonKey &&
          parsed.supabaseUrl !== 'https://your-project.supabase.co'
        ) {
          return {
            url: parsed.supabaseUrl.trim(),
            key: parsed.supabaseAnonKey.trim(),
          };
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  return { url: '', key: '' };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return Boolean(
    url &&
      key &&
      url.startsWith('http') &&
      url !== 'https://your-project.supabase.co'
  );
};

export const getSupabaseClient = (
  customUrl?: string,
  customKey?: string
): SupabaseClient | null => {
  const activeUrl = customUrl?.trim() || getSupabaseConfig().url;
  const activeKey = customKey?.trim() || getSupabaseConfig().key;

  if (!activeUrl || !activeKey || !activeUrl.startsWith('http')) {
    return null;
  }

  const clientKey = `${activeUrl}|${activeKey}`;
  if (cachedClient && lastClientKey === clientKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(activeUrl, activeKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    lastClientKey = clientKey;
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const testSupabaseConnection = async (
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) {
    return {
      success: false,
      message: 'Please provide both a valid Supabase Project URL and Anon Key.',
    };
  }

  try {
    const { error } = await client.from('entries').select('id').limit(1);
    if (error) {
      if (error.code === '42P01' || error.message?.toLowerCase().includes('does not exist')) {
        return {
          success: false,
          message:
            'Connected to Supabase, but the "entries" table was not found. Please run the SQL schema script in your Supabase SQL Editor.',
        };
      }
      return { success: false, message: `Supabase error: ${error.message}` };
    }
    return {
      success: true,
      message: 'Connection successful! Your entries will sync automatically across all devices.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to connect to Supabase. Check your network and URL.',
    };
  }
};

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co');
};

export const getSupabaseClient = (customUrl?: string, customKey?: string) => {
  const url = customUrl || supabaseUrl;
  const key = customKey || supabaseAnonKey;
  if (!url || !key) return null;
  return createClient(url, key);
};

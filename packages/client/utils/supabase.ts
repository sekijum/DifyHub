import { createClient } from '@supabase/supabase-js';

const config = useRuntimeConfig();

const supabaseUrl = config.public.supabaseUrl || '';
const supabaseAnonKey = config.public.supabaseAnonKey || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided');
}

// Supabaseクライアントを作成してエクスポート
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
}); 

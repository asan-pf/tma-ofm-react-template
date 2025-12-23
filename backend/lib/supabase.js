import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
}

// Prefer explicit Supabase env; otherwise default to local PostgREST proxy
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_ANON_KEY;

// Debug environment snapshot (truncated)
console.log('Supabase config:', {
  usingFallback: !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY,
  url: supabaseUrl ? `${String(supabaseUrl).slice(0, 30)}...` : 'undefined',
  key: supabaseKey ? `${String(supabaseKey).slice(0, 6)}...` : 'undefined'
});

export const supabase = createClient(String(supabaseUrl), String(supabaseKey), {
  auth: {
    // Local PostgREST has no auth; avoid auth calls in dev
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

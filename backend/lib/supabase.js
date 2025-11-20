import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Prefer explicit Supabase env; otherwise default to local PostgREST proxy
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Fallback defaults for local dev via docker-compose (proxy at http://localhost:8000/rest/v1)
  const localUrl = process.env.LOCAL_SUPABASE_URL || 'http://localhost:8000';
  const localKey = process.env.LOCAL_SUPABASE_ANON_KEY || 'dev-local-noauth';
  supabaseUrl = localUrl;
  supabaseKey = localKey;
}

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
  },
  global: {
    headers: {
      // Don't send apikey header for local PostgREST
      ...(supabaseUrl?.includes('localhost') || supabaseUrl?.includes('proxy') ? {} : { apikey: supabaseKey })
    }
  }
});

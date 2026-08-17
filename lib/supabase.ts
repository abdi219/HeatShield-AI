import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';

/**
 * Public Supabase Client (Browser & Client Components)
 * Guarded with RLS policies.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-Side Admin Supabase Client (API Routes & Edge Handlers)
 * Uses SERVICE_ROLE_KEY to perform cache updates and log simulations.
 */
export const getServiceSupabase = (): SupabaseClient => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    // Fallback gracefully to public client if service key is not configured in local development
    return supabase;
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

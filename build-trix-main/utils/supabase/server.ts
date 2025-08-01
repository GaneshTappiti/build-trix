import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  // Use environment variables without non-null assertions
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Enhanced secure cookie options for production
            const secureOptions = {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              httpOnly: options?.httpOnly ?? true,
              sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
              // Set path to root if not specified
              path: options?.path ?? '/',
              // Ensure maxAge is reasonable if not set
              maxAge: options?.maxAge ?? 60 * 60 * 24 * 7, // 7 days default
            };
            cookieStore.set(name, value, secureOptions);
          });
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
          console.warn('Cookie setting failed in server component:', error);
        }
      },
    },
    auth: {
      // Enhanced auth configuration for production
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Add flow type for better OAuth handling
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-server',
      },
    },
  });
}

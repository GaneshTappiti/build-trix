'use server';

import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function signInWithGoogle() {
  try {
    const supabase = await createClient();
    const headersList = await headers();

    // Get origin from headers, with fallbacks for production
    let origin = headersList.get('origin');

    if (!origin) {
      // Fallback for production environments
      const host = headersList.get('host');
      const protocol = headersList.get('x-forwarded-proto') || 'https';

      if (host) {
        origin = `${protocol}://${host}`;
      } else {
        console.error('Unable to determine origin for OAuth redirect');
        return { error: 'Authentication configuration error. Please try again.' };
      }
    }

    const redirectUrl = `${origin}/auth/callback`;

    console.log('Auth: Initiating Google OAuth with redirect URL:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      console.error('Auth: OAuth initialization failed:', error.message);
      return { error: 'Authentication failed. Please try again.' };
    }

    if (!data.url) {
      console.error('Auth: No OAuth URL returned from Supabase');
      return { error: 'Authentication failed. Please try again.' };
    }

    console.log('Auth: OAuth URL generated successfully');
    return { url: data.url };
  } catch (error) {
    console.error('Auth: Unexpected error during OAuth initialization:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function logout() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Auth: Logout failed:', error.message);
      return { error: 'Logout failed. Please try again.' };
    }

    console.log('Auth: Logout successful');
    return { success: true };
  } catch (error) {
    console.error('Auth: Unexpected error during logout:', error);
    return { error: 'Logout failed. Please try again.' };
  }
}

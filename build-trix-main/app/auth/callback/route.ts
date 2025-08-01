import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    // If no code parameter, redirect to error page
    if (!code) {
      console.error('OAuth callback: No code parameter provided');
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('OAuth callback: Session exchange failed:', error.message);
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    if (!sessionData?.session) {
      console.error('OAuth callback: No session returned after exchange');
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    // Determine the correct redirect URL for production
    let redirectUrl: string;
    const isLocalEnv = process.env.NODE_ENV === 'development';

    if (isLocalEnv) {
      // Development environment
      redirectUrl = `${origin}${next}`;
    } else {
      // Production environment - be more robust about URL construction
      const forwardedHost = request.headers.get('x-forwarded-host');
      const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';

      if (forwardedHost) {
        redirectUrl = `${forwardedProto}://${forwardedHost}${next}`;
      } else {
        // Fallback to origin if no forwarded headers
        redirectUrl = `${origin}${next}`;
      }
    }

    console.log('OAuth callback: Successful authentication, redirecting to:', redirectUrl);

    const response = NextResponse.redirect(redirectUrl);

    // Ensure cookies are properly set for the redirect
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const allCookies = supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // The session should already be set by the exchangeCodeForSession call
        console.log('OAuth callback: Session verified after exchange');
      }
    });

    return response;
  } catch (error) {
    console.error('OAuth callback: Unexpected error:', error);
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }
}

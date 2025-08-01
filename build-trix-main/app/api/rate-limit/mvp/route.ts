import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkMVPRateLimit } from '@/lib/ratelimit';
import { RateLimitResponse } from '@/types/mvp';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' } as RateLimitResponse, {
        status: 401,
      });
    }

    // Get rate limit status
    const rateLimitResult = await checkMVPRateLimit(user.id, supabase);

    // Calculate used count
    const used = rateLimitResult.limit - rateLimitResult.remaining;

    // Format reset date
    const resetDate = new Date(rateLimitResult.reset).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const rateLimitInfo = {
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      used,
      reset: rateLimitResult.reset,
      resetDate,
    };

    return NextResponse.json({
      success: true,
      rateLimitInfo,
    } as RateLimitResponse);
  } catch (error) {
    console.error('Error fetching rate limit:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch rate limit information' } as RateLimitResponse, {
      status: 500,
    });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { clearMVPRateLimit } from '@/lib/ratelimit';

export async function POST() {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Clear the rate limit data for this user
    const result = await clearMVPRateLimit(user.id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Rate limit data cleared successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to clear rate limit data' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error clearing rate limit:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

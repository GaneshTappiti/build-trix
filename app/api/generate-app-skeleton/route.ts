import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GenerateAppSkeletonRequest, GenerateAppSkeletonResponse } from '@/types/app-skeleton';
import { AppSkeletonGenerator } from '@/lib/app-skeleton-generator';
import { consumeMVPRateLimit, checkMVPRateLimit } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateAppSkeletonRequest = await request.json();
    const { userIdea, settings, additionalContext } = body;

    // Validate required fields
    if (!userIdea || !settings) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userIdea and settings' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Check rate limit (reusing the MVP rate limit for now)
    const preCheckResult = await checkMVPRateLimit(user.id, supabase);
    if (!preCheckResult.success) {
      const resetDate = new Date(preCheckResult.reset).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      return NextResponse.json(
        {
          success: false,
          error: `Monthly generation limit reached (${preCheckResult.limit} generations). Limit resets on ${resetDate}.`,
        },
        { status: 429 }
      );
    }

    // Consume rate limit
    const rateLimitResult = await consumeMVPRateLimit(user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Get Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    // Generate app skeleton
    const generator = new AppSkeletonGenerator(apiKey);
    const result = await generator.generateAppSkeleton({
      userIdea,
      settings,
      additionalContext
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Store the generated skeleton in the database
    if (result.appSkeleton) {
      const { error: storageError } = await supabase
        .from('app_skeletons')
        .insert([
          {
            ...result.appSkeleton,
            user_id: user.id,
          },
        ]);

      if (storageError) {
        console.error('Error storing app skeleton:', storageError);
        // Continue anyway - the generation was successful even if storage failed
      }
    }

    const response: GenerateAppSkeletonResponse = {
      success: true,
      appSkeleton: result.appSkeleton,
      processingTime: result.processingTime,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in generate-app-skeleton endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user's app skeletons
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // Fetch user's app skeletons
    const { data: skeletons, error } = await supabase
      .from('app_skeletons')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching app skeletons:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch app skeletons' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: skeletons || [],
    });

  } catch (error) {
    console.error('Error in GET app-skeletons endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

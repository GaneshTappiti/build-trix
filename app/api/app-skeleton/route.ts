import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { AppSkeletonGenerator } from '@/lib/app-skeleton-generator';
import { GenerateAppSkeletonRequest, GenerateAppSkeletonResponse, GenerationSettings } from '@/types/app-skeleton';

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const body = (await request.json()) as Partial<GenerateAppSkeletonRequest>;

    if (!body?.userIdea || body.userIdea.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'userIdea is required and must be at least 10 characters' } satisfies GenerateAppSkeletonResponse,
        { status: 400 },
      );
    }

    // Auth (optional – only used to tag ownership for future persistence)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Default generation settings
    const defaultSettings: GenerationSettings = {
      includeErrorStates: true,
      includeLoadingStates: true,
      includeEmptyStates: true,
      includeBackendModels: true,
      suggestUIComponents: true,
      includeModalsPopups: true,
      generateArchitecture: true,
      appType: 'web',
      complexity: 'mvp',
    };

    const settings: GenerationSettings = { ...defaultSettings, ...(body.settings || {}) } as GenerationSettings;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY not configured' } satisfies GenerateAppSkeletonResponse,
        { status: 500 },
      );
    }

    const generator = new AppSkeletonGenerator(apiKey);
    const result = await generator.generateAppSkeleton({
      userIdea: body.userIdea,
      settings,
      additionalContext: body.additionalContext,
    });

    if (!result.success) {
      return NextResponse.json({ ...result }, { status: 500 });
    }

    // Attach user id if available (not persisted yet – future enhancement)
    if (user && result.appSkeleton) {
      result.appSkeleton.userId = user.id;
    }

    return NextResponse.json({ ...result, success: true, processingTime: Date.now() - started } satisfies GenerateAppSkeletonResponse);
  } catch (error) {
    console.error('App Skeleton generation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error generating skeleton' } satisfies GenerateAppSkeletonResponse,
      { status: 500 },
    );
  }
}

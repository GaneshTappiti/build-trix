import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { CreateMVPData } from '@/types/mvp';
import { consumeMVPRateLimit, checkMVPRateLimit, clearMVPRateLimit } from '@/lib/ratelimit';

export interface MVPStudioSaveRequest {
  appIdea: {
    appName: string;
    platforms: ('web' | 'mobile')[];
    designStyle: 'minimal' | 'playful' | 'business';
    styleDescription?: string;
    ideaDescription: string;
    targetAudience?: string;
  };
  validationQuestions: {
    hasValidated: boolean;
    hasDiscussed: boolean;
    motivation?: string;
  };
  appBlueprint?: any;
  screenPrompts?: any[];
  appFlow?: any;
  exportPrompts?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body: MVPStudioSaveRequest = await request.json();
    const { appIdea, validationQuestions, appBlueprint, screenPrompts, appFlow, exportPrompts } = body;

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

    // Check rate limit before proceeding
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
          error: `Monthly MVP generation limit reached (${preCheckResult.limit} MVPs). Limit resets on ${resetDate}.`,
          rateLimitInfo: {
            limit: preCheckResult.limit,
            remaining: preCheckResult.remaining,
            used: preCheckResult.limit - preCheckResult.remaining,
            reset: preCheckResult.reset,
            resetDate,
          },
        },
        { status: 429 },
      );
    }

    // Try to consume rate limit
    const rateLimitResult = await consumeMVPRateLimit(user.id);
    if (!rateLimitResult.success) {
      // If rate limit fails, try clearing stale data and retry once
      console.log('Rate limit exceeded, attempting to clear stale data...');
      await clearMVPRateLimit(user.id);

      // Try consuming again after clearing
      const retryRateLimitResult = await consumeMVPRateLimit(user.id);
      if (!retryRateLimitResult.success) {
        const resetDate = new Date(preCheckResult.reset).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        return NextResponse.json(
          {
            success: false,
            error: `Rate limit system detected inconsistency. Based on database count, you have used ${preCheckResult.limit - preCheckResult.remaining}/${preCheckResult.limit} MVPs this month.`,
            rateLimitInfo: {
              limit: preCheckResult.limit,
              remaining: preCheckResult.remaining,
              used: preCheckResult.limit - preCheckResult.remaining,
              reset: preCheckResult.reset,
              resetDate,
            },
          },
          { status: 429 },
        );
      }
    }

    // Convert MVP Studio data to MVP database format
    const designStyleMap = {
      'minimal': 'Minimal & Clean',
      'playful': 'Playful & Animated',
      'business': 'Business & Professional'
    } as const;

    // Generate comprehensive prompt from MVP Studio data
    const generatedPrompt = generateMVPStudioPrompt({
      appIdea,
      validationQuestions,
      appBlueprint,
      screenPrompts,
      appFlow,
      exportPrompts
    });

    const mvpData: CreateMVPData = {
      app_name: appIdea.appName,
      platforms: appIdea.platforms,
      style: designStyleMap[appIdea.designStyle],
      style_description: appIdea.styleDescription,
      app_description: appIdea.ideaDescription,
      target_users: appIdea.targetAudience,
      generated_prompt: generatedPrompt,
      status: 'Yet To Build',
    };

    // Create MVP project in database
    const { data: mvpProject, error: mvpError } = await supabase
      .from('mvps')
      .insert([
        {
          ...mvpData,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (mvpError || !mvpProject) {
      console.error('Error creating MVP project:', mvpError);
      return NextResponse.json({ success: false, error: 'Failed to create MVP project' }, { status: 500 });
    }

    // Store questionnaire responses (compatible with existing structure)
    const questionnaireData = {
      idea_validated: validationQuestions.hasValidated,
      talked_to_people: validationQuestions.hasDiscussed,
      motivation: validationQuestions.motivation,
      mvp_id: mvpProject.id,
      user_id: user.id,
    };

    // Store individual RAG-enhanced prompts for easy access
    const promptsToStore = [];

    // Store blueprint as a prompt if it exists and is RAG-enhanced
    if (appBlueprint && appBlueprint.ragEnhanced) {
      promptsToStore.push({
        user_id: user.id,
        mvp_id: mvpProject.id,
        prompt_title: `${appIdea.appName} - App Blueprint`,
        prompt_content: `# App Blueprint for ${appIdea.appName}

## Architecture
${appBlueprint.architecture}

## Screens
${appBlueprint.screens.map(screen => `- ${screen.name}: ${screen.purpose}`).join('\n')}

## Data Models
${appBlueprint.dataModels.map(model => `- ${model.name}: ${model.fields.join(', ')}`).join('\n')}

${appBlueprint.toolSpecificRecommendations ? `
## Tool-Specific Recommendations
${appBlueprint.toolSpecificRecommendations.join('\n')}
` : ''}

${appBlueprint.securityConsiderations ? `
## Security Considerations
${appBlueprint.securityConsiderations.join('\n')}
` : ''}`,
        prompt_type: 'blueprint',
        target_tool: validationQuestions.preferredAITool || 'general',
        stage_number: 3,
        is_rag_enhanced: true,
        confidence_score: appBlueprint.confidenceScore,
        enhancement_suggestions: appBlueprint.suggestions || [],
        tool_optimizations: appBlueprint.toolSpecificRecommendations || [],
        tags: ['mvp-studio', 'blueprint', appIdea.designStyle]
      });
    }

    // Store screen prompts if they exist and are RAG-enhanced
    if (screenPrompts && screenPrompts.length > 0) {
      screenPrompts.forEach(prompt => {
        if (prompt.ragEnhanced) {
          promptsToStore.push({
            user_id: user.id,
            mvp_id: mvpProject.id,
            prompt_title: `${appIdea.appName} - ${prompt.title}`,
            prompt_content: `# ${prompt.title}

## Layout
${prompt.layout}

## Components
${prompt.components}

## Behavior
${prompt.behavior}

## Conditional Logic
${prompt.conditionalLogic}

## Style Hints
${prompt.styleHints}

${prompt.toolOptimizations ? `
## Tool Optimizations
${prompt.toolOptimizations.join('\n')}
` : ''}

${prompt.designGuidelines ? `
## Design Guidelines
${prompt.designGuidelines.join('\n')}
` : ''}`,
            prompt_type: 'screen_prompt',
            target_tool: validationQuestions.preferredAITool || 'general',
            stage_number: 4,
            screen_id: prompt.screenId,
            is_rag_enhanced: true,
            confidence_score: prompt.confidenceScore,
            tool_optimizations: prompt.toolOptimizations || [],
            tags: ['mvp-studio', 'screen-prompt', appIdea.designStyle]
          });
        }
      });
    }

    // Store export prompts if they exist
    if (exportPrompts) {
      promptsToStore.push({
        user_id: user.id,
        mvp_id: mvpProject.id,
        prompt_title: `${appIdea.appName} - Unified Export Prompt`,
        prompt_content: exportPrompts.unifiedPrompt,
        prompt_type: 'export',
        target_tool: exportPrompts.targetTool || validationQuestions.preferredAITool || 'general',
        stage_number: 6,
        is_rag_enhanced: false, // Export prompts use RAG data but aren't directly enhanced
        tags: ['mvp-studio', 'export', 'unified']
      });
    }

    // Bulk insert prompts if any exist
    if (promptsToStore.length > 0) {
      try {
        const { error: promptsError } = await supabase
          .from('rag_generated_prompts')
          .insert(promptsToStore);

        if (promptsError) {
          console.warn('Error storing individual prompts:', promptsError);
          // Don't fail the main save operation for this
        }
      } catch (promptError) {
        console.warn('Failed to store individual prompts:', promptError);
      }
    }

    const { error: questionnaireError } = await supabase.from('questionnaire').insert([questionnaireData]);

    if (questionnaireError) {
      console.error('Error storing questionnaire:', questionnaireError);
      // Continue even if questionnaire storage fails
    }

    return NextResponse.json({
      success: true,
      mvp_id: mvpProject.id,
      message: 'MVP Studio project saved successfully'
    });

  } catch (error) {
    console.error('Error saving MVP Studio project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save MVP Studio project' },
      { status: 500 }
    );
  }
}

function generateMVPStudioPrompt(data: {
  appIdea: MVPStudioSaveRequest['appIdea'];
  validationQuestions: MVPStudioSaveRequest['validationQuestions'];
  appBlueprint?: any;
  screenPrompts?: any[];
  appFlow?: any;
  exportPrompts?: any;
}): string {
  const { appIdea, validationQuestions, appBlueprint, screenPrompts, appFlow, exportPrompts } = data;

  let prompt = `# ${appIdea.appName} - MVP Implementation Guide

## App Overview
**Name:** ${appIdea.appName}
**Platforms:** ${appIdea.platforms.join(', ')}
**Design Style:** ${appIdea.designStyle}
${appIdea.styleDescription ? `**Style Details:** ${appIdea.styleDescription}` : ''}
**Description:** ${appIdea.ideaDescription}
${appIdea.targetAudience ? `**Target Audience:** ${appIdea.targetAudience}` : ''}

## Validation Status
**Idea Validated:** ${validationQuestions.hasValidated ? 'Yes' : 'No'}
**User Research:** ${validationQuestions.hasDiscussed ? 'Conducted' : 'Pending'}
${validationQuestions.motivation ? `**Motivation:** ${validationQuestions.motivation}` : ''}

`;

  // Add blueprint information if available
  if (appBlueprint) {
    prompt += `## App Blueprint
${appBlueprint.screens ? `**Screens:** ${appBlueprint.screens.map((s: any) => s.name).join(', ')}` : ''}
${appBlueprint.userRoles ? `**User Roles:** ${appBlueprint.userRoles.map((r: any) => r.name).join(', ')}` : ''}
${appBlueprint.architecture ? `**Architecture:** ${appBlueprint.architecture}` : ''}

`;
  }

  // Add screen prompts if available
  if (screenPrompts && screenPrompts.length > 0) {
    prompt += `## Screen Implementation Details
`;
    screenPrompts.forEach((screen: any) => {
      prompt += `### ${screen.title}
${screen.layout ? `**Layout:** ${screen.layout}` : ''}
${screen.components ? `**Components:** ${screen.components}` : ''}
${screen.behavior ? `**Behavior:** ${screen.behavior}` : ''}

`;
    });
  }

  // Add app flow if available
  if (appFlow) {
    prompt += `## Navigation Flow
${appFlow.description || 'Navigation flow defined in MVP Studio'}

`;
  }

  // Add export prompts if available
  if (exportPrompts) {
    prompt += `## Implementation Prompts
${exportPrompts.fullPrompt || 'Comprehensive implementation prompts generated by MVP Studio'}
`;
  }

  return prompt;
}

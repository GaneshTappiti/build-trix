import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { mvpStageEnhancer, MVPStage, MVPStudioData } from '@/lib/rag-stage-enhancer';

interface StageEnhancementRequest {
  stage: MVPStage;
  data: MVPStudioData;
  userId?: string;
}

// POST - Enhance specific MVP Studio stage with RAG
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: StageEnhancementRequest = await request.json();
    const { stage, data } = body;

    if (!stage || !data) {
      return NextResponse.json(
        { success: false, error: 'Stage and data are required' },
        { status: 400 }
      );
    }

    let enhancementResult;

    try {
      switch (stage) {
        case 'blueprint':
          if (!data.appIdea || !data.validationQuestions || !data.appBlueprint) {
            return NextResponse.json(
              { success: false, error: 'App idea, validation questions, and blueprint data are required for this stage' },
              { status: 400 }
            );
          }
          enhancementResult = await mvpStageEnhancer.enhanceBlueprint(data.appIdea, data.validationQuestions, data.appBlueprint);
          break;

        case 'screen_prompts':
          if (!data.appIdea || !data.validationQuestions || !data.screenPrompts) {
            return NextResponse.json(
              { success: false, error: 'App idea, validation questions, and screen prompts data are required for this stage' },
              { status: 400 }
            );
          }
          enhancementResult = await mvpStageEnhancer.enhanceScreenPrompts(data.appIdea, data.validationQuestions, data.screenPrompts);
          break;

        default:
          return NextResponse.json(
            { success: false, error: `Unsupported stage: ${stage}. Only 'blueprint' and 'screen_prompts' are supported.` },
            { status: 400 }
          );
      }

      // Log the enhancement for analytics
      await logStageEnhancement(supabase, user.id, stage, enhancementResult);

      return NextResponse.json({
        success: true,
        stage,
        enhancement: enhancementResult,
        message: `Stage ${stage} enhanced successfully`
      });

    } catch (enhancementError) {
      console.error(`Error enhancing stage ${stage}:`, enhancementError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to enhance stage ${stage}`,
          details: enhancementError instanceof Error ? enhancementError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in stage enhancement API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get enhancement suggestions for a stage
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage') as MVPStage;
    const query = searchParams.get('query') || '';

    if (!stage) {
      return NextResponse.json(
        { success: false, error: 'Stage parameter is required' },
        { status: 400 }
      );
    }

    // Get stage-specific suggestions from knowledge base
    const suggestions = await getStageSpecificSuggestions(stage, query);

    return NextResponse.json({
      success: true,
      stage,
      suggestions,
      count: suggestions.length
    });

  } catch (error) {
    console.error('Error getting stage suggestions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to log stage enhancements for analytics
async function logStageEnhancement(
  supabase: any,
  userId: string,
  stage: MVPStage,
  result: any
): Promise<void> {
  try {
    await supabase
      .from('mvp_stage_enhancements')
      .insert({
        user_id: userId,
        stage,
        confidence_score: result.confidenceScore,
        knowledge_count: result.relevantKnowledge.length,
        optimization_count: result.stageSpecificOptimizations.length,
        suggestion_count: result.suggestions.length,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log stage enhancement:', error);
    // Don't throw error for logging failures
  }
}

// Helper function to get stage-specific suggestions
async function getStageSpecificSuggestions(stage: MVPStage, query: string): Promise<any[]> {
  const { vectorService } = await import('@/lib/vector-service');
  
  const stageCategories = {
    app_idea: ['ideation', 'market_research', 'app_concepts'],
    validation: ['validation_methods', 'market_analysis', 'user_research'],
    blueprint: ['architecture', 'data_modeling', 'screen_design'],
    screen_prompts: ['ui_design', 'component_patterns', 'responsive_design'],
    flow_description: ['navigation', 'user_experience', 'flow_patterns'],
    export_composer: ['tool_optimization', 'prompt_engineering', 'deployment']
  };

  try {
    const results = await vectorService.searchKnowledgeBase(query, {
      categories: stageCategories[stage] || [],
      maxResults: 5,
      similarityThreshold: 0.6
    });

    return results.map(result => ({
      title: result.title,
      content: result.content.substring(0, 200) + '...',
      relevance: result.similarity_score,
      categories: result.categories
    }));
  } catch (error) {
    console.error('Error getting stage suggestions:', error);
    return [];
  }
}

// PUT - Update stage enhancement preferences
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { stage, preferences } = body;

    if (!stage || !preferences) {
      return NextResponse.json(
        { success: false, error: 'Stage and preferences are required' },
        { status: 400 }
      );
    }

    // Update user preferences for stage enhancements
    const { error } = await supabase
      .from('user_stage_preferences')
      .upsert({
        user_id: user.id,
        stage,
        preferences,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating stage preferences:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Stage preferences updated successfully'
    });

  } catch (error) {
    console.error('Error in stage preferences update:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface SavePromptRequest {
  promptTitle: string;
  promptContent: string;
  promptType: 'blueprint' | 'screen_prompt' | 'unified' | 'export';
  targetTool: string;
  stageNumber: number;
  screenId?: string;
  mvpId?: string;
  ragEnhanced?: boolean;
  confidenceScore?: number;
  enhancementSuggestions?: string[];
  toolOptimizations?: string[];
  knowledgeSources?: string[];
  tags?: string[];
}

interface UpdatePromptRequest {
  id: string;
  promptTitle?: string;
  promptContent?: string;
  userRating?: number;
  userFeedback?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  tags?: string[];
}

// GET - Fetch user's saved prompts
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
    const promptType = searchParams.get('type');
    const targetTool = searchParams.get('tool');
    const mvpId = searchParams.get('mvp_id');
    const isArchived = searchParams.get('archived') === 'true';
    const isFavorite = searchParams.get('favorites') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('rag_generated_prompts')
      .select(`
        id,
        prompt_title,
        prompt_content,
        prompt_type,
        target_tool,
        stage_number,
        screen_id,
        is_rag_enhanced,
        confidence_score,
        enhancement_suggestions,
        tool_optimizations,
        knowledge_sources,
        version,
        is_current_version,
        copy_count,
        export_count,
        user_rating,
        user_feedback,
        effectiveness_score,
        tags,
        is_favorite,
        is_archived,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .eq('is_current_version', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (promptType) {
      query = query.eq('prompt_type', promptType);
    }
    if (targetTool) {
      query = query.eq('target_tool', targetTool);
    }
    if (mvpId) {
      query = query.eq('mvp_id', mvpId);
    }
    if (isArchived !== null) {
      query = query.eq('is_archived', isArchived);
    }
    if (isFavorite) {
      query = query.eq('is_favorite', true);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: prompts, error } = await query;

    if (error) {
      console.error('Error fetching prompts:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch prompts' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('rag_generated_prompts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_current_version', true);

    return NextResponse.json({
      success: true,
      prompts: prompts || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Error in prompts GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save a new prompt
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

    const body: SavePromptRequest = await request.json();

    // Validate required fields
    if (!body.promptTitle || !body.promptContent || !body.promptType || !body.targetTool || !body.stageNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert the prompt
    const { data: prompt, error } = await supabase
      .from('rag_generated_prompts')
      .insert({
        user_id: user.id,
        mvp_id: body.mvpId,
        prompt_title: body.promptTitle,
        prompt_content: body.promptContent,
        prompt_type: body.promptType,
        target_tool: body.targetTool,
        stage_number: body.stageNumber,
        screen_id: body.screenId,
        is_rag_enhanced: body.ragEnhanced || false,
        confidence_score: body.confidenceScore,
        enhancement_suggestions: body.enhancementSuggestions || [],
        tool_optimizations: body.toolOptimizations || [],
        knowledge_sources: body.knowledgeSources || [],
        tags: body.tags || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving prompt:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      prompt,
      message: 'Prompt saved successfully'
    });

  } catch (error) {
    console.error('Error in prompts POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing prompt
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

    const body: UpdatePromptRequest = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Prompt ID is required' },
        { status: 400 }
      );
    }

    // Update the prompt
    const updateData: any = {};
    if (body.promptTitle !== undefined) updateData.prompt_title = body.promptTitle;
    if (body.promptContent !== undefined) updateData.prompt_content = body.promptContent;
    if (body.userRating !== undefined) updateData.user_rating = body.userRating;
    if (body.userFeedback !== undefined) updateData.user_feedback = body.userFeedback;
    if (body.isFavorite !== undefined) updateData.is_favorite = body.isFavorite;
    if (body.isArchived !== undefined) updateData.is_archived = body.isArchived;
    if (body.tags !== undefined) updateData.tags = body.tags;

    const { data: prompt, error } = await supabase
      .from('rag_generated_prompts')
      .update(updateData)
      .eq('id', body.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating prompt:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      prompt,
      message: 'Prompt updated successfully'
    });

  } catch (error) {
    console.error('Error in prompts PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a prompt
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Prompt ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by archiving
    const { error } = await supabase
      .from('rag_generated_prompts')
      .update({ is_archived: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting prompt:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt deleted successfully'
    });

  } catch (error) {
    console.error('Error in prompts DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

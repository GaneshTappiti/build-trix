import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { vectorService } from '@/lib/vector-service';

interface PromptTemplate {
  template_name: string;
  template_content: string;
  template_type: 'skeleton' | 'feature' | 'optimization' | 'debugging';
  target_tool: string;
  use_case: string;
  project_complexity: 'simple' | 'medium' | 'complex';
  required_variables: any;
  optional_variables?: any;
}

// GET - Search prompt templates
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
    const query = searchParams.get('query');
    const targetTool = searchParams.get('target_tool');
    const templateType = searchParams.get('template_type');
    const complexity = searchParams.get('complexity');
    const limit = parseInt(searchParams.get('limit') || '10');

    let results;

    if (query) {
      // Vector search with query
      results = await vectorService.searchPromptTemplates(query, {
        targetTool,
        templateType,
        complexity,
        maxResults: limit,
        similarityThreshold: 0.5
      });
    } else {
      // Regular database query without vector search
      let dbQuery = supabase
        .from('rag_prompt_templates')
        .select('id, template_name, template_content, template_type, target_tool, use_case, project_complexity, required_variables, optional_variables, usage_count, success_rate, created_at')
        .eq('is_active', true);

      if (targetTool) {
        dbQuery = dbQuery.eq('target_tool', targetTool);
      }
      if (templateType) {
        dbQuery = dbQuery.eq('template_type', templateType);
      }
      if (complexity) {
        dbQuery = dbQuery.eq('project_complexity', complexity);
      }

      dbQuery = dbQuery.order('success_rate', { ascending: false }).limit(limit);

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Error fetching prompt templates:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch prompt templates' },
          { status: 500 }
        );
      }

      results = data || [];
    }

    return NextResponse.json({
      success: true,
      templates: results,
      count: results.length
    });

  } catch (error) {
    console.error('Error in templates GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add new prompt template
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

    const body: PromptTemplate = await request.json();

    // Validate required fields
    if (!body.template_name || !body.template_content || !body.template_type || !body.target_tool || !body.use_case || !body.project_complexity || !body.required_variables) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add the template to the database
    const templateId = await vectorService.addPromptTemplate({
      template_name: body.template_name,
      template_content: body.template_content,
      template_type: body.template_type,
      target_tool: body.target_tool,
      use_case: body.use_case,
      project_complexity: body.project_complexity,
      required_variables: body.required_variables,
      optional_variables: body.optional_variables || [],
      created_by: user.id
    });

    return NextResponse.json({
      success: true,
      template_id: templateId,
      message: 'Prompt template added successfully'
    });

  } catch (error) {
    console.error('Error adding prompt template:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { success: false, error: `Failed to add template: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// PUT - Update prompt template
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Update the template
    const { error } = await supabase
      .from('rag_prompt_templates')
      .update(updateData)
      .eq('id', id)
      .eq('created_by', user.id); // Ensure user can only update their own templates

    if (error) {
      console.error('Error updating prompt template:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt template updated successfully'
    });

  } catch (error) {
    console.error('Error in templates PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove prompt template
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
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('rag_prompt_templates')
      .update({ is_active: false })
      .eq('id', id)
      .eq('created_by', user.id); // Ensure user can only delete their own templates

    if (error) {
      console.error('Error deleting prompt template:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt template deleted successfully'
    });

  } catch (error) {
    console.error('Error in templates DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update template performance metrics
export async function PATCH(request: NextRequest) {
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
    const { id, success_rate, confidence_score } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Update performance metrics
    const updateData: any = { usage_count: supabase.raw('usage_count + 1') };
    
    if (success_rate !== undefined) {
      updateData.success_rate = success_rate;
    }
    if (confidence_score !== undefined) {
      updateData.avg_confidence_score = confidence_score;
    }

    const { error } = await supabase
      .from('rag_prompt_templates')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating template metrics:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update template metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template metrics updated successfully'
    });

  } catch (error) {
    console.error('Error in templates PATCH:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

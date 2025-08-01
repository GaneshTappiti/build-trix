import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { vectorService } from '@/lib/vector-service';

interface KnowledgeDocument {
  title: string;
  content: string;
  document_type: 'best_practice' | 'example' | 'template' | 'guide' | 'reference';
  target_tools: string[];
  categories: string[];
  complexity_level: 'beginner' | 'intermediate' | 'advanced';
  source_url?: string;
  tags?: string[];
}

interface KnowledgeSearchQuery {
  query?: string;
  target_tools?: string[];
  categories?: string[];
  complexity?: string;
  document_type?: string;
  limit?: number;
}

// GET - Search knowledge base
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
    const targetTools = searchParams.get('target_tools')?.split(',');
    const categories = searchParams.get('categories')?.split(',');
    const complexity = searchParams.get('complexity');
    const documentType = searchParams.get('document_type');
    const limit = parseInt(searchParams.get('limit') || '10');

    let results;

    if (query) {
      // Vector search with query
      results = await vectorService.searchKnowledgeBase(query, {
        targetTools,
        categories,
        complexity,
        maxResults: limit,
        similarityThreshold: 0.5
      });
    } else {
      // Regular database query without vector search
      let dbQuery = supabase
        .from('rag_knowledge_base')
        .select('id, title, content, document_type, target_tools, categories, complexity_level, source_url, tags, quality_score, created_at')
        .eq('is_active', true);

      if (targetTools && targetTools.length > 0) {
        dbQuery = dbQuery.overlaps('target_tools', targetTools);
      }
      if (categories && categories.length > 0) {
        dbQuery = dbQuery.overlaps('categories', categories);
      }
      if (complexity) {
        dbQuery = dbQuery.eq('complexity_level', complexity);
      }
      if (documentType) {
        dbQuery = dbQuery.eq('document_type', documentType);
      }

      dbQuery = dbQuery.order('quality_score', { ascending: false }).limit(limit);

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Error fetching knowledge base:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch knowledge base' },
          { status: 500 }
        );
      }

      results = data || [];
    }

    return NextResponse.json({
      success: true,
      documents: results,
      count: results.length
    });

  } catch (error) {
    console.error('Error in knowledge base GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add new knowledge document
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

    const body: KnowledgeDocument = await request.json();

    // Validate required fields
    if (!body.title || !body.content || !body.document_type || !body.target_tools || !body.categories || !body.complexity_level) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add the document to the knowledge base
    const documentId = await vectorService.addKnowledgeDocument({
      title: body.title,
      content: body.content,
      document_type: body.document_type,
      target_tools: body.target_tools,
      categories: body.categories,
      complexity_level: body.complexity_level,
      source_url: body.source_url,
      tags: body.tags || [],
      created_by: user.id
    });

    return NextResponse.json({
      success: true,
      document_id: documentId,
      message: 'Knowledge document added successfully'
    });

  } catch (error) {
    console.error('Error adding knowledge document:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { success: false, error: `Failed to add document: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// PUT - Update knowledge document
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
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Update the document
    const { error } = await supabase
      .from('rag_knowledge_base')
      .update(updateData)
      .eq('id', id)
      .eq('created_by', user.id); // Ensure user can only update their own documents

    if (error) {
      console.error('Error updating knowledge document:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Knowledge document updated successfully'
    });

  } catch (error) {
    console.error('Error in knowledge base PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove knowledge document
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
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('rag_knowledge_base')
      .update({ is_active: false })
      .eq('id', id)
      .eq('created_by', user.id); // Ensure user can only delete their own documents

    if (error) {
      console.error('Error deleting knowledge document:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Knowledge document deleted successfully'
    });

  } catch (error) {
    console.error('Error in knowledge base DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

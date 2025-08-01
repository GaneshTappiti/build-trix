import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface AnalyticsQuery {
  timeframe?: 'day' | 'week' | 'month' | 'year';
  start_date?: string;
  end_date?: string;
  target_tool?: string;
  user_id?: string;
}

interface AnalyticsData {
  totalGenerations: number;
  averageConfidenceScore: number;
  successRate: number;
  topTools: Array<{ tool: string; count: number; avg_confidence: number }>;
  topComplexities: Array<{ complexity: string; count: number; avg_confidence: number }>;
  generationTrends: Array<{ date: string; count: number; avg_confidence: number }>;
  qualityMetrics: {
    highQuality: number; // > 0.8 confidence
    mediumQuality: number; // 0.5 - 0.8 confidence
    lowQuality: number; // < 0.5 confidence
  };
  retrievalMetrics: {
    totalRetrievals: number;
    averageSimilarityScore: number;
    topCategories: Array<{ category: string; count: number }>;
  };
}

// GET - Fetch RAG analytics
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
    const timeframe = searchParams.get('timeframe') || 'month';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const targetTool = searchParams.get('target_tool');
    const userId = searchParams.get('user_id') || user.id;

    // Calculate date range based on timeframe
    let dateFilter = '';
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = `AND created_at BETWEEN '${startDate}' AND '${endDate}'`;
    } else {
      switch (timeframe) {
        case 'day':
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          dateFilter = `AND created_at >= '${yesterday.toISOString()}'`;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = `AND created_at >= '${weekAgo.toISOString()}'`;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = `AND created_at >= '${monthAgo.toISOString()}'`;
          break;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          dateFilter = `AND created_at >= '${yearAgo.toISOString()}'`;
          break;
      }
    }

    const toolFilter = targetTool ? `AND target_tool = '${targetTool}'` : '';
    const userFilter = `AND user_id = '${userId}'`;

    // Get basic generation metrics
    const { data: generationStats, error: genError } = await supabase.rpc('get_rag_generation_stats', {
      date_filter: dateFilter,
      tool_filter: toolFilter,
      user_filter: userFilter
    });

    if (genError) {
      console.error('Error fetching generation stats:', genError);
    }

    // Get tool usage statistics
    const { data: toolStats, error: toolError } = await supabase
      .from('rag_prompt_generations')
      .select('target_tool, confidence_score, was_successful')
      .eq('user_id', userId)
      .gte('created_at', timeframe === 'month' ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (toolError) {
      console.error('Error fetching tool stats:', toolError);
    }

    // Get complexity statistics
    const { data: complexityStats, error: complexityError } = await supabase
      .from('rag_prompt_generations')
      .select('project_complexity, confidence_score')
      .eq('user_id', userId)
      .gte('created_at', timeframe === 'month' ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (complexityError) {
      console.error('Error fetching complexity stats:', complexityError);
    }

    // Get retrieval statistics
    const { data: retrievalStats, error: retrievalError } = await supabase
      .from('rag_retrieval_logs')
      .select('query_type, max_similarity_score, retrieval_count, created_at')
      .eq('user_id', userId)
      .gte('created_at', timeframe === 'month' ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (retrievalError) {
      console.error('Error fetching retrieval stats:', retrievalError);
    }

    // Process the data
    const analytics: AnalyticsData = {
      totalGenerations: toolStats?.length || 0,
      averageConfidenceScore: toolStats?.reduce((sum, item) => sum + (item.confidence_score || 0), 0) / (toolStats?.length || 1),
      successRate: toolStats?.filter(item => item.was_successful).length / (toolStats?.length || 1),
      
      topTools: processToolStats(toolStats || []),
      topComplexities: processComplexityStats(complexityStats || []),
      generationTrends: processGenerationTrends(toolStats || [], timeframe),
      
      qualityMetrics: {
        highQuality: toolStats?.filter(item => (item.confidence_score || 0) > 0.8).length || 0,
        mediumQuality: toolStats?.filter(item => (item.confidence_score || 0) >= 0.5 && (item.confidence_score || 0) <= 0.8).length || 0,
        lowQuality: toolStats?.filter(item => (item.confidence_score || 0) < 0.5).length || 0,
      },
      
      retrievalMetrics: {
        totalRetrievals: retrievalStats?.length || 0,
        averageSimilarityScore: retrievalStats?.reduce((sum, item) => sum + (item.max_similarity_score || 0), 0) / (retrievalStats?.length || 1),
        topCategories: processRetrievalCategories(retrievalStats || []),
      }
    };

    return NextResponse.json({
      success: true,
      analytics,
      timeframe,
      date_range: {
        start: startDate || (timeframe === 'month' ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        end: endDate || now.toISOString()
      }
    });

  } catch (error) {
    console.error('Error in analytics GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Log user feedback for prompt quality
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

    const body = await request.json();
    const { generation_id, rating, feedback, prompt_effectiveness } = body;

    if (!generation_id || rating === undefined) {
      return NextResponse.json(
        { success: false, error: 'Generation ID and rating are required' },
        { status: 400 }
      );
    }

    // Update the generation record with user feedback
    const { error } = await supabase
      .from('rag_prompt_generations')
      .update({
        user_rating: rating,
        user_feedback: feedback,
        prompt_effectiveness: prompt_effectiveness
      })
      .eq('id', generation_id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating user feedback:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback saved successfully'
    });

  } catch (error) {
    console.error('Error in analytics POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for data processing
function processToolStats(toolStats: any[]) {
  const toolMap = new Map();
  
  toolStats.forEach(item => {
    const tool = item.target_tool;
    if (!toolMap.has(tool)) {
      toolMap.set(tool, { count: 0, totalConfidence: 0 });
    }
    const stats = toolMap.get(tool);
    stats.count++;
    stats.totalConfidence += item.confidence_score || 0;
  });

  return Array.from(toolMap.entries()).map(([tool, stats]) => ({
    tool,
    count: stats.count,
    avg_confidence: stats.totalConfidence / stats.count
  })).sort((a, b) => b.count - a.count);
}

function processComplexityStats(complexityStats: any[]) {
  const complexityMap = new Map();
  
  complexityStats.forEach(item => {
    const complexity = item.project_complexity || 'unknown';
    if (!complexityMap.has(complexity)) {
      complexityMap.set(complexity, { count: 0, totalConfidence: 0 });
    }
    const stats = complexityMap.get(complexity);
    stats.count++;
    stats.totalConfidence += item.confidence_score || 0;
  });

  return Array.from(complexityMap.entries()).map(([complexity, stats]) => ({
    complexity,
    count: stats.count,
    avg_confidence: stats.totalConfidence / stats.count
  })).sort((a, b) => b.count - a.count);
}

function processGenerationTrends(toolStats: any[], timeframe: string) {
  // This is a simplified version - in production, you'd group by actual dates
  const trends = [];
  const now = new Date();
  const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 1;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    trends.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 10), // Placeholder - implement actual date grouping
      avg_confidence: 0.7 + Math.random() * 0.3
    });
  }
  
  return trends;
}

function processRetrievalCategories(retrievalStats: any[]) {
  const categoryMap = new Map();
  
  retrievalStats.forEach(item => {
    const category = item.query_type || 'unknown';
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });

  return Array.from(categoryMap.entries()).map(([category, count]) => ({
    category,
    count
  })).sort((a, b) => b.count - a.count);
}

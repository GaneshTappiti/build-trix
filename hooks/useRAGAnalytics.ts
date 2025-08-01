import { useState, useCallback, useEffect } from 'react';

export interface AnalyticsData {
  totalGenerations: number;
  averageConfidenceScore: number;
  successRate: number;
  topTools: Array<{ tool: string; count: number; avg_confidence: number }>;
  topComplexities: Array<{ complexity: string; count: number; avg_confidence: number }>;
  generationTrends: Array<{ date: string; count: number; avg_confidence: number }>;
  qualityMetrics: {
    highQuality: number;
    mediumQuality: number;
    lowQuality: number;
  };
  retrievalMetrics: {
    totalRetrievals: number;
    averageSimilarityScore: number;
    topCategories: Array<{ category: string; count: number }>;
  };
}

export interface AnalyticsQuery {
  timeframe?: 'day' | 'week' | 'month' | 'year';
  start_date?: string;
  end_date?: string;
  target_tool?: string;
  user_id?: string;
}

export interface UserFeedback {
  generation_id: string;
  rating: number; // 1-5 scale
  feedback?: string;
  prompt_effectiveness?: number; // 1-5 scale
}

export function useRAGAnalytics() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // Fetch analytics data
  const fetchAnalytics = useCallback(async (query: AnalyticsQuery = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (query.timeframe) params.append('timeframe', query.timeframe);
      if (query.start_date) params.append('start_date', query.start_date);
      if (query.end_date) params.append('end_date', query.end_date);
      if (query.target_tool) params.append('target_tool', query.target_tool);
      if (query.user_id) params.append('user_id', query.user_id);

      const response = await fetch(`/api/rag/analytics?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
        return data.analytics;
      } else {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching analytics:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Submit user feedback
  const submitFeedback = useCallback(async (feedback: UserFeedback) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return true;
      } else {
        throw new Error(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error submitting feedback:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch analytics when timeframe changes
  useEffect(() => {
    fetchAnalytics({ timeframe });
  }, [timeframe, fetchAnalytics]);

  // Computed metrics
  const computedMetrics = analytics ? {
    // Quality distribution percentages
    qualityDistribution: {
      high: analytics.totalGenerations > 0 ? (analytics.qualityMetrics.highQuality / analytics.totalGenerations) * 100 : 0,
      medium: analytics.totalGenerations > 0 ? (analytics.qualityMetrics.mediumQuality / analytics.totalGenerations) * 100 : 0,
      low: analytics.totalGenerations > 0 ? (analytics.qualityMetrics.lowQuality / analytics.totalGenerations) * 100 : 0,
    },
    
    // Success rate percentage
    successRatePercentage: analytics.successRate * 100,
    
    // Average confidence score percentage
    confidencePercentage: analytics.averageConfidenceScore * 100,
    
    // Most popular tool
    mostPopularTool: analytics.topTools.length > 0 ? analytics.topTools[0].tool : 'None',
    
    // Most common complexity
    mostCommonComplexity: analytics.topComplexities.length > 0 ? analytics.topComplexities[0].complexity : 'None',
    
    // Retrieval efficiency
    retrievalEfficiency: analytics.retrievalMetrics.averageSimilarityScore * 100,
    
    // Trend direction (simplified)
    trendDirection: analytics.generationTrends.length >= 2 ? 
      (analytics.generationTrends[analytics.generationTrends.length - 1].count > analytics.generationTrends[0].count ? 'up' : 'down') : 'stable',
  } : null;

  // Performance insights
  const insights = analytics ? {
    // Quality insights
    qualityInsights: [
      analytics.qualityMetrics.highQuality > analytics.qualityMetrics.lowQuality ? 
        'Most prompts are high quality' : 'Consider improving prompt quality',
      analytics.averageConfidenceScore > 0.8 ? 
        'Excellent confidence scores' : 'Confidence scores could be improved',
    ],
    
    // Tool insights
    toolInsights: analytics.topTools.length > 0 ? [
      `${analytics.topTools[0].tool} is your most used tool`,
      analytics.topTools[0].avg_confidence > 0.8 ? 
        `${analytics.topTools[0].tool} generates high-quality prompts` : 
        `Consider optimizing ${analytics.topTools[0].tool} usage`,
    ] : ['No tool usage data available'],
    
    // Retrieval insights
    retrievalInsights: [
      analytics.retrievalMetrics.totalRetrievals > 0 ? 
        `${analytics.retrievalMetrics.totalRetrievals} knowledge retrievals performed` : 
        'No knowledge base retrievals yet',
      analytics.retrievalMetrics.averageSimilarityScore > 0.7 ? 
        'Good knowledge base relevance' : 
        'Consider expanding knowledge base',
    ],
  } : null;

  return {
    // State
    isLoading,
    error,
    analytics,
    timeframe,
    
    // Computed data
    computedMetrics,
    insights,
    
    // Actions
    fetchAnalytics,
    submitFeedback,
    setTimeframe,
    
    // Utilities
    clearError: () => setError(null),
    refreshAnalytics: () => fetchAnalytics({ timeframe }),
  };
}

// Helper hook for real-time analytics updates
export function useRAGAnalyticsRealtime(refreshInterval: number = 30000) {
  const analytics = useRAGAnalytics();
  
  useEffect(() => {
    const interval = setInterval(() => {
      analytics.refreshAnalytics();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [analytics, refreshInterval]);
  
  return analytics;
}

// Helper hook for specific tool analytics
export function useToolAnalytics(toolName: string) {
  const [toolAnalytics, setToolAnalytics] = useState<any>(null);
  const { fetchAnalytics, isLoading, error } = useRAGAnalytics();
  
  const fetchToolSpecificAnalytics = useCallback(async () => {
    const data = await fetchAnalytics({ target_tool: toolName });
    setToolAnalytics(data);
    return data;
  }, [fetchAnalytics, toolName]);
  
  useEffect(() => {
    fetchToolSpecificAnalytics();
  }, [fetchToolSpecificAnalytics]);
  
  return {
    toolAnalytics,
    isLoading,
    error,
    refreshToolAnalytics: fetchToolSpecificAnalytics,
  };
}

// Helper hook for user feedback collection
export function useFeedbackCollection() {
  const { submitFeedback, isLoading, error } = useRAGAnalytics();
  const [feedbackHistory, setFeedbackHistory] = useState<UserFeedback[]>([]);
  
  const addFeedback = useCallback(async (feedback: UserFeedback) => {
    try {
      await submitFeedback(feedback);
      setFeedbackHistory(prev => [...prev, feedback]);
      return true;
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      return false;
    }
  }, [submitFeedback]);
  
  return {
    addFeedback,
    feedbackHistory,
    isLoading,
    error,
  };
}

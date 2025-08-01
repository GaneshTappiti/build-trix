import { useState, useCallback, useEffect } from 'react';

export interface StoredPrompt {
  id: string;
  promptTitle: string;
  promptContent: string;
  promptType: 'blueprint' | 'screen_prompt' | 'unified' | 'export';
  targetTool: string;
  stageNumber: number;
  screenId?: string;
  isRagEnhanced: boolean;
  confidenceScore?: number;
  enhancementSuggestions?: string[];
  toolOptimizations?: string[];
  knowledgeSources?: string[];
  version: number;
  copyCount: number;
  exportCount: number;
  userRating?: number;
  userFeedback?: string;
  effectivenessScore?: number;
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavePromptData {
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

export interface PromptFilters {
  type?: string;
  tool?: string;
  mvpId?: string;
  archived?: boolean;
  favorites?: boolean;
  limit?: number;
  offset?: number;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function useStoredPrompts() {
  const [prompts, setPrompts] = useState<StoredPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  });

  // Fetch prompts with filters
  const fetchPrompts = useCallback(async (filters: PromptFilters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.tool) params.append('tool', filters.tool);
      if (filters.mvpId) params.append('mvp_id', filters.mvpId);
      if (filters.archived !== undefined) params.append('archived', filters.archived.toString());
      if (filters.favorites) params.append('favorites', 'true');
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`/api/prompts?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setPrompts(data.prompts);
        setPagination(data.pagination);
        return data.prompts;
      } else {
        throw new Error(data.error || 'Failed to fetch prompts');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching prompts:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save a new prompt
  const savePrompt = useCallback(async (promptData: SavePromptData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh the prompts list
        await fetchPrompts();
        return data.prompt;
      } else {
        throw new Error(data.error || 'Failed to save prompt');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error saving prompt:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchPrompts]);

  // Update an existing prompt
  const updatePrompt = useCallback(async (
    id: string, 
    updates: {
      promptTitle?: string;
      promptContent?: string;
      userRating?: number;
      userFeedback?: string;
      isFavorite?: boolean;
      isArchived?: boolean;
      tags?: string[];
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/prompts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the local state
        setPrompts(prev => prev.map(prompt => 
          prompt.id === id ? { ...prompt, ...updates } : prompt
        ));
        return data.prompt;
      } else {
        throw new Error(data.error || 'Failed to update prompt');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error updating prompt:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a prompt (soft delete - archive)
  const deletePrompt = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/prompts?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Remove from local state
        setPrompts(prev => prev.filter(prompt => prompt.id !== id));
        return true;
      } else {
        throw new Error(data.error || 'Failed to delete prompt');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error deleting prompt:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (id: string, isFavorite: boolean) => {
    return updatePrompt(id, { isFavorite });
  }, [updatePrompt]);

  // Add rating and feedback
  const ratePrompt = useCallback(async (id: string, rating: number, feedback?: string) => {
    return updatePrompt(id, { userRating: rating, userFeedback: feedback });
  }, [updatePrompt]);

  // Copy prompt content to clipboard
  const copyPrompt = useCallback(async (prompt: StoredPrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.promptContent);
      
      // Track copy count (optional - could be done server-side)
      // This is a fire-and-forget operation
      fetch('/api/prompts/track-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prompt.id, action: 'copy' })
      }).catch(console.warn);
      
      return true;
    } catch (err) {
      console.error('Failed to copy prompt:', err);
      return false;
    }
  }, []);

  // Load more prompts (pagination)
  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || isLoading) return;

    const newOffset = pagination.offset + pagination.limit;
    const newPrompts = await fetchPrompts({ offset: newOffset, limit: pagination.limit });
    
    if (newPrompts.length > 0) {
      setPrompts(prev => [...prev, ...newPrompts]);
    }
  }, [pagination, isLoading, fetchPrompts]);

  // Get prompts by type
  const getPromptsByType = useCallback((type: string) => {
    return prompts.filter(prompt => prompt.promptType === type);
  }, [prompts]);

  // Get prompts by tool
  const getPromptsByTool = useCallback((tool: string) => {
    return prompts.filter(prompt => prompt.targetTool === tool);
  }, [prompts]);

  // Get favorite prompts
  const getFavoritePrompts = useCallback(() => {
    return prompts.filter(prompt => prompt.isFavorite);
  }, [prompts]);

  // Get RAG-enhanced prompts
  const getRagEnhancedPrompts = useCallback(() => {
    return prompts.filter(prompt => prompt.isRagEnhanced);
  }, [prompts]);

  // Search prompts by title or content
  const searchPrompts = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return prompts.filter(prompt => 
      prompt.promptTitle.toLowerCase().includes(lowercaseQuery) ||
      prompt.promptContent.toLowerCase().includes(lowercaseQuery) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [prompts]);

  // Load initial prompts
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  return {
    // State
    prompts,
    isLoading,
    error,
    pagination,
    
    // Actions
    fetchPrompts,
    savePrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    ratePrompt,
    copyPrompt,
    loadMore,
    
    // Filters and search
    getPromptsByType,
    getPromptsByTool,
    getFavoritePrompts,
    getRagEnhancedPrompts,
    searchPrompts,
    
    // Utilities
    clearError: () => setError(null),
    refreshPrompts: () => fetchPrompts(),
  };
}

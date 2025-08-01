import { useState } from 'react';

interface RAGRequest {
  appIdea: {
    appName: string;
    platforms: string[];
    designStyle: string;
    styleDescription?: string;
    ideaDescription: string;
    targetAudience?: string;
  };
  validationQuestions: {
    hasValidated: boolean;
    hasDiscussed: boolean;
    motivation: string;
    preferredAITool?: string;
    projectComplexity?: string;
    technicalExperience?: string;
  };
  targetTool?: string;
  taskType?: string;
}

interface RAGResponse {
  success: boolean;
  prompt?: string;
  validation?: {
    is_valid: boolean;
    score: number;
    issues: string[];
    suggestions: string[];
  };
  error?: string;
}

export function useRAG() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePrompt = async (request: RAGRequest): Promise<RAGResponse | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/rag/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate prompt');
      }

      const data: RAGResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate prompt');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('RAG prompt generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const getSupportedTools = async () => {
    try {
      const response = await fetch('/api/rag/generate-prompt');
      
      if (!response.ok) {
        throw new Error('Failed to fetch supported tools');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching supported tools:', err);
      return null;
    }
  };

  return {
    generatePrompt,
    getSupportedTools,
    isGenerating,
    error,
    clearError: () => setError(null)
  };
}

// Helper function to convert MVP Studio data to RAG request
export function createRAGRequest(
  appIdea: any,
  validationQuestions: any,
  targetTool?: string,
  taskType?: string
): RAGRequest {
  return {
    appIdea: {
      appName: appIdea.appName || appIdea.app_name,
      platforms: appIdea.platforms || ['web'],
      designStyle: appIdea.designStyle || appIdea.style || 'minimal',
      styleDescription: appIdea.styleDescription || appIdea.style_description,
      ideaDescription: appIdea.ideaDescription || appIdea.app_description,
      targetAudience: appIdea.targetAudience || appIdea.target_users
    },
    validationQuestions: {
      hasValidated: validationQuestions.hasValidated || validationQuestions.idea_validated || false,
      hasDiscussed: validationQuestions.hasDiscussed || validationQuestions.talked_to_people || false,
      motivation: validationQuestions.motivation || 'Building an innovative application',
      preferredAITool: validationQuestions.preferredAITool || targetTool,
      projectComplexity: validationQuestions.projectComplexity || 'medium',
      technicalExperience: validationQuestions.technicalExperience || 'intermediate'
    },
    targetTool: targetTool || validationQuestions.preferredAITool || 'lovable',
    taskType: taskType || 'build web application'
  };
}

// Enhanced prompt generation for existing MVP Studio workflow
export async function enhanceExistingPrompt(
  originalPrompt: string,
  appIdea: any,
  validationQuestions: any,
  targetTool?: string
): Promise<string> {
  try {
    const ragRequest = createRAGRequest(appIdea, validationQuestions, targetTool, 'enhance existing prompt');

    const response = await fetch('/api/rag/generate-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ragRequest),
    });

    if (!response.ok) {
      console.warn('RAG enhancement failed, using original prompt');
      return originalPrompt;
    }

    const data: RAGResponse = await response.json();

    if (data.success && data.prompt) {
      // Combine original prompt with RAG enhancements
      return `${data.prompt}\n\n--- ORIGINAL REQUIREMENTS ---\n${originalPrompt}`;
    }

    return originalPrompt;
  } catch (error) {
    console.warn('RAG enhancement failed:', error);
    return originalPrompt;
  }
}

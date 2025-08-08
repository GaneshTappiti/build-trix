import { useState, useCallback } from 'react';
import { 
  AppSkeleton, 
  GenerateAppSkeletonRequest, 
  GenerateAppSkeletonResponse,
  GenerationSettings,
  AppType,
  AppComplexity
} from '@/types/app-skeleton';

interface UseAppSkeletonGeneratorResult {
  isGenerating: boolean;
  generatedSkeleton: AppSkeleton | null;
  error: string | null;
  generateSkeleton: (request: GenerateAppSkeletonRequest) => Promise<void>;
  clearSkeleton: () => void;
  exportSkeleton: () => void;
}

export function useAppSkeletonGenerator(): UseAppSkeletonGeneratorResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSkeleton, setGeneratedSkeleton] = useState<AppSkeleton | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSkeleton = useCallback(async (request: GenerateAppSkeletonRequest) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-app-skeleton', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result: GenerateAppSkeletonResponse = await response.json();

      if (result.success && result.appSkeleton) {
        setGeneratedSkeleton(result.appSkeleton);
      } else {
        setError(result.error || 'Failed to generate app skeleton');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearSkeleton = useCallback(() => {
    setGeneratedSkeleton(null);
    setError(null);
  }, []);

  const exportSkeleton = useCallback(() => {
    if (!generatedSkeleton) return;

    const dataStr = JSON.stringify(generatedSkeleton, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generatedSkeleton.name.replace(/\s+/g, '-').toLowerCase()}-skeleton.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [generatedSkeleton]);

  return {
    isGenerating,
    generatedSkeleton,
    error,
    generateSkeleton,
    clearSkeleton,
    exportSkeleton,
  };
}

// Helper functions for common generation patterns
export function createQuickSettings(appType: AppType, complexity: AppComplexity = 'mvp'): GenerationSettings {
  return {
    includeErrorStates: complexity !== 'mvp',
    includeLoadingStates: true,
    includeEmptyStates: true,
    includeBackendModels: complexity === 'production',
    suggestUIComponents: true,
    includeModalsPopups: complexity !== 'mvp',
    generateArchitecture: complexity === 'production',
    appType,
    complexity
  };
}

export function createMVPSettings(appType: AppType): GenerationSettings {
  return createQuickSettings(appType, 'mvp');
}

export function createAdvancedSettings(appType: AppType): GenerationSettings {
  return createQuickSettings(appType, 'advanced');
}

export function createProductionSettings(appType: AppType): GenerationSettings {
  return createQuickSettings(appType, 'production');
}

// Hook for fetching user's existing app skeletons
export function useAppSkeletons() {
  const [skeletons, setSkeletons] = useState<AppSkeleton[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSkeletons = useCallback(async (limit = 10, offset = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/generate-app-skeleton?limit=${limit}&offset=${offset}`);
      const result = await response.json();

      if (result.success) {
        setSkeletons(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch app skeletons');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    skeletons,
    isLoading,
    error,
    fetchSkeletons,
  };
}

// Utility functions for working with app skeletons
export class SkeletonUtils {
  static getComplexityBadgeColor(complexity: AppComplexity): string {
    switch (complexity) {
      case 'mvp':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'advanced':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'production':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  static getAppTypeBadgeColor(appType: AppType): string {
    switch (appType) {
      case 'web':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'mobile':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'hybrid':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  static generateSkeletonSummary(skeleton: AppSkeleton): string {
    const parts = [
      `${skeleton.screens.length} screens`,
      `${skeleton.userRoles.length} user roles`,
      `${skeleton.dataModels.length} data models`
    ];

    if (skeleton.modals.length > 0) {
      parts.push(`${skeleton.modals.length} modals`);
    }

    if (skeleton.integrations.length > 0) {
      parts.push(`${skeleton.integrations.length} integrations`);
    }

    return parts.join(' • ');
  }

  static findScreensByCategory(skeleton: AppSkeleton, category: string) {
    return skeleton.screens.filter(screen => screen.category === category);
  }

  static findUserRoleByName(skeleton: AppSkeleton, roleName: string) {
    return skeleton.userRoles.find(role => 
      role.name.toLowerCase() === roleName.toLowerCase()
    );
  }

  static getDataModelByName(skeleton: AppSkeleton, modelName: string) {
    return skeleton.dataModels.find(model => 
      model.name.toLowerCase() === modelName.toLowerCase()
    );
  }

  static calculateSkeletonComplexity(skeleton: AppSkeleton): number {
    // Calculate a complexity score based on various factors
    let score = 0;
    
    score += skeleton.screens.length * 2;
    score += skeleton.userRoles.length * 3;
    score += skeleton.dataModels.length * 4;
    score += skeleton.modals.length * 1;
    score += skeleton.integrations.length * 5;
    
    if (skeleton.architecture) {
      score += 10;
    }

    return score;
  }
}

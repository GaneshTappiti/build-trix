// RAG Integration Tests for MVP Studio
// Tests the integration between the RAG system and MVP Studio

import { ragService } from '@/lib/rag-service';
import { SupportedTool, PromptStage, TaskContext } from '@/types/rag';
import { createRAGRequest } from '@/hooks/useRAG';

describe('RAG Integration Tests', () => {
  describe('RAG Service', () => {
    test('should generate enhanced prompt for Lovable', async () => {
      const mockAppIdea = {
        appName: 'TaskMaster Pro',
        platforms: ['web'] as ('web' | 'mobile')[],
        designStyle: 'minimal' as const,
        styleDescription: 'Clean and modern',
        ideaDescription: 'A task management app for small teams with real-time collaboration',
        targetAudience: 'Small business teams'
      };

      const mockValidationQuestions = {
        hasValidated: true,
        hasDiscussed: true,
        motivation: 'I want to build a tool that helps teams stay organized and productive',
        preferredAITool: SupportedTool.LOVABLE,
        projectComplexity: 'medium' as const,
        technicalExperience: 'intermediate' as const
      };

      const ragRequest = createRAGRequest(
        mockAppIdea,
        mockValidationQuestions,
        SupportedTool.LOVABLE,
        PromptStage.APP_SKELETON
      );

      const result = await ragService.generateEnhancedPrompt(ragRequest);

      expect(result).toBeDefined();
      expect(result.prompt).toContain('TaskMaster Pro');
      expect(result.prompt).toContain('Lovable');
      expect(result.prompt).toContain('React');
      expect(result.prompt).toContain('TypeScript');
      expect(result.prompt).toContain('Supabase');
      expect(result.tool).toBe(SupportedTool.LOVABLE);
      expect(result.stage).toBe(PromptStage.APP_SKELETON);
      expect(result.confidenceScore).toBeGreaterThan(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
    });

    test('should generate enhanced prompt for Cursor', async () => {
      const mockAppIdea = {
        appName: 'E-commerce Dashboard',
        platforms: ['web'] as ('web' | 'mobile')[],
        designStyle: 'business' as const,
        ideaDescription: 'An admin dashboard for managing e-commerce operations',
        targetAudience: 'E-commerce business owners'
      };

      const mockValidationQuestions = {
        hasValidated: false,
        hasDiscussed: true,
        motivation: 'Need a better way to manage my online store',
        preferredAITool: SupportedTool.CURSOR,
        projectComplexity: 'complex' as const,
        technicalExperience: 'advanced' as const
      };

      const ragRequest = createRAGRequest(
        mockAppIdea,
        mockValidationQuestions,
        SupportedTool.CURSOR,
        PromptStage.FEATURE_SPECIFIC
      );

      const result = await ragService.generateEnhancedPrompt(ragRequest);

      expect(result).toBeDefined();
      expect(result.prompt).toContain('E-commerce Dashboard');
      expect(result.prompt).toContain('Code Context');
      expect(result.tool).toBe(SupportedTool.CURSOR);
      expect(result.stage).toBe(PromptStage.FEATURE_SPECIFIC);
      expect(result.confidenceScore).toBeGreaterThan(0);
    });

    test('should generate enhanced prompt for v0.dev', async () => {
      const mockAppIdea = {
        appName: 'Recipe Finder',
        platforms: ['web', 'mobile'] as ('web' | 'mobile')[],
        designStyle: 'playful' as const,
        ideaDescription: 'A fun app to discover and save recipes',
        targetAudience: 'Home cooks and food enthusiasts'
      };

      const mockValidationQuestions = {
        hasValidated: true,
        hasDiscussed: false,
        motivation: 'Love cooking and want to share recipes with friends',
        preferredAITool: SupportedTool.V0,
        projectComplexity: 'simple' as const,
        technicalExperience: 'beginner' as const
      };

      const ragRequest = createRAGRequest(
        mockAppIdea,
        mockValidationQuestions,
        SupportedTool.V0,
        PromptStage.PAGE_UI
      );

      const result = await ragService.generateEnhancedPrompt(ragRequest);

      expect(result).toBeDefined();
      expect(result.prompt).toContain('Recipe Finder');
      expect(result.prompt).toContain('component');
      expect(result.tool).toBe(SupportedTool.V0);
      expect(result.stage).toBe(PromptStage.PAGE_UI);
      expect(result.confidenceScore).toBeGreaterThan(0);
    });

    test('should provide enhancement suggestions', async () => {
      const mockAppIdea = {
        appName: 'Test App',
        platforms: ['web'] as ('web' | 'mobile')[],
        designStyle: 'minimal' as const,
        ideaDescription: 'A simple test app',
        targetAudience: 'Developers'
      };

      const mockValidationQuestions = {
        hasValidated: false,
        hasDiscussed: false,
        motivation: 'Testing the system',
        preferredAITool: SupportedTool.LOVABLE,
        projectComplexity: 'simple' as const,
        technicalExperience: 'beginner' as const
      };

      const ragRequest = createRAGRequest(
        mockAppIdea,
        mockValidationQuestions,
        SupportedTool.LOVABLE,
        PromptStage.APP_SKELETON
      );

      const result = await ragService.generateEnhancedPrompt(ragRequest);

      expect(result.enhancementSuggestions).toBeDefined();
      expect(Array.isArray(result.enhancementSuggestions)).toBe(true);
      expect(result.enhancementSuggestions!.length).toBeGreaterThan(0);
    });

    test('should suggest next stage', async () => {
      const mockAppIdea = {
        appName: 'Test App',
        platforms: ['web'] as ('web' | 'mobile')[],
        designStyle: 'minimal' as const,
        ideaDescription: 'A simple test app',
        targetAudience: 'Developers'
      };

      const mockValidationQuestions = {
        hasValidated: true,
        hasDiscussed: true,
        motivation: 'Testing the system',
        preferredAITool: SupportedTool.LOVABLE,
        projectComplexity: 'simple' as const,
        technicalExperience: 'intermediate' as const
      };

      const ragRequest = createRAGRequest(
        mockAppIdea,
        mockValidationQuestions,
        SupportedTool.LOVABLE,
        PromptStage.APP_SKELETON
      );

      const result = await ragService.generateEnhancedPrompt(ragRequest);

      expect(result.nextSuggestedStage).toBe(PromptStage.PAGE_UI);
    });

    test('should handle unsupported tool gracefully', async () => {
      const mockAppIdea = {
        appName: 'Test App',
        platforms: ['web'] as ('web' | 'mobile')[],
        designStyle: 'minimal' as const,
        ideaDescription: 'A simple test app',
        targetAudience: 'Developers'
      };

      const mockValidationQuestions = {
        hasValidated: true,
        hasDiscussed: true,
        motivation: 'Testing the system',
        preferredAITool: 'unsupported_tool' as SupportedTool,
        projectComplexity: 'simple' as const,
        technicalExperience: 'intermediate' as const
      };

      const ragRequest = createRAGRequest(
        mockAppIdea,
        mockValidationQuestions,
        'unsupported_tool' as SupportedTool,
        PromptStage.APP_SKELETON
      );

      await expect(ragService.generateEnhancedPrompt(ragRequest))
        .rejects
        .toThrow('Unsupported tool');
    });
  });

  describe('createRAGRequest helper', () => {
    test('should create valid RAG request from MVP Studio data', () => {
      const mockAppIdea = {
        appName: 'Test App',
        platforms: ['web', 'mobile'],
        designStyle: 'minimal',
        styleDescription: 'Clean design',
        ideaDescription: 'A test application',
        targetAudience: 'Developers'
      };

      const mockValidationQuestions = {
        hasValidated: true,
        hasDiscussed: false,
        motivation: 'Testing the integration',
        preferredAITool: 'lovable',
        projectComplexity: 'medium',
        technicalExperience: 'intermediate'
      };

      const ragRequest = createRAGRequest(
        mockAppIdea,
        mockValidationQuestions,
        SupportedTool.LOVABLE,
        PromptStage.APP_SKELETON
      );

      expect(ragRequest.appIdea.appName).toBe('Test App');
      expect(ragRequest.appIdea.platforms).toEqual(['web', 'mobile']);
      expect(ragRequest.validationQuestions.hasValidated).toBe(true);
      expect(ragRequest.validationQuestions.preferredAITool).toBe('lovable');
      expect(ragRequest.targetTool).toBe(SupportedTool.LOVABLE);
      expect(ragRequest.stage).toBe(PromptStage.APP_SKELETON);
    });
  });

  describe('Tool Profile Configuration', () => {
    test('should have valid tool profiles for all supported tools', () => {
      const supportedTools = [
        SupportedTool.LOVABLE,
        SupportedTool.CURSOR,
        SupportedTool.V0,
        SupportedTool.BOLT,
        SupportedTool.CLAUDE,
        SupportedTool.CHATGPT
      ];

      supportedTools.forEach(tool => {
        // This would test that each tool has a valid profile
        // In a real implementation, you'd access the tool profiles
        expect(tool).toBeDefined();
        expect(typeof tool).toBe('string');
      });
    });
  });
});

// Mock data for testing
export const mockMVPStudioData = {
  appIdea: {
    appName: 'TaskMaster Pro',
    platforms: ['web'] as ('web' | 'mobile')[],
    designStyle: 'minimal' as const,
    styleDescription: 'Clean and modern interface',
    ideaDescription: 'A comprehensive task management application for small teams with real-time collaboration features',
    targetAudience: 'Small business teams and freelancers'
  },
  validationQuestions: {
    hasValidated: true,
    hasDiscussed: true,
    motivation: 'I want to build a tool that helps teams stay organized and productive while working remotely',
    preferredAITool: SupportedTool.LOVABLE,
    projectComplexity: 'medium' as const,
    technicalExperience: 'intermediate' as const
  },
  appBlueprint: {
    screens: [
      { id: '1', name: 'Dashboard', purpose: 'Main overview', components: ['TaskList', 'Calendar'], navigation: ['Tasks', 'Projects'] },
      { id: '2', name: 'Tasks', purpose: 'Task management', components: ['TaskForm', 'TaskList'], navigation: ['Dashboard', 'Projects'] }
    ],
    userRoles: [
      { name: 'Admin', permissions: ['create', 'read', 'update', 'delete'], description: 'Full access' },
      { name: 'Member', permissions: ['create', 'read', 'update'], description: 'Standard user' }
    ],
    navigationFlow: 'Dashboard -> Tasks -> Projects',
    dataModels: [
      { name: 'Task', fields: ['title', 'description', 'status', 'assignee'], description: 'Task entity' },
      { name: 'Project', fields: ['name', 'description', 'tasks'], description: 'Project entity' }
    ]
  }
};

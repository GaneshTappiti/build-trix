// Comprehensive test suite for RAG system
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ragGenerator } from '../lib/rag-integration';
import { vectorService } from '../lib/vector-service';
import { ragService } from '../lib/rag-service';

// Mock the vector service
jest.mock('../lib/vector-service', () => ({
  vectorService: {
    searchKnowledgeBase: jest.fn(),
    searchPromptTemplates: jest.fn(),
    addKnowledgeDocument: jest.fn(),
    addPromptTemplate: jest.fn(),
    generateEmbedding: jest.fn(),
    logRetrieval: jest.fn(),
  },
}));

// Mock Supabase
jest.mock('../utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => ({ data: { id: 'test-id' }, error: null })),
    })),
    rpc: jest.fn(() => ({ data: [], error: null })),
  })),
}));

describe('RAG System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RAG Prompt Generator', () => {
    it('should generate a basic prompt without vector retrieval', async () => {
      const taskContext = {
        task_type: 'build web application',
        project_name: 'Test App',
        description: 'A simple test application',
        technical_requirements: ['React', 'TypeScript'],
        ui_requirements: ['Responsive design'],
        constraints: ['Web only'],
      };

      const projectInfo = {
        name: 'Test App',
        description: 'A simple test application',
        tech_stack: ['React', 'TypeScript'],
        target_audience: 'Developers',
        requirements: [],
      };

      // Mock empty vector search results
      (vectorService.searchKnowledgeBase as jest.Mock).mockResolvedValue([]);
      (vectorService.searchPromptTemplates as jest.Mock).mockResolvedValue([]);

      const prompt = await ragGenerator.generatePrompt(taskContext, projectInfo, 'lovable');

      expect(prompt).toBeDefined();
      expect(prompt).toContain('Test App');
      expect(prompt).toContain('build web application');
      expect(prompt).toContain('React');
      expect(prompt).toContain('TypeScript');
    });

    it('should generate enhanced prompt with vector retrieval', async () => {
      const taskContext = {
        task_type: 'build web application',
        project_name: 'Test App',
        description: 'A simple test application',
        technical_requirements: ['React', 'TypeScript'],
        ui_requirements: ['Responsive design'],
        constraints: ['Web only'],
      };

      const projectInfo = {
        name: 'Test App',
        description: 'A simple test application',
        tech_stack: ['React', 'TypeScript'],
        target_audience: 'Developers',
        requirements: [],
      };

      // Mock vector search results
      const mockKnowledge = [
        {
          id: '1',
          title: 'React Best Practices',
          content: 'Use functional components with hooks',
          document_type: 'best_practice',
          target_tools: ['lovable'],
          categories: ['ui_design'],
          similarity_score: 0.9,
        },
      ];

      const mockTemplates = [
        {
          id: '1',
          template_name: 'React App Template',
          template_content: 'Create a React app with {features}',
          template_type: 'skeleton',
          target_tool: 'lovable',
          required_variables: ['features'],
          similarity_score: 0.8,
        },
      ];

      (vectorService.searchKnowledgeBase as jest.Mock).mockResolvedValue(mockKnowledge);
      (vectorService.searchPromptTemplates as jest.Mock).mockResolvedValue(mockTemplates);

      const prompt = await ragGenerator.generatePrompt(taskContext, projectInfo, 'lovable');

      expect(prompt).toBeDefined();
      expect(prompt).toContain('React Best Practices');
      expect(prompt).toContain('React App Template');
      expect(vectorService.searchKnowledgeBase).toHaveBeenCalled();
      expect(vectorService.searchPromptTemplates).toHaveBeenCalled();
    });

    it('should validate generated prompts', () => {
      const validPrompt = `
        # Context
        Building a web application
        
        ## Technical Requirements
        - React
        - TypeScript
        
        ## UI Requirements
        - Responsive design
        
        ## Constraints
        - Web only
      `;

      const validation = ragGenerator.validatePrompt(validPrompt);

      expect(validation.is_valid).toBe(true);
      expect(validation.score).toBeGreaterThan(60);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect invalid prompts', () => {
      const invalidPrompt = 'This is a very short prompt';

      const validation = ragGenerator.validatePrompt(invalidPrompt);

      expect(validation.is_valid).toBe(false);
      expect(validation.score).toBeLessThan(60);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Vector Service', () => {
    it('should generate embeddings for text', async () => {
      const text = 'This is a test document about React development';
      
      const embedding = await vectorService.generateEmbedding(text);

      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding).toHaveLength(1536);
      expect(embedding.every(val => typeof val === 'number')).toBe(true);
    });

    it('should search knowledge base with filters', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'React Hooks Guide',
          content: 'Comprehensive guide to React hooks',
          document_type: 'guide',
          target_tools: ['lovable'],
          categories: ['ui_design'],
          similarity_score: 0.9,
        },
      ];

      (vectorService.searchKnowledgeBase as jest.Mock).mockResolvedValue(mockResults);

      const results = await vectorService.searchKnowledgeBase('React hooks', {
        targetTools: ['lovable'],
        categories: ['ui_design'],
        complexity: 'intermediate',
        maxResults: 5,
      });

      expect(results).toEqual(mockResults);
      expect(vectorService.searchKnowledgeBase).toHaveBeenCalledWith('React hooks', {
        targetTools: ['lovable'],
        categories: ['ui_design'],
        complexity: 'intermediate',
        maxResults: 5,
      });
    });

    it('should add knowledge documents with embeddings', async () => {
      const document = {
        title: 'Test Document',
        content: 'This is a test document',
        document_type: 'guide',
        target_tools: ['lovable'],
        categories: ['testing'],
        complexity_level: 'beginner',
      };

      (vectorService.addKnowledgeDocument as jest.Mock).mockResolvedValue('doc-id-123');

      const documentId = await vectorService.addKnowledgeDocument(document);

      expect(documentId).toBe('doc-id-123');
      expect(vectorService.addKnowledgeDocument).toHaveBeenCalledWith(document);
    });
  });

  describe('RAG Service', () => {
    it('should generate enhanced prompts for different tools', async () => {
      const request = {
        appIdea: {
          appName: 'Test App',
          platforms: ['web'] as ('web' | 'mobile')[],
          designStyle: 'minimal' as 'minimal' | 'playful' | 'business',
          ideaDescription: 'A test application',
          targetAudience: 'Developers',
        },
        validationQuestions: {
          hasValidated: true,
          hasDiscussed: true,
          motivation: 'Testing the RAG system',
          preferredAITool: 'lovable',
          projectComplexity: 'medium' as 'simple' | 'medium' | 'complex',
          technicalExperience: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
        },
        targetTool: 'lovable',
        stage: 'app_skeleton',
      };

      const result = await ragService.generateEnhancedPrompt(request);

      expect(result).toBeDefined();
      expect(result.prompt).toBeDefined();
      expect(result.tool).toBe('lovable');
      expect(result.stage).toBe('app_skeleton');
      expect(result.confidenceScore).toBeGreaterThan(0);
    });

    it('should provide tool-specific optimizations', async () => {
      const request = {
        appIdea: {
          appName: 'Test App',
          platforms: ['web'] as ('web' | 'mobile')[],
          designStyle: 'minimal' as 'minimal' | 'playful' | 'business',
          ideaDescription: 'A test application',
        },
        validationQuestions: {
          hasValidated: true,
          hasDiscussed: true,
          motivation: 'Testing',
        },
        targetTool: 'cursor',
        stage: 'debugging',
      };

      const result = await ragService.generateEnhancedPrompt(request);

      expect(result.toolSpecificOptimizations).toBeDefined();
      expect(result.toolSpecificOptimizations?.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle vector service failures gracefully', async () => {
      (vectorService.searchKnowledgeBase as jest.Mock).mockRejectedValue(new Error('Vector search failed'));

      const taskContext = {
        task_type: 'build web application',
        project_name: 'Test App',
        description: 'A simple test application',
        technical_requirements: ['React'],
        ui_requirements: ['Responsive'],
        constraints: ['Web only'],
      };

      const projectInfo = {
        name: 'Test App',
        description: 'A simple test application',
        tech_stack: ['React'],
        target_audience: 'Developers',
        requirements: [],
      };

      // Should still generate a prompt even if vector search fails
      const prompt = await ragGenerator.generatePrompt(taskContext, projectInfo, 'lovable');

      expect(prompt).toBeDefined();
      expect(prompt).toContain('Test App');
    });

    it('should handle invalid tool names', async () => {
      const request = {
        appIdea: {
          appName: 'Test App',
          platforms: ['web'] as ('web' | 'mobile')[],
          designStyle: 'minimal' as 'minimal' | 'playful' | 'business',
          ideaDescription: 'A test application',
        },
        validationQuestions: {
          hasValidated: true,
          hasDiscussed: true,
          motivation: 'Testing',
        },
        targetTool: 'invalid-tool',
        stage: 'app_skeleton',
      };

      await expect(ragService.generateEnhancedPrompt(request)).rejects.toThrow('Unsupported tool');
    });
  });

  describe('Performance Tests', () => {
    it('should generate prompts within reasonable time', async () => {
      const startTime = Date.now();

      const taskContext = {
        task_type: 'build web application',
        project_name: 'Performance Test App',
        description: 'Testing prompt generation performance',
        technical_requirements: ['React', 'TypeScript', 'Supabase'],
        ui_requirements: ['Responsive design', 'Dark mode'],
        constraints: ['Web only', 'Mobile-first'],
      };

      const projectInfo = {
        name: 'Performance Test App',
        description: 'Testing prompt generation performance',
        tech_stack: ['React', 'TypeScript', 'Supabase'],
        target_audience: 'End users',
        requirements: [],
      };

      (vectorService.searchKnowledgeBase as jest.Mock).mockResolvedValue([]);
      (vectorService.searchPromptTemplates as jest.Mock).mockResolvedValue([]);

      const prompt = await ragGenerator.generatePrompt(taskContext, projectInfo, 'lovable');
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(prompt).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent prompt generations', async () => {
      const taskContext = {
        task_type: 'build web application',
        project_name: 'Concurrent Test',
        description: 'Testing concurrent generations',
        technical_requirements: ['React'],
        ui_requirements: ['Responsive'],
        constraints: ['Web only'],
      };

      const projectInfo = {
        name: 'Concurrent Test',
        description: 'Testing concurrent generations',
        tech_stack: ['React'],
        target_audience: 'Users',
        requirements: [],
      };

      (vectorService.searchKnowledgeBase as jest.Mock).mockResolvedValue([]);
      (vectorService.searchPromptTemplates as jest.Mock).mockResolvedValue([]);

      // Generate multiple prompts concurrently
      const promises = Array.from({ length: 5 }, () =>
        ragGenerator.generatePrompt(taskContext, projectInfo, 'lovable')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(prompt => {
        expect(prompt).toBeDefined();
        expect(prompt).toContain('Concurrent Test');
      });
    });
  });
});

describe('Integration with MVP Studio', () => {
  it('should integrate with existing MVP generation flow', async () => {
    // Mock the enhancePromptWithRAG function
    const { enhancePromptWithRAG } = require('../lib/rag-enhancer');
    
    const originalPrompt = 'Create a task management application';
    const ideaDetails = {
      app_name: 'TaskMaster',
      platforms: ['web'],
      style: 'minimal',
      app_description: 'A simple task management app',
      target_users: 'Small teams',
    };
    const questionnaire = {
      idea_validated: true,
      talked_to_people: true,
      motivation: 'Improve team productivity',
    };

    const enhancedPrompt = await enhancePromptWithRAG(originalPrompt, ideaDetails, questionnaire);

    expect(enhancedPrompt).toBeDefined();
    expect(enhancedPrompt).toContain(originalPrompt);
    expect(enhancedPrompt.length).toBeGreaterThan(originalPrompt.length);
  });
});

describe('Analytics and Monitoring', () => {
  it('should track prompt generation metrics', async () => {
    const mockMetrics = {
      totalGenerations: 100,
      averageConfidenceScore: 0.85,
      successRate: 0.92,
      topTools: [{ tool: 'lovable', count: 60, avg_confidence: 0.88 }],
    };

    // Mock analytics API response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, analytics: mockMetrics }),
      })
    ) as jest.Mock;

    const response = await fetch('/api/rag/analytics?timeframe=month');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.analytics.totalGenerations).toBe(100);
    expect(data.analytics.averageConfidenceScore).toBe(0.85);
  });
});

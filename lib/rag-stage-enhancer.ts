// Focused RAG Enhancement for MVP Studio - Blueprint & Screen Prompts
// This module provides RAG enhancement for the most critical stages: Blueprint and Screen Prompts

import { ragGenerator, TaskContext, ProjectInfo } from './rag-integration';
import { vectorService } from './vector-service';

export type MVPStage = 'blueprint' | 'screen_prompts';

export type SupportedTool = 'lovable' | 'cursor' | 'v0' | 'bolt' | 'claude' | 'chatgpt';

export interface BlueprintEnhancementResult {
  stage: 'blueprint';
  originalBlueprint: any;
  enhancedBlueprint: {
    screens: any[];
    userRoles: any[];
    dataModels: any[];
    architecture: string;
    toolSpecificRecommendations: string[];
    securityConsiderations: string[];
    scalabilityNotes: string[];
  };
  relevantKnowledge: any[];
  confidenceScore: number;
  suggestions: string[];
}

export interface ScreenPromptsEnhancementResult {
  stage: 'screen_prompts';
  originalPrompts: any;
  enhancedPrompts: {
    screens: any[];
    optimizedPrompts: Record<string, string>;
    designSystemGuidelines: string[];
    componentPatterns: string[];
    toolSpecificOptimizations: string[];
  };
  relevantKnowledge: any[];
  confidenceScore: number;
  suggestions: string[];
}

export interface MVPStudioData {
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
    motivation?: string;
    preferredAITool: SupportedTool; // Tool selected in validation stage
    projectComplexity?: 'simple' | 'medium' | 'complex';
    technicalExperience?: 'beginner' | 'intermediate' | 'advanced';
  };
  appBlueprint?: {
    screens: any[];
    userRoles: any[];
    dataModels: any[];
    architecture?: string;
  };
  screenPrompts?: {
    screens: any[];
    prompts: Record<string, string>;
  };
}

// Knowledge categories for the two main RAG-enhanced stages
const BLUEPRINT_CATEGORIES = [
  'architecture', 'data_modeling', 'screen_design', 'user_flows',
  'backend', 'database', 'authentication', 'api_design'
];

const SCREEN_PROMPTS_CATEGORIES = [
  'ui_design', 'component_patterns', 'responsive_design', 'accessibility',
  'design_systems', 'user_interface', 'frontend', 'styling'
];

// Tool-specific optimization patterns
const TOOL_OPTIMIZATIONS = {
  lovable: {
    blueprint: [
      'Use Supabase for backend and database',
      'Implement Row Level Security (RLS) policies',
      'Design for React with TypeScript',
      'Plan for shadcn/ui component integration',
      'Consider real-time subscriptions for live data'
    ],
    screen_prompts: [
      'Use shadcn/ui components for consistent design',
      'Implement Tailwind CSS for styling',
      'Follow mobile-first responsive design',
      'Include proper loading states and error handling',
      'Use Supabase Auth for authentication flows'
    ]
  },
  cursor: {
    blueprint: [
      'Focus on clean, maintainable code architecture',
      'Implement proper TypeScript interfaces',
      'Design modular component structure',
      'Plan for easy refactoring and debugging',
      'Consider code organization and file structure'
    ],
    screen_prompts: [
      'Write semantic, accessible HTML structure',
      'Implement proper component composition',
      'Use consistent naming conventions',
      'Include comprehensive error handling',
      'Focus on code readability and maintainability'
    ]
  },
  v0: {
    blueprint: [
      'Design component-first architecture',
      'Plan for interactive UI elements',
      'Consider animation and micro-interactions',
      'Design for component reusability',
      'Focus on visual hierarchy and layout'
    ],
    screen_prompts: [
      'Create visually appealing, modern interfaces',
      'Implement smooth animations and transitions',
      'Use contemporary design patterns',
      'Focus on user experience and interactions',
      'Ensure visual consistency across screens'
    ]
  },
  bolt: {
    blueprint: [
      'Plan full-stack application architecture',
      'Design for rapid prototyping and deployment',
      'Consider both frontend and backend integration',
      'Plan for scalable application structure',
      'Design API endpoints and data flow'
    ],
    screen_prompts: [
      'Create production-ready UI components',
      'Implement proper state management',
      'Design for full-stack integration',
      'Include proper form handling and validation',
      'Consider deployment and hosting requirements'
    ]
  }
};

export class MVPStageEnhancer {

  /**
   * Enhance Stage 3: Blueprint (App Skeleton Generator)
   * This is where the heavy RAG enhancement happens for architecture
   */
  async enhanceBlueprint(
    appIdea: MVPStudioData['appIdea'],
    validationQuestions: MVPStudioData['validationQuestions'],
    blueprint: MVPStudioData['appBlueprint']
  ): Promise<BlueprintEnhancementResult> {
    if (!appIdea || !validationQuestions || !blueprint) {
      throw new Error('App idea, validation questions, and blueprint data are required');
    }

    const selectedTool = validationQuestions.preferredAITool;
    const complexity = validationQuestions.projectComplexity || 'medium';

    // Create search query based on app concept and selected tool
    const query = `${appIdea.appName} ${appIdea.ideaDescription} architecture ${appIdea.platforms.join(' ')} ${selectedTool}`;

    // Retrieve relevant architecture knowledge
    const relevantKnowledge = await vectorService.searchKnowledgeBase(query, {
      categories: BLUEPRINT_CATEGORIES,
      targetTools: [selectedTool],
      complexity: complexity === 'simple' ? 'beginner' : complexity === 'complex' ? 'advanced' : 'intermediate',
      maxResults: 8
    });

    // Get architecture templates specific to the tool
    const templates = await vectorService.searchPromptTemplates(query, {
      targetTool: selectedTool,
      templateType: 'skeleton',
      complexity,
      maxResults: 5
    });

    // Generate tool-specific recommendations
    const toolSpecificRecommendations = TOOL_OPTIMIZATIONS[selectedTool]?.blueprint || [];

    // Extract insights from knowledge base
    const securityConsiderations = this.extractSecurityConsiderations(relevantKnowledge);
    const scalabilityNotes = this.extractScalabilityNotes(relevantKnowledge);

    // Calculate confidence score
    const confidenceScore = this.calculateBlueprintConfidence(blueprint, relevantKnowledge, selectedTool);

    // Generate improvement suggestions
    const suggestions = this.generateBlueprintSuggestions(blueprint, relevantKnowledge, selectedTool);

    return {
      stage: 'blueprint',
      originalBlueprint: blueprint,
      enhancedBlueprint: {
        ...blueprint,
        architecture: this.enhanceArchitecture(blueprint, relevantKnowledge, selectedTool),
        toolSpecificRecommendations,
        securityConsiderations,
        scalabilityNotes
      },
      relevantKnowledge,
      confidenceScore,
      suggestions
    };
  }

  /**
   * Enhance Stage 4: Screen Prompts (UI Prompt Generator)
   * This is where the heavy RAG enhancement happens for UI/UX
   */
  async enhanceScreenPrompts(
    appIdea: MVPStudioData['appIdea'],
    validationQuestions: MVPStudioData['validationQuestions'],
    screenPrompts: MVPStudioData['screenPrompts']
  ): Promise<ScreenPromptsEnhancementResult> {
    if (!appIdea || !validationQuestions || !screenPrompts) {
      throw new Error('App idea, validation questions, and screen prompts data are required');
    }

    const selectedTool = validationQuestions.preferredAITool;
    const designStyle = appIdea.designStyle;

    // Create search query for UI/UX patterns
    const query = `UI design ${designStyle} ${appIdea.platforms.join(' ')} components ${selectedTool}`;

    // Retrieve relevant UI/UX knowledge
    const relevantKnowledge = await vectorService.searchKnowledgeBase(query, {
      categories: SCREEN_PROMPTS_CATEGORIES,
      targetTools: [selectedTool],
      maxResults: 10
    });

    // Get UI templates specific to the tool and design style
    const templates = await vectorService.searchPromptTemplates(query, {
      targetTool: selectedTool,
      templateType: 'feature',
      maxResults: 5
    });

    // Generate tool-specific UI optimizations
    const toolSpecificOptimizations = TOOL_OPTIMIZATIONS[selectedTool]?.screen_prompts || [];

    // Extract design patterns from knowledge base
    const designSystemGuidelines = this.extractDesignSystemGuidelines(relevantKnowledge, selectedTool);
    const componentPatterns = this.extractComponentPatterns(relevantKnowledge, selectedTool);

    // Enhance each screen prompt with RAG insights
    const optimizedPrompts = this.optimizeScreenPrompts(screenPrompts, relevantKnowledge, selectedTool, designStyle);

    // Calculate confidence score
    const confidenceScore = this.calculateScreenPromptsConfidence(screenPrompts, relevantKnowledge, selectedTool);

    // Generate improvement suggestions
    const suggestions = this.generateScreenPromptsSuggestions(screenPrompts, relevantKnowledge, selectedTool);

    return {
      stage: 'screen_prompts',
      originalPrompts: screenPrompts,
      enhancedPrompts: {
        ...screenPrompts,
        optimizedPrompts,
        designSystemGuidelines,
        componentPatterns,
        toolSpecificOptimizations
      },
      relevantKnowledge,
      confidenceScore,
      suggestions
    };
  }

  /**
   * Enhance Stage 3: Blueprint (App Skeleton Generator)
   */
  async enhanceBlueprint(
    appIdea: MVPStudioData['appIdea'],
    blueprint: MVPStudioData['appBlueprint']
  ): Promise<StageEnhancementResult> {
    if (!appIdea || !blueprint) throw new Error('App idea and blueprint data are required');

    const query = `${appIdea.appName} architecture screens data models ${appIdea.platforms.join(' ')}`;
    
    const relevantKnowledge = await vectorService.searchKnowledgeBase(query, {
      categories: STAGE_KNOWLEDGE_CATEGORIES.blueprint,
      targetTools: [appIdea.targetAudience || 'general'],
      maxResults: 7
    });

    const optimizations = this.generateBlueprintOptimizations(blueprint, relevantKnowledge);
    const confidenceScore = this.calculateBlueprintConfidence(blueprint, relevantKnowledge);
    const suggestions = this.generateBlueprintSuggestions(blueprint, relevantKnowledge);

    return {
      stage: 'blueprint',
      originalData: blueprint,
      enhancedData: {
        ...blueprint,
        enhancedArchitecture: this.enhanceArchitecture(blueprint, relevantKnowledge),
        optimizedDataModels: this.optimizeDataModels(blueprint, relevantKnowledge),
        securityConsiderations: this.extractSecurityConsiderations(relevantKnowledge),
        scalabilityNotes: this.extractScalabilityNotes(relevantKnowledge)
      },
      relevantKnowledge,
      stageSpecificOptimizations: optimizations,
      confidenceScore,
      suggestions
    };
  }

  /**
   * Enhance Stage 4: Screen Prompts (UI Prompt Generator)
   */
  async enhanceScreenPrompts(
    appIdea: MVPStudioData['appIdea'],
    screenPrompts: MVPStudioData['screenPrompts']
  ): Promise<StageEnhancementResult> {
    if (!appIdea || !screenPrompts) throw new Error('App idea and screen prompts data are required');

    const query = `UI design ${appIdea.designStyle} ${appIdea.platforms.join(' ')} components`;
    
    const relevantKnowledge = await vectorService.searchKnowledgeBase(query, {
      categories: STAGE_KNOWLEDGE_CATEGORIES.screen_prompts,
      complexity: 'intermediate',
      maxResults: 8
    });

    const optimizations = this.generateScreenPromptOptimizations(screenPrompts, relevantKnowledge);
    const confidenceScore = this.calculateScreenPromptConfidence(screenPrompts, relevantKnowledge);
    const suggestions = this.generateScreenPromptSuggestions(screenPrompts, relevantKnowledge);

    return {
      stage: 'screen_prompts',
      originalData: screenPrompts,
      enhancedData: {
        ...screenPrompts,
        enhancedPrompts: this.enhanceScreenPrompts(screenPrompts, relevantKnowledge),
        designSystemGuidelines: this.extractDesignSystemGuidelines(relevantKnowledge),
        accessibilityGuidelines: this.extractAccessibilityGuidelines(relevantKnowledge),
        responsivePatterns: this.extractResponsivePatterns(relevantKnowledge)
      },
      relevantKnowledge,
      stageSpecificOptimizations: optimizations,
      confidenceScore,
      suggestions
    };
  }

  /**
   * Enhance Stage 5: Flow Description
   */
  async enhanceFlowDescription(
    appIdea: MVPStudioData['appIdea'],
    appFlow: MVPStudioData['appFlow']
  ): Promise<StageEnhancementResult> {
    if (!appIdea || !appFlow) throw new Error('App idea and flow data are required');

    const query = `navigation flow user journey ${appIdea.platforms.join(' ')} routing`;
    
    const relevantKnowledge = await vectorService.searchKnowledgeBase(query, {
      categories: STAGE_KNOWLEDGE_CATEGORIES.flow_description,
      maxResults: 6
    });

    const optimizations = this.generateFlowOptimizations(appFlow, relevantKnowledge);
    const confidenceScore = this.calculateFlowConfidence(appFlow, relevantKnowledge);
    const suggestions = this.generateFlowSuggestions(appFlow, relevantKnowledge);

    return {
      stage: 'flow_description',
      originalData: appFlow,
      enhancedData: {
        ...appFlow,
        optimizedNavigation: this.optimizeNavigation(appFlow, relevantKnowledge),
        userJourneyInsights: this.generateUserJourneyInsights(appFlow, relevantKnowledge),
        flowPatterns: this.extractFlowPatterns(relevantKnowledge)
      },
      relevantKnowledge,
      stageSpecificOptimizations: optimizations,
      confidenceScore,
      suggestions
    };
  }

  /**
   * Enhance Stage 6: Export Composer
   */
  async enhanceExportComposer(
    mvpData: MVPStudioData,
    exportData: MVPStudioData['exportPrompts']
  ): Promise<StageEnhancementResult> {
    if (!mvpData || !exportData) throw new Error('MVP data and export data are required');

    const query = `${exportData.targetTool} optimization prompt engineering deployment`;
    
    const relevantKnowledge = await vectorService.searchKnowledgeBase(query, {
      categories: STAGE_KNOWLEDGE_CATEGORIES.export_composer,
      targetTools: [exportData.targetTool],
      maxResults: 10
    });

    // Get tool-specific templates
    const templates = await vectorService.searchPromptTemplates(query, {
      targetTool: exportData.targetTool,
      maxResults: 5
    });

    const optimizations = this.generateExportOptimizations(exportData, relevantKnowledge);
    const confidenceScore = this.calculateExportConfidence(exportData, relevantKnowledge);
    const suggestions = this.generateExportSuggestions(exportData, relevantKnowledge);

    return {
      stage: 'export_composer',
      originalData: exportData,
      enhancedData: {
        ...exportData,
        enhancedUnifiedPrompt: this.enhanceUnifiedPrompt(mvpData, exportData, relevantKnowledge, templates),
        toolSpecificOptimizations: this.generateToolSpecificOptimizations(exportData.targetTool, relevantKnowledge),
        deploymentGuidelines: this.extractDeploymentGuidelines(relevantKnowledge),
        bestPractices: this.extractBestPractices(relevantKnowledge)
      },
      relevantKnowledge,
      stageSpecificOptimizations: optimizations,
      confidenceScore,
      suggestions
    };
  }

  // Helper methods for Blueprint enhancement
  private calculateBlueprintConfidence(blueprint: any, knowledge: any[], tool: SupportedTool): number {
    let score = 0.4; // Base score

    if (blueprint.screens && blueprint.screens.length > 0) score += 0.2;
    if (blueprint.dataModels && blueprint.dataModels.length > 0) score += 0.2;
    if (knowledge.length > 5) score += 0.1;
    if (TOOL_OPTIMIZATIONS[tool]) score += 0.1;

    return Math.min(score, 1.0);
  }

  private generateBlueprintSuggestions(blueprint: any, knowledge: any[], tool: SupportedTool): string[] {
    const suggestions = [];

    if (!blueprint.architecture) {
      suggestions.push('Define a clear application architecture');
    }

    if (blueprint.dataModels.length === 0) {
      suggestions.push('Add data models to better structure your application');
    }

    if (knowledge.length > 0) {
      suggestions.push(`Apply insights from ${knowledge.length} relevant architecture patterns`);
    }

    suggestions.push(`Optimize for ${tool} development workflow`);

    return suggestions;
  }

  private enhanceArchitecture(blueprint: any, knowledge: any[], tool: SupportedTool): string {
    let architecture = blueprint.architecture || 'Standard web application architecture';

    // Add tool-specific architecture recommendations
    const toolRecommendations = TOOL_OPTIMIZATIONS[tool]?.blueprint || [];
    const knowledgeInsights = knowledge
      .filter(k => k.categories.includes('architecture'))
      .map(k => k.content.substring(0, 200))
      .slice(0, 3);

    return `${architecture}\n\nTool-Specific Recommendations:\n${toolRecommendations.join('\n')}\n\nArchitecture Insights:\n${knowledgeInsights.join('\n')}`;
  }

  private extractSecurityConsiderations(knowledge: any[]): string[] {
    const securityKnowledge = knowledge.filter(k =>
      k.content.toLowerCase().includes('security') ||
      k.content.toLowerCase().includes('authentication') ||
      k.categories.includes('authentication')
    );

    const considerations = [
      'Implement proper authentication and authorization',
      'Use HTTPS for all communications',
      'Validate and sanitize all user inputs'
    ];

    securityKnowledge.forEach(k => {
      if (k.content.includes('RLS') || k.content.includes('Row Level Security')) {
        considerations.push('Implement Row Level Security (RLS) for data protection');
      }
      if (k.content.includes('JWT') || k.content.includes('token')) {
        considerations.push('Use secure token-based authentication');
      }
    });

    return considerations;
  }

  private extractScalabilityNotes(knowledge: any[]): string[] {
    const scalabilityKnowledge = knowledge.filter(k =>
      k.content.toLowerCase().includes('scalability') ||
      k.content.toLowerCase().includes('performance') ||
      k.categories.includes('performance')
    );

    const notes = [
      'Design for horizontal scaling',
      'Implement proper caching strategies',
      'Optimize database queries and indexes'
    ];

    scalabilityKnowledge.forEach(k => {
      if (k.content.includes('CDN')) {
        notes.push('Consider CDN for static asset delivery');
      }
      if (k.content.includes('microservices')) {
        notes.push('Consider microservices architecture for complex applications');
      }
    });

    return notes;
  }

  // Helper methods for Screen Prompts enhancement
  private calculateScreenPromptsConfidence(screenPrompts: any, knowledge: any[], tool: SupportedTool): number {
    let score = 0.4; // Base score

    if (screenPrompts.screens && screenPrompts.screens.length > 0) score += 0.2;
    if (screenPrompts.prompts && Object.keys(screenPrompts.prompts).length > 0) score += 0.2;
    if (knowledge.length > 5) score += 0.1;
    if (TOOL_OPTIMIZATIONS[tool]) score += 0.1;

    return Math.min(score, 1.0);
  }

  private generateScreenPromptsSuggestions(screenPrompts: any, knowledge: any[], tool: SupportedTool): string[] {
    const suggestions = [];

    if (Object.keys(screenPrompts.prompts || {}).length === 0) {
      suggestions.push('Generate detailed prompts for each screen');
    }

    if (knowledge.some(k => k.categories.includes('accessibility'))) {
      suggestions.push('Include accessibility considerations in your UI design');
    }

    if (knowledge.some(k => k.categories.includes('responsive_design'))) {
      suggestions.push('Implement responsive design patterns for all screen sizes');
    }

    suggestions.push(`Optimize UI components for ${tool} development`);

    return suggestions;
  }

  private optimizeScreenPrompts(screenPrompts: any, knowledge: any[], tool: SupportedTool, designStyle: string): Record<string, string> {
    const optimizedPrompts: Record<string, string> = {};
    const toolOptimizations = TOOL_OPTIMIZATIONS[tool]?.screen_prompts || [];

    // Extract UI patterns from knowledge base
    const uiPatterns = knowledge
      .filter(k => k.categories.includes('ui_design') || k.categories.includes('component_patterns'))
      .map(k => k.content.substring(0, 150))
      .slice(0, 3);

    Object.entries(screenPrompts.prompts || {}).forEach(([screenName, originalPrompt]) => {
      let enhancedPrompt = originalPrompt as string;

      // Add tool-specific optimizations
      enhancedPrompt += `\n\n## ${tool.toUpperCase()} Optimizations:\n${toolOptimizations.join('\n')}`;

      // Add design style considerations
      enhancedPrompt += `\n\n## ${designStyle.toUpperCase()} Design Style:\n`;
      if (designStyle === 'minimal') {
        enhancedPrompt += '- Use clean, simple layouts with plenty of white space\n- Focus on essential elements only\n- Use subtle colors and typography';
      } else if (designStyle === 'playful') {
        enhancedPrompt += '- Include vibrant colors and engaging animations\n- Use rounded corners and friendly typography\n- Add micro-interactions for delight';
      } else if (designStyle === 'business') {
        enhancedPrompt += '- Use professional color schemes and typography\n- Focus on data presentation and efficiency\n- Include clear hierarchy and navigation';
      }

      // Add relevant UI patterns
      if (uiPatterns.length > 0) {
        enhancedPrompt += `\n\n## Relevant UI Patterns:\n${uiPatterns.join('\n')}`;
      }

      optimizedPrompts[screenName] = enhancedPrompt;
    });

    return optimizedPrompts;
  }

  private extractDesignSystemGuidelines(knowledge: any[], tool: SupportedTool): string[] {
    const designKnowledge = knowledge.filter(k =>
      k.categories.includes('design_systems') ||
      k.content.toLowerCase().includes('design system')
    );

    const guidelines = [
      'Maintain consistent spacing and typography',
      'Use a cohesive color palette throughout',
      'Implement reusable component patterns'
    ];

    if (tool === 'lovable') {
      guidelines.push('Use shadcn/ui components for consistency');
      guidelines.push('Follow Tailwind CSS design tokens');
    } else if (tool === 'v0') {
      guidelines.push('Focus on modern, visually appealing components');
      guidelines.push('Implement smooth animations and transitions');
    }

    designKnowledge.forEach(k => {
      if (k.content.includes('atomic design')) {
        guidelines.push('Follow atomic design principles (atoms, molecules, organisms)');
      }
      if (k.content.includes('accessibility')) {
        guidelines.push('Ensure WCAG 2.1 compliance for accessibility');
      }
    });

    return guidelines;
  }

  private extractComponentPatterns(knowledge: any[], tool: SupportedTool): string[] {
    const componentKnowledge = knowledge.filter(k =>
      k.categories.includes('component_patterns') ||
      k.content.toLowerCase().includes('component')
    );

    const patterns = [
      'Use composition over inheritance for components',
      'Implement proper prop validation and TypeScript interfaces',
      'Create reusable, single-responsibility components'
    ];

    if (tool === 'lovable') {
      patterns.push('Leverage shadcn/ui base components');
      patterns.push('Use React hooks for state management');
    } else if (tool === 'cursor') {
      patterns.push('Focus on clean, maintainable component code');
      patterns.push('Implement proper error boundaries');
    }

    componentKnowledge.forEach(k => {
      if (k.content.includes('compound components')) {
        patterns.push('Use compound component patterns for complex UI');
      }
      if (k.content.includes('render props')) {
        patterns.push('Consider render props for flexible component APIs');
      }
    });

    return patterns;
  }
}

// Export singleton instance
export const mvpStageEnhancer = new MVPStageEnhancer();

// RAG Service for MVP Studio
// Converts Python RAG functionality to TypeScript/Next.js

import { 
  SupportedTool, 
  PromptStage, 
  TaskContext, 
  ToolProfile, 
  PromptResult,
  PromptingStrategy,
  RAGPromptRequest 
} from '@/types/rag';

export class RAGService {
  private toolProfiles: Map<SupportedTool, ToolProfile>;

  constructor() {
    this.toolProfiles = this.initializeToolProfiles();
  }

  private initializeToolProfiles(): Map<SupportedTool, ToolProfile> {
    const profiles = new Map<SupportedTool, ToolProfile>();

    // Lovable.dev profile with C.L.E.A.R. framework
    profiles.set(SupportedTool.LOVABLE, {
      toolName: "Lovable.dev",
      format: "structured_sections",
      tone: "expert_casual",
      preferredUseCases: [
        "react_development",
        "ui_scaffolding", 
        "supabase_integration",
        "component_optimization",
        "responsive_design"
      ],
      fewShotExamples: [
        {
          input: "Create a task management dashboard",
          output: "Build a React dashboard with task CRUD operations, filtering, and real-time updates using Supabase. Include responsive design with Tailwind CSS and shadcn/ui components."
        }
      ],
      promptingGuidelines: {
        framework: "C.L.E.A.R",
        knowledgeBaseRequired: true,
        incrementalDevelopment: true,
        modeAwareness: ["chat", "default"]
      },
      categories: ["web_development", "frontend", "fullstack"],
      stageTemplates: {
        [PromptStage.APP_SKELETON]: "lovable_skeleton_template",
        [PromptStage.PAGE_UI]: "lovable_ui_template",
        [PromptStage.FLOW_CONNECTIONS]: "lovable_flow_template"
      },
      vectorNamespace: "lovable_docs",
      promptingStrategies: [
        {
          strategyType: "structured",
          template: "Context: {context}\nTask: {task}\nGuidelines: {guidelines}\nConstraints: {constraints}",
          useCases: ["complex_features", "new_projects"],
          effectivenessScore: 0.9
        },
        {
          strategyType: "conversational", 
          template: "Let's {action}. {description} {technical_details}",
          useCases: ["feature_additions", "debugging"],
          effectivenessScore: 0.8
        }
      ],
      constraints: [
        "react_typescript_only",
        "supabase_backend", 
        "tailwind_styling",
        "responsive_required"
      ],
      optimizationTips: [
        "Use Knowledge Base extensively",
        "Implement incremental development",
        "Leverage Chat mode for planning",
        "Be explicit about constraints"
      ],
      commonPitfalls: [
        "overly_complex_single_prompts",
        "insufficient_context",
        "ignoring_knowledge_base"
      ]
    });

    // Bolt.new profile
    profiles.set(SupportedTool.BOLT, {
      toolName: "Bolt.new",
      format: "enhanced_prompts",
      tone: "technical_precise",
      preferredUseCases: [
        "rapid_prototyping",
        "web_applications",
        "javascript_projects", 
        "iterative_development",
        "code_refinement"
      ],
      fewShotExamples: [
        {
          input: "Todo app",
          output: "Create a React todo application with TypeScript, featuring task creation, editing, deletion, and filtering. Include local storage persistence, responsive design with Tailwind CSS, and accessibility features."
        }
      ],
      promptingGuidelines: {
        enhancementFeature: true,
        fileTargeting: true,
        webcontainerAware: true,
        incrementalChanges: true
      },
      categories: ["web_development", "prototyping", "javascript"],
      stageTemplates: {
        [PromptStage.APP_SKELETON]: "bolt_architecture_template",
        [PromptStage.PAGE_UI]: "bolt_component_template", 
        [PromptStage.FLOW_CONNECTIONS]: "bolt_integration_template"
      },
      vectorNamespace: "bolt_docs",
      promptingStrategies: [
        {
          strategyType: "structured",
          template: "Enhanced detailed prompt with complete specifications and constraints",
          useCases: ["complex_applications", "production_ready"],
          effectivenessScore: 0.95
        }
      ],
      constraints: [
        "webcontainer_limitations",
        "browser_compatible_only",
        "no_native_binaries"
      ],
      optimizationTips: [
        "Use enhance prompt feature",
        "Target specific files",
        "Lock critical files", 
        "Break into incremental steps"
      ],
      commonPitfalls: [
        "context_window_overflow",
        "too_many_simultaneous_changes",
        "webcontainer_incompatible_requests"
      ]
    });

    // Add more tool profiles...
    this.addAdditionalToolProfiles(profiles);

    return profiles;
  }

  private addAdditionalToolProfiles(profiles: Map<SupportedTool, ToolProfile>) {
    // Cursor profile
    profiles.set(SupportedTool.CURSOR, {
      toolName: "Cursor",
      format: "code_focused",
      tone: "technical_precise",
      preferredUseCases: ["code_editing", "refactoring", "debugging", "complex_logic"],
      fewShotExamples: [
        {
          input: "Refactor this component for better performance",
          output: "Analyze the component structure, identify performance bottlenecks, and implement optimizations using React best practices, memoization, and efficient state management."
        }
      ],
      promptingGuidelines: {
        codeContext: true,
        incrementalEditing: true,
        explicitInstructions: true
      },
      categories: ["code_editor", "development"],
      stageTemplates: {},
      vectorNamespace: "cursor_docs",
      promptingStrategies: [
        {
          strategyType: "structured",
          template: "Code context: {context}\nTask: {task}\nExpected outcome: {outcome}",
          useCases: ["code_modification", "debugging"],
          effectivenessScore: 0.85
        }
      ],
      constraints: ["file_based_editing", "context_aware"],
      optimizationTips: ["Provide clear context", "Be specific about changes", "Use incremental approach"],
      commonPitfalls: ["vague_instructions", "too_broad_scope"]
    });

    // v0.dev profile
    profiles.set(SupportedTool.V0, {
      toolName: "v0.dev",
      format: "component_focused",
      tone: "design_oriented",
      preferredUseCases: ["ui_components", "react_interfaces", "quick_prototypes"],
      fewShotExamples: [
        {
          input: "Create a modern login form",
          output: "Design a clean, accessible login form with email/password fields, validation states, and modern styling using Tailwind CSS and React."
        }
      ],
      promptingGuidelines: {
        visualFocus: true,
        componentBased: true,
        designSystem: true
      },
      categories: ["ui_generator", "design"],
      stageTemplates: {},
      vectorNamespace: "v0_docs",
      promptingStrategies: [
        {
          strategyType: "conversational",
          template: "Create a {component_type} that {functionality} with {design_requirements}",
          useCases: ["ui_creation", "component_design"],
          effectivenessScore: 0.9
        }
      ],
      constraints: ["react_only", "component_scope"],
      optimizationTips: ["Focus on visual design", "Specify interactions", "Include accessibility"],
      commonPitfalls: ["overly_complex_components", "missing_design_details"]
    });
  }

  public async generateEnhancedPrompt(request: RAGPromptRequest): Promise<PromptResult> {
    const { appIdea, validationQuestions, targetTool, stage } = request;
    
    // Get tool profile
    const toolProfile = this.toolProfiles.get(targetTool);
    if (!toolProfile) {
      throw new Error(`Unsupported tool: ${targetTool}`);
    }

    // Create task context
    const context: TaskContext = {
      taskType: this.determineTaskType(appIdea, stage),
      projectName: appIdea.appName,
      description: appIdea.ideaDescription,
      stage,
      technicalRequirements: this.extractTechnicalRequirements(appIdea, validationQuestions),
      uiRequirements: this.extractUIRequirements(appIdea),
      constraints: this.extractConstraints(appIdea, toolProfile),
      targetTool
    };

    // Determine optimal strategy
    const strategy = this.determineOptimalStrategy(context, toolProfile);

    // Generate base prompt
    const basePrompt = this.generateBasePrompt(context, toolProfile);

    // Apply tool-specific optimizations
    const optimizedPrompt = this.applyToolOptimizations(basePrompt, context, toolProfile);

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(context, toolProfile);

    // Generate enhancement suggestions
    const enhancementSuggestions = this.generateEnhancementSuggestions(context, toolProfile);

    // Determine next stage
    const nextSuggestedStage = this.suggestNextStage(stage);

    return {
      prompt: optimizedPrompt,
      stage,
      tool: targetTool,
      confidenceScore,
      sources: [], // Would be populated from vector database in full implementation
      nextSuggestedStage,
      enhancementSuggestions,
      appliedStrategy: strategy,
      toolSpecificOptimizations: toolProfile.optimizationTips
    };
  }

  private determineTaskType(appIdea: any, stage: PromptStage): string {
    if (stage === PromptStage.APP_SKELETON) return "app_architecture";
    if (stage === PromptStage.PAGE_UI) return "ui_development";
    if (stage === PromptStage.FLOW_CONNECTIONS) return "navigation_flow";
    return "feature_development";
  }

  private extractTechnicalRequirements(appIdea: any, validationQuestions: any): string[] {
    const requirements: string[] = [];
    
    if (appIdea.platforms.includes('web')) {
      requirements.push("Web application development");
      requirements.push("Responsive design");
    }
    
    if (appIdea.platforms.includes('mobile')) {
      requirements.push("Mobile-responsive design");
      requirements.push("Touch-friendly interfaces");
    }

    // Add complexity-based requirements
    if (validationQuestions.projectComplexity === 'complex') {
      requirements.push("Scalable architecture");
      requirements.push("Performance optimization");
    }

    return requirements;
  }

  private extractUIRequirements(appIdea: any): string[] {
    const requirements: string[] = [];
    
    switch (appIdea.designStyle) {
      case 'minimal':
        requirements.push("Clean, minimal design");
        requirements.push("Plenty of whitespace");
        requirements.push("Simple color palette");
        break;
      case 'playful':
        requirements.push("Vibrant colors");
        requirements.push("Engaging animations");
        requirements.push("Fun, interactive elements");
        break;
      case 'business':
        requirements.push("Professional appearance");
        requirements.push("Corporate color scheme");
        requirements.push("Formal typography");
        break;
    }

    if (appIdea.styleDescription) {
      requirements.push(`Style preference: ${appIdea.styleDescription}`);
    }

    return requirements;
  }

  private extractConstraints(appIdea: any, toolProfile: ToolProfile): string[] {
    const constraints = [...toolProfile.constraints];
    
    // Add platform constraints
    if (appIdea.platforms.length === 1 && appIdea.platforms[0] === 'web') {
      constraints.push("Web-only implementation");
    }

    return constraints;
  }

  private determineOptimalStrategy(context: TaskContext, profile: ToolProfile): string {
    if (context.stage === PromptStage.APP_SKELETON) return "structured";
    if (context.technicalRequirements.length > 5) return "structured";
    if ([PromptStage.DEBUGGING, PromptStage.OPTIMIZATION].includes(context.stage)) return "conversational";
    return "conversational";
  }

  private generateBasePrompt(context: TaskContext, profile: ToolProfile): string {
    switch (profile.toolName) {
      case "Lovable.dev":
        return this.generateLovablePrompt(context);
      case "Bolt.new":
        return this.generateBoltPrompt(context);
      case "Cursor":
        return this.generateCursorPrompt(context);
      case "v0.dev":
        return this.generateV0Prompt(context);
      default:
        return this.generateGenericPrompt(context);
    }
  }

  private generateLovablePrompt(context: TaskContext): string {
    if (context.stage === PromptStage.APP_SKELETON) {
      return `Context: You are building ${context.projectName} using Lovable with React, TypeScript, and Supabase.

Task: ${context.description}

Guidelines:
- Use modern React patterns with TypeScript
- Implement responsive design with Tailwind CSS
- Integrate Supabase for backend functionality
- Follow accessibility best practices
- Use shadcn/ui components for consistent UI

Technical Requirements:
${context.technicalRequirements.map(req => `- ${req}`).join('\n')}

UI Requirements:
${context.uiRequirements.map(req => `- ${req}`).join('\n')}

Constraints:
${context.constraints.map(constraint => `- ${constraint}`).join('\n')}

Before starting, please confirm you understand the project requirements from the Knowledge Base.`;
    } else {
      return `Let's ${context.taskType.toLowerCase().replace('_', ' ')} for the ${context.projectName} project.

${context.description}

Requirements:
${[...context.technicalRequirements, ...context.uiRequirements].map(req => `- ${req}`).join('\n')}

Please ensure the implementation maintains consistency with existing components and follows our established patterns.`;
    }
  }

  private generateBoltPrompt(context: TaskContext): string {
    return `Create a ${context.taskType.toLowerCase().replace('_', ' ')} for ${context.projectName}.

Core Functionality:
${context.description}

Technical Specifications:
${context.technicalRequirements.map(req => `- ${req}`).join('\n')}

UI/UX Requirements:
${context.uiRequirements.map(req => `- ${req}`).join('\n')}

Constraints:
${context.constraints.map(constraint => `- ${constraint}`).join('\n')}

${context.stage === PromptStage.APP_SKELETON ? `
Architecture Requirements:
- Modern web application structure
- Component-based organization
- Proper state management
- Responsive design implementation
- Performance optimization` : ''}`;
  }

  private generateCursorPrompt(context: TaskContext): string {
    return `Code Context: Working on ${context.projectName}

Task: ${context.taskType.replace('_', ' ')}
${context.description}

Technical Requirements:
${context.technicalRequirements.map(req => `- ${req}`).join('\n')}

Expected Outcome:
- Clean, maintainable code
- Following best practices
- Proper error handling
- Performance considerations

Please provide specific code changes and explanations.`;
  }

  private generateV0Prompt(context: TaskContext): string {
    return `Create a ${context.taskType.replace('_', ' ')} component for ${context.projectName}.

Functionality: ${context.description}

Design Requirements:
${context.uiRequirements.map(req => `- ${req}`).join('\n')}

Technical Requirements:
${context.technicalRequirements.map(req => `- ${req}`).join('\n')}

Please include:
- Modern, accessible design
- Responsive layout
- Interactive states
- Clean component structure`;
  }

  private generateGenericPrompt(context: TaskContext): string {
    return `Project: ${context.projectName}
Task: ${context.taskType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}

Description: ${context.description}

Technical Requirements:
${context.technicalRequirements.map(req => `- ${req}`).join('\n')}

UI Requirements:
${context.uiRequirements.map(req => `- ${req}`).join('\n')}

Constraints:
${context.constraints.map(constraint => `- ${constraint}`).join('\n')}

Please implement this feature following best practices for ${context.targetTool}.`;
  }

  private applyToolOptimizations(basePrompt: string, context: TaskContext, profile: ToolProfile): string {
    let optimized = basePrompt;

    // Lovable-specific optimizations
    if (profile.toolName === "Lovable.dev") {
      if (context.stage === PromptStage.DEBUGGING) {
        optimized += "\n\nPlease use Chat mode to discuss the issue before implementing changes.";
      }
      if (context.uiRequirements.some(req => req.includes("responsive"))) {
        optimized += "\n\nEnsure mobile-first responsive design using Tailwind breakpoints (sm:, md:, lg:).";
      }
    }

    // Bolt.new specific optimizations
    if (profile.toolName === "Bolt.new") {
      optimized = `[Note: Consider using the Enhance Prompt feature ⭐ for this request]\n\n${optimized}`;
      if (context.technicalRequirements.length > 3) {
        optimized += "\n\nSuggestion: Break this into smaller, incremental changes for better results.";
      }
    }

    return optimized;
  }

  private calculateConfidenceScore(context: TaskContext, profile: ToolProfile): number {
    let score = 0.5; // Base score

    // Boost for complete requirements
    if (context.technicalRequirements.length > 0 && context.uiRequirements.length > 0) {
      score += 0.2;
    }

    // Boost for appropriate tool selection
    if (profile.preferredUseCases.some(useCase => 
      context.taskType.includes(useCase.replace('_', '')) || 
      context.description.toLowerCase().includes(useCase.replace('_', ' '))
    )) {
      score += 0.2;
    }

    // Boost for clear description
    if (context.description.length > 50) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private generateEnhancementSuggestions(context: TaskContext, profile: ToolProfile): string[] {
    const suggestions: string[] = [];

    if (context.technicalRequirements.length === 0) {
      suggestions.push("Add specific technical requirements for better results");
    }

    if (context.constraints.length === 0) {
      suggestions.push("Define constraints to avoid scope creep");
    }

    if (profile.toolName === "Lovable.dev" && context.stage === PromptStage.APP_SKELETON) {
      suggestions.push("Consider setting up Knowledge Base with project requirements");
    }

    if (profile.toolName === "Bolt.new") {
      suggestions.push("Use the enhance prompt feature for more detailed specifications");
    }

    return suggestions;
  }

  private suggestNextStage(currentStage: PromptStage): PromptStage | undefined {
    const stageProgression: Record<PromptStage, PromptStage> = {
      [PromptStage.APP_SKELETON]: PromptStage.PAGE_UI,
      [PromptStage.PAGE_UI]: PromptStage.FLOW_CONNECTIONS,
      [PromptStage.FLOW_CONNECTIONS]: PromptStage.FEATURE_SPECIFIC,
      [PromptStage.FEATURE_SPECIFIC]: PromptStage.OPTIMIZATION,
      [PromptStage.DEBUGGING]: PromptStage.OPTIMIZATION,
      [PromptStage.OPTIMIZATION]: PromptStage.OPTIMIZATION // Stay at optimization
    };

    return stageProgression[currentStage];
  }
}

// Export singleton instance
export const ragService = new RAGService();

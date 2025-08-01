// RAG System Types for MVP Studio Integration
// Converted from Python RAG system to TypeScript

export enum PromptStage {
  APP_SKELETON = "app_skeleton",
  PAGE_UI = "page_ui", 
  FLOW_CONNECTIONS = "flow_connections",
  FEATURE_SPECIFIC = "feature_specific",
  DEBUGGING = "debugging",
  OPTIMIZATION = "optimization"
}

export enum SupportedTool {
  LOVABLE = "lovable",
  BOLT = "bolt", 
  CURSOR = "cursor",
  V0 = "v0",
  CLAUDE = "claude",
  CHATGPT = "chatgpt",
  COPILOT = "copilot",
  REPLIT = "replit",
  CLINE = "cline",
  DEVIN = "devin",
  WINDSURF = "windsurf",
  UIZARD = "uizard",
  ADALO = "adalo",
  FLUTTERFLOW = "flutterflow",
  FRAMER = "framer",
  BUBBLE = "bubble"
}

export interface AppStructure {
  pages: string[];
  components: string[];
  features: string[];
  navigationFlow: Record<string, string[]>;
}

export interface PageSpec {
  pageName: string;
  layoutType: string;
  components: string[];
  interactions: string[];
  dataRequirements: string[];
}

export interface FlowConnection {
  fromPage: string;
  toPage: string;
  trigger: string;
  animation?: string;
  conditions?: string[];
}

export interface TaskContext {
  taskType: string;
  projectName: string;
  description: string;
  stage: PromptStage;
  technicalRequirements: string[];
  uiRequirements: string[];
  constraints: string[];
  targetTool: SupportedTool;
  
  // Stage-specific data
  appStructure?: AppStructure;
  pageSpec?: PageSpec;
  flowConnections?: FlowConnection[];
}

export interface ProjectInfo {
  name: string;
  description: string;
  techStack: string[];
  targetAudience: string;
  requirements: string[];
  industry?: string;
  complexityLevel: 'simple' | 'medium' | 'complex';
}

export type PromptingStrategyType = 
  | 'structured' 
  | 'conversational' 
  | 'meta' 
  | 'reverse_meta' 
  | 'iterative' 
  | 'parallel' 
  | 'planning_mode' 
  | 'production_ready' 
  | 'security_first';

export interface PromptingStrategy {
  strategyType: PromptingStrategyType;
  template: string;
  useCases: string[];
  effectivenessScore: number;
  asyncAware?: boolean;
  requiresConfirmation?: boolean;
  securityFocused?: boolean;
}

export interface ToolProfile {
  toolName: string;
  format: string;
  tone: string;
  preferredUseCases: string[];
  fewShotExamples: Array<{
    input: string;
    output: string;
  }>;
  promptingGuidelines: Record<string, any>;
  categories: string[];
  stageTemplates: Partial<Record<PromptStage, string>>;
  vectorNamespace: string;
  promptingStrategies: PromptingStrategy[];
  constraints: string[];
  optimizationTips: string[];
  commonPitfalls: string[];
}

export interface PromptResult {
  prompt: string;
  stage: PromptStage;
  tool: SupportedTool;
  confidenceScore: number;
  sources: string[];
  nextSuggestedStage?: PromptStage;
  regenerationContext?: Record<string, any>;
  enhancementSuggestions?: string[];
  appliedStrategy?: string;
  toolSpecificOptimizations?: string[];
}

// Integration with existing MVP Studio types
export interface RAGEnhancedValidationQuestions {
  hasValidated: boolean;
  hasDiscussed: boolean;
  motivation: string;
  preferredAITool?: SupportedTool; // New field for AI tool selection
  projectComplexity?: 'simple' | 'medium' | 'complex';
  technicalExperience?: 'beginner' | 'intermediate' | 'advanced';
}

export interface RAGPromptRequest {
  appIdea: {
    appName: string;
    platforms: ('web' | 'mobile')[];
    designStyle: 'minimal' | 'playful' | 'business';
    styleDescription?: string;
    ideaDescription: string;
    targetAudience?: string;
  };
  validationQuestions: RAGEnhancedValidationQuestions;
  appBlueprint?: any;
  screenPrompts?: any[];
  appFlow?: any;
  targetTool: SupportedTool;
  stage: PromptStage;
}

export interface RAGPromptResponse {
  success: boolean;
  prompt?: string;
  confidenceScore?: number;
  enhancementSuggestions?: string[];
  nextSuggestedStage?: PromptStage;
  toolSpecificOptimizations?: string[];
  error?: string;
}

// AI Tool definitions for the UI
export interface AIToolOption {
  id: SupportedTool;
  name: string;
  description: string;
  category: 'code_editor' | 'ui_generator' | 'ai_assistant' | 'no_code' | 'prototyping';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  bestFor: string[];
  icon?: string;
  website?: string;
}

export const AI_TOOL_OPTIONS: AIToolOption[] = [
  {
    id: SupportedTool.LOVABLE,
    name: 'Lovable.dev',
    description: 'React/TypeScript with Supabase integration',
    category: 'ui_generator',
    complexity: 'intermediate',
    bestFor: ['Full-stack web apps', 'React projects', 'Database integration'],
    website: 'https://lovable.dev'
  },
  {
    id: SupportedTool.CURSOR,
    name: 'Cursor',
    description: 'AI-powered code editor',
    category: 'code_editor',
    complexity: 'intermediate',
    bestFor: ['Code editing', 'Refactoring', 'Complex logic'],
    website: 'https://cursor.sh'
  },
  {
    id: SupportedTool.V0,
    name: 'v0.dev',
    description: 'Vercel\'s AI UI generator',
    category: 'ui_generator',
    complexity: 'beginner',
    bestFor: ['UI components', 'React interfaces', 'Quick prototypes'],
    website: 'https://v0.dev'
  },
  {
    id: SupportedTool.BOLT,
    name: 'Bolt.new',
    description: 'Full-stack web development in browser',
    category: 'ui_generator',
    complexity: 'beginner',
    bestFor: ['Web applications', 'Rapid prototyping', 'No setup required'],
    website: 'https://bolt.new'
  },
  {
    id: SupportedTool.CLAUDE,
    name: 'Claude',
    description: 'Anthropic\'s AI assistant',
    category: 'ai_assistant',
    complexity: 'beginner',
    bestFor: ['Code generation', 'Problem solving', 'Documentation'],
    website: 'https://claude.ai'
  },
  {
    id: SupportedTool.CHATGPT,
    name: 'ChatGPT',
    description: 'OpenAI\'s conversational AI',
    category: 'ai_assistant',
    complexity: 'beginner',
    bestFor: ['Code generation', 'Debugging', 'Learning'],
    website: 'https://chat.openai.com'
  }
];

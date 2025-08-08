// Enhanced App Skeleton Generator Types

export type AppType = 'web' | 'mobile' | 'hybrid';
export type AppComplexity = 'mvp' | 'advanced' | 'production';
export type ArchitecturePattern = 'mvc' | 'mvvm' | 'clean' | 'feature-foldering' | 'component-based';

// User Role Definition
export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  accessLevel: 'basic' | 'advanced' | 'admin';
}

// Data Model/Entity Definition
export interface DataModel {
  name: string;
  description: string;
  fields: DataField[];
  relationships: DataRelationship[];
  primaryKey: string;
}

export interface DataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'reference';
  required: boolean;
  description?: string;
  validation?: string[];
}

export interface DataRelationship {
  type: 'oneToOne' | 'oneToMany' | 'manyToMany';
  targetModel: string;
  description: string;
}

// Screen Definition
export interface AppScreen {
  id: string;
  name: string;
  type: 'page' | 'modal' | 'drawer' | 'popup';
  category: 'auth' | 'main' | 'settings' | 'onboarding' | 'error' | 'loading';
  description: string;
  userRoles: string[]; // Which roles can access this screen
  parentScreen?: string; // For sub-pages
  components: ScreenComponent[];
  states: ScreenState[];
  navigation: NavigationRule[];
}

export interface ScreenComponent {
  name: string;
  type: 'header' | 'navigation' | 'form' | 'list' | 'card' | 'button' | 'input' | 'custom';
  description: string;
  // Using unknown to avoid implicit any while allowing flexible prop value shapes
  props?: Record<string, unknown>;
}

export interface ScreenState {
  name: string;
  type: 'loading' | 'empty' | 'error' | 'success' | 'default';
  description: string;
  triggerConditions: string[];
}

export interface NavigationRule {
  action: string;
  target: string;
  condition?: string;
  type: 'push' | 'replace' | 'modal' | 'popup';
}

// Page Flow Definition
export interface PageFlow {
  id: string;
  name: string;
  description: string;
  startScreen: string;
  endScreen: string;
  screens: string[];
  userJourney: FlowStep[];
}

export interface FlowStep {
  screenId: string;
  action: string;
  description: string;
  optional: boolean;
}

// Modal and Popup Definitions
export interface ModalDefinition {
  id: string;
  name: string;
  type: 'confirmation' | 'form' | 'info' | 'error' | 'custom';
  description: string;
  triggerScreens: string[];
  components: ScreenComponent[];
}

// Integration Definition
export interface ThirdPartyIntegration {
  name: string;
  type: 'auth' | 'storage' | 'payment' | 'notification' | 'analytics' | 'api' | 'social';
  description: string;
  provider?: string;
  configRequired: string[];
  implementationNotes: string[];
}

// Architecture Suggestion
export interface ArchitectureSuggestion {
  pattern: ArchitecturePattern;
  reasoning: string;
  folderStructure: FolderStructure[];
  technologies: TechnologyStack;
}

export interface FolderStructure {
  name: string;
  type: 'folder' | 'file';
  description: string;
  children?: FolderStructure[];
}

export interface TechnologyStack {
  frontend: string[];
  backend?: string[];
  database?: string[];
  deployment?: string[];
  testing?: string[];
}

// Complete App Skeleton
export interface AppSkeleton {
  id: string;
  name: string;
  description: string;
  appType: AppType;
  complexity: AppComplexity;
  
  // Core Structure
  screens: AppScreen[];
  userRoles: UserRole[];
  dataModels: DataModel[];
  pageFlows: PageFlow[];
  modals: ModalDefinition[];
  
  // Technical Details
  integrations: ThirdPartyIntegration[];
  architecture: ArchitectureSuggestion;
  
  // Generation Settings
  generationSettings: GenerationSettings;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

// Generation Configuration
export interface GenerationSettings {
  includeErrorStates: boolean;
  includeLoadingStates: boolean;
  includeEmptyStates: boolean;
  includeBackendModels: boolean;
  suggestUIComponents: boolean;
  includeModalsPopups: boolean;
  generateArchitecture: boolean;
  appType: AppType;
  complexity: AppComplexity;
}

// Request/Response Types
export interface GenerateAppSkeletonRequest {
  userIdea: string;
  settings: GenerationSettings;
  additionalContext?: {
    targetUsers?: string;
    businessDomain?: string;
    specificRequirements?: string[];
  };
}

export interface GenerateAppSkeletonResponse {
  success: boolean;
  appSkeleton?: AppSkeleton;
  error?: string;
  processingTime?: number;
}

// Enhanced MVP Integration
export interface EnhancedMVPRequest extends GenerateAppSkeletonRequest {
  ideaDetails: {
    app_name: string;
    platforms: string[];
    style: string;
    style_description?: string;
    app_description: string;
    target_users?: string;
  };
  questionnaire: {
    idea_validated: boolean;
    talked_to_people: boolean;
    motivation?: string;
  };
}

export interface EnhancedMVPResponse {
  success: boolean;
  mvp_id?: string;
  appSkeleton?: AppSkeleton;
  generatedPrompt?: string;
  error?: string;
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    used: number;
    reset: number;
    resetDate: string;
  };
}

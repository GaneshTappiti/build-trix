"use client"

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types for the builder state
export interface AppIdea {
  appName: string;
  platforms: ('web' | 'mobile')[];
  designStyle: 'minimal' | 'playful' | 'business';
  styleDescription?: string;
  ideaDescription: string;
  targetAudience?: string;
}

export interface ValidationQuestions {
  hasValidated: boolean;
  hasDiscussed: boolean;
  motivation: string;
}

export interface Screen {
  id: string;
  name: string;
  purpose: string;
  components: string[];
  navigation: string[];
  type?: 'main' | 'onboarding' | 'auth' | 'settings' | 'feature' | 'error' | 'loading' | 'empty';
  subPages?: string[];
  edgeCases?: string[];
}

export interface UserRole {
  name: string;
  permissions: string[];
  description: string;
}

export interface DataModel {
  name: string;
  fields: string[];
  relationships?: string[];
  description?: string;
}

export interface Modal {
  id: string;
  name: string;
  purpose: string;
  triggerScreens: string[];
  components: string[];
}

export interface AppState {
  name: string;
  description: string;
  screens: string[];
  conditions: string[];
}

export interface Integration {
  name: string;
  type: 'auth' | 'storage' | 'payment' | 'notification' | 'analytics' | 'social' | 'api';
  description: string;
  implementation: string;
}

export interface PageFlow {
  from: string;
  to: string;
  condition?: string;
  action: string;
}

export interface AppBlueprint {
  screens: Screen[];
  userRoles: UserRole[];
  navigationFlow: string;
  dataModels: DataModel[];
  modals?: Modal[];
  states?: AppState[];
  integrations?: Integration[];
  pageFlow?: PageFlow[];
  architecture?: string;
  suggestedPattern?: string;
}

export interface ScreenPrompt {
  screenId: string;
  title: string;
  layout: string;
  components: string;
  behavior: string;
  conditionalLogic: string;
  styleHints: string;
}

export interface AppFlow {
  flowLogic: string;
  conditionalRouting: string[];
  backButtonBehavior: string;
  modalLogic: string;
  screenTransitions: string[];
}

export interface ExportPrompts {
  unifiedPrompt: string;
  screenByScreenPrompts: ScreenPrompt[];
  targetTool: string;
}

export interface ProjectHistory {
  id: string;
  appName: string;
  platforms: ('web' | 'mobile')[];
  designStyle: 'minimal' | 'playful' | 'business';
  dateCreated: string;
  dateModified: string;
  isCompleted: boolean;
  completedStages: number;
  state: BuilderState;
}

export interface BuilderState {
  currentCard: number;
  appIdea: AppIdea;
  validationQuestions: ValidationQuestions;
  appBlueprint: AppBlueprint | null;
  screenPrompts: ScreenPrompt[];
  appFlow: AppFlow | null;
  exportPrompts: ExportPrompts | null;
  isGenerating: boolean;
  generationProgress: number;
  projectHistory: ProjectHistory[];
  currentProjectId: string | null;
  error: string | null;
  lastSaved: string | null;
}

// Action types
type BuilderAction =
  | { type: 'SET_CURRENT_CARD'; payload: number }
  | { type: 'UPDATE_APP_IDEA'; payload: Partial<AppIdea> }
  | { type: 'UPDATE_VALIDATION'; payload: Partial<ValidationQuestions> }
  | { type: 'SET_APP_BLUEPRINT'; payload: AppBlueprint }
  | { type: 'ADD_SCREEN_PROMPT'; payload: ScreenPrompt }
  | { type: 'UPDATE_SCREEN_PROMPT'; payload: ScreenPrompt }
  | { type: 'SET_APP_FLOW'; payload: AppFlow }
  | { type: 'SET_EXPORT_PROMPTS'; payload: ExportPrompts }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_GENERATION_PROGRESS'; payload: number }
  | { type: 'SAVE_PROJECT'; payload?: string }
  | { type: 'SAVE_TO_DATABASE'; payload?: { onSuccess?: (mvpId: string) => void; onError?: (error: string) => void } }
  | { type: 'LOAD_PROJECT'; payload: string }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'LOAD_HISTORY' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_SCREEN_PROMPTS' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: BuilderState = {
  currentCard: 1,
  appIdea: {
    appName: '',
    platforms: [],
    designStyle: 'minimal',
    styleDescription: '',
    ideaDescription: '',
    targetAudience: ''
  },
  validationQuestions: {
    hasValidated: false,
    hasDiscussed: false,
    motivation: ''
  },
  appBlueprint: null,
  screenPrompts: [],
  appFlow: null,
  exportPrompts: null,
  isGenerating: false,
  generationProgress: 0,
  projectHistory: [],
  currentProjectId: null,
  error: null,
  lastSaved: null
};

// History management functions
const STORAGE_KEY = 'builder-blueprint-history';

function saveToLocalStorage(history: ProjectHistory[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

function loadFromLocalStorage(): ProjectHistory[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return [];
  }
}

function generateProjectId(): string {
  return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validation functions
function validateAppIdea(appIdea: AppIdea): string | null {
  if (!appIdea.appName.trim()) return 'App name is required';
  if (appIdea.platforms.length === 0) return 'At least one platform must be selected';
  if (!appIdea.ideaDescription.trim()) return 'App description is required';
  if (appIdea.ideaDescription.trim().length < 50) return 'App description must be at least 50 characters';
  return null;
}

function validateValidationQuestions(validation: ValidationQuestions): string | null {
  if (!validation.motivation.trim()) return 'Motivation is required';
  if (validation.motivation.trim().length < 30) return 'Motivation must be at least 30 characters';
  return null;
}

function saveProject(state: BuilderState, projectId?: string): BuilderState {
  const id = projectId || state.currentProjectId || generateProjectId();
  const now = new Date().toISOString();

  const projectData: ProjectHistory = {
    id,
    appName: state.appIdea.appName || 'Untitled Project',
    platforms: state.appIdea.platforms,
    designStyle: state.appIdea.designStyle,
    dateCreated: state.currentProjectId ? state.projectHistory.find(p => p.id === state.currentProjectId)?.dateCreated || now : now,
    dateModified: now,
    isCompleted: state.currentCard >= 6 && !!state.exportPrompts,
    completedStages: state.currentCard,
    state: { ...state, projectHistory: [], currentProjectId: null }
  };

  const updatedHistory = state.projectHistory.filter(p => p.id !== id);
  updatedHistory.unshift(projectData);

  // Keep only last 10 projects
  const trimmedHistory = updatedHistory.slice(0, 10);
  saveToLocalStorage(trimmedHistory);

  return {
    ...state,
    projectHistory: trimmedHistory,
    currentProjectId: id,
    lastSaved: now,
    error: null
  };
}

function loadProject(state: BuilderState, projectId: string): BuilderState {
  const project = state.projectHistory.find(p => p.id === projectId);
  if (!project) return state;

  return {
    ...project.state,
    projectHistory: state.projectHistory,
    currentProjectId: projectId
  };
}

function deleteProject(state: BuilderState, projectId: string): BuilderState {
  const updatedHistory = state.projectHistory.filter(p => p.id !== projectId);
  saveToLocalStorage(updatedHistory);

  const newState = { ...state, projectHistory: updatedHistory };

  // If we're deleting the current project, reset to initial state
  if (state.currentProjectId === projectId) {
    return {
      ...initialState,
      projectHistory: updatedHistory,
      currentProjectId: null
    };
  }

  return newState;
}

function loadHistory(state: BuilderState): BuilderState {
  const history = loadFromLocalStorage();
  return { ...state, projectHistory: history };
}

async function saveToDatabase(
  state: BuilderState,
  callbacks?: { onSuccess?: (mvpId: string) => void; onError?: (error: string) => void }
): Promise<void> {
  try {
    const requestData = {
      appIdea: state.appIdea,
      validationQuestions: state.validationQuestions,
      appBlueprint: state.appBlueprint,
      screenPrompts: state.screenPrompts,
      appFlow: state.appFlow,
      exportPrompts: state.exportPrompts
    };

    const response = await fetch('/api/mvp-studio/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();

    if (result.success && result.mvp_id) {
      callbacks?.onSuccess?.(result.mvp_id);
    } else {
      const errorMessage = result.error || 'Failed to save MVP to database';
      callbacks?.onError?.(errorMessage);
    }
  } catch (error) {
    console.error('Error saving to database:', error);
    callbacks?.onError?.('Network error while saving MVP');
  }
}

// Enhanced state management with validation
function updateAppIdeaWithValidation(state: BuilderState, payload: Partial<AppIdea>): BuilderState {
  const newAppIdea = { ...state.appIdea, ...payload };
  const error = validateAppIdea(newAppIdea);
  return {
    ...state,
    appIdea: newAppIdea,
    error: error
  };
}

function updateValidationWithValidation(state: BuilderState, payload: Partial<ValidationQuestions>): BuilderState {
  const newValidation = { ...state.validationQuestions, ...payload };
  const error = validateValidationQuestions(newValidation);
  return {
    ...state,
    validationQuestions: newValidation,
    error: error
  };
}

// Reducer function
function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'SET_CURRENT_CARD':
      return { ...state, currentCard: action.payload };
    case 'UPDATE_APP_IDEA':
      return updateAppIdeaWithValidation(state, action.payload);
    case 'UPDATE_VALIDATION':
      return updateValidationWithValidation(state, action.payload);
    case 'SET_APP_BLUEPRINT':
      return { ...state, appBlueprint: action.payload };
    case 'ADD_SCREEN_PROMPT':
      return { ...state, screenPrompts: [...state.screenPrompts, action.payload] };
    case 'UPDATE_SCREEN_PROMPT':
      const updatedPrompts = state.screenPrompts.map(prompt =>
        prompt.screenId === action.payload.screenId ? action.payload : prompt
      );
      return { ...state, screenPrompts: updatedPrompts };
    case 'SET_APP_FLOW':
      return { ...state, appFlow: action.payload };
    case 'SET_EXPORT_PROMPTS':
      return { ...state, exportPrompts: action.payload };
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.payload };
    case 'SET_GENERATION_PROGRESS':
      return { ...state, generationProgress: action.payload };
    case 'SAVE_PROJECT':
      return saveProject(state, action.payload);
    case 'SAVE_TO_DATABASE':
      // This is handled asynchronously, so we just return the current state
      // The actual database save is triggered in the provider
      saveToDatabase(state, action.payload);
      return state;
    case 'LOAD_PROJECT':
      return loadProject(state, action.payload);
    case 'DELETE_PROJECT':
      return deleteProject(state, action.payload);
    case 'LOAD_HISTORY':
      return loadHistory(state);
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_SCREEN_PROMPTS':
      return { ...state, screenPrompts: [], error: null };
    case 'RESET_STATE':
      return { ...initialState, projectHistory: state.projectHistory };
    default:
      return state;
  }
}

// Context
const BuilderContext = createContext<{
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
} | null>(null);

// Provider component
export function BuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(builderReducer, initialState);

  // Load history on mount
  React.useEffect(() => {
    dispatch(builderActions.loadHistory());
  }, []);

  // Auto-save project when significant changes occur
  React.useEffect(() => {
    if (state.appIdea.appName && state.currentCard > 1 && !state.error) {
      const timeoutId = setTimeout(() => {
        try {
          dispatch(builderActions.saveProject());
        } catch (error) {
          console.error('Auto-save failed:', error);
          dispatch(builderActions.setError('Failed to auto-save project'));
        }
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [state.appIdea, state.validationQuestions, state.appBlueprint, state.screenPrompts, state.appFlow, state.exportPrompts]);

  // Clear errors after 5 seconds
  React.useEffect(() => {
    if (state.error) {
      const timeoutId = setTimeout(() => {
        dispatch(builderActions.setError(null));
      }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [state.error]);

  // Persist current state to sessionStorage for recovery
  React.useEffect(() => {
    if (state.currentCard > 1) {
      try {
        sessionStorage.setItem('builder-current-state', JSON.stringify({
          currentCard: state.currentCard,
          appIdea: state.appIdea,
          validationQuestions: state.validationQuestions,
          currentProjectId: state.currentProjectId
        }));
      } catch (error) {
        console.error('Failed to persist state:', error);
      }
    }
  }, [state.currentCard, state.appIdea, state.validationQuestions, state.currentProjectId]);

  return (
    <BuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </BuilderContext.Provider>
  );
}

// Custom hook to use the builder context
export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error('useBuilder must be used within a BuilderProvider');
  }
  return context;
}

// Helper functions for common actions
export const builderActions = {
  setCurrentCard: (card: number) => ({ type: 'SET_CURRENT_CARD' as const, payload: card }),
  updateAppIdea: (idea: Partial<AppIdea>) => ({ type: 'UPDATE_APP_IDEA' as const, payload: idea }),
  updateValidation: (validation: Partial<ValidationQuestions>) => ({ type: 'UPDATE_VALIDATION' as const, payload: validation }),
  setAppBlueprint: (blueprint: AppBlueprint) => ({ type: 'SET_APP_BLUEPRINT' as const, payload: blueprint }),
  addScreenPrompt: (prompt: ScreenPrompt) => ({ type: 'ADD_SCREEN_PROMPT' as const, payload: prompt }),
  updateScreenPrompt: (prompt: ScreenPrompt) => ({ type: 'UPDATE_SCREEN_PROMPT' as const, payload: prompt }),
  setAppFlow: (flow: AppFlow) => ({ type: 'SET_APP_FLOW' as const, payload: flow }),
  setExportPrompts: (prompts: ExportPrompts) => ({ type: 'SET_EXPORT_PROMPTS' as const, payload: prompts }),
  setGenerating: (generating: boolean) => ({ type: 'SET_GENERATING' as const, payload: generating }),
  setGenerationProgress: (progress: number) => ({ type: 'SET_GENERATION_PROGRESS' as const, payload: progress }),
  saveProject: (projectId?: string) => ({ type: 'SAVE_PROJECT' as const, payload: projectId }),
  saveToDatabase: (callbacks?: { onSuccess?: (mvpId: string) => void; onError?: (error: string) => void }) => ({
    type: 'SAVE_TO_DATABASE' as const,
    payload: callbacks
  }),
  loadProject: (projectId: string) => ({ type: 'LOAD_PROJECT' as const, payload: projectId }),
  deleteProject: (projectId: string) => ({ type: 'DELETE_PROJECT' as const, payload: projectId }),
  loadHistory: () => ({ type: 'LOAD_HISTORY' as const }),
  setError: (error: string | null) => ({ type: 'SET_ERROR' as const, payload: error }),
  clearScreenPrompts: () => ({ type: 'CLEAR_SCREEN_PROMPTS' as const }),
  resetState: () => ({ type: 'RESET_STATE' as const })
};

-- RAG System Database Schema for MVP Studio
-- This file contains the database schema for the RAG (Retrieval-Augmented Generation) system integration

-- =====================================================
-- RAG PROMPT GENERATIONS TABLE
-- =====================================================

-- Table to log RAG prompt generations for analytics and improvement
CREATE TABLE IF NOT EXISTS public.rag_prompt_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Project Information
    app_name TEXT NOT NULL,
    target_tool TEXT NOT NULL, -- SupportedTool enum value
    stage TEXT NOT NULL, -- PromptStage enum value
    
    -- Generation Metrics
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    prompt_length INTEGER NOT NULL,
    generation_time_ms INTEGER, -- Time taken to generate prompt
    
    -- Context Information
    project_complexity TEXT CHECK (project_complexity IN ('simple', 'medium', 'complex')),
    technical_experience TEXT CHECK (technical_experience IN ('beginner', 'intermediate', 'advanced')),
    platforms TEXT[] NOT NULL,
    design_style TEXT NOT NULL,
    
    -- Enhancement Data
    enhancement_suggestions JSONB, -- Array of suggestions
    tool_optimizations_applied JSONB, -- Array of optimizations applied
    
    -- Success Metrics
    was_successful BOOLEAN DEFAULT TRUE,
    error_message TEXT, -- If generation failed
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RAG TOOL PROFILES TABLE
-- =====================================================

-- Table to store and manage AI tool profiles for RAG system
CREATE TABLE IF NOT EXISTS public.rag_tool_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Tool Information
    tool_id TEXT UNIQUE NOT NULL, -- SupportedTool enum value
    tool_name TEXT NOT NULL,
    tool_description TEXT,
    tool_category TEXT NOT NULL, -- 'code_editor', 'ui_generator', 'ai_assistant', etc.
    complexity_level TEXT NOT NULL CHECK (complexity_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Profile Configuration
    format_preference TEXT NOT NULL,
    tone_preference TEXT NOT NULL,
    preferred_use_cases JSONB NOT NULL, -- Array of use cases
    constraints JSONB NOT NULL, -- Array of constraints
    optimization_tips JSONB NOT NULL, -- Array of tips
    common_pitfalls JSONB NOT NULL, -- Array of pitfalls
    
    -- Prompting Strategies
    prompting_strategies JSONB NOT NULL, -- Array of strategy objects
    stage_templates JSONB, -- Object mapping stages to templates
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RAG USER PREFERENCES TABLE
-- =====================================================

-- Table to store user preferences for RAG system
CREATE TABLE IF NOT EXISTS public.rag_user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Default Preferences
    default_ai_tool TEXT, -- SupportedTool enum value
    default_complexity TEXT CHECK (default_complexity IN ('simple', 'medium', 'complex')),
    default_experience TEXT CHECK (default_experience IN ('beginner', 'intermediate', 'advanced')),
    
    -- Feature Preferences
    enable_enhancement_suggestions BOOLEAN DEFAULT TRUE,
    enable_confidence_scoring BOOLEAN DEFAULT TRUE,
    enable_tool_recommendations BOOLEAN DEFAULT TRUE,
    
    -- Usage Statistics
    total_prompts_generated INTEGER DEFAULT 0,
    favorite_tools JSONB DEFAULT '[]'::jsonb, -- Array of frequently used tools
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for rag_prompt_generations table
CREATE INDEX IF NOT EXISTS idx_rag_generations_user_id ON public.rag_prompt_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_generations_target_tool ON public.rag_prompt_generations(target_tool);
CREATE INDEX IF NOT EXISTS idx_rag_generations_stage ON public.rag_prompt_generations(stage);
CREATE INDEX IF NOT EXISTS idx_rag_generations_created_at ON public.rag_prompt_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_rag_generations_confidence ON public.rag_prompt_generations(confidence_score);

-- Indexes for rag_tool_profiles table
CREATE INDEX IF NOT EXISTS idx_rag_profiles_tool_id ON public.rag_tool_profiles(tool_id);
CREATE INDEX IF NOT EXISTS idx_rag_profiles_category ON public.rag_tool_profiles(tool_category);
CREATE INDEX IF NOT EXISTS idx_rag_profiles_active ON public.rag_tool_profiles(is_active);

-- Indexes for rag_user_preferences table
CREATE INDEX IF NOT EXISTS idx_rag_preferences_user_id ON public.rag_user_preferences(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all RAG tables
ALTER TABLE public.rag_prompt_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_tool_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rag_prompt_generations
CREATE POLICY "Users can view their own RAG generations" ON public.rag_prompt_generations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own RAG generations" ON public.rag_prompt_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RAG generations" ON public.rag_prompt_generations
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for rag_tool_profiles (read-only for users)
CREATE POLICY "Users can view active tool profiles" ON public.rag_tool_profiles
    FOR SELECT USING (is_active = true);

-- RLS Policies for rag_user_preferences
CREATE POLICY "Users can view their own preferences" ON public.rag_user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.rag_user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.rag_user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_rag_generations_updated_at 
    BEFORE UPDATE ON public.rag_prompt_generations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rag_profiles_updated_at 
    BEFORE UPDATE ON public.rag_tool_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rag_preferences_updated_at 
    BEFORE UPDATE ON public.rag_user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert default tool profiles
INSERT INTO public.rag_tool_profiles (
    tool_id, tool_name, tool_description, tool_category, complexity_level,
    format_preference, tone_preference, preferred_use_cases, constraints,
    optimization_tips, common_pitfalls, prompting_strategies
) VALUES 
(
    'lovable', 'Lovable.dev', 'React/TypeScript with Supabase integration', 'ui_generator', 'intermediate',
    'structured_sections', 'expert_casual',
    '["react_development", "ui_scaffolding", "supabase_integration", "component_optimization"]'::jsonb,
    '["react_typescript_only", "supabase_backend", "tailwind_styling", "responsive_required"]'::jsonb,
    '["Use Knowledge Base extensively", "Implement incremental development", "Leverage Chat mode for planning"]'::jsonb,
    '["overly_complex_single_prompts", "insufficient_context", "ignoring_knowledge_base"]'::jsonb,
    '[{"strategyType": "structured", "template": "Context: {context}\\nTask: {task}\\nGuidelines: {guidelines}", "useCases": ["complex_features"], "effectivenessScore": 0.9}]'::jsonb
),
(
    'cursor', 'Cursor', 'AI-powered code editor', 'code_editor', 'intermediate',
    'code_focused', 'technical_precise',
    '["code_editing", "refactoring", "debugging", "complex_logic"]'::jsonb,
    '["file_based_editing", "context_aware"]'::jsonb,
    '["Provide clear context", "Be specific about changes", "Use incremental approach"]'::jsonb,
    '["vague_instructions", "too_broad_scope"]'::jsonb,
    '[{"strategyType": "structured", "template": "Code context: {context}\\nTask: {task}\\nExpected outcome: {outcome}", "useCases": ["code_modification"], "effectivenessScore": 0.85}]'::jsonb
),
(
    'v0', 'v0.dev', 'Vercel\'s AI UI generator', 'ui_generator', 'beginner',
    'component_focused', 'design_oriented',
    '["ui_components", "react_interfaces", "quick_prototypes"]'::jsonb,
    '["react_only", "component_scope"]'::jsonb,
    '["Focus on visual design", "Specify interactions", "Include accessibility"]'::jsonb,
    '["overly_complex_components", "missing_design_details"]'::jsonb,
    '[{"strategyType": "conversational", "template": "Create a {component_type} that {functionality}", "useCases": ["ui_creation"], "effectivenessScore": 0.9}]'::jsonb
)
ON CONFLICT (tool_id) DO NOTHING;

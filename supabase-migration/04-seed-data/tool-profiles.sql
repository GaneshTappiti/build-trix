-- =====================================================
-- RAG TOOL PROFILES SEED DATA
-- =====================================================
-- This file contains initial tool profiles for the RAG system
-- Run this after schema and functions are created

-- =====================================================
-- 1. CLEAR EXISTING DATA (OPTIONAL)
-- =====================================================

-- Uncomment the following line if you want to reset tool profiles
-- DELETE FROM public.rag_tool_profiles;

-- =====================================================
-- 2. INSERT TOOL PROFILES
-- =====================================================

-- Lovable.dev Tool Profile
INSERT INTO public.rag_tool_profiles (
    tool_id,
    tool_name,
    tool_description,
    tool_category,
    complexity_level,
    supported_platforms,
    supported_languages,
    supported_frameworks,
    format_preference,
    tone_preference,
    preferred_use_cases,
    constraints,
    optimization_tips,
    common_pitfalls,
    prompting_strategies,
    stage_templates,
    average_success_rate,
    is_active,
    version
) VALUES (
    'lovable',
    'Lovable.dev',
    'AI-powered full-stack development platform with React/TypeScript and Supabase integration',
    'ui_generator',
    'intermediate',
    ARRAY['web', 'mobile'],
    ARRAY['typescript', 'javascript'],
    ARRAY['react', 'nextjs', 'supabase', 'tailwindcss'],
    'structured_sections',
    'expert_casual',
    '["react_development", "ui_scaffolding", "supabase_integration", "component_optimization", "full_stack_apps"]'::jsonb,
    '["react_typescript_only", "supabase_backend", "tailwind_styling", "responsive_required", "component_based"]'::jsonb,
    '["Use Knowledge Base extensively", "Implement incremental development", "Leverage Chat mode for planning", "Break complex features into components", "Use Supabase for backend operations"]'::jsonb,
    '["overly_complex_single_prompts", "insufficient_context", "ignoring_knowledge_base", "mixing_frameworks", "non_responsive_designs"]'::jsonb,
    '[
        {
            "strategyType": "structured",
            "template": "# {feature_name}\n\n## Context\n{context}\n\n## Requirements\n{requirements}\n\n## Implementation Guidelines\n{guidelines}\n\n## Expected Outcome\n{outcome}",
            "useCases": ["complex_features", "full_applications"],
            "effectivenessScore": 0.9
        },
        {
            "strategyType": "incremental",
            "template": "Build {component_name} step by step:\n\n1. Basic structure\n2. Core functionality\n3. Styling with Tailwind\n4. Integration with {integration}\n\nStart with: {starting_point}",
            "useCases": ["component_development", "feature_building"],
            "effectivenessScore": 0.85
        }
    ]'::jsonb,
    '{
        "idea_validation": "Create a comprehensive project plan for {app_name} including:\n- Technical architecture\n- Component breakdown\n- Database schema\n- Implementation timeline",
        "blueprint": "Design the complete application structure for {app_name}:\n\n## Architecture\n{architecture_details}\n\n## Components\n{component_list}\n\n## Database Design\n{database_schema}",
        "screen_prompts": "Create {screen_name} component with:\n- Responsive design using Tailwind CSS\n- TypeScript interfaces\n- Supabase integration for {data_operations}\n- Proper error handling",
        "app_flow": "Implement navigation and routing for {app_name}:\n- React Router setup\n- Protected routes\n- State management\n- User flow optimization",
        "export": "Generate production-ready code for {app_name} with:\n- Complete component structure\n- Supabase configuration\n- Deployment instructions\n- Testing guidelines"
    }'::jsonb,
    0.88,
    true,
    '1.0'
);

-- Cursor Tool Profile
INSERT INTO public.rag_tool_profiles (
    tool_id,
    tool_name,
    tool_description,
    tool_category,
    complexity_level,
    supported_platforms,
    supported_languages,
    supported_frameworks,
    format_preference,
    tone_preference,
    preferred_use_cases,
    constraints,
    optimization_tips,
    common_pitfalls,
    prompting_strategies,
    stage_templates,
    average_success_rate,
    is_active,
    version
) VALUES (
    'cursor',
    'Cursor',
    'AI-powered code editor with intelligent code completion and editing capabilities',
    'code_editor',
    'intermediate',
    ARRAY['web', 'mobile', 'desktop'],
    ARRAY['typescript', 'javascript', 'python', 'java', 'cpp', 'rust', 'go'],
    ARRAY['react', 'nextjs', 'express', 'django', 'flask', 'spring', 'electron'],
    'code_focused',
    'technical_precise',
    '["code_editing", "refactoring", "debugging", "complex_logic", "algorithm_implementation", "code_optimization"]'::jsonb,
    '["file_based_editing", "context_aware", "existing_codebase", "incremental_changes"]'::jsonb,
    '["Provide clear context about existing code", "Be specific about changes needed", "Use incremental approach", "Include file structure", "Specify exact locations for changes"]'::jsonb,
    '["vague_instructions", "too_broad_scope", "missing_context", "unclear_requirements", "ignoring_existing_patterns"]'::jsonb,
    '[
        {
            "strategyType": "contextual",
            "template": "## File: {file_path}\n\n### Current Code Context:\n{existing_code}\n\n### Required Changes:\n{changes_needed}\n\n### Expected Result:\n{expected_outcome}",
            "useCases": ["code_modification", "refactoring"],
            "effectivenessScore": 0.85
        },
        {
            "strategyType": "incremental",
            "template": "Step-by-step implementation:\n\n1. {step_1}\n2. {step_2}\n3. {step_3}\n\nFocus on: {current_step}",
            "useCases": ["complex_features", "algorithm_implementation"],
            "effectivenessScore": 0.82
        }
    ]'::jsonb,
    '{
        "idea_validation": "Analyze the technical feasibility of {app_name}:\n\n## Code Architecture Analysis\n- Technology stack evaluation\n- Implementation complexity\n- Potential challenges\n- Recommended approach",
        "blueprint": "Create detailed technical specification for {app_name}:\n\n## File Structure\n{file_structure}\n\n## Core Functions\n{function_definitions}\n\n## Implementation Plan\n{implementation_steps}",
        "screen_prompts": "Implement {screen_name} functionality:\n\n```typescript\n// File: {file_path}\n// Implementation for {feature_description}\n```\n\nInclude:\n- Type definitions\n- Error handling\n- Performance optimization",
        "app_flow": "Implement application logic and state management:\n\n## State Management\n{state_structure}\n\n## Business Logic\n{business_logic}\n\n## Integration Points\n{integrations}",
        "export": "Generate complete codebase for {app_name}:\n\n## Project Structure\n{project_structure}\n\n## Build Configuration\n{build_config}\n\n## Deployment Setup\n{deployment_config}"
    }'::jsonb,
    0.83,
    true,
    '1.0'
);

-- v0.dev Tool Profile
INSERT INTO public.rag_tool_profiles (
    tool_id,
    tool_name,
    tool_description,
    tool_category,
    complexity_level,
    supported_platforms,
    supported_languages,
    supported_frameworks,
    format_preference,
    tone_preference,
    preferred_use_cases,
    constraints,
    optimization_tips,
    common_pitfalls,
    prompting_strategies,
    stage_templates,
    average_success_rate,
    is_active,
    version
) VALUES (
    'v0',
    'v0.dev',
    'Vercel\'s AI UI generator for creating React components and interfaces',
    'ui_generator',
    'beginner',
    ARRAY['web'],
    ARRAY['typescript', 'javascript'],
    ARRAY['react', 'nextjs', 'tailwindcss'],
    'component_focused',
    'design_oriented',
    '["ui_components", "react_interfaces", "quick_prototypes", "landing_pages", "dashboard_components"]'::jsonb,
    '["react_only", "component_scope", "tailwind_styling", "single_file_components"]'::jsonb,
    '["Focus on visual design", "Specify interactions clearly", "Include accessibility features", "Use descriptive component names", "Provide design context"]'::jsonb,
    '["overly_complex_components", "missing_design_details", "unclear_interactions", "accessibility_oversight", "poor_component_structure"]'::jsonb,
    '[
        {
            "strategyType": "conversational",
            "template": "Create a {component_type} that {functionality}. The design should be {design_style} with {specific_features}. Include {interactions} and ensure {accessibility_requirements}.",
            "useCases": ["ui_creation", "component_design"],
            "effectivenessScore": 0.9
        },
        {
            "strategyType": "descriptive",
            "template": "Design a {component_name} with the following specifications:\n\n- Visual style: {visual_style}\n- Functionality: {functionality}\n- Interactions: {interactions}\n- Responsive behavior: {responsive_behavior}",
            "useCases": ["detailed_components", "complex_interfaces"],
            "effectivenessScore": 0.87
        }
    ]'::jsonb,
    '{
        "idea_validation": "Create a visual mockup and component breakdown for {app_name}:\n\n## UI/UX Analysis\n- Design system recommendations\n- Component hierarchy\n- User interface flow\n- Visual design principles",
        "blueprint": "Design the complete UI architecture for {app_name}:\n\n## Component Library\n{component_list}\n\n## Design System\n{design_tokens}\n\n## Layout Structure\n{layout_hierarchy}",
        "screen_prompts": "Create {screen_name} interface:\n\nDesign a {screen_type} that includes:\n- {primary_elements}\n- {interactive_elements}\n- {visual_hierarchy}\n\nStyle: {design_style}\nResponsive: {responsive_requirements}",
        "app_flow": "Design the complete user interface flow for {app_name}:\n\n## Navigation Design\n{navigation_structure}\n\n## Screen Transitions\n{transition_patterns}\n\n## User Journey\n{user_flow}",
        "export": "Generate complete UI component library for {app_name}:\n\n## Component Collection\n{component_exports}\n\n## Design Tokens\n{design_system}\n\n## Usage Guidelines\n{implementation_guide}"
    }'::jsonb,
    0.91,
    true,
    '1.0'
);

-- Claude Tool Profile
INSERT INTO public.rag_tool_profiles (
    tool_id,
    tool_name,
    tool_description,
    tool_category,
    complexity_level,
    supported_platforms,
    supported_languages,
    supported_frameworks,
    format_preference,
    tone_preference,
    preferred_use_cases,
    constraints,
    optimization_tips,
    common_pitfalls,
    prompting_strategies,
    stage_templates,
    average_success_rate,
    is_active,
    version
) VALUES (
    'claude',
    'Claude',
    'Anthropic\'s AI assistant for comprehensive development and analysis tasks',
    'ai_assistant',
    'advanced',
    ARRAY['web', 'mobile', 'desktop', 'backend'],
    ARRAY['typescript', 'javascript', 'python', 'java', 'cpp', 'rust', 'go', 'swift', 'kotlin'],
    ARRAY['react', 'nextjs', 'express', 'django', 'flask', 'spring', 'fastapi', 'rails'],
    'comprehensive',
    'analytical_detailed',
    '["complex_analysis", "architecture_design", "code_review", "problem_solving", "documentation", "planning"]'::jsonb,
    '["detailed_explanations", "step_by_step_approach", "comprehensive_coverage", "analytical_thinking"]'::jsonb,
    '["Provide comprehensive context", "Ask for detailed analysis", "Request step-by-step breakdowns", "Include reasoning and alternatives", "Ask for best practices"]'::jsonb,
    '["overly_brief_requests", "missing_context", "unclear_objectives", "rushing_complex_tasks", "ignoring_constraints"]'::jsonb,
    '[
        {
            "strategyType": "analytical",
            "template": "Analyze {topic} comprehensively:\n\n## Problem Analysis\n{problem_description}\n\n## Requirements\n{requirements}\n\n## Proposed Solution\n{solution_approach}\n\n## Implementation Plan\n{implementation_steps}\n\n## Considerations\n{considerations}",
            "useCases": ["complex_analysis", "architecture_design"],
            "effectivenessScore": 0.92
        },
        {
            "strategyType": "comprehensive",
            "template": "Create a complete solution for {objective}:\n\n1. Analysis and Planning\n2. Design and Architecture\n3. Implementation Strategy\n4. Testing and Validation\n5. Deployment and Maintenance\n\nFocus on: {specific_focus}",
            "useCases": ["full_project_planning", "comprehensive_solutions"],
            "effectivenessScore": 0.89
        }
    ]'::jsonb,
    '{
        "idea_validation": "Conduct comprehensive analysis of {app_name}:\n\n## Market Analysis\n- Target audience validation\n- Competitive landscape\n- Technical feasibility\n- Resource requirements\n\n## Recommendations\n- Implementation strategy\n- Risk assessment\n- Success metrics",
        "blueprint": "Create detailed architecture blueprint for {app_name}:\n\n## System Architecture\n{system_design}\n\n## Technical Specifications\n{tech_specs}\n\n## Implementation Roadmap\n{roadmap}\n\n## Quality Assurance\n{qa_strategy}",
        "screen_prompts": "Design and implement {screen_name}:\n\n## Functional Requirements\n{functional_requirements}\n\n## Technical Implementation\n{technical_approach}\n\n## User Experience\n{ux_considerations}\n\n## Integration Points\n{integrations}",
        "app_flow": "Design complete application architecture for {app_name}:\n\n## System Flow\n{system_flow}\n\n## Data Architecture\n{data_architecture}\n\n## Security Considerations\n{security_measures}\n\n## Performance Optimization\n{performance_strategy}",
        "export": "Generate comprehensive project deliverables for {app_name}:\n\n## Complete Codebase\n{codebase_structure}\n\n## Documentation\n{documentation_package}\n\n## Deployment Guide\n{deployment_instructions}\n\n## Maintenance Plan\n{maintenance_strategy}"
    }'::jsonb,
    0.90,
    true,
    '1.0'
);

-- ChatGPT Tool Profile
INSERT INTO public.rag_tool_profiles (
    tool_id,
    tool_name,
    tool_description,
    tool_category,
    complexity_level,
    supported_platforms,
    supported_languages,
    supported_frameworks,
    format_preference,
    tone_preference,
    preferred_use_cases,
    constraints,
    optimization_tips,
    common_pitfalls,
    prompting_strategies,
    stage_templates,
    average_success_rate,
    is_active,
    version
) VALUES (
    'chatgpt',
    'ChatGPT',
    'OpenAI\'s conversational AI for development assistance and code generation',
    'ai_assistant',
    'intermediate',
    ARRAY['web', 'mobile', 'desktop', 'backend'],
    ARRAY['typescript', 'javascript', 'python', 'java', 'cpp', 'csharp', 'php'],
    ARRAY['react', 'nextjs', 'express', 'django', 'flask', 'spring', 'dotnet'],
    'conversational',
    'helpful_friendly',
    '["code_generation", "problem_solving", "learning_assistance", "debugging", "quick_prototypes"]'::jsonb,
    '["conversational_format", "iterative_development", "example_driven", "educational_approach"]'::jsonb,
    '["Use clear, specific prompts", "Provide examples", "Ask follow-up questions", "Request explanations", "Iterate on solutions"]'::jsonb,
    '["vague_requests", "too_many_requirements_at_once", "not_providing_context", "skipping_validation", "ignoring_best_practices"]'::jsonb,
    '[
        {
            "strategyType": "conversational",
            "template": "I need help with {task}. Here\'s what I\'m trying to achieve: {objective}. My current setup is: {current_setup}. Can you help me {specific_request}?",
            "useCases": ["general_assistance", "learning"],
            "effectivenessScore": 0.85
        },
        {
            "strategyType": "example_driven",
            "template": "Create {deliverable} for {use_case}. Here\'s an example of what I\'m looking for: {example}. Please adapt this for: {specific_requirements}",
            "useCases": ["code_generation", "adaptation"],
            "effectivenessScore": 0.83
        }
    ]'::jsonb,
    '{
        "idea_validation": "Help me validate my app idea for {app_name}:\n\n## Idea Overview\n{idea_description}\n\n## Questions to Address\n- Is this technically feasible?\n- What are the main challenges?\n- What technologies would work best?\n- How should I approach development?",
        "blueprint": "Help me create a development plan for {app_name}:\n\n## Project Overview\n{project_description}\n\n## What I Need\n- Technical architecture\n- Development phases\n- Technology recommendations\n- Implementation timeline",
        "screen_prompts": "Help me build {screen_name} for my app:\n\n## Screen Purpose\n{screen_purpose}\n\n## Requirements\n{requirements}\n\n## Questions\n- How should I structure this?\n- What components do I need?\n- How should I handle {specific_challenge}?",
        "app_flow": "Help me design the overall flow for {app_name}:\n\n## App Concept\n{app_concept}\n\n## Current Progress\n{current_progress}\n\n## Next Steps Needed\n- Navigation structure\n- State management\n- User flow optimization",
        "export": "Help me prepare {app_name} for deployment:\n\n## Current Status\n{current_status}\n\n## Deployment Goals\n{deployment_goals}\n\n## Assistance Needed\n- Code organization\n- Build configuration\n- Deployment strategy"
    }'::jsonb,
    0.82,
    true,
    '1.0'
);

-- =====================================================
-- 3. UPDATE STATISTICS
-- =====================================================

-- Update tool profile statistics based on existing generation data
DO $$
BEGIN
    -- Only update if rag_prompt_generations table has data
    IF EXISTS (SELECT 1 FROM public.rag_prompt_generations LIMIT 1) THEN
        UPDATE public.rag_tool_profiles
        SET
            total_generations = COALESCE(subquery.total_count, 0),
            average_success_rate = COALESCE(subquery.success_rate, average_success_rate),
            updated_at = NOW()
        FROM (
            SELECT
                target_tool,
                COUNT(*) as total_count,
                AVG(CASE WHEN was_successful THEN 1.0 ELSE 0.0 END) as success_rate
            FROM public.rag_prompt_generations
            WHERE target_tool IS NOT NULL
            GROUP BY target_tool
        ) AS subquery
        WHERE tool_id = subquery.target_tool;

        RAISE NOTICE 'Updated tool profile statistics based on existing generation data';
    ELSE
        RAISE NOTICE 'No generation data found, keeping default statistics';
    END IF;
END $$;

-- =====================================================
-- 4. VERIFICATION
-- =====================================================

-- Verify tool profiles were inserted correctly
SELECT 
    tool_id,
    tool_name,
    tool_category,
    complexity_level,
    is_active,
    average_success_rate,
    total_generations
FROM public.rag_tool_profiles
ORDER BY tool_category, complexity_level;

-- =====================================================
-- MVP STUDIO - SEED DATA (OPTIONAL)
-- =====================================================
-- Migration: 005_seed_data.sql
-- Description: Inserts initial seed data for testing and demo
-- Dependencies: All previous migrations
-- Note: This is optional and mainly for development/demo purposes
-- =====================================================

-- =====================================================
-- 1. DEMO USER PROFILES (FOR TESTING)
-- =====================================================
-- Note: These will only work if you have corresponding auth.users records

-- Example user profiles (replace UUIDs with actual user IDs from your auth.users table)
-- INSERT INTO public.user_profiles (
--     id,
--     full_name,
--     subscription_tier,
--     mvp_limit,
--     onboarding_completed,
--     preferred_ai_tool
-- ) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'Demo User', 'free', 3, true, 'cursor'),
-- ('00000000-0000-0000-0000-000000000002', 'Pro User', 'pro', 10, true, 'v0'),
-- ('00000000-0000-0000-0000-000000000003', 'Enterprise User', 'enterprise', 50, true, 'claude');

-- =====================================================
-- 2. SAMPLE MVP PROJECTS
-- =====================================================

-- Sample MVP Studio project
INSERT INTO public.mvps (
    id,
    user_id,
    app_name,
    platforms,
    style,
    style_description,
    app_description,
    target_users,
    generated_prompt,
    app_blueprint,
    screen_prompts,
    app_flow,
    export_prompts,
    completion_stage,
    is_mvp_studio_project,
    status,
    tags
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
    'TaskFlow Pro',
    ARRAY['web', 'mobile'],
    'Minimal & Clean',
    'Clean, modern interface with subtle animations',
    'A comprehensive task management application that helps teams organize, prioritize, and track their work efficiently. Features include project boards, time tracking, team collaboration, and detailed analytics.',
    'Small to medium-sized teams, project managers, freelancers',
    'Build a task management application called TaskFlow Pro...',
    '{
        "screens": [
            {"id": "dashboard", "name": "Dashboard", "purpose": "Main overview of tasks and projects"},
            {"id": "projects", "name": "Projects", "purpose": "Project management and organization"},
            {"id": "tasks", "name": "Tasks", "purpose": "Individual task management"},
            {"id": "team", "name": "Team", "purpose": "Team member management and collaboration"}
        ],
        "userRoles": [
            {"name": "Admin", "permissions": ["create_projects", "manage_team", "view_analytics"]},
            {"name": "Member", "permissions": ["create_tasks", "edit_own_tasks", "view_projects"]}
        ],
        "dataModels": [
            {"name": "Project", "fields": ["name", "description", "status", "deadline"]},
            {"name": "Task", "fields": ["title", "description", "priority", "assignee", "due_date"]}
        ]
    }',
    '[
        {
            "screenId": "dashboard",
            "title": "Dashboard Screen",
            "layout": "Grid layout with cards for quick stats and recent activity",
            "components": "Header, stats cards, recent tasks list, project progress charts",
            "behavior": "Real-time updates, interactive charts, quick task creation"
        }
    ]',
    '{
        "flowLogic": "User authentication -> Dashboard -> Project selection -> Task management",
        "conditionalRouting": ["Admin users see analytics tab", "Members see limited project options"],
        "backButtonBehavior": "Standard browser back with state preservation"
    }',
    '{
        "unifiedPrompt": "Complete TaskFlow Pro implementation prompt...",
        "targetTool": "cursor",
        "screenByScreenPrompts": []
    }',
    6,
    true,
    'Yet To Build',
    ARRAY['productivity', 'team-management', 'saas']
);

-- Sample simple generator project
INSERT INTO public.mvps (
    id,
    user_id,
    app_name,
    platforms,
    style,
    app_description,
    target_users,
    generated_prompt,
    completion_stage,
    is_mvp_studio_project,
    status,
    tags
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
    'Recipe Finder',
    ARRAY['mobile'],
    'Playful & Animated',
    'A mobile app that helps users find recipes based on ingredients they have at home. Users can scan ingredients or manually input them to get personalized recipe suggestions.',
    'Home cooks, busy parents, college students',
    'Build a mobile recipe finder app that suggests recipes based on available ingredients...',
    1,
    false,
    'Built',
    ARRAY['food', 'mobile', 'lifestyle']
);

-- =====================================================
-- 3. SAMPLE QUESTIONNAIRE RESPONSES
-- =====================================================

INSERT INTO public.questionnaire (
    mvp_id,
    user_id,
    idea_validated,
    talked_to_people,
    motivation,
    target_market_research,
    competitive_analysis,
    technical_feasibility,
    validation_notes
) VALUES (
    (SELECT id FROM public.mvps WHERE app_name = 'TaskFlow Pro' LIMIT 1),
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
    true,
    true,
    'Frustrated with existing task management tools that are either too complex or too simple',
    true,
    true,
    true,
    'Conducted interviews with 15 team leads. 80% expressed interest in a cleaner, more intuitive task management solution.'
);

-- =====================================================
-- 4. SAMPLE FEEDBACK ENTRIES
-- =====================================================

INSERT INTO public.feedback (
    user_id,
    type,
    category,
    title,
    description,
    priority,
    status
) VALUES 
(
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
    'feature',
    'mvp_studio',
    'Add template library',
    'It would be great to have pre-built templates for common app types like e-commerce, social media, productivity apps, etc.',
    'medium',
    'open'
),
(
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
    'improvement',
    'ui_ux',
    'Better mobile responsiveness',
    'The MVP Studio builder could be more mobile-friendly for users who want to work on their projects on tablets or phones.',
    'low',
    'open'
),
(
    NULL, -- Anonymous feedback
    'bug',
    'export',
    'Export button not working',
    'When I try to export my MVP prompts, the download button becomes unresponsive.',
    'high',
    'in_progress'
);

-- =====================================================
-- 5. SAMPLE ANALYTICS EVENTS
-- =====================================================

INSERT INTO public.analytics_events (
    user_id,
    event_type,
    event_category,
    event_data,
    session_id
) VALUES 
(
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
    'mvp_created',
    'mvp_studio',
    '{"mvp_id": "sample-mvp-id", "app_name": "TaskFlow Pro", "platforms": ["web", "mobile"], "style": "Minimal & Clean"}',
    'session_123'
),
(
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
    'mvp_stage_completed',
    'mvp_studio',
    '{"mvp_id": "sample-mvp-id", "stage": 3, "stage_name": "App Skeleton Generator"}',
    'session_123'
),
(
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
    'export_generated',
    'export',
    '{"mvp_id": "sample-mvp-id", "export_type": "unified_prompt", "target_tool": "cursor"}',
    'session_123'
);

-- =====================================================
-- 6. SAMPLE RATE LIMITS
-- =====================================================

INSERT INTO public.rate_limits (
    user_id,
    resource_type,
    limit_value,
    window_type,
    current_count,
    reset_date
) VALUES 
(
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
    'mvp_generation',
    3,
    'monthly',
    1,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
),
(
    '00000000-0000-0000-0000-000000000002', -- Replace with actual user ID
    'mvp_generation',
    10,
    'monthly',
    3,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
);

-- =====================================================
-- 7. SAMPLE EXPORT HISTORY
-- =====================================================

INSERT INTO public.export_history (
    user_id,
    mvp_id,
    export_type,
    target_tool,
    export_data,
    file_size_bytes,
    download_count
) VALUES (
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
    (SELECT id FROM public.mvps WHERE app_name = 'TaskFlow Pro' LIMIT 1),
    'unified_prompt',
    'cursor',
    '{"prompt": "Build a comprehensive task management application...", "metadata": {"generated_at": "2024-01-15T10:30:00Z"}}',
    15420,
    2
);

-- =====================================================
-- 8. UTILITY FUNCTIONS FOR SEED DATA
-- =====================================================

-- Function to create sample data for a specific user
CREATE OR REPLACE FUNCTION create_sample_data_for_user(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    sample_mvp_id UUID;
BEGIN
    -- Create sample MVP
    INSERT INTO public.mvps (
        user_id,
        app_name,
        platforms,
        style,
        app_description,
        target_users,
        generated_prompt,
        completion_stage,
        is_mvp_studio_project,
        status
    ) VALUES (
        p_user_id,
        'My Sample App',
        ARRAY['web'],
        'Minimal & Clean',
        'A sample application created for demonstration purposes.',
        'Demo users',
        'This is a sample generated prompt for demonstration.',
        1,
        false,
        'Yet To Build'
    ) RETURNING id INTO sample_mvp_id;
    
    -- Create sample questionnaire
    INSERT INTO public.questionnaire (
        mvp_id,
        user_id,
        idea_validated,
        talked_to_people,
        motivation
    ) VALUES (
        sample_mvp_id,
        p_user_id,
        true,
        false,
        'Just testing the system'
    );
    
    -- Create sample analytics event
    INSERT INTO public.analytics_events (
        user_id,
        event_type,
        event_category,
        event_data
    ) VALUES (
        p_user_id,
        'mvp_created',
        'simple_generator',
        jsonb_build_object('mvp_id', sample_mvp_id, 'app_name', 'My Sample App')
    );
    
    RAISE NOTICE 'Sample data created for user %', p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up all seed data
CREATE OR REPLACE FUNCTION cleanup_seed_data()
RETURNS VOID AS $$
BEGIN
    -- Delete in reverse dependency order
    DELETE FROM public.export_history WHERE user_id LIKE '00000000-0000-0000-0000-%';
    DELETE FROM public.analytics_events WHERE user_id LIKE '00000000-0000-0000-0000-%';
    DELETE FROM public.rate_limits WHERE user_id LIKE '00000000-0000-0000-0000-%';
    DELETE FROM public.feedback WHERE user_id LIKE '00000000-0000-0000-0000-%' OR user_id IS NULL;
    DELETE FROM public.mvp_studio_sessions WHERE user_id LIKE '00000000-0000-0000-0000-%';
    DELETE FROM public.questionnaire WHERE user_id LIKE '00000000-0000-0000-0000-%';
    DELETE FROM public.mvps WHERE user_id LIKE '00000000-0000-0000-0000-%';
    DELETE FROM public.user_profiles WHERE id LIKE '00000000-0000-0000-0000-%';
    
    RAISE NOTICE 'All seed data cleaned up';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA COMPLETE
-- =====================================================
-- Note: Remember to replace the sample UUIDs with actual user IDs
-- from your auth.users table, or remove the seed data entirely
-- for production deployments.

-- To use sample data for a real user:
-- SELECT create_sample_data_for_user('your-actual-user-id-here');

-- To clean up all seed data:
-- SELECT cleanup_seed_data();

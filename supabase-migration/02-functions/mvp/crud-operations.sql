-- =====================================================
-- MVP CRUD OPERATION FUNCTIONS
-- =====================================================
-- This file contains all database functions for MVP CRUD operations
-- Run this after schema creation

-- =====================================================
-- 1. MVP CREATION FUNCTIONS
-- =====================================================

-- Function to create MVP with validation
CREATE OR REPLACE FUNCTION public.create_mvp(
    user_id_param UUID,
    app_name_param TEXT,
    platforms_param TEXT[],
    style_param TEXT,
    style_description_param TEXT DEFAULT NULL,
    app_description_param TEXT,
    target_users_param TEXT DEFAULT NULL,
    generated_prompt_param TEXT,
    app_blueprint_param JSONB DEFAULT NULL,
    screen_prompts_param JSONB DEFAULT NULL,
    app_flow_param JSONB DEFAULT NULL,
    export_prompts_param JSONB DEFAULT NULL,
    status_param TEXT DEFAULT 'Yet To Build',
    completion_stage_param INTEGER DEFAULT 1,
    is_mvp_studio_project_param BOOLEAN DEFAULT FALSE,
    tags_param TEXT[] DEFAULT ARRAY[]::TEXT[],
    estimated_hours_param INTEGER DEFAULT NULL
)
RETURNS public.mvps AS $$
DECLARE
    new_mvp public.mvps;
    user_limits RECORD;
BEGIN
    -- Check user limits
    SELECT * INTO user_limits FROM public.check_subscription_limits(user_id_param);
    
    IF NOT user_limits.can_create_mvp THEN
        RAISE EXCEPTION 'MVP creation limit reached. Current limit: % MVPs', 
            (SELECT mvp_limit FROM public.user_profiles WHERE id = user_id_param);
    END IF;
    
    -- Validate required fields
    IF app_name_param IS NULL OR TRIM(app_name_param) = '' THEN
        RAISE EXCEPTION 'App name is required';
    END IF;
    
    IF app_description_param IS NULL OR TRIM(app_description_param) = '' THEN
        RAISE EXCEPTION 'App description is required';
    END IF;
    
    IF generated_prompt_param IS NULL OR TRIM(generated_prompt_param) = '' THEN
        RAISE EXCEPTION 'Generated prompt is required';
    END IF;
    
    IF platforms_param IS NULL OR array_length(platforms_param, 1) = 0 THEN
        RAISE EXCEPTION 'At least one platform is required';
    END IF;
    
    -- Validate style
    IF style_param NOT IN ('Minimal & Clean', 'Playful & Animated', 'Business & Professional') THEN
        RAISE EXCEPTION 'Invalid style: %', style_param;
    END IF;
    
    -- Validate status
    IF status_param NOT IN ('Yet To Build', 'Built', 'Launched', 'Abandoned') THEN
        RAISE EXCEPTION 'Invalid status: %', status_param;
    END IF;
    
    -- Validate completion stage
    IF completion_stage_param < 1 OR completion_stage_param > 6 THEN
        RAISE EXCEPTION 'Completion stage must be between 1 and 6';
    END IF;
    
    -- Check for duplicate app name for user (case-insensitive)
    IF EXISTS (
        SELECT 1 FROM public.mvps
        WHERE user_id = user_id_param
        AND LOWER(TRIM(app_name)) = LOWER(TRIM(app_name_param))
    ) THEN
        RAISE EXCEPTION 'An MVP with this name already exists for this user';
    END IF;
    
    -- Create the MVP
    INSERT INTO public.mvps (
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
        status,
        completion_stage,
        is_mvp_studio_project,
        tags,
        estimated_hours
    ) VALUES (
        user_id_param,
        TRIM(app_name_param),
        platforms_param,
        style_param,
        style_description_param,
        TRIM(app_description_param),
        target_users_param,
        TRIM(generated_prompt_param),
        app_blueprint_param,
        screen_prompts_param,
        app_flow_param,
        export_prompts_param,
        status_param,
        completion_stage_param,
        is_mvp_studio_project_param,
        COALESCE(tags_param, ARRAY[]::TEXT[]),
        estimated_hours_param
    ) RETURNING * INTO new_mvp;
    
    -- Update user stats
    PERFORM public.increment_usage_counter(user_id_param, 'mvps_created', 1);
    
    -- Calculate and update complexity score
    PERFORM public.update_mvp_complexity(new_mvp.id);
    
    RETURN new_mvp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. MVP RETRIEVAL FUNCTIONS
-- =====================================================

-- Function to get MVP with ownership validation
CREATE OR REPLACE FUNCTION public.get_mvp_by_id(
    mvp_id_param UUID,
    user_id_param UUID
)
RETURNS public.mvps AS $$
DECLARE
    mvp_record public.mvps;
BEGIN
    SELECT * INTO mvp_record
    FROM public.mvps
    WHERE id = mvp_id_param AND user_id = user_id_param;
    
    IF mvp_record IS NULL THEN
        RAISE EXCEPTION 'MVP not found or access denied';
    END IF;
    
    RETURN mvp_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's MVPs with filtering
CREATE OR REPLACE FUNCTION public.get_user_mvps(
    user_id_param UUID,
    status_filter TEXT DEFAULT NULL,
    platforms_filter TEXT[] DEFAULT NULL,
    style_filter TEXT DEFAULT NULL,
    tags_filter TEXT[] DEFAULT NULL,
    is_studio_filter BOOLEAN DEFAULT NULL,
    sort_by TEXT DEFAULT 'created_at',
    sort_order TEXT DEFAULT 'desc',
    limit_param INTEGER DEFAULT 50,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    app_name TEXT,
    platforms TEXT[],
    style TEXT,
    app_description TEXT,
    target_users TEXT,
    status TEXT,
    completion_stage INTEGER,
    is_mvp_studio_project BOOLEAN,
    tags TEXT[],
    complexity_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    completion_percentage INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.app_name,
        m.platforms,
        m.style,
        m.app_description,
        m.target_users,
        m.status,
        m.completion_stage,
        m.is_mvp_studio_project,
        m.tags,
        m.complexity_score,
        m.created_at,
        m.updated_at,
        public.calculate_mvp_completion(m.id) as completion_percentage
    FROM public.mvps m
    WHERE m.user_id = user_id_param
        AND (status_filter IS NULL OR m.status = status_filter)
        AND (platforms_filter IS NULL OR m.platforms && platforms_filter)
        AND (style_filter IS NULL OR m.style = style_filter)
        AND (tags_filter IS NULL OR m.tags && tags_filter)
        AND (is_studio_filter IS NULL OR m.is_mvp_studio_project = is_studio_filter)
    ORDER BY 
        CASE WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN m.created_at END DESC,
        CASE WHEN sort_by = 'created_at' AND sort_order = 'asc' THEN m.created_at END ASC,
        CASE WHEN sort_by = 'updated_at' AND sort_order = 'desc' THEN m.updated_at END DESC,
        CASE WHEN sort_by = 'updated_at' AND sort_order = 'asc' THEN m.updated_at END ASC,
        CASE WHEN sort_by = 'app_name' AND sort_order = 'asc' THEN m.app_name END ASC,
        CASE WHEN sort_by = 'app_name' AND sort_order = 'desc' THEN m.app_name END DESC,
        CASE WHEN sort_by = 'status' AND sort_order = 'asc' THEN m.status END ASC,
        CASE WHEN sort_by = 'status' AND sort_order = 'desc' THEN m.status END DESC,
        m.created_at DESC
    LIMIT limit_param OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search MVPs by text
CREATE OR REPLACE FUNCTION public.search_user_mvps(
    user_id_param UUID,
    search_term TEXT,
    limit_param INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    app_name TEXT,
    app_description TEXT,
    platforms TEXT[],
    style TEXT,
    status TEXT,
    completion_stage INTEGER,
    is_mvp_studio_project BOOLEAN,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.app_name,
        m.app_description,
        m.platforms,
        m.style,
        m.status,
        m.completion_stage,
        m.is_mvp_studio_project,
        m.tags,
        m.created_at,
        ts_rank(
            to_tsvector('english', m.app_name || ' ' || m.app_description || ' ' || array_to_string(m.tags, ' ')),
            plainto_tsquery('english', search_term)
        ) as rank
    FROM public.mvps m
    WHERE m.user_id = user_id_param
        AND (
            to_tsvector('english', m.app_name || ' ' || m.app_description || ' ' || array_to_string(m.tags, ' '))
            @@ plainto_tsquery('english', search_term)
        )
    ORDER BY rank DESC, m.updated_at DESC
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. MVP UPDATE FUNCTIONS
-- =====================================================

-- Function to update MVP with validation
CREATE OR REPLACE FUNCTION public.update_mvp(
    mvp_id_param UUID,
    user_id_param UUID,
    app_name_param TEXT DEFAULT NULL,
    platforms_param TEXT[] DEFAULT NULL,
    style_param TEXT DEFAULT NULL,
    style_description_param TEXT DEFAULT NULL,
    app_description_param TEXT DEFAULT NULL,
    target_users_param TEXT DEFAULT NULL,
    status_param TEXT DEFAULT NULL,
    tags_param TEXT[] DEFAULT NULL,
    estimated_hours_param INTEGER DEFAULT NULL,
    actual_hours_param INTEGER DEFAULT NULL,
    is_public_param BOOLEAN DEFAULT NULL
)
RETURNS public.mvps AS $$
DECLARE
    updated_mvp public.mvps;
    current_mvp public.mvps;
BEGIN
    -- Get current MVP and validate ownership
    SELECT * INTO current_mvp FROM public.get_mvp_by_id(mvp_id_param, user_id_param);
    
    -- Validate new values if provided
    IF app_name_param IS NOT NULL AND TRIM(app_name_param) = '' THEN
        RAISE EXCEPTION 'App name cannot be empty';
    END IF;
    
    IF app_description_param IS NOT NULL AND TRIM(app_description_param) = '' THEN
        RAISE EXCEPTION 'App description cannot be empty';
    END IF;
    
    IF platforms_param IS NOT NULL AND array_length(platforms_param, 1) = 0 THEN
        RAISE EXCEPTION 'At least one platform is required';
    END IF;
    
    IF style_param IS NOT NULL AND style_param NOT IN ('Minimal & Clean', 'Playful & Animated', 'Business & Professional') THEN
        RAISE EXCEPTION 'Invalid style: %', style_param;
    END IF;
    
    IF status_param IS NOT NULL AND status_param NOT IN ('Yet To Build', 'Built', 'Launched', 'Abandoned') THEN
        RAISE EXCEPTION 'Invalid status: %', status_param;
    END IF;
    
    -- Check for duplicate app name if name is being changed (case-insensitive)
    IF app_name_param IS NOT NULL AND LOWER(TRIM(app_name_param)) != LOWER(TRIM(current_mvp.app_name)) THEN
        IF EXISTS (
            SELECT 1 FROM public.mvps
            WHERE user_id = user_id_param
            AND LOWER(TRIM(app_name)) = LOWER(TRIM(app_name_param))
            AND id != mvp_id_param
        ) THEN
            RAISE EXCEPTION 'An MVP with this name already exists for this user';
        END IF;
    END IF;
    
    -- Update the MVP
    UPDATE public.mvps
    SET 
        app_name = COALESCE(TRIM(app_name_param), app_name),
        platforms = COALESCE(platforms_param, platforms),
        style = COALESCE(style_param, style),
        style_description = COALESCE(style_description_param, style_description),
        app_description = COALESCE(TRIM(app_description_param), app_description),
        target_users = COALESCE(target_users_param, target_users),
        status = COALESCE(status_param, status),
        tags = COALESCE(tags_param, tags),
        estimated_hours = COALESCE(estimated_hours_param, estimated_hours),
        actual_hours = COALESCE(actual_hours_param, actual_hours),
        is_public = COALESCE(is_public_param, is_public),
        updated_at = NOW()
    WHERE id = mvp_id_param AND user_id = user_id_param
    RETURNING * INTO updated_mvp;
    
    -- Update complexity score if relevant fields changed
    IF platforms_param IS NOT NULL OR app_description_param IS NOT NULL THEN
        PERFORM public.update_mvp_complexity(mvp_id_param);
    END IF;
    
    RETURN updated_mvp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update MVP Studio data
CREATE OR REPLACE FUNCTION public.update_mvp_studio_data(
    mvp_id_param UUID,
    user_id_param UUID,
    app_blueprint_param JSONB DEFAULT NULL,
    screen_prompts_param JSONB DEFAULT NULL,
    app_flow_param JSONB DEFAULT NULL,
    export_prompts_param JSONB DEFAULT NULL,
    completion_stage_param INTEGER DEFAULT NULL
)
RETURNS public.mvps AS $$
DECLARE
    updated_mvp public.mvps;
BEGIN
    -- Validate completion stage
    IF completion_stage_param IS NOT NULL AND (completion_stage_param < 1 OR completion_stage_param > 6) THEN
        RAISE EXCEPTION 'Completion stage must be between 1 and 6';
    END IF;
    
    -- Update MVP Studio data
    UPDATE public.mvps
    SET 
        app_blueprint = COALESCE(app_blueprint_param, app_blueprint),
        screen_prompts = COALESCE(screen_prompts_param, screen_prompts),
        app_flow = COALESCE(app_flow_param, app_flow),
        export_prompts = COALESCE(export_prompts_param, export_prompts),
        completion_stage = COALESCE(completion_stage_param, completion_stage),
        is_mvp_studio_project = CASE 
            WHEN app_blueprint_param IS NOT NULL OR screen_prompts_param IS NOT NULL 
                 OR app_flow_param IS NOT NULL OR export_prompts_param IS NOT NULL 
            THEN true 
            ELSE is_mvp_studio_project 
        END,
        updated_at = NOW()
    WHERE id = mvp_id_param AND user_id = user_id_param
    RETURNING * INTO updated_mvp;
    
    IF updated_mvp IS NULL THEN
        RAISE EXCEPTION 'MVP not found or access denied';
    END IF;
    
    -- Update complexity score
    PERFORM public.update_mvp_complexity(mvp_id_param);
    
    RETURN updated_mvp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. MVP DELETION FUNCTIONS
-- =====================================================

-- Function to soft delete MVP
CREATE OR REPLACE FUNCTION public.soft_delete_mvp(
    mvp_id_param UUID,
    user_id_param UUID
)
RETURNS public.mvps AS $$
DECLARE
    deleted_mvp public.mvps;
BEGIN
    UPDATE public.mvps
    SET 
        status = 'Abandoned',
        updated_at = NOW()
    WHERE id = mvp_id_param AND user_id = user_id_param
    RETURNING * INTO deleted_mvp;
    
    IF deleted_mvp IS NULL THEN
        RAISE EXCEPTION 'MVP not found or access denied';
    END IF;
    
    RETURN deleted_mvp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hard delete MVP
CREATE OR REPLACE FUNCTION public.hard_delete_mvp(
    mvp_id_param UUID,
    user_id_param UUID
)
RETURNS UUID AS $$
DECLARE
    deleted_id UUID;
BEGIN
    DELETE FROM public.mvps
    WHERE id = mvp_id_param AND user_id = user_id_param
    RETURNING id INTO deleted_id;
    
    IF deleted_id IS NULL THEN
        RAISE EXCEPTION 'MVP not found or access denied';
    END IF;
    
    RETURN deleted_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. BULK OPERATIONS
-- =====================================================

-- Function to bulk update MVP status
CREATE OR REPLACE FUNCTION public.bulk_update_mvp_status(
    user_id_param UUID,
    mvp_ids_param UUID[],
    new_status_param TEXT
)
RETURNS TABLE (
    id UUID,
    app_name TEXT,
    old_status TEXT,
    new_status TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Validate status
    IF new_status_param NOT IN ('Yet To Build', 'Built', 'Launched', 'Abandoned') THEN
        RAISE EXCEPTION 'Invalid status: %', new_status_param;
    END IF;
    
    RETURN QUERY
    UPDATE public.mvps
    SET 
        status = new_status_param,
        updated_at = NOW()
    WHERE user_id = user_id_param AND id = ANY(mvp_ids_param)
    RETURNING 
        mvps.id,
        mvps.app_name,
        mvps.status as old_status,
        new_status_param as new_status,
        mvps.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk delete MVPs
CREATE OR REPLACE FUNCTION public.bulk_delete_mvps(
    user_id_param UUID,
    mvp_ids_param UUID[]
)
RETURNS TABLE (
    deleted_id UUID,
    app_name TEXT
) AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Validate input
    IF mvp_ids_param IS NULL OR array_length(mvp_ids_param, 1) = 0 THEN
        RAISE EXCEPTION 'No MVP IDs provided for deletion';
    END IF;

    RETURN QUERY
    DELETE FROM public.mvps
    WHERE user_id = user_id_param AND id = ANY(mvp_ids_param)
    RETURNING id as deleted_id, app_name;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % MVPs for user %', deleted_count, user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RAG KNOWLEDGE BASE OPERATIONS - API QUERIES
-- =====================================================
-- This file contains all SQL queries for RAG knowledge base operations
-- Used by: /api/rag/knowledge-base/* endpoints

-- =====================================================
-- 1. SEARCH KNOWLEDGE BASE
-- =====================================================

-- Vector similarity search with filters
-- Usage: Replace parameters with actual values
-- Used in: GET /api/rag/knowledge-base (with query)
SELECT 
    id,
    title,
    content,
    document_type,
    target_tools,
    categories,
    complexity_level,
    source_url,
    tags,
    quality_score,
    usage_count,
    created_at,
    (embedding <=> $1::vector) as similarity_distance
FROM public.rag_knowledge_base
WHERE is_active = true
    AND review_status = 'approved'
    AND ($2::TEXT[] IS NULL OR target_tools && $2) -- target_tools filter
    AND ($3::TEXT[] IS NULL OR categories && $3) -- categories filter
    AND ($4::TEXT IS NULL OR complexity_level = $4) -- complexity filter
    AND ($5::TEXT IS NULL OR document_type = $5) -- document_type filter
    AND (embedding <=> $1::vector) < $6 -- similarity_threshold
ORDER BY embedding <=> $1::vector
LIMIT $7; -- max_results

-- Regular database search without vector similarity
-- Usage: Replace parameters with actual values
-- Used in: GET /api/rag/knowledge-base (without query)
SELECT 
    id,
    title,
    content,
    document_type,
    target_tools,
    categories,
    complexity_level,
    source_url,
    tags,
    quality_score,
    usage_count,
    created_at
FROM public.rag_knowledge_base
WHERE is_active = true
    AND review_status = 'approved'
    AND ($1::TEXT[] IS NULL OR target_tools && $1) -- target_tools filter
    AND ($2::TEXT[] IS NULL OR categories && $2) -- categories filter
    AND ($3::TEXT IS NULL OR complexity_level = $3) -- complexity filter
    AND ($4::TEXT IS NULL OR document_type = $4) -- document_type filter
ORDER BY quality_score DESC, usage_count DESC, created_at DESC
LIMIT $5; -- limit

-- Full-text search with ranking
-- Usage: Replace $1 with search_term, other parameters for filters
-- Used in: Text-based search functionality
SELECT 
    id,
    title,
    content,
    document_type,
    target_tools,
    categories,
    complexity_level,
    source_url,
    tags,
    quality_score,
    usage_count,
    created_at,
    ts_rank(
        to_tsvector('english', title || ' ' || content || ' ' || array_to_string(tags, ' ')),
        plainto_tsquery('english', $1)
    ) as rank
FROM public.rag_knowledge_base
WHERE is_active = true
    AND review_status = 'approved'
    AND to_tsvector('english', title || ' ' || content || ' ' || array_to_string(tags, ' '))
        @@ plainto_tsquery('english', $1)
    AND ($2::TEXT[] IS NULL OR target_tools && $2) -- target_tools filter
    AND ($3::TEXT[] IS NULL OR categories && $3) -- categories filter
    AND ($4::TEXT IS NULL OR complexity_level = $4) -- complexity filter
ORDER BY rank DESC, quality_score DESC
LIMIT $5; -- limit

-- =====================================================
-- 2. ADD KNOWLEDGE DOCUMENT
-- =====================================================

-- Insert new knowledge document
-- Usage: Replace parameters with actual values
-- Used in: POST /api/rag/knowledge-base
INSERT INTO public.rag_knowledge_base (
    title,
    content,
    document_type,
    target_tools,
    categories,
    complexity_level,
    source_url,
    tags,
    quality_score,
    embedding,
    created_by,
    review_status
) VALUES (
    $1, -- title
    $2, -- content
    $3, -- document_type
    $4, -- target_tools
    $5, -- categories
    $6, -- complexity_level
    $7, -- source_url
    $8, -- tags
    COALESCE($9, 0.5), -- quality_score
    $10, -- embedding (vector)
    $11, -- created_by (user_id)
    COALESCE($12, 'pending') -- review_status
)
RETURNING id, title, document_type, created_at;

-- =====================================================
-- 3. UPDATE KNOWLEDGE DOCUMENT
-- =====================================================

-- Update existing knowledge document
-- Usage: Replace parameters with actual values
-- Used in: PUT /api/rag/knowledge-base
UPDATE public.rag_knowledge_base
SET 
    title = COALESCE($2, title),
    content = COALESCE($3, content),
    document_type = COALESCE($4, document_type),
    target_tools = COALESCE($5, target_tools),
    categories = COALESCE($6, categories),
    complexity_level = COALESCE($7, complexity_level),
    source_url = COALESCE($8, source_url),
    tags = COALESCE($9, tags),
    quality_score = COALESCE($10, quality_score),
    embedding = COALESCE($11, embedding),
    review_status = COALESCE($12, review_status),
    updated_at = NOW()
WHERE id = $1 
    AND created_by = $13 -- user can only update their own documents
    AND review_status = 'pending' -- can only update pending documents
RETURNING *;

-- Update document review status (admin only)
-- Usage: Replace $1 with document_id, $2 with new_status, $3 with reviewer_id
-- Used in: Admin review process
UPDATE public.rag_knowledge_base
SET 
    review_status = $2,
    reviewed_by = $3,
    updated_at = NOW()
WHERE id = $1
RETURNING id, title, review_status, updated_at;

-- =====================================================
-- 4. DELETE KNOWLEDGE DOCUMENT
-- =====================================================

-- Soft delete (deactivate) knowledge document
-- Usage: Replace $1 with document_id, $2 with user_id
-- Used in: DELETE /api/rag/knowledge-base (soft delete)
UPDATE public.rag_knowledge_base
SET 
    is_active = false,
    updated_at = NOW()
WHERE id = $1 
    AND created_by = $2
    AND review_status = 'pending'
RETURNING id, title, is_active;

-- Hard delete knowledge document
-- Usage: Replace $1 with document_id, $2 with user_id
-- Used in: DELETE /api/rag/knowledge-base (hard delete)
DELETE FROM public.rag_knowledge_base
WHERE id = $1 
    AND created_by = $2
    AND review_status = 'pending'
RETURNING id;

-- =====================================================
-- 5. USAGE TRACKING
-- =====================================================

-- Update usage statistics
-- Usage: Replace $1 with document_id
-- Used in: When document is used in RAG generation
UPDATE public.rag_knowledge_base
SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
WHERE id = $1
RETURNING id, usage_count, last_used_at;

-- Bulk update usage for multiple documents
-- Usage: Replace $1 with array of document_ids
-- Used in: Batch usage tracking
UPDATE public.rag_knowledge_base
SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
WHERE id = ANY($1)
RETURNING id, usage_count;

-- =====================================================
-- 6. ANALYTICS QUERIES
-- =====================================================

-- Get knowledge base statistics
-- Usage: No parameters needed
-- Used in: Admin dashboard
SELECT 
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE is_active = true) as active_documents,
    COUNT(*) FILTER (WHERE review_status = 'approved') as approved_documents,
    COUNT(*) FILTER (WHERE review_status = 'pending') as pending_documents,
    COUNT(*) FILTER (WHERE review_status = 'rejected') as rejected_documents,
    AVG(quality_score) as avg_quality_score,
    SUM(usage_count) as total_usage_count
FROM public.rag_knowledge_base;

-- Get most used documents
-- Usage: Replace $1 with limit
-- Used in: Popular content analysis
SELECT 
    id,
    title,
    document_type,
    target_tools,
    categories,
    usage_count,
    quality_score,
    last_used_at
FROM public.rag_knowledge_base
WHERE is_active = true AND review_status = 'approved'
ORDER BY usage_count DESC, quality_score DESC
LIMIT $1;

-- Get documents by category usage
-- Usage: No parameters needed
-- Used in: Category analytics
SELECT 
    category,
    COUNT(*) as document_count,
    AVG(quality_score) as avg_quality,
    SUM(usage_count) as total_usage
FROM public.rag_knowledge_base,
     unnest(categories) as category
WHERE is_active = true AND review_status = 'approved'
GROUP BY category
ORDER BY total_usage DESC;

-- Get documents by tool usage
-- Usage: No parameters needed
-- Used in: Tool-specific analytics
SELECT 
    tool,
    COUNT(*) as document_count,
    AVG(quality_score) as avg_quality,
    SUM(usage_count) as total_usage
FROM public.rag_knowledge_base,
     unnest(target_tools) as tool
WHERE is_active = true AND review_status = 'approved'
GROUP BY tool
ORDER BY total_usage DESC;

-- =====================================================
-- 7. SEARCH SUGGESTIONS
-- =====================================================

-- Get related documents based on categories
-- Usage: Replace $1 with document_id, $2 with limit
-- Used in: Related content suggestions
SELECT 
    id,
    title,
    document_type,
    categories,
    quality_score,
    usage_count
FROM public.rag_knowledge_base
WHERE is_active = true 
    AND review_status = 'approved'
    AND id != $1
    AND categories && (
        SELECT categories 
        FROM public.rag_knowledge_base 
        WHERE id = $1
    )
ORDER BY quality_score DESC, usage_count DESC
LIMIT $2;

-- Get documents for specific tool and complexity
-- Usage: Replace $1 with tool, $2 with complexity_level, $3 with limit
-- Used in: Tool-specific recommendations
SELECT 
    id,
    title,
    content,
    document_type,
    categories,
    quality_score,
    usage_count
FROM public.rag_knowledge_base
WHERE is_active = true 
    AND review_status = 'approved'
    AND $1 = ANY(target_tools)
    AND complexity_level = $2
ORDER BY quality_score DESC, usage_count DESC
LIMIT $3;

-- =====================================================
-- 8. VALIDATION QUERIES
-- =====================================================

-- Check if document exists and user can modify
-- Usage: Replace $1 with document_id, $2 with user_id
-- Used in: Authorization checks
SELECT 
    id,
    title,
    created_by,
    review_status,
    is_active
FROM public.rag_knowledge_base
WHERE id = $1 AND created_by = $2;

-- Check for duplicate titles
-- Usage: Replace $1 with title, $2 with user_id (optional)
-- Used in: Duplicate prevention
SELECT EXISTS(
    SELECT 1 FROM public.rag_knowledge_base 
    WHERE LOWER(title) = LOWER($1)
        AND is_active = true
        AND ($2::UUID IS NULL OR created_by = $2)
) as title_exists;

-- =====================================================
-- 9. BATCH OPERATIONS
-- =====================================================

-- Bulk approve documents
-- Usage: Replace $1 with array of document_ids, $2 with reviewer_id
-- Used in: Admin bulk operations
UPDATE public.rag_knowledge_base
SET 
    review_status = 'approved',
    reviewed_by = $2,
    updated_at = NOW()
WHERE id = ANY($1) AND review_status = 'pending'
RETURNING id, title, review_status;

-- Bulk update quality scores
-- Usage: Replace $1 with array of document_ids, $2 with new_quality_score
-- Used in: Quality management
UPDATE public.rag_knowledge_base
SET 
    quality_score = $2,
    updated_at = NOW()
WHERE id = ANY($1)
RETURNING id, title, quality_score;

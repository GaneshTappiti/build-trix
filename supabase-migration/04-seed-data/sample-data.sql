-- =====================================================
-- SAMPLE DATA FOR DEVELOPMENT AND TESTING
-- =====================================================
-- This file contains sample data for development and testing purposes
-- WARNING: Only run this in development environments!

-- =====================================================
-- 1. SAMPLE KNOWLEDGE BASE ENTRIES
-- =====================================================

-- Insert sample knowledge base documents
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
    is_active,
    review_status
) VALUES 
(
    'React Component Best Practices',
    'When building React components, follow these best practices:

1. **Single Responsibility**: Each component should have one clear purpose
2. **Props Interface**: Always define TypeScript interfaces for props
3. **Error Boundaries**: Implement error boundaries for robust applications
4. **Performance**: Use React.memo for expensive components
5. **Accessibility**: Include ARIA labels and semantic HTML

Example:
```typescript
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = "primary", 
  disabled = false 
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={typeof children === "string" ? children : undefined}
    >
      {children}
    </button>
  );
};
```',
    'best_practice',
    ARRAY['lovable', 'cursor', 'v0'],
    ARRAY['react', 'components', 'typescript'],
    'intermediate',
    'https://react.dev/learn',
    ARRAY['react', 'components', 'best-practices', 'typescript'],
    0.9,
    true,
    'approved'
),
(
    'Supabase Authentication Setup',
    'Setting up authentication with Supabase in a React application:

## 1. Install Supabase Client
```bash
npm install @supabase/supabase-js
```

## 2. Create Supabase Client
```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

## 3. Authentication Hook
```typescript
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

## 4. Login Component
```typescript
const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) console.error("Login error:", error);
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
};
```',
    'guide',
    ARRAY['lovable', 'cursor'],
    ARRAY['authentication', 'supabase', 'react'],
    'intermediate',
    'https://supabase.com/docs/guides/auth',
    ARRAY['supabase', 'authentication', 'react', 'typescript'],
    0.95,
    true,
    'approved'
),
(
    'Tailwind CSS Responsive Design Patterns',
    'Common responsive design patterns using Tailwind CSS:

## 1. Mobile-First Approach
Always start with mobile styles, then add larger screen styles:

```html
<!-- Mobile: stack vertically, Desktop: side by side -->
<div class="flex flex-col md:flex-row gap-4">
  <div class="w-full md:w-1/2">Content 1</div>
  <div class="w-full md:w-1/2">Content 2</div>
</div>
```

## 2. Responsive Grid Layouts
```html
<!-- 1 column on mobile, 2 on tablet, 3 on desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="bg-white p-6 rounded-lg shadow">Card 1</div>
  <div class="bg-white p-6 rounded-lg shadow">Card 2</div>
  <div class="bg-white p-6 rounded-lg shadow">Card 3</div>
</div>
```

## 3. Responsive Typography
```html
<h1 class="text-2xl md:text-4xl lg:text-6xl font-bold">
  Responsive Heading
</h1>
<p class="text-sm md:text-base lg:text-lg">
  Responsive paragraph text
</p>
```

## 4. Navigation Patterns
```html
<!-- Mobile hamburger, desktop horizontal -->
<nav class="flex items-center justify-between p-4">
  <div class="text-xl font-bold">Logo</div>
  
  <!-- Mobile menu button -->
  <button class="md:hidden">
    <svg class="w-6 h-6" fill="none" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>
  
  <!-- Desktop menu -->
  <div class="hidden md:flex space-x-6">
    <a href="#" class="hover:text-blue-600">Home</a>
    <a href="#" class="hover:text-blue-600">About</a>
    <a href="#" class="hover:text-blue-600">Contact</a>
  </div>
</nav>
```

## 5. Container Patterns
```html
<!-- Responsive container with max width -->
<div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
  <div class="py-8 md:py-12 lg:py-16">
    Content with responsive padding
  </div>
</div>
```',
    'guide',
    ARRAY['lovable', 'v0', 'cursor'],
    ARRAY['css', 'responsive', 'design'],
    'beginner',
    'https://tailwindcss.com/docs/responsive-design',
    ARRAY['tailwind', 'css', 'responsive', 'mobile-first'],
    0.88,
    true,
    'approved'
),
(
    'Next.js App Router Best Practices',
    'Best practices for using Next.js 13+ App Router:

## 1. File Structure
```
app/
├── layout.tsx          # Root layout
├── page.tsx           # Home page
├── loading.tsx        # Loading UI
├── error.tsx          # Error UI
├── not-found.tsx      # 404 page
├── dashboard/
│   ├── layout.tsx     # Dashboard layout
│   ├── page.tsx       # Dashboard page
│   └── settings/
│       └── page.tsx   # Settings page
└── api/
    └── users/
        └── route.ts   # API route
```

## 2. Server Components by Default
```typescript
// app/page.tsx - Server Component (default)
async function HomePage() {
  const data = await fetch("https://api.example.com/data");
  const posts = await data.json();

  return (
    <div>
      <h1>Posts</h1>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}

export default HomePage;
```

## 3. Client Components When Needed
```typescript
"use client"; // Mark as client component

import { useState } from "react";

function InteractiveButton() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

## 4. Loading and Error States
```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
}

// app/dashboard/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  );
}
```

## 5. API Routes
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const users = await fetchUsers();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await createUser(body);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
```',
    'guide',
    ARRAY['lovable', 'cursor'],
    ARRAY['nextjs', 'routing', 'react'],
    'intermediate',
    'https://nextjs.org/docs/app',
    ARRAY['nextjs', 'app-router', 'react', 'routing'],
    0.92,
    true,
    'approved'
);

-- =====================================================
-- 2. SAMPLE USER PREFERENCES
-- =====================================================

-- Note: In a real application, these would be created when users sign up
-- This is just for testing purposes with sample user IDs

-- Sample RAG user preferences (using placeholder UUIDs)
-- Note: These are for development/testing only
DO $$
BEGIN
    -- Only insert if these sample users don't already exist
    IF NOT EXISTS (SELECT 1 FROM public.rag_user_preferences WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID) THEN
        INSERT INTO public.rag_user_preferences (
            user_id,
            default_ai_tool,
            default_complexity,
            default_experience,
            enable_enhancement_suggestions,
            enable_confidence_scoring,
            enable_tool_recommendations,
            preferred_prompt_style,
            preferred_detail_level,
            learning_mode,
            total_prompts_generated,
            favorite_tools
        ) VALUES
        (
            '00000000-0000-0000-0000-000000000001'::UUID, -- Sample user ID
            'lovable',
            'medium',
            'intermediate',
            true,
            true,
            true,
            'structured',
            'detailed',
            true,
            15,
            '["lovable", "cursor"]'::jsonb
        ),
        (
            '00000000-0000-0000-0000-000000000002'::UUID, -- Sample user ID
            'v0',
            'simple',
            'beginner',
            true,
            false,
            true,
            'conversational',
            'medium',
            true,
            8,
            '["v0", "chatgpt"]'::jsonb
        );

        RAISE NOTICE 'Inserted sample user preferences';
    ELSE
        RAISE NOTICE 'Sample user preferences already exist, skipping insert';
    END IF;
END $$;

-- =====================================================
-- 3. SAMPLE ANALYTICS DATA
-- =====================================================

-- Sample RAG analytics events
INSERT INTO public.rag_analytics (
    event_type,
    user_id,
    tool_id,
    stage,
    complexity_level,
    response_time_ms,
    knowledge_documents_count,
    confidence_score,
    event_data
) VALUES 
(
    'prompt_generated',
    '00000000-0000-0000-0000-000000000001'::UUID,
    'lovable',
    'blueprint',
    'intermediate',
    1250,
    3,
    0.85,
    '{"app_name": "Task Manager", "platforms": ["web"], "success": true}'::jsonb
),
(
    'knowledge_retrieved',
    '00000000-0000-0000-0000-000000000001'::UUID,
    'lovable',
    'screen_prompts',
    'intermediate',
    450,
    2,
    0.78,
    '{"query": "react component patterns", "documents_found": 2}'::jsonb
),
(
    'tool_recommended',
    '00000000-0000-0000-0000-000000000002'::UUID,
    'v0',
    'idea_validation',
    'beginner',
    200,
    1,
    0.92,
    '{"recommended_tool": "v0", "reason": "beginner_friendly", "confidence": 0.92}'::jsonb
);

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Verify sample data was inserted correctly
SELECT 'Knowledge Base Documents' as data_type, COUNT(*) as count 
FROM public.rag_knowledge_base 
WHERE review_status = 'approved'

UNION ALL

SELECT 'User Preferences' as data_type, COUNT(*) as count 
FROM public.rag_user_preferences

UNION ALL

SELECT 'Analytics Events' as data_type, COUNT(*) as count 
FROM public.rag_analytics

UNION ALL

SELECT 'Tool Profiles' as data_type, COUNT(*) as count 
FROM public.rag_tool_profiles 
WHERE is_active = true;

-- =====================================================
-- 5. CLEANUP COMMANDS (FOR DEVELOPMENT)
-- =====================================================

-- Uncomment these if you need to clean up sample data:

-- DELETE FROM public.rag_analytics WHERE user_id IN (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     '00000000-0000-0000-0000-000000000002'::UUID
-- );

-- DELETE FROM public.rag_user_preferences WHERE user_id IN (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     '00000000-0000-0000-0000-000000000002'::UUID
-- );

-- DELETE FROM public.rag_knowledge_base WHERE title IN (
--     'React Component Best Practices',
--     'Supabase Authentication Setup',
--     'Tailwind CSS Responsive Design Patterns',
--     'Next.js App Router Best Practices'
-- );

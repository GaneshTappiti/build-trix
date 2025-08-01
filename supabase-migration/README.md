# Supabase Migration for MVP Studio

This folder contains properly organized SQL queries for migrating the MVP Studio application to Supabase. Each function has its own dedicated SQL file for better organization and error-free implementation.

## 📁 Folder Structure

```
supabase-migration/
├── README.md                          # This file
├── 01-schema/                         # Database schema files
│   ├── 01-core-tables.sql            # Core application tables
│   ├── 02-rag-tables.sql             # RAG system tables
│   ├── 03-indexes.sql                # Performance indexes
│   ├── 04-rls-policies.sql           # Row Level Security
│   └── 05-triggers-functions.sql     # Database functions and triggers
├── 02-functions/                      # Database functions by category
│   ├── auth/                         # Authentication functions
│   ├── mvp/                          # MVP management functions
│   ├── rag/                          # RAG system functions
│   ├── analytics/                    # Analytics functions
│   └── rate-limiting/                # Rate limiting functions
├── 03-api-queries/                   # API endpoint specific queries
│   ├── mvp-studio/                   # MVP Studio API queries
│   ├── mvps/                         # MVP CRUD operations
│   ├── rag/                          # RAG API queries
│   └── auth/                         # Authentication queries
└── 04-seed-data/                     # Initial data seeding
    ├── tool-profiles.sql             # RAG tool profiles
    └── sample-data.sql               # Sample data for testing
```

## 🚀 Migration Steps

### 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Note down your project URL and anon key

### 2. Run Schema Migration
Execute the schema files in order:
```sql
-- 1. Core tables
\i 01-schema/01-core-tables.sql

-- 2. RAG tables
\i 01-schema/02-rag-tables.sql

-- 3. Indexes
\i 01-schema/03-indexes.sql

-- 4. RLS Policies
\i 01-schema/04-rls-policies.sql

-- 5. Functions and Triggers
\i 01-schema/05-triggers-functions.sql
```

### 3. Install Database Functions
Execute function files by category as needed:
```sql
-- Authentication functions
\i 02-functions/auth/user-management.sql

-- MVP functions
\i 02-functions/mvp/crud-operations.sql
\i 02-functions/mvp/studio-operations.sql

-- RAG functions
\i 02-functions/rag/knowledge-base.sql
\i 02-functions/rag/prompt-generation.sql

-- Analytics functions
\i 02-functions/analytics/event-tracking.sql

-- Rate limiting functions
\i 02-functions/rate-limiting/rate-limit-management.sql
```

### 4. Seed Initial Data
```sql
-- Tool profiles for RAG system
\i 04-seed-data/tool-profiles.sql

-- Sample data (optional, for development)
\i 04-seed-data/sample-data.sql
```

### 5. Environment Configuration
Update your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔧 Function Categories

### Authentication Functions
- User profile management
- Session handling
- OAuth integration

### MVP Management Functions
- CRUD operations for MVPs
- MVP Studio workflow
- Project status management
- Questionnaire handling

### RAG System Functions
- Knowledge base management
- Prompt generation
- Tool profile management
- Vector search operations

### Analytics Functions
- Event tracking
- Usage analytics
- Performance metrics

### Rate Limiting Functions
- Request rate limiting
- Usage quota management
- Subscription tier enforcement

## 📊 Key Features

- **Row Level Security (RLS)**: All tables have proper RLS policies
- **Performance Optimized**: Comprehensive indexing strategy
- **Error Handling**: Proper error handling in all functions
- **Type Safety**: Strong typing with PostgreSQL constraints
- **Scalable**: Designed for production use
- **Maintainable**: Well-organized and documented code

## 🔍 Testing

After migration, test the following:
1. User authentication and profile creation
2. MVP creation and management
3. RAG system functionality
4. Rate limiting enforcement
5. Analytics event tracking

## 📝 Notes

- All functions include proper error handling
- RLS policies ensure data security
- Indexes are optimized for common query patterns
- Functions are designed to work with the Next.js API routes
- Compatible with Supabase's PostgreSQL version

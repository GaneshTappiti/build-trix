# MVP Studio Database Migration Guide

This folder contains all the SQL scripts needed to set up and manage the MVP Studio database.

## 📁 Folder Structure

```
database/
├── README.md                    # This file - migration guide
├── migrations/                  # Database schema migrations
│   ├── 001_initial_schema.sql   # Core tables and structure
│   ├── 002_indexes.sql          # Performance indexes
│   ├── 003_rls_policies.sql     # Row Level Security policies
│   ├── 004_triggers.sql         # Database triggers and functions
│   └── 005_seed_data.sql        # Initial seed data (optional)
├── queries/                     # Organized query collections
│   ├── user_management.sql      # User profile and auth queries
│   ├── mvp_operations.sql       # MVP CRUD operations
│   ├── mvp_studio.sql           # MVP Studio specific queries
│   ├── analytics.sql            # Analytics and reporting queries
│   ├── rate_limiting.sql        # Rate limiting queries
│   └── maintenance.sql          # Cleanup and maintenance queries
├── views/                       # Database views for complex queries
│   ├── user_dashboard.sql       # Dashboard data views
│   ├── mvp_analytics.sql        # MVP analytics views
│   └── reporting.sql            # Reporting views
└── procedures/                  # Stored procedures and functions
    ├── rate_limit_functions.sql # Rate limiting functions
    ├── analytics_functions.sql  # Analytics helper functions
    └── maintenance_functions.sql # Maintenance procedures
```

## 🚀 Migration Instructions

### Step 1: Run Migrations in Order

Execute the migration files in the `migrations/` folder in numerical order:

```bash
# 1. Create core tables and structure
psql -d your_database -f migrations/001_initial_schema.sql

# 2. Add performance indexes
psql -d your_database -f migrations/002_indexes.sql

# 3. Set up Row Level Security
psql -d your_database -f migrations/003_rls_policies.sql

# 4. Create triggers and functions
psql -d your_database -f migrations/004_triggers.sql

# 5. (Optional) Add seed data
psql -d your_database -f migrations/005_seed_data.sql
```

### Step 2: Create Views

```bash
# Create dashboard views
psql -d your_database -f views/user_dashboard.sql
psql -d your_database -f views/mvp_analytics.sql
psql -d your_database -f views/reporting.sql
```

### Step 3: Add Stored Procedures

```bash
# Add helper functions
psql -d your_database -f procedures/rate_limit_functions.sql
psql -d your_database -f procedures/analytics_functions.sql
psql -d your_database -f procedures/maintenance_functions.sql
```

## 📋 Prerequisites

- PostgreSQL 12+ (recommended 14+)
- Supabase account (if using Supabase)
- Database admin privileges

## 🔧 Environment Setup

### For Supabase:
1. Create a new Supabase project
2. Go to SQL Editor in Supabase Dashboard
3. Run each migration file in order
4. Enable Row Level Security in Authentication settings

### For Self-hosted PostgreSQL:
1. Create a new database
2. Ensure you have superuser privileges
3. Run migrations using psql or your preferred SQL client

## 📊 Key Features

### Core Tables:
- **user_profiles** - Extended user information
- **mvps** - MVP projects with full Studio data
- **questionnaire** - Validation questionnaires
- **mvp_studio_sessions** - Auto-save sessions
- **feedback** - User feedback system
- **analytics_events** - Usage analytics
- **rate_limits** - Rate limiting tracking

### Security Features:
- Row Level Security (RLS) on all tables
- User-specific data isolation
- Secure API access patterns

### Performance Features:
- Optimized indexes for common queries
- Efficient pagination support
- Analytics-friendly data structure

## 🔍 Testing the Migration

After running all migrations, test with these queries:

```sql
-- Test user profile creation
SELECT * FROM public.user_profiles LIMIT 1;

-- Test MVP table structure
\d public.mvps

-- Test RLS policies
SELECT * FROM public.mvps WHERE user_id = 'test-user-id';

-- Test indexes
\di public.*
```

## 🛠 Troubleshooting

### Common Issues:

1. **Permission Errors**: Ensure you have proper database privileges
2. **RLS Blocking Queries**: Check if you're authenticated properly
3. **Missing Extensions**: Some features may require PostgreSQL extensions

### Rollback Instructions:

If you need to rollback:

```sql
-- Drop all tables (WARNING: This will delete all data)
DROP TABLE IF EXISTS public.rate_limits CASCADE;
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.mvp_studio_sessions CASCADE;
DROP TABLE IF EXISTS public.questionnaire CASCADE;
DROP TABLE IF EXISTS public.mvps CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
```

## 📞 Support

If you encounter issues:
1. Check the PostgreSQL logs
2. Verify your database version compatibility
3. Ensure all prerequisites are met
4. Review the error messages carefully

## 🔄 Updates and Maintenance

- Run maintenance queries monthly (see `queries/maintenance.sql`)
- Monitor performance with analytics queries
- Update indexes as data grows
- Regular backups recommended

---

**Note**: Always backup your database before running migrations in production!

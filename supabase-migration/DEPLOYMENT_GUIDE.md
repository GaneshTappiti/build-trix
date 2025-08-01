# MVP Studio - Supabase Deployment Guide

This guide will walk you through deploying the MVP Studio application to Supabase with all the necessary database migrations, functions, and configurations.

## 📋 Prerequisites

- Supabase account ([Sign up here](https://supabase.com))
- Node.js 18+ installed
- Git repository access
- Environment variables ready

## 🚀 Step-by-Step Deployment

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `mvp-studio-production` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project initialization (2-3 minutes)

### 2. Configure Environment Variables

Create or update your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

**To find your keys:**
1. Go to Project Settings → API
2. Copy the Project URL and anon public key
3. Copy the service_role secret key (keep this secure!)

### 3. Run Database Migration

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migration files in this exact order:

```sql
-- 1. Core migration (creates all tables)
-- Copy and paste content from: migrate.sql

-- 2. Create indexes for performance
-- Copy and paste content from: 01-schema/03-indexes.sql

-- 3. Set up Row Level Security
-- Copy and paste content from: 01-schema/04-rls-policies.sql

-- 4. Create functions and triggers
-- Copy and paste content from: 01-schema/05-triggers-functions.sql

-- 5. Add user management functions
-- Copy and paste content from: 02-functions/auth/user-management.sql

-- 6. Add MVP CRUD functions
-- Copy and paste content from: 02-functions/mvp/crud-operations.sql

-- 7. Seed tool profiles
-- Copy and paste content from: 04-seed-data/tool-profiles.sql

-- 8. (Optional) Add sample data for testing
-- Copy and paste content from: 04-seed-data/sample-data.sql
```

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

### 4. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure **Site URL**: `https://your-domain.com`
3. Add **Redirect URLs**:
   - `https://your-domain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

#### Enable OAuth Providers (Optional)

1. Go to **Authentication** → **Providers**
2. Enable desired providers (Google, GitHub, etc.)
3. Configure OAuth credentials

### 5. Set Up Row Level Security

The migration scripts automatically enable RLS, but verify:

1. Go to **Database** → **Tables**
2. Check that all tables show "RLS enabled"
3. Verify policies are created under each table

### 6. Configure Storage (If needed)

If your app uses file uploads:

1. Go to **Storage**
2. Create buckets as needed:
   - `avatars` (for user profile pictures)
   - `exports` (for generated files)
   - `feedback-attachments` (for feedback screenshots)

### 7. Deploy Your Application

#### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

#### Netlify Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=.next
```

### 8. Verify Deployment

1. **Test Authentication**:
   - Sign up with a new account
   - Verify user profile is created
   - Check user appears in `auth.users` and `public.user_profiles`

2. **Test MVP Creation**:
   - Create a new MVP
   - Verify it appears in database
   - Check rate limiting works

3. **Test RAG System**:
   - Generate a prompt
   - Verify knowledge base search works
   - Check analytics are recorded

4. **Test API Endpoints**:
   ```bash
   # Test MVP API
   curl -X GET "https://your-domain.com/api/mvps" \
     -H "Authorization: Bearer your-jwt-token"
   
   # Test RAG API
   curl -X POST "https://your-domain.com/api/rag/generate-prompt" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your-jwt-token" \
     -d '{"appIdea": {...}, "validationQuestions": {...}}'
   ```

## 🔧 Post-Deployment Configuration

### 1. Set Up Monitoring

1. **Supabase Dashboard**:
   - Monitor database performance
   - Check API usage
   - Review error logs

2. **Application Monitoring**:
   - Set up error tracking (Sentry, LogRocket)
   - Monitor performance metrics
   - Set up uptime monitoring

### 2. Configure Backups

1. Go to **Database** → **Backups**
2. Enable automatic backups
3. Set backup retention period
4. Test backup restoration

### 3. Set Up Alerts

1. **Database Alerts**:
   - High CPU usage
   - Connection limits
   - Storage usage

2. **Application Alerts**:
   - Error rate thresholds
   - Response time alerts
   - User signup notifications

### 4. Performance Optimization

1. **Database Optimization**:
   - Monitor slow queries
   - Add indexes as needed
   - Optimize RLS policies

2. **Application Optimization**:
   - Enable caching
   - Optimize bundle size
   - Configure CDN

## 🔒 Security Checklist

- [ ] RLS enabled on all tables
- [ ] Service role key secured
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] HTTPS enforced

## 📊 Monitoring & Maintenance

### Daily Checks
- [ ] Application uptime
- [ ] Error rates
- [ ] Database performance

### Weekly Checks
- [ ] User growth metrics
- [ ] Feature usage analytics
- [ ] Performance trends

### Monthly Checks
- [ ] Security updates
- [ ] Backup verification
- [ ] Cost optimization
- [ ] User feedback review

## 🆘 Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Check redirect URLs
   - Verify JWT configuration
   - Check RLS policies

2. **Database Connection Issues**:
   - Verify connection strings
   - Check connection limits
   - Review firewall settings

3. **API Errors**:
   - Check environment variables
   - Verify function deployments
   - Review error logs

4. **Performance Issues**:
   - Check database indexes
   - Monitor query performance
   - Review caching strategy

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## 📈 Scaling Considerations

### Database Scaling
- Monitor connection usage
- Consider read replicas
- Plan for data archiving

### Application Scaling
- Implement caching layers
- Use CDN for static assets
- Consider serverless functions

### Cost Optimization
- Monitor usage metrics
- Optimize query performance
- Review subscription tiers

---

## 🎉 Deployment Complete!

Your MVP Studio application should now be fully deployed and functional. Monitor the application closely for the first few days and be prepared to make adjustments based on real-world usage patterns.

For ongoing support and updates, refer to the project documentation and community resources.

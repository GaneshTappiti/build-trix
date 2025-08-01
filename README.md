# BuildTrix - MVP Studio

A comprehensive platform that transforms app ideas into implementation-ready prompts through an AI-powered 6-stage process. Build your MVP faster with intelligent blueprint generation and optimized prompts for popular AI development tools.

## 🚀 Features

- **6-Stage Builder Process**: From idea to implementation-ready prompts
- **AI-Powered Blueprint Generation**: Automatic app structure creation
- **Multi-Platform Support**: Web and mobile app development
- **Design Style Options**: Minimal, Playful, or Business themes
- **Export to AI Tools**: Optimized prompts for Cursor, v0.dev, Claude, ChatGPT, etc.
- **Project Management**: Auto-save, history, and progress tracking
- **Responsive Design**: Works on desktop and mobile

## 🎯 Live Demo

[Add your deployed URL here]

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: React Context + useReducer
- **Database**: Supabase
- **AI Integration**: Google AI API
- **Storage**: Local Storage for persistence
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google AI API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/buildtrix-mvp-studio.git
   cd buildtrix-mvp-studio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Site Configuration
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   # Upstash Redis Configuration (for rate limiting)
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token

   # Google AI (for MVP generation)
   GOOGLE_AI_API_KEY=your_google_ai_key
   ```

4. **Set up the database:**
   Follow the [Database Migration Guide](./supabase-migration/README.md) to set up your Supabase database with all required tables, functions, and seed data.

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📱 How to Use MVP Studio

### Step 1: Access MVP Studio
- Navigate to "MVP Studio" in the main sidebar
- Click to access the studio directly

### Step 2: Start Building
Follow the 6-stage process:

#### 🧠 Stage 1: Tool-Adaptive Engine
- Define your app name and description
- Select target platforms (Web/Mobile)
- Choose design style (Minimal/Playful/Business)

#### 💡 Stage 2: Idea Interpreter
- Validate your idea with market research questions
- Share your motivation for building the app

#### 🏗️ Stage 3: App Skeleton Generator
- AI generates comprehensive app blueprint
- Review screens, user roles, and data models

#### 🪄 Stage 4: Prompt Generator
- Generate detailed implementation prompts for each screen
- Get specific layout, component, and behavior instructions

#### 🌊 Stage 5: Flow Description
- Define navigation flow and user journey
- Set up conditional routing and screen transitions

#### 📤 Stage 6: Export Composer
- Choose your target AI tool (Cursor, v0.dev, Claude, etc.)
- Generate optimized prompts for implementation

## 🏗️ Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (authenticated)/   # Protected pages
│   │   └── mvp-studio/    # MVP Studio interface
│   ├── (public)/          # Public pages
│   ├── api/               # API routes
│   └── auth/              # Auth configuration
├── components/            # React components
│   ├── ai-tools/         # AI tool integrations
│   ├── builder-cards/    # MVP builder components
│   ├── prompts/          # Prompt management
│   ├── rag/              # RAG system components
│   ├── sidebar/          # Navigation components
│   ├── storage/          # Storage components
│   └── ui/               # UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── scripts/               # Build and deployment scripts
├── supabase-migration/    # Database migration files
│   ├── 01-schema/        # Database schema
│   ├── 02-functions/     # Database functions
│   ├── 03-api-queries/   # API-specific queries
│   └── 04-seed-data/     # Initial data
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## 📊 Database Migration

The project includes a comprehensive database migration system in the `supabase-migration/` folder:

### Migration Structure
- **01-schema/**: Core tables, indexes, RLS policies, and functions
- **02-functions/**: Database functions organized by feature
- **03-api-queries/**: Optimized queries for each API endpoint
- **04-seed-data/**: Initial data including RAG tool profiles

### Key Features
- ✅ **Complete Schema**: All tables for MVP management, RAG system, analytics
- ✅ **Performance Optimized**: Strategic indexes for common query patterns
- ✅ **Security First**: Row Level Security on all tables
- ✅ **Production Ready**: Proper constraints, validation, and error handling

See the [Migration README](./supabase-migration/README.md) and [Deployment Guide](./supabase-migration/DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🎨 Key Components

### Builder Context (`lib/builderContext.tsx`)
- Comprehensive state management for the 6-stage process
- Auto-save functionality and project history
- TypeScript interfaces for all data structures

### Six-Stage Cards (`components/builder-cards/`)
- **AppIdeaCard**: App concept definition
- **ValidationCard**: Idea validation and motivation
- **BlueprintCard**: AI-powered app structure generation
- **PromptGeneratorCard**: Detailed implementation prompts
- **FlowDescriptionCard**: Navigation flow definition
- **ExportComposerCard**: Final prompt generation

### Workspace Infrastructure
- **WorkspaceSidebar**: Navigation for all workspace modules
- **SixStageArchitecture**: Main orchestration component

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository to Vercel**
2. **Add environment variables in Vercel dashboard**
3. **Deploy automatically on push to main branch**

### Other Platforms

The app can be deployed on:
- Netlify
- Railway
- Render
- Any Node.js hosting platform

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `NEXT_PUBLIC_SITE_URL` | Your site URL | ✅ |
| `UPSTASH_REDIS_REST_URL` | Redis URL for rate limiting | ✅ |
| `UPSTASH_REDIS_REST_TOKEN` | Redis token | ✅ |
| `GOOGLE_AI_API_KEY` | Google AI API key | ✅ |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Database by [Supabase](https://supabase.com/)
- AI powered by [Google AI](https://ai.google.dev/)

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact: [your-email@example.com]

---

**Built with ❤️ for the developer community**

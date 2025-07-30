# BuildTrix - MVP Studio

**The complete replacement for the traditional MVP Generator**

A comprehensive platform that transforms app ideas into implementation-ready prompts through an AI-powered 6-stage process. Build your MVP faster with intelligent blueprint generation and optimized prompts for popular AI development tools.

> **Note**: MVP Studio has replaced the previous MVP Generator, offering a much more comprehensive and powerful approach to MVP development.

## 🚀 Features

- **6-Stage Builder Process**: From idea to implementation-ready prompts
- **AI-Powered Blueprint Generation**: Automatic app structure creation
- **Multi-Platform Support**: Web and mobile app development
- **Design Style Options**: Minimal, Playful, or Business themes
- **Export to AI Tools**: Optimized prompts for Cursor, v0.dev, Claude, ChatGPT, etc.
- **Project Management**: Auto-save, history, and progress tracking
- **Responsive Design**: Works on desktop and mobile

## 🏗️ Architecture

### Core Components

1. **Builder Context** (`lib/builderContext.tsx`)
   - State management for the entire 6-stage process
   - Auto-save functionality
   - Project history management
   - Validation and error handling

2. **Six-Stage Cards** (`components/builder-cards/`)
   - `AppIdeaCard`: App concept definition
   - `ValidationCard`: Idea validation and motivation
   - `BlueprintCard`: AI-powered app structure generation
   - `PromptGeneratorCard`: Detailed implementation prompts
   - `FlowDescriptionCard`: Navigation flow definition
   - `ExportComposerCard`: Final prompt generation

3. **Workspace Infrastructure**
   - `WorkspaceSidebar`: Navigation for all workspace modules
   - `SixStageArchitecture`: Main orchestration component
   - Responsive layout with collapsible sidebar

## 🐳 Docker Setup

### Prerequisites

Install Docker following the official documentation at https://docker.com/get-started/

### Quick Start with Docker

1. **Pull Node.js Docker image:**
   ```bash
   docker pull node:22-alpine
   ```

2. **Build and run the application:**
   ```bash
   # Production build
   docker-compose up buildtrix

   # Development with hot reloading
   docker-compose --profile dev up buildtrix-dev
   ```

3. **Access the application:**
   - Production: http://localhost:3000
   - Development: http://localhost:3001

### Manual Docker Commands

```bash
# Build the Docker image
docker build -t buildtrix-mvp-studio .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://oyniuuxkksxinbrxyvxp.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key \
  -e NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
  -e UPSTASH_REDIS_REST_URL=your_redis_url \
  -e UPSTASH_REDIS_REST_TOKEN=your_redis_token \
  -e GOOGLE_AI_API_KEY=your_google_ai_key \
  buildtrix-mvp-studio
```

### Development with Docker

```bash
# Build development image
docker build -f Dockerfile.dev -t buildtrix-dev .

# Run development container with volume mounting
docker run -p 3000:3000 -v $(pwd):/app -v /app/node_modules buildtrix-dev
```

## 🛠️ Local Development (without Docker)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local` with the provided configuration

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## 📱 How to Use MVP Studio

### Step 1: Access MVP Studio
- Navigate to "Workspace" in the main sidebar
- Click on "MVP Studio"

### Step 2: Start Building
- Click "New Project" or "Start Building"
- Follow the 6-stage process:

#### Stage 1: Tool-Adaptive Engine
- Define your app name and description
- Select target platforms (Web/Mobile)
- Choose design style (Minimal/Playful/Business)
- Add style preferences and target audience

#### Stage 2: Idea Interpreter
- Validate your idea with market research questions
- Share your motivation for building the app
- Get personalized insights based on your answers

#### Stage 3: App Skeleton Generator
- AI generates comprehensive app blueprint
- Review screens, user roles, and data models
- See suggested architecture patterns

#### Stage 4: Prompt Generator
- Generate detailed implementation prompts for each screen
- Get specific layout, component, and behavior instructions
- Copy individual screen prompts or full implementation guide

#### Stage 5: Flow Description
- Define navigation flow and user journey
- Set up conditional routing and back button behavior
- Configure screen transitions and modal logic

#### Stage 6: Export Composer
- Choose your target AI tool (Cursor, v0.dev, Claude, etc.)
- Generate optimized prompts for your chosen tool
- Export unified prompt or screen-by-screen instructions

### Step 3: Implement with AI Tools
- Copy the generated prompts
- Paste into your chosen AI development tool
- Follow the implementation guidance

## 🔧 Technical Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: React Context + useReducer
- **Storage**: Local Storage for persistence
- **Icons**: Lucide React
- **Database**: Supabase (for user management)
- **AI Integration**: Google AI API

## 🎯 Key Features

- **Auto-save**: Projects save automatically as you progress
- **Project History**: Access and continue previous projects
- **Validation**: Real-time form validation and error handling
- **Progress Tracking**: Visual progress indicators
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Full dark mode support
- **Export Options**: Multiple AI tool integrations

## 🚀 Deployment

The application is ready for deployment on platforms like:
- Vercel (recommended for Next.js)
- Netlify
- Docker containers
- Any Node.js hosting platform

## 📝 Environment Variables

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=your_site_url
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
GOOGLE_AI_API_KEY=your_google_ai_key
```

## 🤝 Contributing

The MVP Studio is now fully integrated into the BuildTrix platform. Future enhancements could include:
- Real-time collaboration features
- More AI tool integrations
- Custom template creation
- Advanced blueprint customization
- Team project sharing

---

The MVP Studio implementation is complete and ready for use! 🎉

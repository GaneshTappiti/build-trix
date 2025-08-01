# RAG Integration for MVP Studio

This document describes the complete integration of the RAG (Retrieval-Augmented Generation) system from [GaneshTappiti/RAG](https://github.com/GaneshTappiti/RAG.git) into your MVP Studio, enhancing the prompt generation capabilities with AI-powered optimization.

## Overview

The RAG integration transforms your existing MVP Studio from a template-based prompt generator into an intelligent system that creates optimized, tool-specific prompts. **Your existing workflow remains unchanged** - the RAG system works behind the scenes to enhance prompt quality.

## ✅ What's Been Integrated

### Core RAG System
- **Full RAG Engine**: Complete TypeScript port of the Python RAG system
- **Template System**: Jinja2-style templates converted to TypeScript
- **Tool Profiles**: All 6 AI tools with their specific configurations
- **Validation System**: Prompt quality scoring and suggestions
- **Enhancement Engine**: AI-powered prompt optimization using Gemini

### Seamless Integration
- **Zero Breaking Changes**: Your existing MVP Studio workflow works exactly as before
- **Enhanced Prompts**: All generated prompts are now RAG-optimized automatically
- **Fallback System**: If RAG fails, falls back to your original prompt generation
- **Tool Detection**: Automatically detects the best AI tool based on project context

## 🔄 How It Works

### Your Existing Workflow (Unchanged)
1. User fills out MVP Studio forms (app idea, validation questions, etc.)
2. User clicks "Generate MVP"
3. System generates prompts using your existing logic
4. **NEW**: RAG system enhances the prompts behind the scenes
5. User receives improved, tool-specific prompts

### RAG Enhancement Process
1. **Context Analysis**: RAG analyzes your app idea, platforms, design style, etc.
2. **Tool Detection**: Automatically selects the best AI tool (Lovable, Cursor, v0, etc.)
3. **Template Selection**: Chooses the appropriate prompt template for the detected tool
4. **AI Enhancement**: Uses Gemini AI to further optimize the prompt
5. **Quality Validation**: Scores the prompt and provides improvement suggestions
6. **Fallback Safety**: If anything fails, returns your original prompt

## 🛠️ Supported AI Tools (From Original RAG Repo)

| Tool | Category | Complexity | Best For | RAG Optimizations |
|------|----------|------------|----------|-------------------|
| **Lovable.dev** | UI Generator | Intermediate | Full-stack web apps, React projects | C.L.E.A.R. framework, Supabase integration, Knowledge Base usage |
| **Cursor** | Code Editor | Intermediate | Code editing, refactoring, complex logic | File-specific context, incremental changes, code analysis |
| **v0.dev** | UI Generator | Beginner | UI components, React interfaces | Component-focused, design-oriented, accessibility |
| **Bolt.new** | Web IDE | Beginner | Web applications, rapid prototyping | WebContainer-aware, browser limitations, instant preview |
| **Claude** | AI Assistant | Beginner | Code generation, problem solving | Conversational, explanatory, step-by-step guidance |
| **ChatGPT** | AI Assistant | Beginner | Code generation, debugging | Educational, practical examples, learning-focused |

## 📁 Integration Files

### New Files Added
```
lib/
├── rag-integration.ts      # Full RAG system (TypeScript port)
├── rag-enhancer.ts         # Integration with existing MVP Studio
└── rag-service.ts          # Original RAG service (kept for reference)

app/api/rag/
└── generate-prompt/
    └── route.ts            # RAG API endpoint

hooks/
└── useRAG.ts              # React hook for RAG functionality

types/
└── rag.ts                 # TypeScript definitions

sql/
└── rag-schema.sql         # Database schema for analytics

docs/
└── RAG_INTEGRATION.md     # This documentation

test-rag-integration.js    # Test script
```

### Modified Files
```
build-trix-main/app/api/generate-mvp/route.ts  # Enhanced with RAG
```

## Architecture

### Core Components

1. **RAG Service** (`lib/rag-service.ts`)
   - Main prompt generation engine
   - Tool profile management
   - Strategy optimization

2. **RAG Types** (`types/rag.ts`)
   - TypeScript definitions for RAG system
   - Tool profiles and prompt strategies
   - Integration interfaces

3. **RAG Hook** (`hooks/useRAG.ts`)
   - React hook for RAG functionality
   - API integration
   - Error handling

4. **API Endpoint** (`app/api/rag/generate-prompt/route.ts`)
   - RESTful API for prompt generation
   - Authentication and validation
   - Analytics logging

### Database Schema

The RAG system uses three main tables:

- **`rag_prompt_generations`**: Logs all prompt generations for analytics
- **`rag_tool_profiles`**: Stores AI tool configurations and strategies
- **`rag_user_preferences`**: User preferences and usage statistics

## Integration Points

### Stage 2: Idea Interpreter
- Added AI tool selection interface
- Project complexity assessment
- Technical experience evaluation
- Enhanced validation with RAG preferences

### Stage 6: Export Composer
- RAG-enhanced prompt generation
- Tool-specific optimizations
- Quality scoring and suggestions
- Confidence metrics display

## Usage Examples

### Basic RAG Prompt Generation

```typescript
import { useRAG, createRAGRequest } from '@/hooks/useRAG';
import { SupportedTool, PromptStage } from '@/types/rag';

const { generatePrompt, isGenerating } = useRAG();

const ragRequest = createRAGRequest(
  appIdea,
  validationQuestions,
  SupportedTool.LOVABLE,
  PromptStage.APP_SKELETON
);

const result = await generatePrompt(ragRequest);
```

### Tool-Specific Prompt Generation

```typescript
// For Lovable.dev - Structured approach with C.L.E.A.R. framework
const lovablePrompt = await generatePrompt({
  ...ragRequest,
  targetTool: SupportedTool.LOVABLE,
  stage: PromptStage.APP_SKELETON
});

// For Cursor - Code-focused approach
const cursorPrompt = await generatePrompt({
  ...ragRequest,
  targetTool: SupportedTool.CURSOR,
  stage: PromptStage.FEATURE_SPECIFIC
});
```

## Configuration

### Environment Variables

```bash
# Required for RAG functionality
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key (optional)

# Database configuration (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup

1. Run the RAG schema migration:
```sql
-- Execute sql/rag-schema.sql in your Supabase database
```

2. Seed initial tool profiles:
```sql
-- Tool profiles are automatically seeded via the schema file
```

## Prompt Engineering Strategies

### Lovable.dev Strategy
- **C.L.E.A.R. Framework**: Context, Logic, Examples, Actions, Results
- **Knowledge Base Integration**: Leverages Lovable's knowledge base
- **Incremental Development**: Supports iterative development approach

### Cursor Strategy
- **Code Context Focus**: Emphasizes existing code context
- **Incremental Editing**: Supports file-based editing workflow
- **Explicit Instructions**: Clear, actionable code modifications

### v0.dev Strategy
- **Component-Focused**: Emphasizes UI component creation
- **Design-Oriented**: Visual design and interaction focus
- **Accessibility**: Built-in accessibility considerations

## Performance Optimization

### Caching Strategy
- Tool profiles cached in memory
- User preferences cached per session
- Prompt templates pre-compiled

### Quality Metrics
- **Confidence Scoring**: 0.0 to 1.0 based on context completeness
- **Enhancement Suggestions**: AI-generated improvement recommendations
- **Success Tracking**: Monitor prompt effectiveness

## 🚀 Setup Instructions

### 1. Environment Variables
Your existing environment should work, but ensure you have:
```bash
# Required for RAG AI enhancement
GEMINI_API_KEY=your_gemini_api_key

# Your existing Supabase config (unchanged)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Setup (Optional)
For analytics and logging, run the RAG schema:
```sql
-- Execute sql/rag-schema.sql in your Supabase database
-- This is optional - RAG works without it
```

### 3. Test the Integration
```bash
# Start your development server
npm run dev

# Run the test script
node test-rag-integration.js
```

## 🧪 Testing

### Quick Test
```bash
# Test the RAG integration
node test-rag-integration.js
```

### Manual Testing
1. Go to your MVP Studio
2. Fill out the form as usual
3. Click "Generate MVP"
4. Notice the enhanced prompts (they should be longer and more tool-specific)

### Comparison Test
1. **Before RAG**: Your original prompts were general
2. **After RAG**: Prompts are now tool-specific with detailed guidelines

### Test Coverage
- ✅ All 6 AI tools (Lovable, Cursor, v0, Bolt, Claude, ChatGPT)
- ✅ Prompt quality scoring (0-100)
- ✅ Enhancement suggestions
- ✅ Fallback to original prompts if RAG fails
- ✅ Error handling and edge cases

## Monitoring and Analytics

### Key Metrics
- Prompt generation success rate
- Average confidence scores
- Tool usage distribution
- User satisfaction indicators

### Dashboard Queries
```sql
-- Average confidence score by tool
SELECT target_tool, AVG(confidence_score) as avg_confidence
FROM rag_prompt_generations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY target_tool;

-- Most popular tools
SELECT target_tool, COUNT(*) as usage_count
FROM rag_prompt_generations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY target_tool
ORDER BY usage_count DESC;
```

## Future Enhancements

### Planned Features
- **Vector Database Integration**: Semantic search for better context retrieval
- **Custom Tool Profiles**: User-defined tool configurations
- **A/B Testing**: Compare prompt strategies for optimization
- **Multi-Language Support**: Support for different programming languages
- **Real-time Collaboration**: Shared prompt generation sessions

### Roadmap
- **Q1 2024**: Vector database integration
- **Q2 2024**: Custom tool profiles and advanced analytics
- **Q3 2024**: Multi-language support and collaboration features
- **Q4 2024**: AI-powered prompt optimization and learning

## Troubleshooting

### Common Issues

1. **Low Confidence Scores**
   - Ensure complete project context
   - Add more technical requirements
   - Verify tool selection matches project type

2. **Generation Failures**
   - Check API key configuration
   - Verify database connectivity
   - Review error logs in browser console

3. **Performance Issues**
   - Monitor database query performance
   - Check API response times
   - Optimize tool profile caching

### Debug Mode

Enable debug logging:
```typescript
// In development environment
localStorage.setItem('rag-debug', 'true');
```

## Contributing

When contributing to the RAG system:

1. **Add New Tools**: Update `types/rag.ts` and `lib/rag-service.ts`
2. **Enhance Strategies**: Modify tool profiles in the service
3. **Improve Quality**: Add new quality metrics and scoring algorithms
4. **Test Coverage**: Ensure comprehensive test coverage for new features

## 🎯 Benefits You'll See

### Immediate Improvements
- **Better Prompts**: Tool-specific optimizations for each AI platform
- **Higher Success Rate**: Prompts that work better with each tool's strengths
- **Detailed Guidelines**: Specific technical requirements and best practices
- **Quality Scoring**: Know how good your prompts are (0-100 score)

### Example: Lovable.dev Enhancement
**Before RAG:**
```
Build a task management app with React and a database.
```

**After RAG:**
```
# Build Web Application - TaskMaster Pro

You are a skilled AI development assistant on **Lovable.dev**.

**Tone:** official yet casual
**Output Format:** markdown

## Project Overview
**Name:** TaskMaster Pro
**Description:** A comprehensive task management application for small teams
**Technology Stack:** React, TypeScript, Tailwind CSS, Supabase, shadcn/ui
**Target Audience:** Small business teams and freelancers

## Task Details
**Type:** build web application
**Description:** A comprehensive task management application...

### Technical Requirements
- Web application development
- Responsive design for desktop and mobile
- Modern web technologies (HTML5, CSS3, JavaScript)
- Modular code structure
- Basic state management
- Error handling

### UI/UX Requirements
- Clean, minimal design
- Plenty of whitespace
- Simple color palette
- Typography-focused layout
- Accessibility compliance (WCAG 2.1)
- Cross-browser compatibility

### Constraints
- Web-only implementation
- Follow modern web standards
- Ensure security best practices
- Optimize for performance

## Guidelines Summary
Follow Lovable.dev best practices:
- Use React with TypeScript for all components
- Integrate Supabase for backend functionality
- Style with Tailwind CSS and shadcn/ui components
- Implement responsive, mobile-first design
- Follow accessibility best practices
- Use the Knowledge Base feature extensively
- Leverage Chat mode for complex planning

## Expected Output
Provide a clear, formatted Lovable.dev prompt that:
- Defines the context and scope clearly
- Gives specific, actionable requirements
- Includes responsive design considerations
- Follows accessibility best practices
- Avoids vague language and ensures structure is clean
- Includes proper error handling and loading states

**Remember:** Follow Lovable.dev's best practices for modern web development. Be specific, actionable, and comprehensive in your response.
```

## 🔧 Troubleshooting

### Common Issues

1. **RAG Enhancement Not Working**
   ```bash
   # Check if Gemini API key is set
   echo $GEMINI_API_KEY

   # Check server logs for errors
   npm run dev
   ```

2. **Prompts Look the Same**
   - RAG enhancement happens behind the scenes
   - Look for longer, more detailed prompts
   - Check for tool-specific language (e.g., "Lovable.dev", "React", "Supabase")

3. **API Errors**
   - Ensure your server is running on port 3000
   - Check Supabase authentication is working
   - Verify Gemini API key is valid

### Debug Mode
```javascript
// In browser console, enable debug logging
localStorage.setItem('rag-debug', 'true');
```

## 🚀 Next Steps

### Immediate Actions
1. **Test Your Existing Workflow**: Ensure everything still works
2. **Compare Prompts**: Generate a few MVPs and notice the enhanced prompts
3. **Try Different Tools**: Test with different AI tools to see tool-specific optimizations

### Optional Enhancements
1. **Add Tool Selection UI**: Let users choose their preferred AI tool
2. **Analytics Dashboard**: View prompt quality scores and usage statistics
3. **Custom Templates**: Add your own prompt templates for specific use cases

### Future Improvements
- **Vector Database**: Add semantic search for better context retrieval
- **Learning System**: Improve prompts based on user feedback
- **Multi-Language**: Support for different programming languages

## 📞 Support

For issues related to the RAG integration:
- **Test First**: Run `node test-rag-integration.js`
- **Check Logs**: Look at browser console and server logs
- **Fallback**: RAG should fallback to original prompts if it fails
- **Original RAG Repo**: Reference [GaneshTappiti/RAG](https://github.com/GaneshTappiti/RAG.git) for original implementation

## 🎉 Success Metrics

You'll know the integration is working when:
- ✅ Prompts are significantly longer and more detailed
- ✅ Tool-specific language appears (e.g., "Lovable.dev", "C.L.E.A.R. framework")
- ✅ Technical requirements are more specific
- ✅ Quality scores are displayed (if using the API directly)
- ✅ Your existing MVP Studio workflow remains unchanged

**The RAG integration is designed to be invisible to users while dramatically improving prompt quality behind the scenes!** 🚀

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ragGenerator, TaskContext, ProjectInfo } from '@/lib/rag-integration';

interface RAGRequest {
  appIdea: {
    appName: string;
    platforms: string[];
    designStyle: string;
    styleDescription?: string;
    ideaDescription: string;
    targetAudience?: string;
  };
  validationQuestions: {
    hasValidated: boolean;
    hasDiscussed: boolean;
    motivation: string;
    preferredAITool?: string;
    projectComplexity?: string;
    technicalExperience?: string;
  };
  targetTool?: string;
  taskType?: string;
}

interface RAGResponse {
  success: boolean;
  prompt?: string;
  validation?: any;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RAGRequest = await request.json();
    const { appIdea, validationQuestions, targetTool, taskType } = body;

    // Initialize Supabase client for authentication
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as RAGResponse,
        { status: 401 }
      );
    }

    // Validate required fields
    if (!appIdea?.appName || !appIdea?.ideaDescription) {
      return NextResponse.json(
        { success: false, error: 'App name and description are required' } as RAGResponse,
        { status: 400 }
      );
    }

    // Determine target tool
    const selectedTool = targetTool || validationQuestions.preferredAITool || 'lovable';

    // Create TaskContext from MVP Studio data
    const taskContext: TaskContext = {
      task_type: taskType || 'build web application',
      project_name: appIdea.appName,
      description: appIdea.ideaDescription,
      technical_requirements: extractTechnicalRequirements(appIdea, validationQuestions),
      ui_requirements: extractUIRequirements(appIdea),
      constraints: extractConstraints(appIdea, validationQuestions)
    };

    // Create ProjectInfo from MVP Studio data
    const projectInfo: ProjectInfo = {
      name: appIdea.appName,
      description: appIdea.ideaDescription,
      tech_stack: determineTechStack(appIdea, selectedTool),
      target_audience: appIdea.targetAudience || 'General users',
      requirements: []
    };

    // Generate enhanced prompt using RAG
    const prompt = await ragGenerator.generatePrompt(taskContext, projectInfo, selectedTool);

    // Validate the generated prompt
    const validation = ragGenerator.validatePrompt(prompt);

    // Log the generation for analytics (optional)
    try {
      await supabase
        .from('rag_prompt_generations')
        .insert({
          user_id: user.id,
          app_name: appIdea.appName,
          target_tool: selectedTool,
          stage: taskType || 'build_application',
          confidence_score: validation.score / 100,
          prompt_length: prompt.length,
          was_successful: validation.is_valid,
          platforms: appIdea.platforms,
          design_style: appIdea.designStyle,
          project_complexity: validationQuestions.projectComplexity,
          technical_experience: validationQuestions.technicalExperience,
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.warn('Failed to log prompt generation:', logError);
    }

    const response: RAGResponse = {
      success: true,
      prompt: prompt,
      validation: validation
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error generating RAG prompt:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { success: false, error: `Failed to generate prompt: ${errorMessage}` } as RAGResponse,
      { status: 500 }
    );
  }
}

// Helper functions to extract requirements from MVP Studio data
function extractTechnicalRequirements(appIdea: any, validationQuestions: any): string[] {
  const requirements: string[] = [];

  // Platform-based requirements
  if (appIdea.platforms.includes('web')) {
    requirements.push('Web application development');
    requirements.push('Responsive design for desktop and mobile');
    requirements.push('Modern web technologies (HTML5, CSS3, JavaScript)');
  }

  if (appIdea.platforms.includes('mobile')) {
    requirements.push('Mobile-responsive design');
    requirements.push('Touch-friendly interfaces');
    requirements.push('Mobile performance optimization');
  }

  // Complexity-based requirements
  if (validationQuestions.projectComplexity === 'complex') {
    requirements.push('Scalable architecture');
    requirements.push('Performance optimization');
    requirements.push('Advanced state management');
    requirements.push('Error handling and logging');
  } else if (validationQuestions.projectComplexity === 'medium') {
    requirements.push('Modular code structure');
    requirements.push('Basic state management');
    requirements.push('Error handling');
  } else {
    requirements.push('Simple, clean code structure');
    requirements.push('Basic functionality');
  }

  // Experience-based requirements
  if (validationQuestions.technicalExperience === 'beginner') {
    requirements.push('Clear, well-commented code');
    requirements.push('Step-by-step implementation guide');
    requirements.push('Best practices documentation');
  } else if (validationQuestions.technicalExperience === 'advanced') {
    requirements.push('Advanced patterns and optimizations');
    requirements.push('Performance considerations');
    requirements.push('Scalability planning');
  }

  return requirements;
}

function extractUIRequirements(appIdea: any): string[] {
  const requirements: string[] = [];

  // Design style requirements
  switch (appIdea.designStyle) {
    case 'minimal':
      requirements.push('Clean, minimal design');
      requirements.push('Plenty of whitespace');
      requirements.push('Simple color palette');
      requirements.push('Typography-focused layout');
      break;
    case 'playful':
      requirements.push('Vibrant colors and gradients');
      requirements.push('Engaging animations and transitions');
      requirements.push('Fun, interactive elements');
      requirements.push('Creative layouts');
      break;
    case 'business':
      requirements.push('Professional appearance');
      requirements.push('Corporate color scheme');
      requirements.push('Formal typography');
      requirements.push('Clean, structured layout');
      break;
  }

  // Style description
  if (appIdea.styleDescription) {
    requirements.push(`Style preference: ${appIdea.styleDescription}`);
  }

  // Platform-specific UI requirements
  if (appIdea.platforms.includes('mobile')) {
    requirements.push('Mobile-first responsive design');
    requirements.push('Touch-friendly button sizes (44px minimum)');
    requirements.push('Swipe gestures and mobile interactions');
  }

  // General UI requirements
  requirements.push('Accessibility compliance (WCAG 2.1)');
  requirements.push('Cross-browser compatibility');
  requirements.push('Loading states and error handling');
  requirements.push('Consistent design system');

  return requirements;
}

function extractConstraints(appIdea: any, validationQuestions: any): string[] {
  const constraints: string[] = [];

  // Platform constraints
  if (appIdea.platforms.length === 1 && appIdea.platforms[0] === 'web') {
    constraints.push('Web-only implementation');
    constraints.push('No native mobile app features');
  }

  // Experience-based constraints
  if (validationQuestions.technicalExperience === 'beginner') {
    constraints.push('Avoid overly complex patterns');
    constraints.push('Use well-documented libraries');
    constraints.push('Prioritize readability over optimization');
  }

  // Complexity constraints
  if (validationQuestions.projectComplexity === 'simple') {
    constraints.push('Keep architecture simple');
    constraints.push('Minimize external dependencies');
    constraints.push('Focus on core functionality');
  }

  // General constraints
  constraints.push('Follow modern web standards');
  constraints.push('Ensure security best practices');
  constraints.push('Optimize for performance');

  return constraints;
}

function determineTechStack(appIdea: any, selectedTool: string): string[] {
  const baseStack: string[] = [];

  // Tool-specific tech stacks
  switch (selectedTool) {
    case 'lovable':
      baseStack.push('React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'shadcn/ui');
      break;
    case 'v0':
      baseStack.push('React', 'TypeScript', 'Tailwind CSS', 'Next.js');
      break;
    case 'bolt':
      baseStack.push('React', 'TypeScript', 'Vite', 'CSS Modules');
      break;
    case 'cursor':
      baseStack.push('TypeScript', 'Node.js', 'Modern JavaScript');
      break;
    default:
      baseStack.push('React', 'TypeScript', 'Modern CSS');
  }

  // Platform-specific additions
  if (appIdea.platforms.includes('web')) {
    if (!baseStack.includes('HTML5')) baseStack.push('HTML5');
    if (!baseStack.includes('CSS3')) baseStack.push('CSS3');
  }

  return baseStack;
}

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get supported tools from RAG generator
    const supportedToolNames = ragGenerator.getSupportedTools();
    const supportedTools = supportedToolNames.map(toolName => {
      const profile = ragGenerator.getToolProfile(toolName);
      return {
        id: toolName,
        name: profile?.display_name || toolName,
        description: profile?.description || '',
        category: profile?.category || 'development_tool',
        type: profile?.type || 'tool',
        supported: true
      };
    });

    // Get task suggestions
    const taskSuggestions = ragGenerator.getTaskSuggestions('web_app');

    return NextResponse.json({
      success: true,
      supportedTools,
      taskSuggestions,
      version: '1.0.0'
    });

  } catch (error) {
    console.error('Error fetching RAG configuration:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}



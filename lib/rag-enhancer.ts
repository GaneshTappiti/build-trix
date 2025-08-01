// Full RAG Enhancement for existing MVP Studio
// This enhances your existing prompt generation using the complete RAG system
import { ragGenerator, TaskContext, ProjectInfo } from './rag-integration';

interface MVPIdeaFormData {
  app_name: string;
  platforms: string[];
  style: string;
  style_description?: string;
  app_description: string;
  target_users?: string;
}

interface QuestionnaireData {
  idea_validated: boolean;
  talked_to_people: boolean;
  motivation?: string;
}

// AI Tool specific enhancements
const AI_TOOL_ENHANCEMENTS = {
  lovable: {
    name: "Lovable.dev",
    framework: "C.L.E.A.R",
    prefix: `You are an expert UI/UX design strategist specializing in Lovable.dev development. Use the C.L.E.A.R. framework (Context, Logic, Examples, Actions, Results) for optimal results.

IMPORTANT LOVABLE GUIDELINES:
- Use React with TypeScript exclusively
- Integrate Supabase for backend functionality  
- Style with Tailwind CSS and shadcn/ui components
- Implement responsive, mobile-first design
- Follow accessibility best practices
- Use the Knowledge Base feature extensively
- Leverage Chat mode for complex planning

`,
    suffix: `

LOVABLE-SPECIFIC OPTIMIZATIONS:
- Break complex features into incremental development steps
- Be explicit about Supabase schema requirements
- Include specific Tailwind CSS classes and responsive breakpoints
- Mention shadcn/ui components where applicable
- Consider using Lovable's Chat mode for clarification if needed

Before starting implementation, confirm you understand the requirements from the Knowledge Base.`
  },

  cursor: {
    name: "Cursor",
    framework: "Code-Focused",
    prefix: `You are an expert software developer using Cursor IDE. Focus on clean, maintainable code with clear context and specific instructions.

CURSOR OPTIMIZATION GUIDELINES:
- Provide clear code context and file structure
- Be specific about exact changes needed
- Use incremental, file-by-file approach
- Include proper error handling
- Focus on code quality and best practices

`,
    suffix: `

CURSOR-SPECIFIC INSTRUCTIONS:
- Target specific files and functions for changes
- Provide clear before/after code examples
- Include proper TypeScript types and interfaces
- Consider performance implications
- Use modern JavaScript/TypeScript patterns
- Ensure proper testing considerations`
  },

  v0: {
    name: "v0.dev",
    framework: "Component-Focused",
    prefix: `You are a UI/UX expert specializing in v0.dev component creation. Focus on beautiful, accessible React components with modern design.

V0 OPTIMIZATION GUIDELINES:
- Create clean, reusable React components
- Use modern CSS and design patterns
- Implement proper accessibility features
- Focus on visual design and user experience
- Use Tailwind CSS for styling

`,
    suffix: `

V0-SPECIFIC REQUIREMENTS:
- Design mobile-first, responsive components
- Include proper ARIA labels and accessibility
- Use semantic HTML elements
- Implement proper loading and error states
- Consider component composition and reusability
- Include hover, focus, and active states for interactive elements`
  },

  bolt: {
    name: "Bolt.new",
    framework: "Full-Stack Web",
    prefix: `You are a full-stack web developer using Bolt.new. Create complete, working web applications with modern technologies.

BOLT OPTIMIZATION GUIDELINES:
- Build complete, functional web applications
- Use modern web technologies (React, TypeScript, etc.)
- Implement proper state management
- Consider WebContainer limitations
- Focus on rapid prototyping and iteration

`,
    suffix: `

BOLT-SPECIFIC CONSIDERATIONS:
- Ensure browser compatibility (no native binaries)
- Use web-based technologies only
- Implement proper error boundaries
- Consider performance in browser environment
- Use the "Enhance Prompt" feature for complex requirements
- Break large features into smaller, manageable pieces`
  },

  claude: {
    name: "Claude",
    framework: "Conversational AI",
    prefix: `You are Claude, an AI assistant helping with software development. Provide clear, helpful guidance with detailed explanations.

CLAUDE OPTIMIZATION GUIDELINES:
- Provide step-by-step instructions
- Explain reasoning behind decisions
- Include multiple approaches when applicable
- Focus on best practices and clean code
- Offer debugging and troubleshooting help

`,
    suffix: `

CLAUDE-SPECIFIC APPROACH:
- Break down complex problems into smaller steps
- Provide clear code examples with explanations
- Include potential pitfalls and how to avoid them
- Suggest testing strategies
- Offer alternative solutions when appropriate
- Focus on learning and understanding`
  },

  chatgpt: {
    name: "ChatGPT",
    framework: "Conversational AI",
    prefix: `You are ChatGPT, helping with software development. Provide practical, actionable guidance with clear examples.

CHATGPT OPTIMIZATION GUIDELINES:
- Give practical, implementable solutions
- Include working code examples
- Explain concepts clearly
- Focus on common patterns and best practices
- Provide debugging assistance

`,
    suffix: `

CHATGPT-SPECIFIC APPROACH:
- Use clear, structured responses
- Include code snippets with explanations
- Mention common gotchas and solutions
- Suggest useful libraries and tools
- Focus on practical implementation
- Provide testing and validation steps`
  }
};

// Detect AI tool from user input or default to general enhancement
function detectAITool(ideaDetails: MVPIdeaFormData, questionnaire: QuestionnaireData): string {
  const description = ideaDetails.app_description.toLowerCase();
  const motivation = questionnaire.motivation?.toLowerCase() || '';
  const combined = `${description} ${motivation}`;

  // Simple keyword detection - you can make this more sophisticated
  if (combined.includes('lovable') || combined.includes('react') && combined.includes('supabase')) {
    return 'lovable';
  }
  if (combined.includes('cursor') || combined.includes('code editor')) {
    return 'cursor';
  }
  if (combined.includes('v0') || combined.includes('component') && combined.includes('ui')) {
    return 'v0';
  }
  if (combined.includes('bolt') || combined.includes('web app') && combined.includes('full stack')) {
    return 'bolt';
  }
  if (combined.includes('claude')) {
    return 'claude';
  }
  if (combined.includes('chatgpt') || combined.includes('gpt')) {
    return 'chatgpt';
  }

  // Default to lovable for web apps, cursor for others
  return ideaDetails.platforms.includes('web') ? 'lovable' : 'cursor';
}

// Enhance the existing prompt with full RAG intelligence
export async function enhancePromptWithRAG(
  originalPrompt: string,
  ideaDetails: MVPIdeaFormData,
  questionnaire: QuestionnaireData
): Promise<string> {
  try {
    const detectedTool = detectAITool(ideaDetails, questionnaire);

    // Create TaskContext from MVP Studio data
    const taskContext: TaskContext = {
      task_type: 'build web application',
      project_name: ideaDetails.app_name,
      description: ideaDetails.app_description,
      technical_requirements: addToolSpecificRequirements(ideaDetails, questionnaire),
      ui_requirements: extractUIRequirements(ideaDetails),
      constraints: extractConstraints(ideaDetails, questionnaire)
    };

    // Create ProjectInfo from MVP Studio data
    const projectInfo: ProjectInfo = {
      name: ideaDetails.app_name,
      description: ideaDetails.app_description,
      tech_stack: determineTechStack(ideaDetails, detectedTool),
      target_audience: ideaDetails.target_users || 'General users',
      requirements: []
    };

    // Generate RAG-enhanced prompt
    const ragPrompt = await ragGenerator.generatePrompt(taskContext, projectInfo, detectedTool);

    // Combine RAG prompt with original prompt for maximum context
    const enhancedPrompt = `${ragPrompt}

--- ADDITIONAL CONTEXT FROM MVP STUDIO ---
${originalPrompt}

--- INTEGRATION NOTES ---
This prompt has been enhanced with RAG (Retrieval-Augmented Generation) for ${detectedTool} optimization.
Please follow the tool-specific guidelines above while incorporating the MVP Studio requirements below.`;

    return enhancedPrompt;
  } catch (error) {
    console.error('RAG enhancement failed:', error);
    // Fallback to simple enhancement if RAG fails
    return enhancePromptWithSimpleRAG(originalPrompt, ideaDetails, questionnaire);
  }
}

// Fallback simple enhancement if full RAG fails
function enhancePromptWithSimpleRAG(
  originalPrompt: string,
  ideaDetails: MVPIdeaFormData,
  questionnaire: QuestionnaireData
): string {
  const detectedTool = detectAITool(ideaDetails, questionnaire);
  const enhancement = AI_TOOL_ENHANCEMENTS[detectedTool as keyof typeof AI_TOOL_ENHANCEMENTS];

  if (!enhancement) {
    return originalPrompt; // Return original if no enhancement found
  }

  // Add tool-specific context and optimizations
  const enhancedPrompt = `${enhancement.prefix}

${originalPrompt}

${enhancement.suffix}

TARGET AI TOOL: ${enhancement.name}
FRAMEWORK APPROACH: ${enhancement.framework}`;

  return enhancedPrompt;
}

// Add tool-specific technical requirements
export function addToolSpecificRequirements(
  ideaDetails: MVPIdeaFormData,
  questionnaire: QuestionnaireData
): string[] {
  const detectedTool = detectAITool(ideaDetails, questionnaire);
  const requirements: string[] = [];

  switch (detectedTool) {
    case 'lovable':
      requirements.push(
        "Use React with TypeScript for all components",
        "Integrate Supabase for authentication and database",
        "Style with Tailwind CSS and shadcn/ui components",
        "Implement responsive design with mobile-first approach",
        "Follow accessibility best practices (ARIA labels, semantic HTML)",
        "Use Lovable's Knowledge Base for project context"
      );
      break;

    case 'cursor':
      requirements.push(
        "Provide clear file structure and code organization",
        "Use modern TypeScript patterns and best practices",
        "Implement proper error handling and validation",
        "Include comprehensive type definitions",
        "Focus on maintainable, readable code"
      );
      break;

    case 'v0':
      requirements.push(
        "Create reusable React components with proper props",
        "Implement responsive design with Tailwind CSS",
        "Include accessibility features (ARIA, semantic HTML)",
        "Design for mobile-first approach",
        "Use modern CSS patterns and animations"
      );
      break;

    case 'bolt':
      requirements.push(
        "Build complete web application with modern stack",
        "Use browser-compatible technologies only",
        "Implement proper state management",
        "Consider WebContainer environment limitations",
        "Focus on rapid prototyping and iteration"
      );
      break;

    case 'claude':
    case 'chatgpt':
      requirements.push(
        "Provide step-by-step implementation guide",
        "Include clear code examples and explanations",
        "Mention best practices and common pitfalls",
        "Suggest testing and validation approaches",
        "Offer alternative solutions when applicable"
      );
      break;
  }

  return requirements;
}

// Get tool-specific style recommendations
export function getToolSpecificStyleGuidance(
  style: string,
  detectedTool: string
): string {
  const baseStyle = style.toLowerCase();
  
  switch (detectedTool) {
    case 'lovable':
      if (baseStyle.includes('minimal')) {
        return "Use clean Tailwind utilities like 'bg-white', 'text-gray-900', 'border-gray-200'. Leverage shadcn/ui components for consistency.";
      }
      if (baseStyle.includes('playful')) {
        return "Use vibrant Tailwind colors like 'bg-blue-500', 'text-purple-600'. Add subtle animations with 'transition-all duration-300'.";
      }
      if (baseStyle.includes('business')) {
        return "Use professional Tailwind palette like 'bg-slate-50', 'text-slate-900', 'border-slate-300'. Focus on clean typography.";
      }
      break;

    case 'v0':
      if (baseStyle.includes('minimal')) {
        return "Focus on whitespace, clean typography, and subtle shadows. Use neutral colors and simple layouts.";
      }
      if (baseStyle.includes('playful')) {
        return "Include fun animations, bright colors, and interactive elements. Use gradients and rounded corners.";
      }
      if (baseStyle.includes('business')) {
        return "Professional color scheme, clean layouts, and corporate-friendly design patterns.";
      }
      break;
  }

  return "Follow modern design principles with consistent spacing, typography, and color usage.";
}

// Helper functions for RAG integration
function extractUIRequirements(ideaDetails: MVPIdeaFormData): string[] {
  const requirements: string[] = [];

  // Design style requirements
  switch (ideaDetails.style) {
    case 'minimal':
      requirements.push('Clean, minimal design');
      requirements.push('Plenty of whitespace');
      requirements.push('Simple color palette');
      break;
    case 'playful':
      requirements.push('Vibrant colors and gradients');
      requirements.push('Engaging animations and transitions');
      requirements.push('Fun, interactive elements');
      break;
    case 'business':
      requirements.push('Professional appearance');
      requirements.push('Corporate color scheme');
      requirements.push('Formal typography');
      break;
  }

  // Style description
  if (ideaDetails.style_description) {
    requirements.push(`Style preference: ${ideaDetails.style_description}`);
  }

  // Platform-specific UI requirements
  if (ideaDetails.platforms.includes('mobile')) {
    requirements.push('Mobile-first responsive design');
    requirements.push('Touch-friendly button sizes');
  }

  // General UI requirements
  requirements.push('Accessibility compliance');
  requirements.push('Cross-browser compatibility');
  requirements.push('Loading states and error handling');

  return requirements;
}

function extractConstraints(ideaDetails: MVPIdeaFormData, questionnaire: QuestionnaireData): string[] {
  const constraints: string[] = [];

  // Platform constraints
  if (ideaDetails.platforms.length === 1 && ideaDetails.platforms[0] === 'web') {
    constraints.push('Web-only implementation');
  }

  // General constraints
  constraints.push('Follow modern web standards');
  constraints.push('Ensure security best practices');
  constraints.push('Optimize for performance');

  return constraints;
}

function determineTechStack(ideaDetails: MVPIdeaFormData, selectedTool: string): string[] {
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
  if (ideaDetails.platforms.includes('web')) {
    if (!baseStack.includes('HTML5')) baseStack.push('HTML5');
    if (!baseStack.includes('CSS3')) baseStack.push('CSS3');
  }

  return baseStack;
}

// Simple usage example for your existing code:
// const enhancedPrompt = await enhancePromptWithRAG(originalPrompt, ideaDetails, questionnaire);

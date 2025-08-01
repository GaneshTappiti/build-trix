// Full RAG Integration for MVP Studio
// Based on the actual RAG repository: https://github.com/GaneshTappiti/RAG.git

import { GoogleGenerativeAI } from '@google/generative-ai';

// Types based on the actual RAG system
export interface TaskContext {
  task_type: string;
  project_name: string;
  description: string;
  technical_requirements: string[];
  ui_requirements: string[];
  constraints: string[];
}

export interface ProjectInfo {
  name: string;
  description: string;
  tech_stack: string[];
  target_audience: string;
  requirements: string[];
}

export interface ToolProfile {
  tool_name: string;
  display_name: string;
  description: string;
  type: string;
  category: string;
  primary_use_cases: string[];
  supported_languages: string[];
  key_features: string[];
  tone: string;
  format: string;
}

export interface ValidationResult {
  is_valid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

// Tool configurations from the RAG repository
const TOOL_PROFILES: Record<string, ToolProfile> = {
  lovable: {
    tool_name: "lovable",
    display_name: "Lovable.dev",
    description: "AI-powered web application builder with React and modern frameworks",
    type: "code_generator",
    category: "ai_development_tool",
    primary_use_cases: [
      "web development",
      "backend development", 
      "mobile development",
      "ai development",
      "code generation"
    ],
    supported_languages: ["javascript", "typescript", "python", "go"],
    key_features: [
      "real-time collaboration",
      "code completion",
      "debugging",
      "version control",
      "deployment",
      "testing",
      "refactoring"
    ],
    tone: "official yet casual",
    format: "markdown"
  },
  cursor: {
    tool_name: "cursor",
    display_name: "Cursor",
    description: "AI-powered code editor with intelligent code completion",
    type: "code_editor",
    category: "development_tool",
    primary_use_cases: ["code editing", "refactoring", "debugging"],
    supported_languages: ["javascript", "typescript", "python", "go", "rust", "java"],
    key_features: ["ai_completion", "code_analysis", "refactoring", "debugging"],
    tone: "technical and precise",
    format: "structured"
  },
  v0: {
    tool_name: "v0",
    display_name: "v0.dev",
    description: "Vercel's AI UI generator for React components",
    type: "ui_generator", 
    category: "design_tool",
    primary_use_cases: ["ui_components", "react_interfaces", "quick_prototypes"],
    supported_languages: ["javascript", "typescript"],
    key_features: ["component_generation", "responsive_design", "tailwind_css"],
    tone: "design-oriented and friendly",
    format: "component-focused"
  },
  bolt: {
    tool_name: "bolt",
    display_name: "Bolt.new",
    description: "Full-stack web development in browser",
    type: "web_ide",
    category: "development_platform",
    primary_use_cases: ["rapid_prototyping", "web_applications", "full_stack_development"],
    supported_languages: ["javascript", "typescript", "html", "css"],
    key_features: ["browser_ide", "instant_preview", "deployment", "collaboration"],
    tone: "practical and efficient",
    format: "project-focused"
  },
  claude: {
    tool_name: "claude",
    display_name: "Claude",
    description: "Anthropic's AI assistant for coding and problem solving",
    type: "ai_assistant",
    category: "conversational_ai",
    primary_use_cases: ["code_generation", "problem_solving", "debugging", "documentation"],
    supported_languages: ["javascript", "typescript", "python", "java", "go", "rust"],
    key_features: ["conversational_interface", "code_analysis", "explanation", "debugging"],
    tone: "helpful and explanatory",
    format: "conversational"
  },
  chatgpt: {
    tool_name: "chatgpt",
    display_name: "ChatGPT",
    description: "OpenAI's conversational AI for coding assistance",
    type: "ai_assistant", 
    category: "conversational_ai",
    primary_use_cases: ["code_generation", "learning", "debugging", "explanation"],
    supported_languages: ["javascript", "typescript", "python", "java", "c++", "go"],
    key_features: ["conversational_interface", "code_generation", "explanation", "learning"],
    tone: "friendly and educational",
    format: "conversational"
  }
};

// Template system based on the RAG repository
class TemplateEngine {
  private templates: Record<string, string> = {
    lovable_task_template: `# {{ task_context.task_type }} - {{ project_info.name }}

You are a skilled AI development assistant on **{{ tool_profile.display_name }}**.

**Tone:** {{ tool_profile.tone }}
**Output Format:** {{ tool_profile.format }}

## Project Overview
**Name:** {{ project_info.name }}
**Description:** {{ project_info.description }}
**Technology Stack:** {{ project_info.tech_stack }}
**Target Audience:** {{ project_info.target_audience }}

## Task Details
**Type:** {{ task_context.task_type }}
**Description:** {{ task_context.description }}

### Technical Requirements
{{ task_context.technical_requirements }}

### UI/UX Requirements
{{ task_context.ui_requirements }}

### Constraints
{{ task_context.constraints }}

## Guidelines Summary
{{ guidelines }}

## Expected Output
Provide a clear, formatted {{ tool_profile.display_name }} prompt that:
- Defines the context and scope clearly
- Gives specific, actionable requirements
- Includes responsive design considerations
- Follows accessibility best practices
- Avoids vague language and ensures structure is clean
- Includes proper error handling and loading states

**Remember:** Follow {{ tool_profile.display_name }}'s best practices for modern web development. Be specific, actionable, and comprehensive in your response.`,

    general_template: `# {{ task_context.task_type }} for {{ project_info.name }}

## Project Context
{{ project_info.description }}

**Technology Stack:** {{ project_info.tech_stack }}
**Target Tool:** {{ tool_profile.display_name }}

## Task Description
{{ task_context.description }}

## Requirements
### Technical Requirements
{{ task_context.technical_requirements }}

### UI Requirements
{{ task_context.ui_requirements }}

## Constraints
{{ task_context.constraints }}

## Expected Output
Create a {{ task_context.task_type }} following {{ tool_profile.display_name }} best practices.`
  };

  render(templateName: string, data: any): string {
    const template = this.templates[templateName] || this.templates.general_template;
    
    // Simple template rendering (replace with more sophisticated engine if needed)
    let rendered = template;
    
    // Replace project info
    rendered = rendered.replace(/\{\{ project_info\.name \}\}/g, data.project_info.name);
    rendered = rendered.replace(/\{\{ project_info\.description \}\}/g, data.project_info.description);
    rendered = rendered.replace(/\{\{ project_info\.tech_stack \}\}/g, data.project_info.tech_stack.join(', '));
    rendered = rendered.replace(/\{\{ project_info\.target_audience \}\}/g, data.project_info.target_audience);
    
    // Replace task context
    rendered = rendered.replace(/\{\{ task_context\.task_type \}\}/g, data.task_context.task_type);
    rendered = rendered.replace(/\{\{ task_context\.description \}\}/g, data.task_context.description);
    rendered = rendered.replace(/\{\{ task_context\.technical_requirements \}\}/g, 
      data.task_context.technical_requirements.map((req: string) => `- ${req}`).join('\n'));
    rendered = rendered.replace(/\{\{ task_context\.ui_requirements \}\}/g,
      data.task_context.ui_requirements.map((req: string) => `- ${req}`).join('\n'));
    rendered = rendered.replace(/\{\{ task_context\.constraints \}\}/g,
      data.task_context.constraints.map((constraint: string) => `- ${constraint}`).join('\n'));
    
    // Replace tool profile
    rendered = rendered.replace(/\{\{ tool_profile\.display_name \}\}/g, data.tool_profile.display_name);
    rendered = rendered.replace(/\{\{ tool_profile\.tone \}\}/g, data.tool_profile.tone);
    rendered = rendered.replace(/\{\{ tool_profile\.format \}\}/g, data.tool_profile.format);
    
    // Replace guidelines
    rendered = rendered.replace(/\{\{ guidelines \}\}/g, data.guidelines || 'Follow best practices for modern web development.');
    
    return rendered;
  }
}

// Main RAG Prompt Generator class
export class RAGPromptGenerator {
  private templateEngine: TemplateEngine;
  private geminiAI: GoogleGenerativeAI | null = null;

  constructor() {
    this.templateEngine = new TemplateEngine();
    
    // Initialize Gemini AI if API key is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.geminiAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generatePrompt(
    taskContext: TaskContext,
    projectInfo: ProjectInfo,
    toolName: string = 'lovable'
  ): Promise<string> {
    const toolProfile = TOOL_PROFILES[toolName] || TOOL_PROFILES.lovable;
    
    // Get relevant guidelines for the tool
    const guidelines = this.getToolGuidelines(toolName);
    
    // Prepare template data
    const templateData = {
      task_context: taskContext,
      project_info: projectInfo,
      tool_profile: toolProfile,
      guidelines
    };

    // Choose template based on tool
    const templateName = toolName === 'lovable' ? 'lovable_task_template' : 'general_template';
    
    // Render the template
    const prompt = this.templateEngine.render(templateName, templateData);
    
    // Enhance with AI if Gemini is available
    if (this.geminiAI) {
      return await this.enhanceWithAI(prompt, toolProfile);
    }
    
    return prompt;
  }

  private async enhanceWithAI(basePrompt: string, toolProfile: ToolProfile): Promise<string> {
    if (!this.geminiAI) return basePrompt;

    try {
      const model = this.geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const enhancementPrompt = `Enhance this ${toolProfile.display_name} prompt to be more specific and actionable. Keep the same structure but add more technical details and best practices:

${basePrompt}

Enhanced prompt:`;

      const result = await model.generateContent(enhancementPrompt);
      const response = await result.response;
      const enhancedText = response.text();
      
      return enhancedText || basePrompt;
    } catch (error) {
      console.error('AI enhancement failed:', error);
      return basePrompt;
    }
  }

  private getToolGuidelines(toolName: string): string {
    const guidelines: Record<string, string> = {
      lovable: `Follow Lovable.dev best practices:
- Use React with TypeScript for all components
- Integrate Supabase for backend functionality
- Style with Tailwind CSS and shadcn/ui components
- Implement responsive, mobile-first design
- Follow accessibility best practices
- Use the Knowledge Base feature extensively
- Leverage Chat mode for complex planning`,

      cursor: `Follow Cursor IDE best practices:
- Provide clear code context and file structure
- Be specific about exact changes needed
- Use incremental, file-by-file approach
- Include proper error handling
- Focus on code quality and maintainability`,

      v0: `Follow v0.dev best practices:
- Create clean, reusable React components
- Use modern CSS and design patterns
- Implement proper accessibility features
- Focus on visual design and user experience
- Use Tailwind CSS for styling`,

      bolt: `Follow Bolt.new best practices:
- Build complete, functional web applications
- Use modern web technologies (React, TypeScript, etc.)
- Implement proper state management
- Consider WebContainer limitations
- Focus on rapid prototyping and iteration`,

      claude: `Follow Claude best practices:
- Provide step-by-step instructions
- Explain reasoning behind decisions
- Include multiple approaches when applicable
- Focus on best practices and clean code
- Offer debugging and troubleshooting help`,

      chatgpt: `Follow ChatGPT best practices:
- Give practical, implementable solutions
- Include working code examples
- Explain concepts clearly
- Focus on common patterns and best practices
- Provide debugging assistance`
    };

    return guidelines[toolName] || guidelines.lovable;
  }

  validatePrompt(prompt: string): ValidationResult {
    const validation: ValidationResult = {
      is_valid: true,
      score: 0,
      issues: [],
      suggestions: []
    };

    // Check for key components
    const requiredSections = ['context', 'requirements', 'technical', 'ui'];
    let score = 0;

    for (const section of requiredSections) {
      if (prompt.toLowerCase().includes(section.toLowerCase())) {
        score += 25;
      } else {
        validation.issues.push(`Missing ${section} section`);
      }
    }

    // Check prompt length
    if (prompt.length < 200) {
      validation.issues.push("Prompt is too short");
      score -= 10;
    } else if (prompt.length > 2000) {
      validation.issues.push("Prompt might be too long");
      score -= 5;
    }

    // Check for specificity
    const vagueWords = ['nice', 'good', 'better', 'improve', 'enhance'];
    const vagueCount = vagueWords.reduce((count, word) => 
      count + (prompt.toLowerCase().split(word).length - 1), 0);
    
    if (vagueCount > 3) {
      validation.issues.push("Prompt contains vague language");
      score -= 10;
    }

    validation.score = Math.max(0, Math.min(100, score));
    validation.is_valid = validation.score >= 60;

    if (!validation.is_valid) {
      validation.suggestions = [
        "Be more specific about requirements",
        "Include technical stack details", 
        "Add UI/UX specifications",
        "Define success criteria"
      ];
    }

    return validation;
  }

  getTaskSuggestions(projectType: string): string[] {
    const suggestions: Record<string, string[]> = {
      web_app: [
        'project kickoff',
        'authentication setup', 
        'dashboard creation',
        'responsive design',
        'API integration'
      ],
      mobile_app: [
        'mobile-first design',
        'touch interactions',
        'offline functionality', 
        'push notifications'
      ],
      ecommerce: [
        'product catalog',
        'shopping cart',
        'payment integration',
        'order management'
      ],
      blog: [
        'content management',
        'blog layout',
        'SEO optimization',
        'commenting system'
      ]
    };

    return suggestions[projectType] || suggestions.web_app;
  }

  getSupportedTools(): string[] {
    return Object.keys(TOOL_PROFILES);
  }

  getToolProfile(toolName: string): ToolProfile | null {
    return TOOL_PROFILES[toolName] || null;
  }
}

// Export singleton instance
export const ragGenerator = new RAGPromptGenerator();

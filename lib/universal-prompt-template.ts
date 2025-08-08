import { GenerationSettings, AppType, AppComplexity } from '@/types/app-skeleton';

/**
 * Universal Prompt Template for AI-Powered App Skeleton Generation
 * This template can be used with any AI model to generate comprehensive app structures
 */

export class UniversalPromptTemplate {
  static generateMasterPrompt(
    userIdea: string,
    settings: GenerationSettings,
    additionalContext?: {
      targetUsers?: string;
      businessDomain?: string;
      specificRequirements?: string[];
    }
  ): string {
    const complexityInstructions = this.getComplexityInstructions(settings.complexity);
    const appTypeInstructions = this.getAppTypeInstructions(settings.appType);
    
    return `You're an expert mobile and web app architect. Given a user's app idea, generate a full-scale app structure.

[User Idea]: ${userIdea}

${additionalContext?.targetUsers ? `[Target Users]: ${additionalContext.targetUsers}` : ''}
${additionalContext?.businessDomain ? `[Business Domain]: ${additionalContext.businessDomain}` : ''}
${additionalContext?.specificRequirements ? `[Specific Requirements]: ${additionalContext.specificRequirements.join(', ')}` : ''}

[App Type]: ${settings.appType.toUpperCase()}
[Complexity Level]: ${settings.complexity.toUpperCase()}

${appTypeInstructions}
${complexityInstructions}

Respond with a complete, professional app skeleton including:

## 1. 🖥 COMPREHENSIVE SCREENS LIST
${this.getScreensInstruction(settings)}

## 2. 🧭 PAGE FLOW & NAVIGATION STRUCTURE
${this.getNavigationInstruction(settings)}

## 3. 🧑‍🤝‍🧑 USER ROLES & PERMISSIONS
Define all user types with their specific permissions:
- List each role (e.g., admin, user, guest, moderator)
- Define access levels and what each role can/cannot do
- Specify role-based screen access and feature permissions

## 4. 🗃 DATA MODELS & ENTITIES
${this.getDataModelsInstruction(settings)}

${settings.includeModalsPopups ? `
## 5. 💬 MODALS, POPUPS & OVERLAYS
List all dialog boxes, confirmation prompts, overlays:
- Modal purpose and trigger conditions
- Form modals, confirmation dialogs, info popups
- Context-specific overlays and their content
` : ''}

${this.getStatesInstruction(settings)}

## ${settings.includeModalsPopups ? '6' : '5'}. 🧩 THIRD-PARTY INTEGRATIONS
${this.getIntegrationsInstruction()}

${settings.generateArchitecture ? `
## ${settings.includeModalsPopups ? '7' : '6'}. 🏗 RECOMMENDED ARCHITECTURE PATTERN
Suggest the best architecture for this app:
- Architecture pattern (MVC, MVVM, Clean Architecture, Feature-based)
- Folder structure and organization
- Technology stack recommendations
- Reasoning for the chosen pattern
` : ''}

${this.getOutputFormatInstructions()}

IMPORTANT GUIDELINES:
- Be comprehensive but practical for ${settings.complexity} level development
- Consider ${settings.appType} platform-specific requirements
- Structure everything for immediate implementation
- Don't repeat information across sections
- Be concise but complete
- Focus on user value and development efficiency

${this.getComplexitySpecificGuidelines(settings.complexity)}`;
  }

  private static getComplexityInstructions(complexity: AppComplexity): string {
    switch (complexity) {
      case 'mvp':
        return `**MVP FOCUS**: Generate a lean, focused structure suitable for rapid prototyping and initial market validation. Include only essential features and core user flows.`;
      
      case 'advanced':
        return `**ADVANCED FOCUS**: Generate a comprehensive structure with advanced features, multiple user roles, complex workflows, and production considerations.`;
      
      case 'production':
        return `**PRODUCTION FOCUS**: Generate an enterprise-ready structure with extensive error handling, security considerations, scalability patterns, monitoring, and complete edge case coverage.`;
      
      default:
        return '';
    }
  }

  private static getAppTypeInstructions(appType: AppType): string {
    switch (appType) {
      case 'web':
        return `**WEB APP FOCUS**: Design for desktop/laptop browsers with responsive design. Consider desktop UX patterns, keyboard navigation, and multi-column layouts.`;
      
      case 'mobile':
        return `**MOBILE APP FOCUS**: Design for native mobile experience with touch interactions, gestures, and mobile-first UX patterns.`;
      
      case 'hybrid':
        return `**HYBRID APP FOCUS**: Design for both web and mobile platforms with responsive, cross-platform considerations and adaptive UI patterns.`;
      
      default:
        return '';
    }
  }

  private static getFeatureFlags(settings: GenerationSettings): string {
    const features = [];
    if (settings.includeErrorStates) features.push('Error States');
    if (settings.includeLoadingStates) features.push('Loading States');
    if (settings.includeEmptyStates) features.push('Empty States');
    if (settings.includeBackendModels) features.push('Backend Models');
    if (settings.suggestUIComponents) features.push('UI Components');
    if (settings.includeModalsPopups) features.push('Modals & Popups');
    
    return features.length > 0 ? `**INCLUDE**: ${features.join(', ')}` : '';
  }

  private static getScreensInstruction(settings: GenerationSettings): string {
    let instruction = `List ALL user-facing screens including:
- Main application screens and their purposes
- Authentication flows (login, register, forgot password)
- User profile and settings areas
- Content creation/management screens`;

    if (settings.appType === 'mobile') {
      instruction += `
- Mobile-optimized navigation (tabs, drawer)
- Touch-friendly interfaces and gestures`;
    } else if (settings.appType === 'web') {
      instruction += `
- Desktop navigation patterns (header nav, sidebar)
- Multi-column layouts and hover states`;
    }

    if (settings.complexity !== 'mvp') {
      instruction += `
- Admin/management interfaces
- Advanced feature screens
- Sub-pages and nested navigation flows`;
    }

    return instruction;
  }

  private static getNavigationInstruction(settings: GenerationSettings): string {
    return `Create a clear navigation structure:
- Route/URL structure or screen flow diagram
- Primary navigation patterns (${settings.appType === 'mobile' ? 'bottom tabs, drawer' : 'header nav, sidebar'})
- Secondary navigation (breadcrumbs, back buttons)
- Deep linking structure and screen relationships
- Entry points and navigation hierarchy`;
  }

  private static getDataModelsInstruction(settings: GenerationSettings): string {
    let instruction = `Define the core data entities:
- Primary data models with field definitions
- Relationships between entities (one-to-one, one-to-many, many-to-many)
- Key fields and data types for each model`;

    if (settings.includeBackendModels) {
      instruction += `
- Backend API structure and endpoints
- Database schema considerations
- Data validation rules and constraints`;
    }

    return instruction;
  }

  private static getStatesInstruction(settings: GenerationSettings): string {
    const states = [];
    if (settings.includeLoadingStates) states.push('Loading states');
    if (settings.includeEmptyStates) states.push('Empty states');
    if (settings.includeErrorStates) states.push('Error handling');

    if (states.length === 0) return '';

    const sectionNumber = settings.includeModalsPopups ? '6' : '5';
    return `
## ${sectionNumber}. 🧪 STATES & EDGE CASES
Handle various application states:
${states.map(state => `- ${state} with appropriate UI feedback`).join('\n')}
- Success confirmations and user feedback
- Network connectivity issues (offline/online states)
- Data synchronization states`;
  }

  private static getIntegrationsInstruction(): string {
    return `Suggest relevant third-party services:
- Authentication providers (Google, GitHub, Apple, etc.)
- Cloud storage and file management
- Payment processing (if applicable)
- Push notifications and communication
- Analytics and monitoring tools
- Any domain-specific integrations based on the app idea`;
  }

  private static getOutputFormatInstructions(): string {
    return `
**OUTPUT FORMAT REQUIREMENTS**:
- Use clear section headers and bullet points
- Structure information hierarchically
- Provide specific, actionable details
- Include implementation notes where helpful
- Format for easy parsing and immediate use`;
  }

  private static getComplexitySpecificGuidelines(complexity: AppComplexity): string {
    switch (complexity) {
      case 'mvp':
        return `
**MVP GUIDELINES**:
- Focus on core value proposition
- Include only essential user flows
- Minimize feature complexity
- Prioritize time-to-market
- Plan for future iteration and expansion`;

      case 'advanced':
        return `
**ADVANCED GUIDELINES**:
- Include sophisticated user workflows
- Consider scalability from the start
- Add comprehensive error handling
- Plan for multiple user types and permissions
- Include analytics and optimization features`;

      case 'production':
        return `
**PRODUCTION GUIDELINES**:
- Include enterprise-level security considerations
- Plan for high availability and scalability
- Add comprehensive monitoring and logging
- Include disaster recovery and backup strategies
- Consider compliance and regulatory requirements
- Plan for maintenance and updates`;

      default:
        return '';
    }
  }
}

/**
 * Helper function to generate a quick prompt for simpler use cases
 */
export function generateQuickPrompt(userIdea: string, appType: AppType = 'web'): string {
  const defaultSettings: GenerationSettings = {
    includeErrorStates: true,
    includeLoadingStates: true,
    includeEmptyStates: true,
    includeBackendModels: false,
    suggestUIComponents: true,
    includeModalsPopups: true,
    generateArchitecture: false,
    appType,
    complexity: 'mvp'
  };

  return UniversalPromptTemplate.generateMasterPrompt(userIdea, defaultSettings);
}

/**
 * Template variations for specific use cases
 */
export class PromptTemplateVariations {
  static forMVP(userIdea: string, appType: AppType = 'web'): string {
    const settings: GenerationSettings = {
      includeErrorStates: false,
      includeLoadingStates: true,
      includeEmptyStates: true,
      includeBackendModels: false,
      suggestUIComponents: true,
      includeModalsPopups: false,
      generateArchitecture: false,
      appType,
      complexity: 'mvp'
    };

    return UniversalPromptTemplate.generateMasterPrompt(userIdea, settings);
  }

  static forProduction(userIdea: string, appType: AppType = 'web'): string {
    const settings: GenerationSettings = {
      includeErrorStates: true,
      includeLoadingStates: true,
      includeEmptyStates: true,
      includeBackendModels: true,
      suggestUIComponents: true,
      includeModalsPopups: true,
      generateArchitecture: true,
      appType,
      complexity: 'production'
    };

    return UniversalPromptTemplate.generateMasterPrompt(userIdea, settings);
  }

  static forMobileApp(userIdea: string, complexity: AppComplexity = 'advanced'): string {
    const settings: GenerationSettings = {
      includeErrorStates: true,
      includeLoadingStates: true,
      includeEmptyStates: true,
      includeBackendModels: complexity !== 'mvp',
      suggestUIComponents: true,
      includeModalsPopups: true,
      generateArchitecture: complexity === 'production',
      appType: 'mobile',
      complexity
    };

    return UniversalPromptTemplate.generateMasterPrompt(userIdea, settings);
  }
}

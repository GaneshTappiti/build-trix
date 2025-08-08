import { GoogleGenAI } from '@google/genai';
import { 
  AppSkeleton, 
  GenerateAppSkeletonRequest, 
  GenerateAppSkeletonResponse,
  AppScreen,
  UserRole,
  DataModel,
  PageFlow,
  ModalDefinition,
  ThirdPartyIntegration,
  ArchitectureSuggestion,
  GenerationSettings,
  ScreenComponent,
  ScreenState,
  DataField
} from '@/types/app-skeleton';
import { UniversalPromptTemplate } from './universal-prompt-template';

export class AppSkeletonGenerator {
  private aiClient: GoogleGenAI;

  constructor(apiKey: string) {
    this.aiClient = new GoogleGenAI({ apiKey });
  }

  async generateAppSkeleton(request: GenerateAppSkeletonRequest): Promise<GenerateAppSkeletonResponse> {
    const startTime = Date.now();

    try {
      // Generate the master prompt using our universal template
      const masterPrompt = UniversalPromptTemplate.generateMasterPrompt(
        request.userIdea,
        request.settings,
        request.additionalContext
      );

      // Use Gemini to generate the detailed structure
      const aiResponse = await this.callAIModel(masterPrompt);

      // Parse the AI response into structured data
      const appSkeleton = await this.parseAIResponseToSkeleton(
        aiResponse,
        request.userIdea,
        request.settings
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        appSkeleton,
        processingTime
      };

    } catch (error) {
      console.error('Error generating app skeleton:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate app skeleton',
        processingTime: Date.now() - startTime
      };
    }
  }

  private async callAIModel(prompt: string): Promise<string> {
    const model = 'gemini-2.5-flash';
    
    const config = {
      thinkingConfig: {
        thinkingBudget: -1,
      },
      responseMimeType: 'text/plain',
    };

    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const response = await this.aiClient.models.generateContentStream({
      model,
      config,
      contents,
    });

    let generatedText = '';
    for await (const chunk of response) {
      generatedText += chunk.text || '';
    }

    return generatedText.trim();
  }

  private async parseAIResponseToSkeleton(
    aiResponse: string,
    userIdea: string,
    settings: GenerationSettings
  ): Promise<AppSkeleton> {
    // This is a sophisticated parser that converts AI text response into structured data
    // In a production environment, you might want to fine-tune the AI model to return JSON directly
    
    const skeleton: AppSkeleton = {
      id: this.generateId(),
      name: this.extractAppName(aiResponse) || 'Generated App',
      description: userIdea,
      appType: settings.appType,
      complexity: settings.complexity,
      
      screens: this.parseScreens(aiResponse),
      userRoles: this.parseUserRoles(aiResponse),
      dataModels: this.parseDataModels(aiResponse),
      pageFlows: this.parsePageFlows(aiResponse),
      modals: settings.includeModalsPopups ? this.parseModals(aiResponse) : [],
      
      integrations: this.parseIntegrations(aiResponse),
      architecture: settings.generateArchitecture ? this.parseArchitecture() : this.getDefaultArchitecture(settings),
      
      generationSettings: settings,
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return skeleton;
  }

  private extractAppName(response: string): string | null {
    // Try to extract app name from various patterns
    const patterns = [
      /App Name[:\s]+([^\n]+)/i,
      /Application[:\s]+([^\n]+)/i,
      /#\s*([^#\n]+)/,
      /\*\*([^*]+)\*\*/
    ];

    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private parseScreens(response: string): AppScreen[] {
    const screens: AppScreen[] = [];
    
    // Look for screens section
    const screensSection = this.extractSection(response, /screens?\s*list/i, /##\s*\d+\./);
    if (!screensSection) return screens;

    // Parse individual screens
    const screenMatches = screensSection.match(/[-*]\s*([^\n]+)/g) || [];
    
    screenMatches.forEach((match, index) => {
      const screenText = match.replace(/[-*]\s*/, '').trim();
      const screen = this.parseIndividualScreen(screenText, index);
      if (screen) screens.push(screen);
    });

    return screens;
  }

  private parseIndividualScreen(screenText: string, index: number): AppScreen | null {
    if (!screenText) return null;

    // Extract screen name and description
    const parts = screenText.split(/[:-]/);
    const name = parts[0]?.trim() || `Screen ${index + 1}`;
    const description = parts.slice(1).join(':').trim() || screenText;

    return {
      id: this.generateId(),
      name,
      type: this.inferScreenType(name),
      category: this.inferScreenCategory(name),
      description,
      userRoles: ['user'], // Default, could be enhanced
      components: this.inferScreenComponents(name),
      states: this.generateDefaultStates(),
      navigation: []
    };
  }

  private parseUserRoles(response: string): UserRole[] {
    const roles: UserRole[] = [];
    
    const rolesSection = this.extractSection(response, /user\s*roles/i, /##\s*\d+\./);
    if (!rolesSection) {
      // Return default roles if none specified
      return this.getDefaultUserRoles();
    }

    const roleMatches = rolesSection.match(/[-*]\s*([^\n]+)/g) || [];
    
    roleMatches.forEach(match => {
      const roleText = match.replace(/[-*]\s*/, '').trim();
      const role = this.parseIndividualRole(roleText);
      if (role) roles.push(role);
    });

    return roles.length > 0 ? roles : this.getDefaultUserRoles();
  }

  private parseIndividualRole(roleText: string): UserRole | null {
    const parts = roleText.split(/[:-]/);
    const name = parts[0]?.trim();
    const description = parts.slice(1).join(':').trim() || roleText;

    if (!name) return null;

    return {
      id: this.generateId(),
      name,
      description,
      permissions: this.inferRolePermissions(name),
      accessLevel: this.inferAccessLevel(name)
    };
  }

  private parseDataModels(response: string): DataModel[] {
    const models: DataModel[] = [];
    
    const modelsSection = this.extractSection(response, /data\s*models/i, /##\s*\d+\./);
    if (!modelsSection) return models;

    const modelMatches = modelsSection.match(/[-*]\s*([^\n]+)/g) || [];
    
    modelMatches.forEach(match => {
      const modelText = match.replace(/[-*]\s*/, '').trim();
      const model = this.parseIndividualDataModel(modelText);
      if (model) models.push(model);
    });

    return models;
  }

  private parseIndividualDataModel(modelText: string): DataModel | null {
    const parts = modelText.split(/[:-]/);
    const name = parts[0]?.trim();
    const description = parts.slice(1).join(':').trim() || modelText;

    if (!name) return null;

    return {
      name,
      description,
      fields: this.generateDefaultFields(name),
      relationships: [],
      primaryKey: 'id'
    };
  }

  private parsePageFlows(response: string): PageFlow[] {
    const flows: PageFlow[] = [];
    
    const flowsSection = this.extractSection(response, /page\s*flow/i, /##\s*\d+\./);
    if (!flowsSection) return flows;

    // For now, create a basic flow - this could be enhanced with more sophisticated parsing
    flows.push({
      id: this.generateId(),
      name: 'Main User Flow',
      description: 'Primary user journey through the application',
      startScreen: 'home',
      endScreen: 'dashboard',
      screens: ['home', 'login', 'dashboard'],
      userJourney: [
        { screenId: 'home', action: 'View landing page', description: 'User sees main value proposition', optional: false },
        { screenId: 'login', action: 'Authenticate', description: 'User logs in or registers', optional: false },
        { screenId: 'dashboard', action: 'Access main features', description: 'User reaches core functionality', optional: false }
      ]
    });

    return flows;
  }

  private parseModals(response: string): ModalDefinition[] {
    const modals: ModalDefinition[] = [];
    
    const modalsSection = this.extractSection(response, /modals?\s*(and|&)?\s*popups?/i, /##\s*\d+\./);
    if (!modalsSection) return modals;

    const modalMatches = modalsSection.match(/[-*]\s*([^\n]+)/g) || [];
    
    modalMatches.forEach(match => {
      const modalText = match.replace(/[-*]\s*/, '').trim();
      const modal = this.parseIndividualModal(modalText);
      if (modal) modals.push(modal);
    });

    return modals;
  }

  private parseIndividualModal(modalText: string): ModalDefinition | null {
    const parts = modalText.split(/[:-]/);
    const name = parts[0]?.trim();
    const description = parts.slice(1).join(':').trim() || modalText;

    if (!name) return null;

    return {
      id: this.generateId(),
      name,
      type: this.inferModalType(name),
      description,
      triggerScreens: ['*'], // Default to all screens
      components: this.inferModalComponents(name)
    };
  }

  private parseIntegrations(response: string): ThirdPartyIntegration[] {
    const integrations: ThirdPartyIntegration[] = [];
    
    const integrationsSection = this.extractSection(response, /third.party\s*integrations?/i, /##\s*\d+\./);
    if (!integrationsSection) return integrations;

    const integrationMatches = integrationsSection.match(/[-*]\s*([^\n]+)/g) || [];
    
    integrationMatches.forEach(match => {
      const integrationText = match.replace(/[-*]\s*/, '').trim();
      const integration = this.parseIndividualIntegration(integrationText);
      if (integration) integrations.push(integration);
    });

    return integrations;
  }

  private parseIndividualIntegration(integrationText: string): ThirdPartyIntegration | null {
    const parts = integrationText.split(/[:-]/);
    const name = parts[0]?.trim();
    const description = parts.slice(1).join(':').trim() || integrationText;

    if (!name) return null;

    return {
      name,
      type: this.inferIntegrationType(name),
      description,
      configRequired: this.inferConfigRequirements(name),
      implementationNotes: [`Configure ${name} integration`, `Add necessary API keys and configuration`]
    };
  }

  private parseArchitecture(): ArchitectureSuggestion {
    // For now, return a sensible default based on complexity
    return this.getDefaultArchitecture({ complexity: 'advanced' } as GenerationSettings);
  }

  // Helper methods for inference and generation
  private inferScreenType(name: string): AppScreen['type'] {
    if (name.toLowerCase().includes('modal') || name.toLowerCase().includes('popup')) return 'modal';
    if (name.toLowerCase().includes('drawer') || name.toLowerCase().includes('sidebar')) return 'drawer';
    return 'page';
  }

  private inferScreenCategory(name: string): AppScreen['category'] {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('login') || lowerName.includes('register') || lowerName.includes('auth')) return 'auth';
    if (lowerName.includes('setting') || lowerName.includes('profile')) return 'settings';
    if (lowerName.includes('onboard') || lowerName.includes('welcome')) return 'onboarding';
    if (lowerName.includes('error') || lowerName.includes('404')) return 'error';
    if (lowerName.includes('loading') || lowerName.includes('spinner')) return 'loading';
    return 'main';
  }

  private inferScreenComponents(name: string): ScreenComponent[] {
    // Basic inference based on screen name
    const components: ScreenComponent[] = [{ name: 'Header', type: 'header', description: 'Screen header with navigation' }];
    
    if (name.toLowerCase().includes('form') || name.toLowerCase().includes('login') || name.toLowerCase().includes('register')) {
      components.push({ name: 'Form', type: 'form', description: 'Input form with validation' });
    }
    
    if (name.toLowerCase().includes('list') || name.toLowerCase().includes('feed')) {
      components.push({ name: 'List', type: 'list', description: 'Scrollable list of items' });
    }

    return components;
  }

  private generateDefaultStates(): ScreenState[] {
    return [
      { name: 'default', type: 'default', description: 'Normal screen state', triggerConditions: ['on_load'] },
      { name: 'loading', type: 'loading', description: 'Loading data', triggerConditions: ['data_fetch'] }
    ];
  }

  private getDefaultUserRoles(): UserRole[] {
    return [
      {
        id: this.generateId(),
        name: 'User',
        description: 'Standard application user',
        permissions: ['read', 'create_own', 'update_own'],
        accessLevel: 'basic'
      },
      {
        id: this.generateId(),
        name: 'Admin',
        description: 'Administrator with full access',
        permissions: ['read', 'create', 'update', 'delete', 'admin'],
        accessLevel: 'admin'
      }
    ];
  }

  private inferRolePermissions(roleName: string): string[] {
    const lowerName = roleName.toLowerCase();
    if (lowerName.includes('admin')) return ['read', 'create', 'update', 'delete', 'admin'];
    if (lowerName.includes('moderator')) return ['read', 'create', 'update', 'moderate'];
    if (lowerName.includes('guest')) return ['read'];
    return ['read', 'create_own', 'update_own'];
  }

  private inferAccessLevel(roleName: string): UserRole['accessLevel'] {
    const lowerName = roleName.toLowerCase();
    if (lowerName.includes('admin')) return 'admin';
    if (lowerName.includes('moderator') || lowerName.includes('manager')) return 'advanced';
    return 'basic';
  }

  private generateDefaultFields(modelName: string): DataField[] {
    const baseFields: DataField[] = [
      { name: 'id', type: 'string', required: true, description: 'Unique identifier' },
      { name: 'created_at', type: 'date', required: true, description: 'Creation timestamp' },
      { name: 'updated_at', type: 'date', required: true, description: 'Last update timestamp' }
    ];

    // Add model-specific fields based on name
    const lowerName = modelName.toLowerCase();
    if (lowerName.includes('user')) {
      baseFields.push(
        { name: 'email', type: 'string', required: true, description: 'User email address' },
        { name: 'name', type: 'string', required: true, description: 'User display name' }
      );
    }

    return baseFields;
  }

  private inferModalType(name: string): ModalDefinition['type'] {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('confirm')) return 'confirmation';
    if (lowerName.includes('form')) return 'form';
    if (lowerName.includes('error')) return 'error';
    if (lowerName.includes('info')) return 'info';
    return 'custom';
  }

  private inferModalComponents(name: string): ScreenComponent[] {
    const type = this.inferModalType(name);
    const components: ScreenComponent[] = [];

    switch (type) {
      case 'confirmation':
        components.push(
          { name: 'Message', type: 'custom', description: 'Confirmation message' },
          { name: 'Confirm Button', type: 'button', description: 'Confirm action' },
          { name: 'Cancel Button', type: 'button', description: 'Cancel action' }
        );
        break;
      case 'form':
        components.push(
          { name: 'Form Fields', type: 'form', description: 'Input fields' },
          { name: 'Submit Button', type: 'button', description: 'Submit form' }
        );
        break;
      default:
        components.push({ name: 'Content', type: 'custom', description: 'Modal content' });
    }

    return components;
  }

  private inferIntegrationType(name: string): ThirdPartyIntegration['type'] {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('auth') || lowerName.includes('login') || lowerName.includes('google') || lowerName.includes('github')) return 'auth';
    if (lowerName.includes('storage') || lowerName.includes('s3') || lowerName.includes('file')) return 'storage';
    if (lowerName.includes('payment') || lowerName.includes('stripe') || lowerName.includes('paypal')) return 'payment';
    if (lowerName.includes('notification') || lowerName.includes('push') || lowerName.includes('email')) return 'notification';
    if (lowerName.includes('analytics') || lowerName.includes('tracking')) return 'analytics';
    return 'api';
  }

  private inferConfigRequirements(name: string): string[] {
    const type = this.inferIntegrationType(name);
    
    switch (type) {
      case 'auth':
        return ['Client ID', 'Client Secret', 'Redirect URI'];
      case 'storage':
        return ['Access Key', 'Secret Key', 'Bucket Name'];
      case 'payment':
        return ['API Key', 'Webhook Secret'];
      case 'notification':
        return ['API Key', 'Sender ID'];
      default:
        return ['API Key'];
    }
  }

  private getDefaultArchitecture(settings: GenerationSettings): ArchitectureSuggestion {
    const { appType, complexity } = settings;

    if (appType === 'mobile') {
      return {
        pattern: 'feature-foldering',
        reasoning: 'Feature-based architecture works well for mobile apps with clear separation of concerns',
        folderStructure: [
          { name: 'src', type: 'folder', description: 'Source code root' },
          { name: 'features', type: 'folder', description: 'Feature modules' },
          { name: 'shared', type: 'folder', description: 'Shared components and utilities' },
          { name: 'navigation', type: 'folder', description: 'Navigation configuration' }
        ],
        technologies: {
          frontend: ['React Native', 'TypeScript', 'React Navigation'],
          backend: ['Node.js', 'Express'],
          database: ['SQLite', 'Firebase'],
          deployment: ['App Store', 'Google Play'],
          testing: ['Jest', 'Detox']
        }
      };
    }

    return {
      pattern: complexity === 'production' ? 'clean' : 'component-based',
      reasoning: complexity === 'production' 
        ? 'Clean architecture provides excellent scalability and maintainability for production applications'
        : 'Component-based architecture offers good structure while remaining simple to implement',
      folderStructure: [
        { name: 'src', type: 'folder', description: 'Source code root' },
        { name: 'components', type: 'folder', description: 'Reusable UI components' },
        { name: 'pages', type: 'folder', description: 'Page components' },
        { name: 'hooks', type: 'folder', description: 'Custom React hooks' },
        { name: 'utils', type: 'folder', description: 'Utility functions' }
      ],
      technologies: {
        frontend: ['Next.js', 'TypeScript', 'Tailwind CSS'],
        backend: ['Next.js API Routes', 'Prisma'],
        database: ['PostgreSQL', 'Redis'],
        deployment: ['Vercel', 'Railway'],
        testing: ['Jest', 'Playwright']
      }
    };
  }

  private extractSection(text: string, startPattern: RegExp, endPattern: RegExp): string | null {
    const startMatch = text.match(startPattern);
    if (!startMatch) return null;

    const startIndex = startMatch.index! + startMatch[0].length;
    const remainingText = text.slice(startIndex);
    
    const endMatch = remainingText.match(endPattern);
    const endIndex = endMatch ? endMatch.index! : remainingText.length;

    return remainingText.slice(0, endIndex).trim();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

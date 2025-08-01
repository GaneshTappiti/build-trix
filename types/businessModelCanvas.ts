// Business Model Canvas Types and Interfaces

export interface BMCBlock {
  id: string;
  title: string;
  content: string;
  isGenerated: boolean;
  lastUpdated: Date;
  confidence?: number;
}

export interface BusinessModelCanvas {
  id: string;
  appIdea: string;
  createdAt: Date;
  updatedAt: Date;
  blocks: {
    customerSegments: BMCBlock;
    valueProposition: BMCBlock;
    channels: BMCBlock;
    customerRelationships: BMCBlock;
    revenueStreams: BMCBlock;
    keyResources: BMCBlock;
    keyActivities: BMCBlock;
    keyPartnerships: BMCBlock;
    costStructure: BMCBlock;
  };
  metadata?: {
    industry?: string;
    targetMarket?: string;
    businessType?: 'b2b' | 'b2c' | 'b2b2c';
    stage?: 'idea' | 'mvp' | 'growth' | 'scale';
  };
}

export interface BMCGenerationRequest {
  appIdea: string;
  industry?: string;
  targetMarket?: string;
  businessType?: 'b2b' | 'b2c' | 'b2b2c';
  additionalContext?: string;
}

export interface BMCGenerationResponse {
  success: boolean;
  canvas: BusinessModelCanvas;
  confidence: number;
  suggestions?: string[];
  error?: string;
}

export interface BMCBlockConfig {
  id: keyof BusinessModelCanvas['blocks'];
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  placeholder: string;
  examples: string[];
}

export const BMC_BLOCK_CONFIGS: BMCBlockConfig[] = [
  {
    id: 'customerSegments',
    title: 'Customer Segments',
    description: 'The different groups of people or organizations your business aims to reach and serve',
    icon: '👥',
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-600/20',
    placeholder: 'Who are your target customers?',
    examples: ['Young professionals', 'Small businesses', 'Enterprise clients']
  },
  {
    id: 'valueProposition',
    title: 'Value Proposition',
    description: 'The bundle of products and services that create value for your customer segments',
    icon: '💎',
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-green-600/20',
    placeholder: 'What value do you deliver to customers?',
    examples: ['Time savings', 'Cost reduction', 'Better user experience']
  },
  {
    id: 'channels',
    title: 'Channels',
    description: 'How your company communicates with and reaches its customer segments',
    icon: '📢',
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-purple-600/20',
    placeholder: 'How do you reach your customers?',
    examples: ['App stores', 'Social media', 'Direct sales']
  },
  {
    id: 'customerRelationships',
    title: 'Customer Relationships',
    description: 'The types of relationships you establish with specific customer segments',
    icon: '🤝',
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-orange-600/20',
    placeholder: 'What type of relationship do you have with customers?',
    examples: ['Self-service', 'Personal assistance', 'Community']
  },
  {
    id: 'revenueStreams',
    title: 'Revenue Streams',
    description: 'The cash your company generates from each customer segment',
    icon: '💰',
    color: 'text-yellow-400',
    gradient: 'from-yellow-500/20 to-yellow-600/20',
    placeholder: 'How do you make money?',
    examples: ['Subscription fees', 'One-time payments', 'Advertising']
  },
  {
    id: 'keyResources',
    title: 'Key Resources',
    description: 'The most important assets required to make your business model work',
    icon: '🔧',
    color: 'text-red-400',
    gradient: 'from-red-500/20 to-red-600/20',
    placeholder: 'What key resources do you need?',
    examples: ['Technology platform', 'Expert team', 'Brand']
  },
  {
    id: 'keyActivities',
    title: 'Key Activities',
    description: 'The most important things your company must do to make its business model work',
    icon: '⚡',
    color: 'text-indigo-400',
    gradient: 'from-indigo-500/20 to-indigo-600/20',
    placeholder: 'What key activities does your business require?',
    examples: ['Software development', 'Marketing', 'Customer support']
  },
  {
    id: 'keyPartnerships',
    title: 'Key Partnerships',
    description: 'The network of suppliers and partners that make the business model work',
    icon: '🤝',
    color: 'text-teal-400',
    gradient: 'from-teal-500/20 to-teal-600/20',
    placeholder: 'Who are your key partners?',
    examples: ['Technology providers', 'Distribution partners', 'Strategic alliances']
  },
  {
    id: 'costStructure',
    title: 'Cost Structure',
    description: 'All costs incurred to operate your business model',
    icon: '📊',
    color: 'text-pink-400',
    gradient: 'from-pink-500/20 to-pink-600/20',
    placeholder: 'What are your main costs?',
    examples: ['Development costs', 'Marketing expenses', 'Infrastructure costs']
  }
];

export interface BMCExportOptions {
  format: 'pdf' | 'markdown' | 'json';
  includeMetadata: boolean;
  includeTimestamps: boolean;
  template?: 'standard' | 'detailed' | 'pitch';
}

export interface BMCIntegrationData {
  canvas: BusinessModelCanvas;
  targetStage: number;
  integrationMode: 'append' | 'replace' | 'merge';
}

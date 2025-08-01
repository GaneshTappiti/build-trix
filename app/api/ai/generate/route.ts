import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BusinessModelCanvas, BMCGenerationRequest, BMCBlock, BMC_BLOCK_CONFIGS } from '@/types/businessModelCanvas';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(request: NextRequest) {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('GOOGLE_GEMINI_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'AI service not configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    const { prompt, type, options } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'business-model-canvas':
        result = await generateBusinessModelCanvas(JSON.parse(prompt));
        break;
      case 'bmc-block':
        const parsedData = JSON.parse(prompt);
        const { blockId, appIdea, existingCanvas } = parsedData;
        result = await generateBMCBlock(blockId, appIdea, existingCanvas);
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported generation type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('AI API Error:', error);

    let errorMessage = 'Failed to process AI request';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'AI service configuration error';
        statusCode = 500;
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'AI service temporarily unavailable. Please try again later.';
        statusCode = 429;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}

async function generateBusinessModelCanvas(request: BMCGenerationRequest) {
  const { appIdea, industry, targetMarket, businessType, additionalContext } = request;

  const prompt = `
You are an expert business strategist and consultant specializing in Business Model Canvas development. Create a comprehensive Business Model Canvas for the following business idea.

BUSINESS IDEA: "${appIdea}"
${industry ? `INDUSTRY: ${industry}` : ''}
${targetMarket ? `TARGET MARKET: ${targetMarket}` : ''}
${businessType ? `BUSINESS TYPE: ${businessType.toUpperCase()}` : ''}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

Please generate content for all 9 Business Model Canvas blocks. For each block, provide 2-4 concise, actionable bullet points. Make sure each block is distinct and avoid repetition across blocks.

Format your response as JSON with this exact structure:
{
  "customerSegments": "• [Point 1]\\n• [Point 2]\\n• [Point 3]",
  "valueProposition": "• [Point 1]\\n• [Point 2]\\n• [Point 3]",
  "channels": "• [Point 1]\\n• [Point 2]\\n• [Point 3]",
  "customerRelationships": "• [Point 1]\\n• [Point 2]\\n• [Point 3]",
  "revenueStreams": "• [Point 1]\\n• [Point 2]\\n• [Point 3]",
  "keyResources": "• [Point 1]\\n• [Point 2]\\n• [Point 3]",
  "keyActivities": "• [Point 1]\\n• [Point 2]\\n• [Point 3]",
  "keyPartnerships": "• [Point 1]\\n• [Point 2]\\n• [Point 3]",
  "costStructure": "• [Point 1]\\n• [Point 2]\\n• [Point 3]"
}

Guidelines:
- Customer Segments: Specific target groups, demographics, and user personas
- Value Proposition: Unique benefits, problem solutions, and competitive advantages
- Channels: Distribution methods, marketing channels, and customer touchpoints
- Customer Relationships: Relationship types, engagement strategies, and retention methods
- Revenue Streams: Income sources, pricing models, and monetization strategies
- Key Resources: Essential assets, technology, human resources, and intellectual property
- Key Activities: Core business operations, critical processes, and value-creating activities
- Key Partnerships: Strategic alliances, suppliers, and external collaborators
- Cost Structure: Major expenses, cost drivers, and operational costs

Ensure each block is professional, actionable, and tailored to the specific business idea.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let parsedContent;
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to template content
      parsedContent = generateFallbackContent(appIdea);
    }

    // Create the canvas object
    const canvasId = `bmc_${Date.now()}`;
    const now = new Date();

    const canvas: BusinessModelCanvas = {
      id: canvasId,
      appIdea,
      createdAt: now,
      updatedAt: now,
      blocks: {
        customerSegments: createBlock('customerSegments', parsedContent.customerSegments),
        valueProposition: createBlock('valueProposition', parsedContent.valueProposition),
        channels: createBlock('channels', parsedContent.channels),
        customerRelationships: createBlock('customerRelationships', parsedContent.customerRelationships),
        revenueStreams: createBlock('revenueStreams', parsedContent.revenueStreams),
        keyResources: createBlock('keyResources', parsedContent.keyResources),
        keyActivities: createBlock('keyActivities', parsedContent.keyActivities),
        keyPartnerships: createBlock('keyPartnerships', parsedContent.keyPartnerships),
        costStructure: createBlock('costStructure', parsedContent.costStructure),
      },
      metadata: {
        industry,
        targetMarket,
        businessType,
        stage: 'idea'
      }
    };

    return { canvas };
  } catch (error) {
    console.error('Error generating BMC:', error);
    
    // Return fallback canvas
    const canvasId = `bmc_${Date.now()}`;
    const now = new Date();
    const fallbackContent = generateFallbackContent(appIdea);

    const canvas: BusinessModelCanvas = {
      id: canvasId,
      appIdea,
      createdAt: now,
      updatedAt: now,
      blocks: {
        customerSegments: createBlock('customerSegments', fallbackContent.customerSegments),
        valueProposition: createBlock('valueProposition', fallbackContent.valueProposition),
        channels: createBlock('channels', fallbackContent.channels),
        customerRelationships: createBlock('customerRelationships', fallbackContent.customerRelationships),
        revenueStreams: createBlock('revenueStreams', fallbackContent.revenueStreams),
        keyResources: createBlock('keyResources', fallbackContent.keyResources),
        keyActivities: createBlock('keyActivities', fallbackContent.keyActivities),
        keyPartnerships: createBlock('keyPartnerships', fallbackContent.keyPartnerships),
        costStructure: createBlock('costStructure', fallbackContent.costStructure),
      },
      metadata: {
        industry,
        targetMarket,
        businessType,
        stage: 'idea'
      }
    };

    return { canvas };
  }
}

async function generateBMCBlock(blockId: string, appIdea: string, existingCanvas: BusinessModelCanvas): Promise<BMCBlock> {
  const blockConfig = BMC_BLOCK_CONFIGS.find(config => config.id === blockId);
  
  if (!blockConfig) {
    throw new Error(`Invalid block ID: ${blockId}`);
  }

  const prompt = `
You are an expert business strategist. Generate content for the "${blockConfig.title}" section of a Business Model Canvas.

BUSINESS IDEA: "${appIdea}"
BLOCK: ${blockConfig.title}
DESCRIPTION: ${blockConfig.description}

Provide 2-4 concise, actionable bullet points for this specific block. Format as:
• [Point 1]
• [Point 2]
• [Point 3]

Make sure the content is specific to this block and doesn't overlap with other BMC sections.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();

    return createBlock(blockId, content);
  } catch (error) {
    console.error(`Error generating block ${blockId}:`, error);
    
    // Return fallback content
    return createBlock(blockId, `Please customize this ${blockConfig.title.toLowerCase()} section for your business idea: "${appIdea}"\n\n${blockConfig.description}\n\nConsider: ${blockConfig.examples.join(', ')}`);
  }
}

function createBlock(id: string, content: string): BMCBlock {
  const config = BMC_BLOCK_CONFIGS.find(c => c.id === id);
  return {
    id,
    title: config?.title || id,
    content,
    isGenerated: true,
    lastUpdated: new Date(),
    confidence: 0.8
  };
}

function generateFallbackContent(appIdea: string) {
  return {
    customerSegments: `• Early adopters interested in ${appIdea}\n• Tech-savvy users seeking innovative solutions\n• Target demographic based on app functionality`,
    valueProposition: `• Solves key problems for target users\n• Provides unique features not available elsewhere\n• Delivers measurable value and benefits`,
    channels: `• Mobile app stores (iOS/Android)\n• Social media marketing\n• Word-of-mouth referrals`,
    customerRelationships: `• Self-service through app interface\n• Community support and forums\n• Regular updates and feature releases`,
    revenueStreams: `• Freemium model with premium features\n• In-app purchases or subscriptions\n• Potential advertising revenue`,
    keyResources: `• Mobile app development platform\n• User data and analytics\n• Brand and intellectual property`,
    keyActivities: `• App development and maintenance\n• User acquisition and marketing\n• Customer support and engagement`,
    keyPartnerships: `• App store platforms (Apple, Google)\n• Technology service providers\n• Marketing and analytics partners`,
    costStructure: `• Development and engineering costs\n• Marketing and user acquisition\n• Infrastructure and hosting expenses`
  };
}

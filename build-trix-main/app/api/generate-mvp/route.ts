import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/utils/supabase/server';
import { GenerateMVPRequest, GenerateMVPResponse, MVPIdeaFormData } from '@/types/questionnaire';
import { CreateMVPData } from '@/types/mvp';
import { consumeMVPRateLimit, checkMVPRateLimit, clearMVPRateLimit } from '@/lib/ratelimit';
import { enhancePromptWithRAG, addToolSpecificRequirements } from '@/lib/rag-enhancer';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateMVPRequest = await request.json();
    const { ideaDetails, questionnaire } = body;

    // Initialize Supabase client
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // First check rate limit without consuming (database-based check)
    const preCheckResult = await checkMVPRateLimit(user.id, supabase);
    if (!preCheckResult.success) {
      const resetDate = new Date(preCheckResult.reset).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      return NextResponse.json(
        {
          success: false,
          error: `Monthly MVP generation limit reached (${preCheckResult.limit} MVPs). Limit resets on ${resetDate}.`,
          rateLimitInfo: {
            limit: preCheckResult.limit,
            remaining: preCheckResult.remaining,
            used: preCheckResult.limit - preCheckResult.remaining,
            reset: preCheckResult.reset,
            resetDate,
          },
        },
        { status: 429 },
      );
    }

    // Only consume the rate limit slot if we're actually going to create the MVP
    const rateLimitResult = await consumeMVPRateLimit(user.id);
    if (!rateLimitResult.success) {
      // Redis rate limiter thinks limit is exceeded, but database check passed
      // This suggests Redis has stale/incorrect data from the previous bug
      console.log(
        `Rate limit mismatch detected for user ${user.id}. Database shows ${preCheckResult.remaining} remaining, but Redis failed.`,
      );

      // Clear the Redis rate limit data and try again
      console.log('Attempting to clear stale Redis rate limit data...');
      await clearMVPRateLimit(user.id);

      // Try consuming again after clearing
      const retryRateLimitResult = await consumeMVPRateLimit(user.id);
      if (!retryRateLimitResult.success) {
        // If it still fails after clearing, respect the database count
        const resetDate = new Date(preCheckResult.reset).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        return NextResponse.json(
          {
            success: false,
            error: `Rate limit system detected inconsistency. Based on database count, you have used ${preCheckResult.limit - preCheckResult.remaining}/${preCheckResult.limit} MVPs this month.`,
            rateLimitInfo: {
              limit: preCheckResult.limit,
              remaining: preCheckResult.remaining,
              used: preCheckResult.limit - preCheckResult.remaining,
              reset: preCheckResult.reset,
              resetDate,
            },
          },
          { status: 429 },
        );
      }
      // If retry succeeded, continue with MVP creation
      console.log('Successfully cleared stale rate limit data and retried.');
    }

    // Step 1: Create MVP project in database
    const mvpData: CreateMVPData = {
      app_name: ideaDetails.app_name,
      platforms: ideaDetails.platforms as ('web' | 'mobile')[],
      style: ideaDetails.style as 'Minimal & Clean' | 'Playful & Animated' | 'Business & Professional',
      style_description: ideaDetails.style_description,
      app_description: ideaDetails.app_description,
      target_users: ideaDetails.target_users,
      generated_prompt: '', // Will be updated later
      status: 'Yet To Build',
    };

    const { data: mvpProject, error: mvpError } = await supabase
      .from('mvps')
      .insert([
        {
          ...mvpData,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (mvpError || !mvpProject) {
      console.error('Error creating MVP project:', mvpError);
      return NextResponse.json({ success: false, error: 'Failed to create MVP project' }, { status: 500 });
    }

    // Step 2: Store questionnaire responses
    const questionnaireData = {
      ...questionnaire,
      mvp_id: mvpProject.id,
      user_id: user.id,
    };

    const { error: questionnaireError } = await supabase.from('questionnaire').insert([questionnaireData]);

    if (questionnaireError) {
      console.error('Error storing questionnaire:', questionnaireError);
      // Continue with MVP generation even if questionnaire storage fails
    }

    // Step 3: Generate AI prompt using Gemini
    const generatedPrompt = await generateMVPPrompt(ideaDetails, questionnaire);

    // Step 4: Update MVP project with generated prompt
    const { error: updateError } = await supabase
      .from('mvps')
      .update({ generated_prompt: generatedPrompt })
      .eq('id', mvpProject.id);

    if (updateError) {
      console.error('Error updating MVP with prompt:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update MVP with generated prompt' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      mvp_id: mvpProject.id,
    } as GenerateMVPResponse);
  } catch (error) {
    console.error('Error in generate-mvp endpoint:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

async function generateMVPPrompt(
  ideaDetails: MVPIdeaFormData,
  questionnaire: { idea_validated: boolean; talked_to_people: boolean; motivation?: string },
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const config = {
    thinkingConfig: {
      thinkingBudget: -1,
    },
    responseMimeType: 'text/plain',
  };

  const model = 'gemini-2.5-flash';

  // Build comprehensive prompt based on user inputs
  const basePrompt = buildPromptFromInputs(ideaDetails, questionnaire);

  // Enhance with RAG for tool-specific optimization
  const inputPrompt = await enhancePromptWithRAG(basePrompt, ideaDetails, questionnaire);

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: inputPrompt,
        },
      ],
    },
  ];

  try {
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let generatedText = '';
    for await (const chunk of response) {
      generatedText += chunk.text || '';
    }

    return generatedText.trim();
  } catch (error) {
    console.error('Error generating content with Gemini:', error);
    throw new Error('Failed to generate MVP prompt with AI');
  }
}

function buildPromptFromInputs(
  ideaDetails: MVPIdeaFormData,
  questionnaire: { idea_validated: boolean; talked_to_people: boolean; motivation?: string },
): string {
  const { app_name, platforms, style, style_description, app_description, target_users } = ideaDetails;

  const { idea_validated, talked_to_people, motivation } = questionnaire;

  return `You are an expert UI/UX design strategist specializing in creating comprehensive prompts for AI development tools. Your role is to analyze app requirements and generate detailed UI/UX-focused prompts that AI builders (Lovable.dev, Cursor IDE, Bolt.new, etc.) can immediately use to create beautiful, functional interfaces.

## HOW TO THINK ABOUT THIS TASK:

**🧠 Your Mental Framework:**
1. **Visual-First Approach**: Think like a designer who sees the complete user journey before writing a single line of code
2. **Component-Driven Thinking**: Break down the UI into reusable, semantic components that AI tools can easily implement
3. **User-Centered Design**: Every UI decision should serve a clear user need and follow established UX principles
4. **Platform-Aware Design**: Consider the unique constraints and opportunities of ${platforms.join(' and ')} platform(s)
5. **AI Tool Optimization**: Structure your output so AI builders can immediately start creating components without ambiguity

## APP CONTEXT TO ANALYZE:

**App Name:** ${app_name}
**Platforms:** ${platforms.join(', ')}
**Design Style:** ${style}
${style_description ? `**Style Details:** ${style_description}` : ''}
**App Description:** ${app_description}
${target_users ? `**Target Users:** ${target_users}` : ''}

**Validation Status:** ${idea_validated ? 'Validated' : 'Unvalidated'} | **User Research:** ${talked_to_people ? 'Conducted' : 'Pending'}
${motivation ? `**Core Motivation:** ${motivation}` : ''}

## YOUR TASK: Generate a UI/UX-Focused Development Prompt

**🎯 PROMPT STRUCTURE TO CREATE:**

**1. COMPREHENSIVE DESIGN SYSTEM & THEME**
Build a complete visual identity system:

**🎨 Theme & Visual Aesthetics (${style} Style):**
- **Brand Personality**: Define how "${style}" translates to visual elements, mood, and user perception
- **Visual Language**: ${style === 'Minimal & Clean' ? 'Clean lines, ample white space, subtle shadows, geometric shapes' : style === 'Playful & Animated' ? 'Rounded corners, vibrant colors, micro-animations, friendly illustrations' : 'Professional typography, structured layouts, corporate color schemes, formal imagery'}
${style_description ? `- **Custom Style Notes**: Incorporate "${style_description}" into every design decision` : ''}
- **Aesthetic Hierarchy**: Primary visual elements that establish brand recognition and user trust

**🖼️ Color System & Theme:**
- **Primary Palette**: Main brand colors (2-3 colors) that reflect "${style}" aesthetic
- **Secondary Palette**: Supporting colors for variety and visual interest
- **Semantic Colors**: Success (green), warning (amber), error (red), info (blue)
- **Neutral Scale**: 8-10 grayscale values for text, borders, backgrounds
- **Theme Variants**: Light mode primary, consider dark mode adaptation
- **Color Usage Rules**: When to use each color, contrast requirements, accessibility compliance

**✍️ Typography System:**
- **Font Selection**: Choose fonts that embody "${style}" personality
- **Type Scale**: Mobile (14px, 16px, 18px, 20px, 24px) Desktop (16px, 18px, 20px, 24px, 32px)
- **Font Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)
- **Line Heights**: Optimal readability ratios (1.4 for body, 1.2 for headlines)
- **Letter Spacing**: Subtle adjustments for different text sizes and contexts

**📏 Spacing & Layout System:**
- **Base Unit**: 4px foundation with 8px, 12px, 16px, 24px, 32px, 48px, 64px increments
- **Component Spacing**: Internal padding patterns for buttons, cards, forms
- **Layout Spacing**: Margins between sections, content blocks, navigation elements
- **Grid System**: 12-column responsive grid with consistent gutters

**2. COMPLETE SCREEN BREAKDOWN**
${platforms.includes('mobile') ? 'Mobile-First' : 'Desktop-First'} approach with these screens:

For EACH screen, define:
🖼️ **Screen Name & Purpose**
📐 **Layout Structure** (Header → Content → Footer/Navigation)
🔘 **Key UI Components** (specific buttons, forms, cards, lists)
🔗 **Navigation & Interactions** (what happens when user taps/clicks)
📱 **Responsive Behavior** (how it adapts across breakpoints)

**Essential Screens to Design:**
- Landing/Home screen with clear value proposition
- ${!idea_validated ? 'Feedback collection interface for validation' : 'Core feature interface based on validation'}
- Navigation system (${platforms.includes('mobile') ? 'bottom tabs or drawer' : 'header nav or sidebar'})
- User profile/settings area
- ${platforms.includes('mobile') ? 'Mobile-optimized forms and touch interactions' : 'Desktop-optimized layouts with hover states'}

**3. TECHNICAL UI IMPLEMENTATION & COMPONENT STYLING**
Frontend stack optimized for AI builders:
- **Framework**: ${platforms.includes('web') ? 'Next.js 14+ with App Router' : ''}${platforms.includes('mobile') ? 'React Native/Expo or Next.js PWA' : ''}
- **Styling Architecture**: Tailwind CSS + Shadcn/ui components for rapid development
- **State Management**: React hooks for UI state, placeholder integration points for future data
- **Icon System**: Lucide React or similar consistent icon library

**🔧 Component Styling Patterns:**
- **Button Hierarchy**: Primary (${style === 'Minimal & Clean' ? 'subtle gradients, clean borders' : style === 'Playful & Animated' ? 'rounded, vibrant colors, hover animations' : 'structured, professional appearance'}), Secondary, Ghost, Destructive variants
- **Input Styling**: Form fields that match "${style}" aesthetic with proper focus states, validation styling
- **Card Components**: Consistent elevation, borders, and internal spacing following design system
- **Navigation Elements**: ${platforms.includes('mobile') ? 'Bottom tabs with active states and smooth transitions' : 'Header navigation with hover effects and clear hierarchy'}
- **Typography Components**: Heading, body text, captions with consistent styling and responsive behavior

**🎭 Style-Specific Implementation:**
${style === 'Minimal & Clean' ? '- Clean, borderless inputs with subtle focus indicators\n- Soft shadows and minimal visual noise\n- Monochromatic color schemes with strategic accent usage\n- Generous white space and clean typography' : ''}${style === 'Playful & Animated' ? '- Rounded corners on all interactive elements\n- Vibrant color combinations and gradients\n- Micro-animations on hover, click, and page transitions\n- Friendly iconography and illustrative elements' : ''}${style === 'Business & Professional' ? '- Structured layouts with clear information hierarchy\n- Professional color palette (blues, grays, whites)\n- Formal typography choices and conservative spacing\n- Corporate-appropriate imagery and iconography' : ''}

**4. RESPONSIVE DESIGN SPECIFICATIONS**
- **Breakpoints**: sm(640px), md(768px), lg(1024px), xl(1280px)
- **Mobile UX**: 44px minimum touch targets, thumb-zone optimization, swipe gestures
- **Desktop UX**: Hover states, keyboard navigation, multi-column layouts
- **Cross-Platform**: Consistent core experience with platform-specific optimizations

**5. ACCESSIBILITY & VISUAL DESIGN POLISH**
- **WCAG 2.1 AA Compliance**: 
  - Contrast ratios (4.5:1 normal text, 3:1 large text) validated against "${style}" color palette
  - ARIA labels and semantic HTML structure
  - Keyboard navigation with visible focus indicators matching theme
  - Screen reader compatibility with descriptive alt text

- **Visual Feedback Systems**:
  - **Loading States**: ${style === 'Minimal & Clean' ? 'Clean skeleton loaders with subtle animations' : style === 'Playful & Animated' ? 'Bouncy loading animations and colorful progress indicators' : 'Professional progress bars and discrete loading indicators'}
  - **Empty States**: Contextual illustrations and messaging that align with "${style}" personality
  - **Error Handling**: User-friendly error messages with appropriate iconography and color coding
  - **Success States**: Confirmation feedback that matches the overall design aesthetic

- **Interactive Design Elements**:
  - **Micro-interactions**: ${style === 'Minimal & Clean' ? 'Subtle hover effects and clean transitions (0.2s ease)' : style === 'Playful & Animated' ? 'Bouncy animations, scale transforms, and delightful interactions' : 'Professional hover states and smooth, purposeful transitions'}
  - **Focus States**: Clear visual indicators that maintain theme consistency
  - **Active States**: Button press feedback and selection indicators
  - **Disabled States**: Appropriate visual treatment while maintaining accessibility

**6. PLACEHOLDER INTEGRATION POINTS**
Set up clear spots for future functionality:
- **Data Integration**: Component props ready for real API data
- **Authentication**: UI components designed for future auth states (logged in/out)
- **Dynamic Content**: Flexible layouts that work with various content types
- **User Actions**: Buttons and forms ready for future backend integration
- **Analytics**: UI events and tracking points clearly marked

${
  motivation
    ? `
**7. MOTIVATION-ALIGNED DESIGN**
Based on "${motivation}", ensure the UI prioritizes:
- Visual elements that reinforce the core motivation
- User flows that support the primary use case
- Design patterns that encourage the desired user behavior
`
    : ''
}

**🎨 FINAL PROMPT REQUIREMENTS:**

Your generated prompt should be:
- **Immediately Actionable**: AI tools can start building without clarification
- **Visually Comprehensive**: Detailed specifications for colors, typography, spacing, shadows, borders, and animations
- **Theme-Consistent**: Every visual element aligned with "${style}" aesthetic and brand personality
- **Component-Focused**: Broken down into styled, reusable UI components with specific design specifications
- **User-Centric**: Every design decision explained in terms of user benefit and visual hierarchy
- **Platform-Optimized**: Tailored for ${platforms.join(' and ')} with platform-specific styling considerations
- **Style-Aware**: Incorporates the nuances of "${style}" style throughout all design decisions
- **Future-Ready**: Structured for easy integration of backend functionality while maintaining visual consistency

**Generate a prompt that creates a cohesive, beautiful, and professionally styled interface that embodies "${style}" design principles and would make both a senior designer proud and a developer excited to build.**`;
}

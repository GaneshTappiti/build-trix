"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, ArrowRight, ArrowLeft, Copy, Check, Loader2 } from "lucide-react";
import { useBuilder, builderActions, ScreenPrompt } from "@/lib/builderContext";

export function PromptGeneratorCard() {
  const { state, dispatch } = useBuilder();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const generateScreenPrompts = async () => {
    if (!state.appBlueprint) return;

    setIsGenerating(true);
    dispatch(builderActions.setGenerating(true));
    dispatch(builderActions.clearScreenPrompts());

    try {
      for (const screen of state.appBlueprint.screens) {
        const prompt: ScreenPrompt = {
          screenId: screen.id,
          title: `${screen.name} Implementation`,
          layout: generateLayoutPrompt(screen),
          components: generateComponentsPrompt(screen),
          behavior: generateBehaviorPrompt(screen),
          conditionalLogic: generateConditionalLogic(screen),
          styleHints: generateStyleHints(screen)
        };

        dispatch(builderActions.addScreenPrompt(prompt));
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate generation time
      }

      dispatch(builderActions.saveProject());
    } catch (error) {
      console.error('Error generating prompts:', error);
      dispatch(builderActions.setError('Failed to generate screen prompts'));
    } finally {
      setIsGenerating(false);
      dispatch(builderActions.setGenerating(false));
    }
  };

  const generateLayoutPrompt = (screen: any): string => {
    return `Create a ${state.appIdea.designStyle} ${screen.name.toLowerCase()} with the following layout:
- Purpose: ${screen.purpose}
- Platform: ${state.appIdea.platforms.join(', ')}
- Components: ${screen.components.join(', ')}
- Navigation: Links to ${screen.navigation.join(', ')}`;
  };

  const generateComponentsPrompt = (screen: any): string => {
    return `Implement these components for ${screen.name}:
${screen.components.map((comp: string) => `- ${comp}: Interactive and responsive`).join('\n')}

Style: ${state.appIdea.designStyle}
${state.appIdea.styleDescription ? `Additional style notes: ${state.appIdea.styleDescription}` : ''}`;
  };

  const generateBehaviorPrompt = (screen: any): string => {
    return `Add these behaviors to ${screen.name}:
- User interactions for all clickable elements
- Form validation (if applicable)
- Loading states for async operations
- Error handling and user feedback
- Responsive design for ${state.appIdea.platforms.join(' and ')}`;
  };

  const generateConditionalLogic = (screen: any): string => {
    return `Implement conditional logic for ${screen.name}:
- Show/hide elements based on user state
- Handle different user roles: ${state.appBlueprint?.userRoles.map(r => r.name).join(', ')}
- Navigation guards and permissions
- Dynamic content based on data availability`;
  };

  const generateStyleHints = (screen: any): string => {
    const styleMap = {
      minimal: 'Clean lines, plenty of whitespace, subtle shadows, neutral colors',
      playful: 'Bright colors, rounded corners, animations, fun illustrations',
      business: 'Professional colors, structured layout, clear hierarchy, corporate feel'
    };

    return `Style this ${screen.name} with ${state.appIdea.designStyle} design:
- ${styleMap[state.appIdea.designStyle]}
- Consistent with overall app theme
- Accessible and user-friendly
${state.appIdea.styleDescription ? `- ${state.appIdea.styleDescription}` : ''}`;
  };

  const copyToClipboard = async (text: string, promptId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(promptId);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getFullPrompt = (prompt: ScreenPrompt): string => {
    return `${prompt.title}

LAYOUT:
${prompt.layout}

COMPONENTS:
${prompt.components}

BEHAVIOR:
${prompt.behavior}

CONDITIONAL LOGIC:
${prompt.conditionalLogic}

STYLE HINTS:
${prompt.styleHints}`;
  };

  const handlePrevious = () => {
    dispatch(builderActions.setCurrentCard(3));
  };

  const handleNext = () => {
    if (state.screenPrompts.length === 0) {
      dispatch(builderActions.setError('Please generate screen prompts first'));
      return;
    }
    dispatch(builderActions.setCurrentCard(5));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-orange-400" />
          Prompt Generator
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Generate detailed prompts for each screen
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {state.screenPrompts.length === 0 && !isGenerating && (
          <div className="text-center py-8">
            <Wand2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Generate Screen Prompts</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create detailed implementation prompts for each screen in your app blueprint.
            </p>
            <Button onClick={generateScreenPrompts} size="lg" disabled={!state.appBlueprint}>
              Generate Prompts
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Generating Prompts...</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Creating detailed prompts for {state.appBlueprint?.screens.length} screens
            </p>
          </div>
        )}

        {state.screenPrompts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Screen Prompts ({state.screenPrompts.length})</h3>
              <Badge variant="outline">Ready for implementation</Badge>
            </div>

            <Tabs defaultValue={state.screenPrompts[0]?.screenId} className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
                {state.screenPrompts.slice(0, 4).map((prompt) => (
                  <TabsTrigger key={prompt.screenId} value={prompt.screenId} className="text-xs">
                    {prompt.title.replace(' Implementation', '')}
                  </TabsTrigger>
                ))}
              </TabsList>

              {state.screenPrompts.map((prompt) => (
                <TabsContent key={prompt.screenId} value={prompt.screenId} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{prompt.title}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(getFullPrompt(prompt), prompt.screenId)}
                    >
                      {copiedPrompt === prompt.screenId ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Full Prompt
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Layout</h5>
                      <Textarea
                        value={prompt.layout}
                        readOnly
                        className="min-h-[80px] text-sm"
                      />
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-2">Components</h5>
                      <Textarea
                        value={prompt.components}
                        readOnly
                        className="min-h-[80px] text-sm"
                      />
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-2">Behavior</h5>
                      <Textarea
                        value={prompt.behavior}
                        readOnly
                        className="min-h-[80px] text-sm"
                      />
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-2">Style Hints</h5>
                      <Textarea
                        value={prompt.styleHints}
                        readOnly
                        className="min-h-[60px] text-sm"
                      />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={handlePrevious}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={state.screenPrompts.length === 0}
          >
            Next Step
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

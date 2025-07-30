"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Copy, Check, ArrowLeft, Loader2, Sparkles, Database, ExternalLink } from "lucide-react";
import { useBuilder, builderActions, ExportPrompts } from "@/lib/builderContext";

const AI_TOOLS = [
  { id: 'cursor', name: 'Cursor', description: 'AI-powered code editor' },
  { id: 'v0', name: 'v0.dev', description: 'Vercel\'s AI UI generator' },
  { id: 'claude', name: 'Claude', description: 'Anthropic\'s AI assistant' },
  { id: 'chatgpt', name: 'ChatGPT', description: 'OpenAI\'s conversational AI' },
  { id: 'copilot', name: 'GitHub Copilot', description: 'AI pair programmer' },
  { id: 'replit', name: 'Replit Agent', description: 'AI coding assistant' }
];

export function ExportComposerCard() {
  const { state, dispatch } = useBuilder();
  const [selectedTool, setSelectedTool] = useState('cursor');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [isSavingToDatabase, setIsSavingToDatabase] = useState(false);
  const [savedMvpId, setSavedMvpId] = useState<string | null>(null);

  const generateExportPrompts = async () => {
    if (!state.appBlueprint || !state.screenPrompts.length || !state.appFlow) {
      dispatch(builderActions.setError('Please complete all previous steps first'));
      return;
    }

    setIsGenerating(true);
    dispatch(builderActions.setGenerating(true));

    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate generation

      const exportPrompts: ExportPrompts = {
        unifiedPrompt: generateUnifiedPrompt(),
        screenByScreenPrompts: state.screenPrompts,
        targetTool: selectedTool
      };

      dispatch(builderActions.setExportPrompts(exportPrompts));
      dispatch(builderActions.saveProject());
    } catch (error) {
      console.error('Error generating export prompts:', error);
      dispatch(builderActions.setError('Failed to generate export prompts'));
    } finally {
      setIsGenerating(false);
      dispatch(builderActions.setGenerating(false));
    }
  };

  const generateUnifiedPrompt = (): string => {
    const tool = AI_TOOLS.find(t => t.id === selectedTool);
    
    return `# ${state.appIdea.appName} - Complete Implementation Guide

## Project Overview
**App Name:** ${state.appIdea.appName}
**Platforms:** ${state.appIdea.platforms.join(', ')}
**Design Style:** ${state.appIdea.designStyle}
**Target Tool:** ${tool?.name}

## App Description
${state.appIdea.ideaDescription}

${state.appIdea.targetAudience ? `## Target Audience\n${state.appIdea.targetAudience}\n` : ''}

## User Motivation & Validation
${state.validationQuestions.motivation}

Validation Status:
- Market Research: ${state.validationQuestions.hasValidated ? 'Completed' : 'Not completed'}
- User Discussions: ${state.validationQuestions.hasDiscussed ? 'Completed' : 'Not completed'}

## Architecture Overview
${state.appBlueprint?.architecture}
${state.appBlueprint?.suggestedPattern ? `Pattern: ${state.appBlueprint.suggestedPattern}` : ''}

## Screens & Components
${state.appBlueprint?.screens.map(screen => `
### ${screen.name}
- **Purpose:** ${screen.purpose}
- **Type:** ${screen.type}
- **Components:** ${screen.components.join(', ')}
- **Navigation:** ${screen.navigation.join(', ')}
`).join('')}

## User Roles
${state.appBlueprint?.userRoles.map(role => `
### ${role.name}
- **Description:** ${role.description}
- **Permissions:** ${role.permissions.join(', ')}
`).join('')}

## Data Models
${state.appBlueprint?.dataModels.map(model => `
### ${model.name}
- **Description:** ${model.description}
- **Fields:** ${model.fields.join(', ')}
${model.relationships ? `- **Relationships:** ${model.relationships.join(', ')}` : ''}
`).join('')}

## App Flow & Navigation
${state.appFlow?.flowLogic}

### Conditional Routing
${state.appFlow?.conditionalRouting.map(rule => `- ${rule}`).join('\n')}

### Back Button Behavior
${state.appFlow?.backButtonBehavior}

### Screen Transitions
${state.appFlow?.screenTransitions.map(transition => `- ${transition}`).join('\n')}

## Implementation Instructions
1. Start with the basic project structure
2. Implement authentication and user management
3. Create the main navigation and routing
4. Build each screen according to the detailed prompts
5. Add the app flow and conditional logic
6. Style according to ${state.appIdea.designStyle} design principles
7. Test on ${state.appIdea.platforms.join(' and ')} platforms

## Style Guidelines
- **Design Style:** ${state.appIdea.designStyle}
${state.appIdea.styleDescription ? `- **Additional Notes:** ${state.appIdea.styleDescription}` : ''}
- **Responsive:** Optimize for ${state.appIdea.platforms.join(' and ')}
- **Accessibility:** Follow WCAG guidelines
- **Performance:** Optimize for fast loading and smooth interactions

## Next Steps
1. Copy this prompt to ${tool?.name}
2. Start with the project setup and basic structure
3. Implement screens one by one using the detailed prompts
4. Test functionality and user flow
5. Iterate based on user feedback

---
Generated by BuildTrix MVP Studio`;
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

  const handlePrevious = () => {
    dispatch(builderActions.setCurrentCard(5));
  };

  const handleSaveToDatabase = () => {
    setIsSavingToDatabase(true);
    dispatch(builderActions.saveToDatabase({
      onSuccess: (mvpId: string) => {
        setSavedMvpId(mvpId);
        setIsSavingToDatabase(false);
        dispatch(builderActions.saveProject()); // Also save locally
      },
      onError: (error: string) => {
        setIsSavingToDatabase(false);
        dispatch(builderActions.setError(error));
      }
    }));
  };

  const handleComplete = () => {
    // Mark project as completed
    dispatch(builderActions.saveProject());
    // Could redirect to project dashboard or show completion message
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-green-400" />
          Export Composer
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Generate final prompts for your chosen AI tool
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!state.exportPrompts && !isGenerating && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Choose your AI tool</label>
              <Select value={selectedTool} onValueChange={setSelectedTool}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an AI tool" />
                </SelectTrigger>
                <SelectContent>
                  {AI_TOOLS.map((tool) => (
                    <SelectItem key={tool.id} value={tool.id}>
                      <div>
                        <div className="font-medium">{tool.name}</div>
                        <div className="text-xs text-gray-500">{tool.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center py-8">
              <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Generate Export Prompts</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create optimized prompts for {AI_TOOLS.find(t => t.id === selectedTool)?.name} to build your app.
              </p>
              <Button onClick={generateExportPrompts} size="lg">
                Generate Export Prompts
              </Button>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Generating Export Prompts...</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Creating optimized prompts for {AI_TOOLS.find(t => t.id === selectedTool)?.name}
            </p>
          </div>
        )}

        {state.exportPrompts && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Export Ready!</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Target: {AI_TOOLS.find(t => t.id === state.exportPrompts?.targetTool)?.name}
                </Badge>
                {savedMvpId && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Saved to Database
                  </Badge>
                )}
              </div>
            </div>

            {/* Save to Database Section */}
            {!savedMvpId && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Save to Your MVPs</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Save this project to your MVP collection for future reference and tracking.
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveToDatabase}
                    disabled={isSavingToDatabase}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSavingToDatabase ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Save to Database
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {savedMvpId && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">✅ Saved Successfully!</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your MVP project has been saved to your collection.
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <a href={`/your-mvps/${savedMvpId}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View MVP
                    </a>
                  </Button>
                </div>
              </div>
            )}

            <Tabs defaultValue="unified" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unified">Unified Prompt</TabsTrigger>
                <TabsTrigger value="screens">Screen-by-Screen</TabsTrigger>
              </TabsList>

              <TabsContent value="unified" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Complete Implementation Prompt</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(state.exportPrompts!.unifiedPrompt, 'unified')}
                  >
                    {copiedPrompt === 'unified' ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Prompt
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={state.exportPrompts.unifiedPrompt}
                  readOnly
                  className="min-h-[400px] text-sm font-mono"
                />
              </TabsContent>

              <TabsContent value="screens" className="space-y-4">
                <h4 className="font-medium">Individual Screen Prompts</h4>
                <div className="space-y-4">
                  {state.exportPrompts.screenByScreenPrompts.map((prompt) => (
                    <div key={prompt.screenId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{prompt.title}</h5>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(
                            `${prompt.title}\n\n${prompt.layout}\n\n${prompt.components}\n\n${prompt.behavior}\n\n${prompt.styleHints}`,
                            prompt.screenId
                          )}
                        >
                          {copiedPrompt === prompt.screenId ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Detailed implementation prompt for this screen
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>
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
          {state.exportPrompts && (
            <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
              <Check className="mr-2 h-4 w-4" />
              Complete Project
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

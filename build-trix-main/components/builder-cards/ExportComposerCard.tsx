"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Copy, Check, ArrowLeft, Loader2, Sparkles, Database, ExternalLink, Zap } from "lucide-react";
import { useBuilder, builderActions, ExportPrompts } from "@/lib/builderContext";
import { useRAG, createRAGRequest } from "@/hooks/useRAG";
import { SupportedTool, PromptStage, AI_TOOL_OPTIONS } from "@/types/rag";

export function ExportComposerCard() {
  const { state, dispatch } = useBuilder();
  const { generatePrompt, isGenerating: ragGenerating, error: ragError } = useRAG();
  const [selectedTool, setSelectedTool] = useState<string>(
    state.validationQuestions.preferredAITool || 'cursor'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [isSavingToDatabase, setIsSavingToDatabase] = useState(false);
  const [savedMvpId, setSavedMvpId] = useState<string | null>(null);
  const [ragPrompt, setRagPrompt] = useState<string | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [enhancementSuggestions, setEnhancementSuggestions] = useState<string[]>([]);

  // Set the selected tool from validation questions on mount
  useEffect(() => {
    if (state.validationQuestions.preferredAITool) {
      setSelectedTool(state.validationQuestions.preferredAITool);
    }
  }, [state.validationQuestions.preferredAITool]);

  const generateExportPrompts = async () => {
    if (!state.appBlueprint || !state.screenPrompts.length || !state.appFlow) {
      dispatch(builderActions.setError('Please complete all previous steps first'));
      return;
    }

    setIsGenerating(true);
    dispatch(builderActions.setGenerating(true));

    try {
      // Generate RAG-enhanced prompt
      const ragRequest = createRAGRequest(
        state.appIdea,
        state.validationQuestions,
        selectedTool as SupportedTool,
        PromptStage.OPTIMIZATION, // Final stage for export
        state.appBlueprint,
        state.screenPrompts,
        state.appFlow
      );

      const ragResponse = await generatePrompt(ragRequest);

      if (ragResponse && ragResponse.success) {
        setRagPrompt(ragResponse.prompt || null);
        setConfidenceScore(ragResponse.confidenceScore || null);
        setEnhancementSuggestions(ragResponse.enhancementSuggestions || []);

        const exportPrompts: ExportPrompts = {
          unifiedPrompt: ragResponse.prompt || generateFallbackPrompt(),
          screenByScreenPrompts: state.screenPrompts,
          targetTool: selectedTool
        };

        dispatch(builderActions.setExportPrompts(exportPrompts));
        dispatch(builderActions.saveProject());
      } else {
        // Fallback to basic prompt generation
        const exportPrompts: ExportPrompts = {
          unifiedPrompt: generateFallbackPrompt(),
          screenByScreenPrompts: state.screenPrompts,
          targetTool: selectedTool
        };

        dispatch(builderActions.setExportPrompts(exportPrompts));
        dispatch(builderActions.saveProject());
      }
    } catch (error) {
      console.error('Error generating export prompts:', error);
      dispatch(builderActions.setError('Failed to generate export prompts'));
    } finally {
      setIsGenerating(false);
      dispatch(builderActions.setGenerating(false));
    }
  };

  const generateFallbackPrompt = (): string => {
    const tool = AI_TOOL_OPTIONS.find(t => t.id === selectedTool);
    
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
          <Badge variant="secondary" className="ml-2">
            <Zap className="w-3 h-3 mr-1" />
            RAG Enhanced
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Generate AI-optimized prompts tailored for your chosen development tool
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!state.exportPrompts && !isGenerating && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Choose your AI tool
                {state.validationQuestions.preferredAITool && (
                  <Badge variant="outline" className="ml-2">
                    Pre-selected from Stage 2
                  </Badge>
                )}
              </label>
              <Select value={selectedTool} onValueChange={setSelectedTool}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an AI tool" />
                </SelectTrigger>
                <SelectContent>
                  {AI_TOOL_OPTIONS.map((tool) => (
                    <SelectItem key={tool.id} value={tool.id}>
                      <div>
                        <div className="font-medium">{tool.name}</div>
                        <div className="text-xs text-gray-500">{tool.description}</div>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {tool.category.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {tool.complexity}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center py-8">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <Zap className="w-6 h-6 text-blue-500 absolute top-0 right-1/2 transform translate-x-8" />
              </div>
              <h3 className="text-lg font-medium mb-2">Generate RAG-Enhanced Prompts</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create AI-optimized prompts for {AI_TOOL_OPTIONS.find(t => t.id === selectedTool)?.name} using advanced prompt engineering.
              </p>
              <Button onClick={generateExportPrompts} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Zap className="w-4 h-4 mr-2" />
                Generate RAG Prompts
              </Button>
            </div>
          </div>
        )}

        {(isGenerating || ragGenerating) && (
          <div className="text-center py-8">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-spin" />
              <Zap className="w-6 h-6 text-blue-500 absolute top-2 right-1/2 transform translate-x-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium mb-2">Generating RAG-Enhanced Prompts...</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Using advanced AI to create optimized prompts for {AI_TOOL_OPTIONS.find(t => t.id === selectedTool)?.name}
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <p className="mt-2">Analyzing your project context and optimizing for {AI_TOOL_OPTIONS.find(t => t.id === selectedTool)?.name}</p>
            </div>
          </div>
        )}

        {state.exportPrompts && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">RAG-Enhanced Export Ready!</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Zap className="w-3 h-3 mr-1" />
                  Target: {AI_TOOL_OPTIONS.find(t => t.id === state.exportPrompts?.targetTool)?.name}
                </Badge>
                {confidenceScore && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Confidence: {Math.round(confidenceScore * 100)}%
                  </Badge>
                )}
                {savedMvpId && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Saved to Database
                  </Badge>
                )}
              </div>
            </div>

            {/* RAG Enhancement Information */}
            {(confidenceScore || enhancementSuggestions.length > 0) && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">RAG Enhancement Details</h4>
                </div>

                {confidenceScore && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-blue-700 dark:text-blue-300">Prompt Quality Score</span>
                      <span className="font-medium">{Math.round(confidenceScore * 100)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${confidenceScore * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {enhancementSuggestions.length > 0 && (
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">Enhancement Suggestions:</p>
                    <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                      {enhancementSuggestions.slice(0, 3).map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

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

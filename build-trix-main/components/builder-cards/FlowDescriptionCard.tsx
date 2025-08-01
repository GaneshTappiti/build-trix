"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GitBranch, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useBuilder, builderActions, AppFlow } from "@/lib/builderContext";

export function FlowDescriptionCard() {
  const { state, dispatch } = useBuilder();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAppFlow = async () => {
    if (!state.appBlueprint) return;

    setIsGenerating(true);
    dispatch(builderActions.setGenerating(true));

    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate generation

      const appFlow: AppFlow = {
        flowLogic: generateFlowLogic(),
        conditionalRouting: generateConditionalRouting(),
        backButtonBehavior: generateBackButtonBehavior(),
        modalLogic: generateModalLogic(),
        screenTransitions: generateScreenTransitions()
      };

      dispatch(builderActions.setAppFlow(appFlow));
      dispatch(builderActions.saveProject());
    } catch (error) {
      console.error('Error generating app flow:', error);
      dispatch(builderActions.setError('Failed to generate app flow'));
    } finally {
      setIsGenerating(false);
      dispatch(builderActions.setGenerating(false));
    }
  };

  const generateFlowLogic = (): string => {
    return `App Flow Logic for ${state.appIdea.appName}:

1. Entry Point: ${state.appIdea.platforms.includes('mobile') ? 'Onboarding → ' : ''}Home Screen
2. Authentication Flow: Login/Signup → Dashboard
3. Main Navigation: Dashboard ↔ Features ↔ Profile ↔ Settings
4. Content Flow: Browse → View Details → Actions → Feedback
5. Exit Points: Logout → Home, App Close → Save State

Key Considerations:
- ${state.appIdea.designStyle} design principles throughout
- Responsive behavior for ${state.appIdea.platforms.join(' and ')} platforms
- User role-based access control`;
  };

  const generateConditionalRouting = (): string[] => {
    return [
      "If user is not authenticated → Redirect to Login",
      "If user lacks permissions → Show Access Denied",
      "If content is loading → Show Loading State",
      "If error occurs → Show Error Page with Retry",
      "If offline → Show Offline Mode",
      `If ${state.appIdea.platforms.includes('mobile') ? 'mobile' : 'web'} → Optimize for platform`
    ];
  };

  const generateBackButtonBehavior = (): string => {
    return `Back Button Behavior:
- From Dashboard → Exit app confirmation
- From Feature screens → Return to Dashboard
- From Modal → Close modal, return to previous screen
- From Forms → Confirm unsaved changes
- From Error pages → Return to last valid screen
- Maintain navigation history stack`;
  };

  const generateModalLogic = (): string => {
    return `Modal Management:
- Confirmation dialogs for destructive actions
- Form modals for quick data entry
- Image/content viewers for media
- Settings overlays for quick access
- Error/success notifications
- Loading overlays for async operations`;
  };

  const generateScreenTransitions = (): string[] => {
    const transitions = [
      "Fade transitions for content changes",
      "Slide transitions for navigation",
      "Scale animations for modal open/close",
      "Loading spinners for async operations"
    ];

    if (state.appIdea.designStyle === 'playful') {
      transitions.push("Bounce effects for interactive elements");
      transitions.push("Colorful progress indicators");
    } else if (state.appIdea.designStyle === 'minimal') {
      transitions.push("Subtle fade effects");
      transitions.push("Clean slide animations");
    } else {
      transitions.push("Professional slide transitions");
      transitions.push("Structured progress indicators");
    }

    return transitions;
  };

  const handlePrevious = () => {
    dispatch(builderActions.setCurrentCard(4));
  };

  const handleNext = () => {
    if (!state.appFlow) {
      dispatch(builderActions.setError('Please generate the app flow first'));
      return;
    }
    dispatch(builderActions.setCurrentCard(6));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-cyan-400" />
          Flow Description
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Define navigation flow and user journey
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!state.appFlow && !isGenerating && (
          <div className="text-center py-8">
            <GitBranch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Generate App Flow</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create a comprehensive flow description including navigation logic, routing, and user journey.
            </p>
            <Button onClick={generateAppFlow} size="lg" disabled={!state.appBlueprint}>
              Generate Flow
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-cyan-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Generating App Flow...</h3>
            <p className="text-gray-600 dark:text-gray-400">Creating navigation and user journey logic</p>
          </div>
        )}

        {state.appFlow && (
          <div className="space-y-6">
            {/* Flow Logic */}
            <div>
              <h3 className="text-lg font-medium mb-3">Flow Logic</h3>
              <Textarea
                value={state.appFlow.flowLogic}
                readOnly
                className="min-h-[200px] text-sm"
              />
            </div>

            {/* Conditional Routing */}
            <div>
              <h3 className="text-lg font-medium mb-3">Conditional Routing</h3>
              <div className="space-y-2">
                {state.appFlow.conditionalRouting.map((rule, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                    {rule}
                  </div>
                ))}
              </div>
            </div>

            {/* Back Button Behavior */}
            <div>
              <h3 className="text-lg font-medium mb-3">Back Button Behavior</h3>
              <Textarea
                value={state.appFlow.backButtonBehavior}
                readOnly
                className="min-h-[120px] text-sm"
              />
            </div>

            {/* Modal Logic */}
            <div>
              <h3 className="text-lg font-medium mb-3">Modal Logic</h3>
              <Textarea
                value={state.appFlow.modalLogic}
                readOnly
                className="min-h-[120px] text-sm"
              />
            </div>

            {/* Screen Transitions */}
            <div>
              <h3 className="text-lg font-medium mb-3">Screen Transitions</h3>
              <div className="space-y-2">
                {state.appFlow.screenTransitions.map((transition, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                    {transition}
                  </div>
                ))}
              </div>
            </div>
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
            disabled={!state.appFlow}
          >
            Next Step
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

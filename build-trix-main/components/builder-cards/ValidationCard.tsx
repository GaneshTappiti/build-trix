"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, CheckCircle, MessageCircle, Heart, ArrowRight, ArrowLeft, Zap, Code, Palette } from "lucide-react";
import { useBuilder, builderActions } from "@/lib/builderContext";
import { AI_TOOL_OPTIONS, SupportedTool } from "@/types/rag";

export function ValidationCard() {
  const { state, dispatch } = useBuilder();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckboxChange = (field: 'hasValidated' | 'hasDiscussed', checked: boolean) => {
    dispatch(builderActions.updateValidation({ [field]: checked }));
  };

  const handleMotivationChange = (value: string) => {
    dispatch(builderActions.updateValidation({ motivation: value }));
  };

  const handleAIToolChange = (toolId: string) => {
    dispatch(builderActions.updateValidation({
      preferredAITool: toolId as SupportedTool
    }));
  };

  const handleComplexityChange = (complexity: string) => {
    dispatch(builderActions.updateValidation({
      projectComplexity: complexity as 'simple' | 'medium' | 'complex'
    }));
  };

  const handleExperienceChange = (experience: string) => {
    dispatch(builderActions.updateValidation({
      technicalExperience: experience as 'beginner' | 'intermediate' | 'advanced'
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'code_editor': return <Code className="w-4 h-4" />;
      case 'ui_generator': return <Palette className="w-4 h-4" />;
      case 'ai_assistant': return <Zap className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handlePrevious = () => {
    dispatch(builderActions.setCurrentCard(1));
  };

  const handleNext = async () => {
    if (!state.validationQuestions.motivation.trim()) {
      dispatch(builderActions.setError('Please share your motivation'));
      return;
    }

    if (state.validationQuestions.motivation.trim().length < 30) {
      dispatch(builderActions.setError('Motivation must be at least 30 characters'));
      return;
    }

    if (!state.validationQuestions.preferredAITool) {
      dispatch(builderActions.setError('Please select your preferred AI development tool'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Save current progress
      dispatch(builderActions.saveProject());
      
      // Move to next stage
      dispatch(builderActions.setCurrentCard(3));
    } catch (error) {
      console.error('Error proceeding to next stage:', error);
      dispatch(builderActions.setError('Failed to save progress'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-400" />
          Idea Interpreter
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Help us understand where you are in your journey
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Validation Question */}
        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <Checkbox
            id="hasValidated"
            checked={state.validationQuestions.hasValidated}
            onCheckedChange={(checked) => handleCheckboxChange('hasValidated', checked as boolean)}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="hasValidated" className="flex items-center gap-2 text-base font-medium cursor-pointer">
              <CheckCircle className="w-4 h-4" />
              Did you validate your idea?
            </Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Have you tested your idea with potential users or done market research?
            </p>
          </div>
        </div>

        {/* Discussion Question */}
        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <Checkbox
            id="hasDiscussed"
            checked={state.validationQuestions.hasDiscussed}
            onCheckedChange={(checked) => handleCheckboxChange('hasDiscussed', checked as boolean)}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="hasDiscussed" className="flex items-center gap-2 text-base font-medium cursor-pointer">
              <MessageCircle className="w-4 h-4" />
              Did you talk to people about your idea?
            </Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Have you discussed your idea with friends, potential users, or mentors?
            </p>
          </div>
        </div>

        {/* Motivation Question */}
        <div className="space-y-3">
          <Label htmlFor="motivation" className="flex items-center gap-2 text-base font-medium">
            <Heart className="w-4 h-4" />
            What is your motivation to try this out? *
          </Label>
          <Textarea
            id="motivation"
            placeholder="Share what drives you to build this idea..."
            className="min-h-[120px]"
            value={state.validationQuestions.motivation}
            onChange={(e) => handleMotivationChange(e.target.value)}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This helps us create a more personalized prompt for your journey
          </p>
          <p className="text-xs text-gray-500">
            {state.validationQuestions.motivation.length}/30 characters minimum
          </p>
        </div>

        {/* AI Tool Selection */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-base font-medium">
            <Zap className="w-4 h-4" />
            Choose your preferred AI development tool
          </Label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This helps us generate optimized prompts for your chosen tool
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            {AI_TOOL_OPTIONS.map((tool) => (
              <div
                key={tool.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 ${
                  state.validationQuestions.preferredAITool === tool.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => handleAIToolChange(tool.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getCategoryIcon(tool.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{tool.name}</h4>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getComplexityColor(tool.complexity)}`}
                      >
                        {tool.complexity}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {tool.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tool.bestFor.slice(0, 2).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Complexity */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            How complex is your project?
          </Label>
          <Select
            value={state.validationQuestions.projectComplexity || ''}
            onValueChange={handleComplexityChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project complexity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Simple</span>
                  <span className="text-xs text-gray-500">Basic CRUD, few pages</span>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Medium</span>
                  <span className="text-xs text-gray-500">Multiple features, user auth</span>
                </div>
              </SelectItem>
              <SelectItem value="complex">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Complex</span>
                  <span className="text-xs text-gray-500">Advanced features, integrations</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Technical Experience */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            What's your technical experience level?
          </Label>
          <Select
            value={state.validationQuestions.technicalExperience || ''}
            onValueChange={handleExperienceChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Beginner</span>
                  <span className="text-xs text-gray-500">New to coding</span>
                </div>
              </SelectItem>
              <SelectItem value="intermediate">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Intermediate</span>
                  <span className="text-xs text-gray-500">Some coding experience</span>
                </div>
              </SelectItem>
              <SelectItem value="advanced">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Advanced</span>
                  <span className="text-xs text-gray-500">Experienced developer</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Insights Based on Answers */}
        {(state.validationQuestions.hasValidated || state.validationQuestions.hasDiscussed) && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Great progress!</h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              {state.validationQuestions.hasValidated && state.validationQuestions.hasDiscussed
                ? "You've validated your idea and discussed it with others. This shows strong preparation for building your MVP."
                : state.validationQuestions.hasValidated
                ? "You've validated your idea, which is excellent. Consider discussing it with more people for additional insights."
                : "You've discussed your idea with others, which is valuable. Consider doing some market research to validate demand."
              }
            </p>
          </div>
        )}

        {(!state.validationQuestions.hasValidated && !state.validationQuestions.hasDiscussed) && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">No worries!</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Many successful products started without extensive validation. We'll help you build an MVP that you can use to test and validate your idea with real users.
            </p>
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
            disabled={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

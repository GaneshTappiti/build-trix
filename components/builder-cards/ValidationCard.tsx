"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Lightbulb, CheckCircle, MessageCircle, Heart, ArrowRight, ArrowLeft } from "lucide-react";
import { useBuilder, builderActions } from "@/lib/builderContext";

export function ValidationCard() {
  const { state, dispatch } = useBuilder();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckboxChange = (field: 'hasValidated' | 'hasDiscussed', checked: boolean) => {
    dispatch(builderActions.updateValidation({ [field]: checked }));
  };

  const handleMotivationChange = (value: string) => {
    dispatch(builderActions.updateValidation({ motivation: value }));
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

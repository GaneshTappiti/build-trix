"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Brain, Monitor, Smartphone, Building2, Gamepad2, Minimize, ArrowRight, Lightbulb } from "lucide-react";
import { useBuilder, builderActions } from "@/lib/builderContext";

const PLATFORMS = [
  { id: "web", label: "Web", icon: Monitor },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

const STYLES = [
  { id: "minimal", label: "Minimal & Clean", icon: Minimize, description: "Clean, simple interface" },
  { id: "playful", label: "Playful & Animated", icon: Gamepad2, description: "Fun, engaging design" },
  { id: "business", label: "Business & Professional", icon: Building2, description: "Corporate, professional look" },
];

export function AppIdeaCard() {
  const { state, dispatch } = useBuilder();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    const currentPlatforms = state.appIdea.platforms;
    let newPlatforms;
    
    if (checked) {
      newPlatforms = [...currentPlatforms, platformId as 'web' | 'mobile'];
    } else {
      newPlatforms = currentPlatforms.filter(p => p !== platformId);
    }
    
    dispatch(builderActions.updateAppIdea({ platforms: newPlatforms }));
  };

  const handleStyleChange = (style: string) => {
    dispatch(builderActions.updateAppIdea({ designStyle: style as 'minimal' | 'playful' | 'business' }));
  };

  const handleInputChange = (field: string, value: string) => {
    dispatch(builderActions.updateAppIdea({ [field]: value }));
  };

  const handleNext = async () => {
    console.log('Continue button clicked!');
    console.log('Current state:', state.appIdea);

    if (!state.appIdea.appName.trim() ||
        state.appIdea.platforms.length === 0 ||
        !state.appIdea.designStyle ||
        !state.appIdea.ideaDescription.trim()) {
      console.log('Validation failed: missing required fields');
      dispatch(builderActions.setError('Please fill in all required fields'));
      return;
    }

    if (state.appIdea.ideaDescription.trim().length < 50) {
      console.log('Validation failed: description too short');
      dispatch(builderActions.setError('App description must be at least 50 characters'));
      return;
    }

    console.log('Validation passed, proceeding to next stage');
    setIsSubmitting(true);

    try {
      // Clear any existing errors
      dispatch(builderActions.setError(null));

      // Save current progress
      dispatch(builderActions.saveProject());

      // Move to next stage
      console.log('Setting current card to 2');
      dispatch(builderActions.setCurrentCard(2));
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
          <Brain className="w-5 h-5 text-green-400" />
          Tool-Adaptive Engine
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Define your app concept, platform, and design preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* App Name */}
        <div className="space-y-2">
          <Label htmlFor="appName">App Name *</Label>
          <Input
            id="appName"
            placeholder="e.g., TaskFlow Pro"
            value={state.appIdea.appName}
            onChange={(e) => handleInputChange('appName', e.target.value)}
          />
        </div>

        {/* Platforms */}
        <div className="space-y-3">
          <Label>Platform(s) *</Label>
          <div className="grid grid-cols-2 gap-4">
            {PLATFORMS.map((platform) => {
              const PlatformIcon = platform.icon;
              const isSelected = state.appIdea.platforms.includes(platform.id as 'web' | 'mobile');

              return (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`platform-${platform.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                  />
                  <Label
                    htmlFor={`platform-${platform.id}`}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors flex-1 ${
                      isSelected
                        ? "border-green-500/50 bg-green-50 dark:bg-green-500/10"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <PlatformIcon className="w-5 h-5" />
                    <span>{platform.label}</span>
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Design Style */}
        <div className="space-y-3">
          <Label>Design Style *</Label>
          <RadioGroup 
            value={state.appIdea.designStyle} 
            onValueChange={handleStyleChange}
          >
            <div className="grid gap-4">
              {STYLES.map((style) => {
                const StyleIcon = style.icon;
                return (
                  <div key={style.id}>
                    <RadioGroupItem value={style.id} id={style.id} className="sr-only" />
                    <Label
                      htmlFor={style.id}
                      className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                        state.appIdea.designStyle === style.id
                          ? "border-green-500/50 bg-green-50 dark:bg-green-500/10"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                      }`}
                    >
                      <StyleIcon className="w-6 h-6" />
                      <div>
                        <p className="font-medium">{style.label}</p>
                        <p className="text-sm text-gray-500">{style.description}</p>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </div>

        {/* Style Description */}
        <div className="space-y-2">
          <Label htmlFor="styleDescription">Style Description (Optional)</Label>
          <Textarea
            id="styleDescription"
            placeholder="Describe any specific design preferences..."
            className="min-h-[100px]"
            value={state.appIdea.styleDescription || ''}
            onChange={(e) => handleInputChange('styleDescription', e.target.value)}
          />
        </div>

        {/* App Description */}
        <div className="space-y-2">
          <Label htmlFor="ideaDescription">Describe your app idea in detail *</Label>
          <Textarea
            id="ideaDescription"
            placeholder="Explain what your app does, what problems it solves, key features, etc..."
            className="min-h-[150px]"
            value={state.appIdea.ideaDescription}
            onChange={(e) => handleInputChange('ideaDescription', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            {state.appIdea.ideaDescription.length}/50 characters minimum
          </p>
        </div>

        {/* Target Audience */}
        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target Users (Optional)</Label>
          <Textarea
            id="targetAudience"
            placeholder="Who will use this app? Describe your target audience..."
            className="min-h-[100px]"
            value={state.appIdea.targetAudience || ''}
            onChange={(e) => handleInputChange('targetAudience', e.target.value)}
          />
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          </div>
        )}

        {/* Validation Summary */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Required Fields Status:</h4>
          <div className="space-y-1 text-xs">
            <div className={`flex items-center gap-2 ${state.appIdea.appName.trim() ? 'text-green-600' : 'text-red-600'}`}>
              <span>{state.appIdea.appName.trim() ? '✓' : '✗'}</span>
              <span>App Name: {state.appIdea.appName.trim() || 'Not provided'}</span>
            </div>
            <div className={`flex items-center gap-2 ${state.appIdea.platforms.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>{state.appIdea.platforms.length > 0 ? '✓' : '✗'}</span>
              <span>Platforms: {state.appIdea.platforms.length > 0 ? state.appIdea.platforms.join(', ') : 'None selected'}</span>
            </div>
            <div className={`flex items-center gap-2 ${state.appIdea.designStyle ? 'text-green-600' : 'text-red-600'}`}>
              <span>{state.appIdea.designStyle ? '✓' : '✗'}</span>
              <span>Design Style: {state.appIdea.designStyle || 'Not selected'}</span>
            </div>
            <div className={`flex items-center gap-2 ${state.appIdea.ideaDescription.trim().length >= 50 ? 'text-green-600' : 'text-red-600'}`}>
              <span>{state.appIdea.ideaDescription.trim().length >= 50 ? '✓' : '✗'}</span>
              <span>Description: {state.appIdea.ideaDescription.trim().length}/50 characters</span>
            </div>
          </div>
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={(e) => {
              console.log('Button clicked!', e);
              handleNext();
            }}
            disabled={isSubmitting}
            className="min-w-[120px]"
            type="button"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

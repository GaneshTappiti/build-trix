"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, ArrowRight, ArrowLeft, Loader2, Monitor, Users, Database, Settings } from "lucide-react";
import { useBuilder, builderActions, AppBlueprint, Screen, UserRole, DataModel } from "@/lib/builderContext";

export function BlueprintCard() {
  const { state, dispatch } = useBuilder();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

  const generateBlueprint = async () => {
    setIsGenerating(true);
    dispatch(builderActions.setGenerating(true));

    try {
      // Simulate blueprint generation based on app idea
      setGenerationStep('Analyzing app requirements...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationStep('Generating screen structure...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationStep('Defining user roles...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationStep('Creating data models...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock blueprint based on the app idea
      const mockBlueprint: AppBlueprint = {
        screens: generateMockScreens(),
        userRoles: generateMockUserRoles(),
        navigationFlow: generateNavigationFlow(),
        dataModels: generateMockDataModels(),
        architecture: 'Component-based architecture with state management',
        suggestedPattern: 'MVC (Model-View-Controller) pattern'
      };

      dispatch(builderActions.setAppBlueprint(mockBlueprint));
      dispatch(builderActions.saveProject());
      
    } catch (error) {
      console.error('Error generating blueprint:', error);
      dispatch(builderActions.setError('Failed to generate blueprint'));
    } finally {
      setIsGenerating(false);
      dispatch(builderActions.setGenerating(false));
      setGenerationStep('');
    }
  };

  const generateMockScreens = (): Screen[] => {
    const baseScreens = [
      {
        id: 'home',
        name: 'Home Screen',
        purpose: 'Main landing page with key features',
        components: ['Header', 'Navigation', 'Hero Section', 'Feature Cards'],
        navigation: ['login', 'signup', 'features'],
        type: 'main' as const
      },
      {
        id: 'login',
        name: 'Login Screen',
        purpose: 'User authentication',
        components: ['Login Form', 'Social Login', 'Forgot Password Link'],
        navigation: ['home', 'signup', 'dashboard'],
        type: 'auth' as const
      },
      {
        id: 'dashboard',
        name: 'Dashboard',
        purpose: 'Main user interface after login',
        components: ['Sidebar', 'Main Content', 'User Profile', 'Quick Actions'],
        navigation: ['profile', 'settings', 'features'],
        type: 'main' as const
      }
    ];

    // Add mobile-specific screens if mobile platform is selected
    if (state.appIdea.platforms.includes('mobile')) {
      baseScreens.push({
        id: 'onboarding',
        name: 'Onboarding Flow',
        purpose: 'Introduce new users to the app',
        components: ['Welcome Screen', 'Feature Tour', 'Permissions'],
        navigation: ['login', 'signup'],
        type: 'onboarding' as const
      });
    }

    return baseScreens;
  };

  const generateMockUserRoles = (): UserRole[] => {
    return [
      {
        name: 'Regular User',
        permissions: ['view_content', 'create_content', 'edit_own_content'],
        description: 'Standard user with basic app functionality'
      },
      {
        name: 'Admin',
        permissions: ['view_content', 'create_content', 'edit_content', 'delete_content', 'manage_users'],
        description: 'Administrator with full access to app features'
      }
    ];
  };

  const generateMockDataModels = (): DataModel[] => {
    return [
      {
        name: 'User',
        fields: ['id', 'email', 'name', 'avatar', 'role', 'created_at'],
        relationships: ['has_many_posts', 'belongs_to_role'],
        description: 'User account information'
      },
      {
        name: 'Content',
        fields: ['id', 'title', 'description', 'user_id', 'status', 'created_at'],
        relationships: ['belongs_to_user'],
        description: 'Main content entity'
      }
    ];
  };

  const generateNavigationFlow = (): string => {
    return `
    Home → Login/Signup → Dashboard → Features
    Dashboard ↔ Profile ↔ Settings
    ${state.appIdea.platforms.includes('mobile') ? 'Onboarding → Login/Signup' : ''}
    `;
  };

  const handlePrevious = () => {
    dispatch(builderActions.setCurrentCard(2));
  };

  const handleNext = () => {
    if (!state.appBlueprint) {
      dispatch(builderActions.setError('Please generate the blueprint first'));
      return;
    }
    dispatch(builderActions.setCurrentCard(4));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          App Skeleton Generator
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Auto-generated app structure and architecture
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!state.appBlueprint && !isGenerating && (
          <div className="text-center py-8">
            <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Generate Your App Blueprint</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Based on your app idea "{state.appIdea.appName}", we'll create a comprehensive blueprint including screens, user roles, and data structure.
            </p>
            <Button onClick={generateBlueprint} size="lg">
              Generate Blueprint
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Generating Blueprint...</h3>
            <p className="text-gray-600 dark:text-gray-400">{generationStep}</p>
          </div>
        )}

        {state.appBlueprint && (
          <div className="space-y-6">
            {/* Screens */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Screens ({state.appBlueprint.screens.length})
              </h3>
              <div className="grid gap-3">
                {state.appBlueprint.screens.map((screen) => (
                  <div key={screen.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{screen.name}</h4>
                      <Badge variant="outline">{screen.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{screen.purpose}</p>
                    <div className="flex flex-wrap gap-1">
                      {screen.components.map((component, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {component}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Roles */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Roles ({state.appBlueprint.userRoles.length})
              </h3>
              <div className="grid gap-3">
                {state.appBlueprint.userRoles.map((role, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-1">{role.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{role.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((permission, permIndex) => (
                        <Badge key={permIndex} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Models */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Models ({state.appBlueprint.dataModels.length})
              </h3>
              <div className="grid gap-3">
                {state.appBlueprint.dataModels.map((model, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-1">{model.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{model.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {model.fields.map((field, fieldIndex) => (
                        <Badge key={fieldIndex} variant="secondary" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture */}
            {state.appBlueprint.architecture && (
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Architecture
                </h3>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm">{state.appBlueprint.architecture}</p>
                  {state.appBlueprint.suggestedPattern && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Suggested Pattern: {state.appBlueprint.suggestedPattern}
                    </p>
                  )}
                </div>
              </div>
            )}
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
            disabled={!state.appBlueprint}
          >
            Next Step
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

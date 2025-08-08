"use client";

import React from 'react';
import { AppSkeletonGenerator } from '@/components/AppSkeletonGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Layers, 
  Users, 
  Database, 
  Navigation,
  Code,
  Zap,
  Target,
  Rocket
} from 'lucide-react';

export default function AdvancedGeneratorPage() {
  const features = [
    {
      icon: Layers,
      title: "Complete Screen Breakdown",
      description: "Generate all user-facing pages including auth flows, dashboards, settings, and edge cases"
    },
    {
      icon: Navigation,
      title: "Navigation & Flow Design",
      description: "Route structure, page flows, and navigation patterns optimized for your platform"
    },
    {
      icon: Users,
      title: "User Roles & Permissions",
      description: "Define user types, access levels, and role-based feature permissions"
    },
    {
      icon: Database,
      title: "Data Models & Entities",
      description: "Backend data structures, relationships, and API endpoint suggestions"
    },
    {
      icon: Code,
      title: "Architecture Patterns",
      description: "Technology stack recommendations and folder structure based on your needs"
    },
    {
      icon: Zap,
      title: "States & Edge Cases",
      description: "Loading states, error handling, empty states, and user feedback systems"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Universal App Skeleton Generator
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Transform any app idea into a comprehensive, implementation-ready blueprint with AI-powered analysis and structured planning.
            </p>
            <div className="flex justify-center gap-2 mt-6">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                <Rocket className="w-3 h-3 mr-1" />
                Production Ready
              </Badge>
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                <Target className="w-3 h-3 mr-1" />
                Platform Agnostic
              </Badge>
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                <Brain className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Features Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            What You&apos;ll Get
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Generator */}
        <AppSkeletonGenerator 
          onSkeletonGenerated={(skeleton) => {
            console.log('Generated skeleton:', skeleton);
          }}
        />

        {/* Additional Information */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <h4 className="font-medium">Describe Your Idea</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enter your app concept and any specific requirements</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <h4 className="font-medium">Configure Settings</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Choose app type, complexity level, and desired features</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <h4 className="font-medium">Generate Blueprint</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI analyzes your idea and creates a comprehensive app structure</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">4</div>
                <div>
                  <h4 className="font-medium">Export & Implement</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Download structured data and start building</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Perfect For</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Entrepreneurs & Founders</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Validate ideas with comprehensive planning before development</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Product Managers</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create detailed specifications for development teams</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Developers</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get architecture guidance and implementation structure</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Design Teams</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Understand user flows and screen requirements early</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

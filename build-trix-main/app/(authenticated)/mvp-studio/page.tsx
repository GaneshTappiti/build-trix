"use client"

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SixStageArchitecture } from '@/components/builder-cards/SixStageArchitecture';
import { useBuilder } from '@/lib/builderContext';
import { 
  Rocket, 
  Plus, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Brain,
  Lightbulb,
  Layers,
  Wand2,
  GitBranch,
  Download
} from 'lucide-react';

export default function MVPStudioPage() {
  const { state } = useBuilder();

  const getProjectStatusBadge = () => {
    if (state.currentCard === 6 && state.exportPrompts) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
    } else if (state.currentCard > 1) {
      return <Badge variant="outline">In Progress</Badge>;
    }
    return null;
  };

  const getProgressPercentage = () => {
    return Math.round(((state.currentCard - 1) / 6) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Rocket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MVP Studio</h1>
                  <p className="text-gray-600 dark:text-gray-400">Transform your app idea into implementation-ready prompts</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
              <Link href="/mvp-studio/builder">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Project Status */}
        {state.currentCard > 1 && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">Current Project</h3>
                    {getProjectStatusBadge()}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">
                    {state.appIdea.appName || 'Untitled Project'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {state.appIdea.platforms.join(', ')} • {state.appIdea.designStyle} design
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {getProgressPercentage()}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Stage {state.currentCard} of 6
                  </p>
                  <Link href="/mvp-studio/builder">
                    <Button>
                      Continue Building
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project History */}
        {state.projectHistory.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {state.projectHistory.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{project.appName}</h4>
                        {project.isCompleted && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {project.platforms.join(', ')} • {project.designStyle} design
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Modified {new Date(project.dateModified).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {project.completedStages}/6 stages
                      </Badge>
                      <Button variant="outline" size="sm">
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 6-Stage Architecture Overview */}
        <SixStageArchitecture mode="overview" />

        {/* Features Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-8 h-8 text-blue-500" />
                <h3 className="text-lg font-semibold">AI-Powered Analysis</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Our AI analyzes your app idea and generates comprehensive blueprints with screens, user roles, and data models.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wand2 className="w-8 h-8 text-purple-500" />
                <h3 className="text-lg font-semibold">Smart Prompts</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Generate detailed, implementation-ready prompts optimized for your chosen AI development tool.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Layers className="w-8 h-8 text-green-500" />
                <h3 className="text-lg font-semibold">Complete Architecture</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Get a full app structure including navigation flow, user journey, and technical specifications.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        {state.currentCard === 1 && (
          <div className="mt-12 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Ready to build your MVP?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start with our 6-stage process to transform your app idea into implementation-ready prompts.
              </p>
              <Link href="/mvp-studio/builder">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Building
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, ExternalLink, Star, Zap } from 'lucide-react';

const AI_TOOLS = [
  {
    name: 'Cursor',
    description: 'AI-powered code editor with intelligent autocomplete',
    category: 'Code Editor',
    rating: 4.8,
    pricing: 'Free/Pro',
    features: ['AI Autocomplete', 'Code Generation', 'Refactoring'],
    url: 'https://cursor.sh'
  },
  {
    name: 'v0.dev',
    description: 'Generate UI components from text descriptions',
    category: 'UI Generation',
    rating: 4.6,
    pricing: 'Free/Pro',
    features: ['React Components', 'Tailwind CSS', 'TypeScript'],
    url: 'https://v0.dev'
  },
  {
    name: 'Claude',
    description: 'Advanced AI assistant for coding and problem solving',
    category: 'AI Assistant',
    rating: 4.7,
    pricing: 'Free/Pro',
    features: ['Code Review', 'Architecture Design', 'Debugging'],
    url: 'https://claude.ai'
  },
  {
    name: 'GitHub Copilot',
    description: 'AI pair programmer that suggests code in real-time',
    category: 'Code Assistant',
    rating: 4.5,
    pricing: 'Paid',
    features: ['Code Suggestions', 'Multiple Languages', 'IDE Integration'],
    url: 'https://github.com/features/copilot'
  }
];

export default function AIToolsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Tools Database</h1>
              <p className="text-gray-600 dark:text-gray-400">Discover and compare AI development tools</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {AI_TOOLS.map((tool, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{tool.rating}</span>
                  </div>
                </div>
                <Badge variant="outline">{tool.category}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {tool.description}
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {tool.features.map((feature, featureIndex) => (
                        <Badge key={featureIndex} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{tool.pricing}</Badge>
                    <Button variant="outline" size="sm" asChild>
                      <a href={tool.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Visit
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon */}
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <CardContent className="p-8 text-center">
            <Zap className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">More Tools Coming Soon</h3>
            <p className="text-gray-600 dark:text-gray-400">
              We're constantly adding new AI tools to help you build better apps faster.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

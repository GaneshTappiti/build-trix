"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Download, Eye, Star } from 'lucide-react';

const MVP_TEMPLATES = [
  {
    name: 'SaaS Dashboard',
    description: 'Complete SaaS application with user management, billing, and analytics',
    category: 'SaaS',
    difficulty: 'Intermediate',
    tech: ['React', 'Next.js', 'Tailwind', 'Prisma'],
    features: ['Authentication', 'Billing', 'Analytics', 'Admin Panel'],
    downloads: 1250
  },
  {
    name: 'E-commerce Store',
    description: 'Full-featured online store with cart, payments, and inventory',
    category: 'E-commerce',
    difficulty: 'Advanced',
    tech: ['React', 'Node.js', 'Stripe', 'MongoDB'],
    features: ['Shopping Cart', 'Payments', 'Inventory', 'Orders'],
    downloads: 890
  },
  {
    name: 'Social Media App',
    description: 'Social platform with posts, comments, likes, and real-time chat',
    category: 'Social',
    difficulty: 'Advanced',
    tech: ['React Native', 'Firebase', 'Socket.io'],
    features: ['Posts', 'Chat', 'Notifications', 'Media Upload'],
    downloads: 670
  },
  {
    name: 'Task Management',
    description: 'Project management tool with boards, tasks, and team collaboration',
    category: 'Productivity',
    difficulty: 'Beginner',
    tech: ['Vue.js', 'Express', 'PostgreSQL'],
    features: ['Kanban Board', 'Team Collaboration', 'Time Tracking'],
    downloads: 1100
  }
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Intermediate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Advanced':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MVP Templates</h1>
              <p className="text-gray-600 dark:text-gray-400">Ready-to-use app templates and patterns</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MVP_TEMPLATES.map((template, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge className={getDifficultyColor(template.difficulty)}>
                    {template.difficulty}
                  </Badge>
                </div>
                <Badge variant="outline">{template.category}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {template.description}
                </p>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Tech Stack:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.tech.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.features.map((feature, featureIndex) => (
                        <Badge key={featureIndex} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Download className="w-3 h-3" />
                      {template.downloads.toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm">
                        <Download className="w-3 h-3 mr-1" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon */}
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
          <CardContent className="p-8 text-center">
            <Star className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Custom Templates</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Soon you'll be able to create and share your own MVP templates with the community.
            </p>
            <Button variant="outline">
              Request Template
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

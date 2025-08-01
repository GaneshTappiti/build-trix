'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Download, 
  Upload, 
  Archive, 
  Star, 
  Brain, 
  Target, 
  Eye, 
  Zap,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  FileText,
  Folder,
  Search,
  Filter
} from 'lucide-react';
import { PromptLibrary } from '@/components/prompts/PromptLibrary';
import { useStoredPrompts } from '@/hooks/useStoredPrompts';

interface StorageStats {
  totalPrompts: number;
  ragEnhancedPrompts: number;
  favoritePrompts: number;
  blueprintPrompts: number;
  screenPrompts: number;
  exportPrompts: number;
  totalStorage: string;
  avgConfidenceScore: number;
}

export function StorageDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { 
    prompts, 
    isLoading, 
    getPromptsByType, 
    getFavoritePrompts, 
    getRagEnhancedPrompts 
  } = useStoredPrompts();

  // Calculate storage statistics
  const getStorageStats = (): StorageStats => {
    const ragEnhanced = getRagEnhancedPrompts();
    const favorites = getFavoritePrompts();
    const blueprints = getPromptsByType('blueprint');
    const screenPrompts = getPromptsByType('screen_prompt');
    const exports = getPromptsByType('export');
    
    const totalSize = prompts.reduce((acc, prompt) => acc + prompt.promptContent.length, 0);
    const avgConfidence = ragEnhanced.length > 0 
      ? ragEnhanced.reduce((acc, p) => acc + (p.confidenceScore || 0), 0) / ragEnhanced.length 
      : 0;

    return {
      totalPrompts: prompts.length,
      ragEnhancedPrompts: ragEnhanced.length,
      favoritePrompts: favorites.length,
      blueprintPrompts: blueprints.length,
      screenPrompts: screenPrompts.length,
      exportPrompts: exports.length,
      totalStorage: `${(totalSize / 1024).toFixed(1)} KB`,
      avgConfidenceScore: avgConfidence
    };
  };

  const stats = getStorageStats();

  const getToolDistribution = () => {
    const toolCounts = prompts.reduce((acc, prompt) => {
      acc[prompt.targetTool] = (acc[prompt.targetTool] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(toolCounts).map(([tool, count]) => ({
      tool,
      count,
      percentage: (count / prompts.length) * 100
    }));
  };

  const getRecentActivity = () => {
    return prompts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const toolDistribution = getToolDistribution();
  const recentActivity = getRecentActivity();

  if (isLoading && prompts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Storage Dashboard</h1>
          <p className="text-gray-600">Manage your generated prompts and RAG-enhanced content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Prompts</p>
                <p className="text-2xl font-bold">{stats.totalPrompts}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.totalStorage} total storage
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">RAG Enhanced</p>
                <p className="text-2xl font-bold">{stats.ragEnhancedPrompts}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.totalPrompts > 0 ? ((stats.ragEnhancedPrompts / stats.totalPrompts) * 100).toFixed(1) : 0}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favorites</p>
                <p className="text-2xl font-bold">{stats.favoritePrompts}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Starred for quick access
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold">{(stats.avgConfidenceScore * 100).toFixed(0)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              RAG enhancement quality
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="library">Prompt Library</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prompt Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Prompt Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Blueprint</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stats.blueprintPrompts}</span>
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-purple-500 rounded-full" 
                          style={{ width: `${stats.totalPrompts > 0 ? (stats.blueprintPrompts / stats.totalPrompts) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Screen Prompts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stats.screenPrompts}</span>
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-blue-500 rounded-full" 
                          style={{ width: `${stats.totalPrompts > 0 ? (stats.screenPrompts / stats.totalPrompts) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Export</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stats.exportPrompts}</span>
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-orange-500 rounded-full" 
                          style={{ width: `${stats.totalPrompts > 0 ? (stats.exportPrompts / stats.totalPrompts) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tool Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Target Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {toolDistribution.map(({ tool, count, percentage }) => (
                    <div key={tool} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {tool}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{count}</span>
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-green-500 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-10">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((prompt) => (
                  <div key={prompt.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {prompt.promptType === 'blueprint' && <Target className="h-4 w-4 text-purple-500" />}
                        {prompt.promptType === 'screen_prompt' && <Eye className="h-4 w-4 text-blue-500" />}
                        {prompt.promptType === 'export' && <Download className="h-4 w-4 text-orange-500" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{prompt.promptTitle}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(prompt.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {prompt.isRagEnhanced && (
                        <Badge variant="secondary" className="text-xs">
                          <Brain className="h-3 w-3 mr-1" />
                          RAG
                        </Badge>
                      )}
                      {prompt.isFavorite && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {prompt.targetTool}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library">
          <PromptLibrary />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-600">
                  Detailed analytics and insights about your prompt usage and effectiveness.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Collections Coming Soon</h3>
                <p className="text-gray-600">
                  Organize your prompts into custom collections and share them with others.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

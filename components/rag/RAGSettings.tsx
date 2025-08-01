'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Settings, Brain, Database, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AI_TOOL_OPTIONS, SupportedTool } from '@/types/rag';
import { Separator } from '@/components/ui/separator';

interface RAGSettings {
  defaultAITool: SupportedTool;
  defaultComplexity: 'simple' | 'medium' | 'complex';
  defaultExperience: 'beginner' | 'intermediate' | 'advanced';
  enableEnhancementSuggestions: boolean;
  enableConfidenceScoring: boolean;
  enableToolRecommendations: boolean;
  similarityThreshold: number;
  maxRetrievalResults: number;
  enableRealTimeAnalytics: boolean;
  customPromptPrefix?: string;
  customPromptSuffix?: string;
}

interface RAGSettingsProps {
  onSettingsChange?: (settings: RAGSettings) => void;
  initialSettings?: Partial<RAGSettings>;
}

const defaultSettings: RAGSettings = {
  defaultAITool: SupportedTool.LOVABLE,
  defaultComplexity: 'medium',
  defaultExperience: 'intermediate',
  enableEnhancementSuggestions: true,
  enableConfidenceScoring: true,
  enableToolRecommendations: true,
  similarityThreshold: 0.7,
  maxRetrievalResults: 10,
  enableRealTimeAnalytics: false,
};

export function RAGSettings({ onSettingsChange, initialSettings }: RAGSettingsProps) {
  const [settings, setSettings] = useState<RAGSettings>({
    ...defaultSettings,
    ...initialSettings,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Update settings and notify parent
  const updateSettings = (newSettings: Partial<RAGSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    setHasChanges(true);
    onSettingsChange?.(updatedSettings);
  };

  // Save settings to backend
  const saveSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">RAG Configuration</h2>
          <p className="text-muted-foreground">
            Configure your Retrieval-Augmented Generation settings for optimal prompt generation.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button 
            onClick={saveSettings} 
            disabled={!hasChanges || isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="ai-tools" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Tools
          </TabsTrigger>
          <TabsTrigger value="retrieval" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Retrieval
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Preferences</CardTitle>
              <CardDescription>
                Set your default preferences for new RAG generations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-complexity">Default Complexity</Label>
                  <Select
                    value={settings.defaultComplexity}
                    onValueChange={(value: 'simple' | 'medium' | 'complex') =>
                      updateSettings({ defaultComplexity: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="complex">Complex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-experience">Default Experience Level</Label>
                  <Select
                    value={settings.defaultExperience}
                    onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                      updateSettings({ defaultExperience: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-ai-tool">Default AI Tool</Label>
                  <Select
                    value={settings.defaultAITool}
                    onValueChange={(value: SupportedTool) =>
                      updateSettings({ defaultAITool: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_TOOL_OPTIONS.map((tool) => (
                        <SelectItem key={tool.id} value={tool.id}>
                          {tool.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enhancement Features</CardTitle>
              <CardDescription>
                Configure which RAG enhancement features to enable.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enhancement Suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    Show suggestions to improve prompt quality
                  </p>
                </div>
                <Switch
                  checked={settings.enableEnhancementSuggestions}
                  onCheckedChange={(checked) =>
                    updateSettings({ enableEnhancementSuggestions: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Confidence Scoring</Label>
                  <p className="text-sm text-muted-foreground">
                    Display confidence scores for generated prompts
                  </p>
                </div>
                <Switch
                  checked={settings.enableConfidenceScoring}
                  onCheckedChange={(checked) =>
                    updateSettings({ enableConfidenceScoring: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tool Recommendations</Label>
                  <p className="text-sm text-muted-foreground">
                    Suggest optimal AI tools based on project requirements
                  </p>
                </div>
                <Switch
                  checked={settings.enableToolRecommendations}
                  onCheckedChange={(checked) =>
                    updateSettings({ enableToolRecommendations: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Tool Configuration</CardTitle>
              <CardDescription>
                Configure settings for different AI tools and their optimization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AI_TOOL_OPTIONS.map((tool) => (
                  <Card key={tool.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{tool.name}</h4>
                      <Badge variant={tool.complexity === 'beginner' ? 'secondary' : 
                                   tool.complexity === 'intermediate' ? 'default' : 'destructive'}>
                        {tool.complexity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {tool.description}
                    </p>
                    <div className="space-y-2">
                      <Label className="text-xs">Best for:</Label>
                      <div className="flex flex-wrap gap-1">
                        {tool.bestFor.slice(0, 2).map((use, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {use}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retrieval" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vector Retrieval Settings</CardTitle>
              <CardDescription>
                Configure how the RAG system retrieves relevant knowledge and templates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Similarity Threshold: {settings.similarityThreshold}</Label>
                <p className="text-sm text-muted-foreground">
                  Minimum similarity score for retrieved documents (0.0 - 1.0)
                </p>
                <Slider
                  value={[settings.similarityThreshold]}
                  onValueChange={([value]) => updateSettings({ similarityThreshold: value })}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Max Retrieval Results: {settings.maxRetrievalResults}</Label>
                <p className="text-sm text-muted-foreground">
                  Maximum number of documents to retrieve for each query
                </p>
                <Slider
                  value={[settings.maxRetrievalResults]}
                  onValueChange={([value]) => updateSettings({ maxRetrievalResults: value })}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Prompt Templates</CardTitle>
              <CardDescription>
                Add custom prefix and suffix to all generated prompts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt-prefix">Custom Prompt Prefix</Label>
                <Textarea
                  id="prompt-prefix"
                  placeholder="Add text that will be prepended to all prompts..."
                  value={settings.customPromptPrefix || ''}
                  onChange={(e) => updateSettings({ customPromptPrefix: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt-suffix">Custom Prompt Suffix</Label>
                <Textarea
                  id="prompt-suffix"
                  placeholder="Add text that will be appended to all prompts..."
                  value={settings.customPromptSuffix || ''}
                  onChange={(e) => updateSettings({ customPromptSuffix: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Monitoring</CardTitle>
              <CardDescription>
                Configure analytics and monitoring settings for the RAG system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Real-time Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable real-time analytics updates (may impact performance)
                  </p>
                </div>
                <Switch
                  checked={settings.enableRealTimeAnalytics}
                  onCheckedChange={(checked) =>
                    updateSettings({ enableRealTimeAnalytics: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

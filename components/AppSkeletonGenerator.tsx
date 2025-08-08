"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Rocket, 
  Settings, 
  Layers, 
  Users, 
  Database,
  Loader2,
  Download,
  CheckCircle,
  FileText,
  Smartphone,
  Monitor,
  Globe
} from 'lucide-react';
import { 
  AppType, 
  AppComplexity, 
  GenerationSettings, 
  AppSkeleton,
  GenerateAppSkeletonRequest,
  GenerateAppSkeletonResponse 
} from '@/types/app-skeleton';
import { toast } from 'sonner';

interface AppSkeletonGeneratorProps {
  onSkeletonGenerated?: (skeleton: AppSkeleton) => void;
}

export function AppSkeletonGenerator({ onSkeletonGenerated }: AppSkeletonGeneratorProps) {
  const [userIdea, setUserIdea] = useState('');
  const [settings, setSettings] = useState<GenerationSettings>({
    includeErrorStates: true,
    includeLoadingStates: true,
    includeEmptyStates: true,
    includeBackendModels: false,
    suggestUIComponents: true,
    includeModalsPopups: true,
    generateArchitecture: false,
    appType: 'web',
    complexity: 'mvp'
  });
  
  const [additionalContext, setAdditionalContext] = useState({
    targetUsers: '',
    businessDomain: '',
    specificRequirements: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSkeleton, setGeneratedSkeleton] = useState<AppSkeleton | null>(null);
  const [activeTab, setActiveTab] = useState('generator');

  const complexityLabels = {
    mvp: 'MVP - Quick & Lean',
    advanced: 'Advanced - Feature Rich',
    production: 'Production - Enterprise Ready'
  };

  const appTypeIcons = {
    web: Monitor,
    mobile: Smartphone,
    hybrid: Globe
  };

  const handleGenerate = async () => {
    if (!userIdea.trim()) {
      toast.error('Please enter your app idea');
      return;
    }

    setIsGenerating(true);
    
    try {
      const request: GenerateAppSkeletonRequest = {
        userIdea,
        settings,
        additionalContext: {
          targetUsers: additionalContext.targetUsers || undefined,
          businessDomain: additionalContext.businessDomain || undefined,
          specificRequirements: additionalContext.specificRequirements 
            ? additionalContext.specificRequirements.split(',').map(r => r.trim())
            : undefined
        }
      };

      const response = await fetch('/api/generate-app-skeleton', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result: GenerateAppSkeletonResponse = await response.json();

      if (result.success && result.appSkeleton) {
        setGeneratedSkeleton(result.appSkeleton);
        setActiveTab('results');
        onSkeletonGenerated?.(result.appSkeleton);
        toast.success(`App skeleton generated in ${result.processingTime}ms!`);
      } else {
        toast.error(result.error || 'Failed to generate app skeleton');
      }
    } catch (error) {
      console.error('Error generating skeleton:', error);
      toast.error('Failed to generate app skeleton');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSetting = <K extends keyof GenerationSettings>(
    key: K,
    value: GenerationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const exportAsJSON = () => {
    if (!generatedSkeleton) return;
    
    const dataStr = JSON.stringify(generatedSkeleton, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generatedSkeleton.name.replace(/\s+/g, '-').toLowerCase()}-skeleton.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generator">
            <Brain className="w-4 h-4 mr-2" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!generatedSkeleton}>
            <FileText className="w-4 h-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-blue-500" />
                AI-Powered App Skeleton Generator
              </CardTitle>
              <p className="text-muted-foreground">
                Transform any app idea into a comprehensive blueprint with screens, flows, roles, data models, and more.
              </p>
            </CardHeader>
          </Card>

          {/* App Idea Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your App Idea</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="idea">Describe your app idea</Label>
                <Textarea
                  id="idea"
                  placeholder="Example: I want to build an app where students can share study materials, ask questions, and form study groups..."
                  value={userIdea}
                  onChange={(e) => setUserIdea(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
              
              {/* Additional Context */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="targetUsers">Target Users (Optional)</Label>
                  <Textarea
                    id="targetUsers"
                    placeholder="Students, professionals, etc."
                    value={additionalContext.targetUsers}
                    onChange={(e) => setAdditionalContext(prev => ({ ...prev, targetUsers: e.target.value }))}
                    rows={2}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="businessDomain">Business Domain (Optional)</Label>
                  <Textarea
                    id="businessDomain"
                    placeholder="Education, healthcare, finance, etc."
                    value={additionalContext.businessDomain}
                    onChange={(e) => setAdditionalContext(prev => ({ ...prev, businessDomain: e.target.value }))}
                    rows={2}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="requirements">Specific Requirements (Optional)</Label>
                  <Textarea
                    id="requirements"
                    placeholder="Real-time chat, file upload, etc."
                    value={additionalContext.specificRequirements}
                    onChange={(e) => setAdditionalContext(prev => ({ ...prev, specificRequirements: e.target.value }))}
                    rows={2}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Generation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* App Type */}
              <div>
                <Label className="text-base font-medium">App Type</Label>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {Object.entries(appTypeIcons).map(([type, Icon]) => (
                    <div
                      key={type}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        settings.appType === type 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => updateSetting('appType', type as AppType)}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-center text-sm font-medium capitalize">{type}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Complexity Level */}
              <div>
                <Label className="text-base font-medium">Complexity Level</Label>
                <div className="mt-3">
                  <Select 
                    value={settings.complexity} 
                    onValueChange={(value) => updateSetting('complexity', value as AppComplexity)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(complexityLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Feature Toggles */}
              <div>
                <Label className="text-base font-medium mb-4 block">Include in Generation</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="errorStates"
                      checked={settings.includeErrorStates}
                      onCheckedChange={(checked) => updateSetting('includeErrorStates', !!checked)}
                    />
                    <Label htmlFor="errorStates">Error States</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="loadingStates"
                      checked={settings.includeLoadingStates}
                      onCheckedChange={(checked) => updateSetting('includeLoadingStates', !!checked)}
                    />
                    <Label htmlFor="loadingStates">Loading States</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emptyStates"
                      checked={settings.includeEmptyStates}
                      onCheckedChange={(checked) => updateSetting('includeEmptyStates', !!checked)}
                    />
                    <Label htmlFor="emptyStates">Empty States</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="backendModels"
                      checked={settings.includeBackendModels}
                      onCheckedChange={(checked) => updateSetting('includeBackendModels', !!checked)}
                    />
                    <Label htmlFor="backendModels">Backend Models</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="uiComponents"
                      checked={settings.suggestUIComponents}
                      onCheckedChange={(checked) => updateSetting('suggestUIComponents', !!checked)}
                    />
                    <Label htmlFor="uiComponents">UI Components</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="modalsPopups"
                      checked={settings.includeModalsPopups}
                      onCheckedChange={(checked) => updateSetting('includeModalsPopups', !!checked)}
                    />
                    <Label htmlFor="modalsPopups">Modals & Popups</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="architecture"
                      checked={settings.generateArchitecture}
                      onCheckedChange={(checked) => updateSetting('generateArchitecture', !!checked)}
                    />
                    <Label htmlFor="architecture">Architecture Suggestions</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !userIdea.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating App Skeleton...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generate App Skeleton
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {generatedSkeleton && (
            <>
              {/* Results Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        {generatedSkeleton.name}
                      </CardTitle>
                      <p className="text-muted-foreground mt-2">
                        {generatedSkeleton.description}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Badge variant="outline">{generatedSkeleton.appType}</Badge>
                        <Badge variant="outline">{generatedSkeleton.complexity}</Badge>
                        <Badge variant="outline">{generatedSkeleton.screens.length} screens</Badge>
                        <Badge variant="outline">{generatedSkeleton.userRoles.length} roles</Badge>
                        <Badge variant="outline">{generatedSkeleton.dataModels.length} models</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={exportAsJSON} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export JSON
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Screens */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Screens ({generatedSkeleton.screens.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedSkeleton.screens.map((screen) => (
                      <div key={screen.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{screen.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {screen.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {screen.description}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          {screen.components.length} components • {screen.states.length} states
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* User Roles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    User Roles ({generatedSkeleton.userRoles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedSkeleton.userRoles.map((role) => (
                      <div key={role.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{role.name}</h4>
                          <Badge variant={role.accessLevel === 'admin' ? 'destructive' : role.accessLevel === 'advanced' ? 'default' : 'secondary'}>
                            {role.accessLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {role.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Data Models */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Data Models ({generatedSkeleton.dataModels.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {generatedSkeleton.dataModels.map((model) => (
                      <div key={model.name} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">{model.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {model.description}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {model.fields.map((field) => (
                            <div key={field.name} className="text-xs border rounded p-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{field.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {field.type}
                                </Badge>
                              </div>
                              {field.required && (
                                <div className="text-red-500 text-xs mt-1">Required</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Architecture */}
              {generatedSkeleton.architecture && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5" />
                      Recommended Architecture
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Badge className="mb-2">{generatedSkeleton.architecture.pattern}</Badge>
                        <p className="text-sm text-muted-foreground">
                          {generatedSkeleton.architecture.reasoning}
                        </p>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-2">Technology Stack</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(generatedSkeleton.architecture.technologies).map(([category, techs]) => (
                            <div key={category}>
                              <h6 className="text-sm font-medium capitalize mb-1">{category}</h6>
                              <div className="flex flex-wrap gap-1">
                                {techs.map((tech: string) => (
                                  <Badge key={tech} variant="outline" className="text-xs">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

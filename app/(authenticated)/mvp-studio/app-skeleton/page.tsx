"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2, Copy, Layers, Database, Users, Network } from 'lucide-react';
import type { AppSkeleton, GenerateAppSkeletonResponse, GenerationSettings } from '@/types/app-skeleton';

export default function AppSkeletonGeneratorPage() {
  const [idea, setIdea] = useState('');
  const [settings, setSettings] = useState<GenerationSettings>({
    includeErrorStates: true,
    includeLoadingStates: true,
    includeEmptyStates: true,
    includeBackendModels: true,
    suggestUIComponents: true,
    includeModalsPopups: true,
    generateArchitecture: true,
    appType: 'web',
    complexity: 'mvp'
  });
  const [depth, setDepth] = useState<'mvp' | 'advanced' | 'production'>('mvp');
  const [loading, setLoading] = useState(false);
  const [skeleton, setSkeleton] = useState<AppSkeleton | null>(null);
  const [rawResponse, setRawResponse] = useState<GenerateAppSkeletonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!idea.trim()) {
      setError('Please enter an idea');
      return;
    }
    setLoading(true);
    setError(null);
    setSkeleton(null);
    try {
      const response = await fetch('/api/app-skeleton', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIdea: idea,
          settings: { ...settings, complexity: depth }
        })
      });
      const data: GenerateAppSkeletonResponse = await response.json();
      setRawResponse(data);
      if (data.success && data.appSkeleton) {
        setSkeleton(data.appSkeleton);
      } else {
        setError(data.error || 'Failed to generate skeleton');
      }
  } catch {
      setError('Network error generating skeleton');
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (key: keyof GenerationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" /> App Skeleton Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Generate a full-scale app blueprint from a single idea.</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Enter Your App Idea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="E.g. A marketplace where local artists can showcase and sell eco-friendly handmade products with real-time inventory and community reviews"
              value={idea}
              onChange={e => setIdea(e.target.value)}
              className="min-h-[120px] resize-y"
            />
            <div className="flex flex-wrap gap-4 items-start">
              <div className="space-y-2">
                <label className="text-sm font-medium">App Type</label>
                <Select value={settings.appType} onValueChange={v => setSettings(s => ({ ...s, appType: v as GenerationSettings['appType'] }))}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Web App</SelectItem>
                    <SelectItem value="mobile">Mobile App</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Depth</label>
                <Select value={depth} onValueChange={v => setDepth(v as typeof depth)}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Depth" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mvp">MVP</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="production">Production Ready</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-3 self-end">
                <Button variant="outline" onClick={() => { setIdea(''); setSkeleton(null); }}>Reset</Button>
                <Button onClick={handleGenerate} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  {loading ? 'Generating...' : 'Generate Skeleton'}
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle>Options</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
            {(
              [
                ['includeErrorStates','Error States'] as const,
                ['includeLoadingStates','Loading States'] as const,
                ['includeEmptyStates','Empty States'] as const,
                ['includeBackendModels','Backend Models'] as const,
                ['suggestUIComponents','UI Components'] as const,
                ['includeModalsPopups','Modals/Popups'] as const,
                ['generateArchitecture','Architecture'] as const
              ]
            ).map(([key,label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={settings[key]} onCheckedChange={() => toggleSetting(key)} />
                <span>{label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {skeleton && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="screens">Screens</TabsTrigger>
              <TabsTrigger value="models">Data</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Layers className="w-4 h-4"/>Screens</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{skeleton.screens.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4"/>Roles</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{skeleton.userRoles.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Database className="w-4 h-4"/>Models</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{skeleton.dataModels.length}</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Network className="w-4 h-4"/>Architecture</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">Pattern: <Badge variant="secondary">{skeleton.architecture.pattern}</Badge></p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-4">{skeleton.architecture.reasoning}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="screens" className="mt-4 space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Screens ({skeleton.screens.length})</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {skeleton.screens.map(screen => (
                    <div key={screen.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{screen.name}</h4>
                        <Badge variant="outline">{screen.category}</Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{screen.description}</p>
                      {screen.components.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {screen.components.map(c => (
                            <Badge key={c.name} className="text-xs" variant="secondary">{c.name}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="models" className="mt-4 space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Data Models ({skeleton.dataModels.length})</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {skeleton.dataModels.map(model => (
                    <div key={model.name} className="border rounded p-3">
                      <h4 className="font-medium mb-1">{model.name}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{model.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {model.fields.map(f => (
                          <Badge key={f.name} variant="outline" className="text-[10px]">{f.name}:{f.type}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="raw" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Raw JSON</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(JSON.stringify(skeleton, null, 2))}>
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs max-h-[480px] overflow-auto bg-muted p-4 rounded">{JSON.stringify(skeleton, null, 2)}</pre>
                </CardContent>
              </Card>
              {rawResponse && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">Response Meta</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(JSON.stringify(rawResponse, null, 2))}><Copy className="w-3 h-3 mr-1"/>Copy</Button>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs max-h-[240px] overflow-auto bg-muted p-4 rounded">{JSON.stringify(rawResponse, null, 2)}</pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

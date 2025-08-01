"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Sparkles,
  ArrowLeft,
  Lightbulb,
  Target,
  RefreshCw,
  Zap,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { BusinessModelCanvas, BMCGenerationRequest } from "@/types/businessModelCanvas";
import { BMCBlockGrid } from "@/components/bmc/BMCBlockGrid";
import { BMCExportPanel } from "@/components/bmc/BMCExportPanel";

export default function BusinessModelCanvasPage() {
  const router = useRouter();
  const [appIdea, setAppIdea] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [businessType, setBusinessType] = useState<'b2b' | 'b2c' | 'b2b2c'>('b2c');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');
  const [canvas, setCanvas] = useState<BusinessModelCanvas | null>(null);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const { toast } = useToast();

  // Check for recent canvas
  const [hasRecentCanvas, setHasRecentCanvas] = useState(false);

  useEffect(() => {
    const recentCanvas = localStorage.getItem('bmc-canvas');
    setHasRecentCanvas(!!recentCanvas);
  }, []);

  const handleGenerate = async () => {
    const trimmedIdea = appIdea.trim();

    if (!trimmedIdea) {
      toast({
        title: "App idea required",
        description: "Please enter your app or business idea to generate a Business Model Canvas.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedIdea.length < 10) {
      toast({
        title: "Idea too short",
        description: "Please provide a more detailed description of your app or business idea (at least 10 characters).",
        variant: "destructive"
      });
      return;
    }

    if (trimmedIdea.length > 1000) {
      toast({
        title: "Idea too long",
        description: "Please keep your idea description under 1000 characters for better AI processing.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStep('Initializing AI generation...');

    // Enhanced progress simulation with steps
    const progressSteps = [
      { progress: 10, step: 'Analyzing business idea...' },
      { progress: 25, step: 'Generating customer segments...' },
      { progress: 40, step: 'Creating value proposition...' },
      { progress: 55, step: 'Defining channels and relationships...' },
      { progress: 70, step: 'Structuring revenue and costs...' },
      { progress: 85, step: 'Checking for content duplication...' },
      { progress: 95, step: 'Finalizing business model canvas...' }
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        const currentStep = progressSteps[stepIndex];
        setGenerationProgress(currentStep.progress);
        setGenerationStep(currentStep.step);
        stepIndex++;
      }
    }, 800);

    try {
      const request: BMCGenerationRequest = {
        appIdea: appIdea.trim(),
        industry: industry || undefined,
        targetMarket: targetMarket || undefined,
        businessType,
        additionalContext: additionalContext || undefined
      };

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'business-model-canvas',
          prompt: JSON.stringify(request)
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate Business Model Canvas');
      } else {
        const generatedCanvas = data.data.canvas;

        // Save canvas to localStorage
        localStorage.setItem('bmc-canvas', JSON.stringify(generatedCanvas));
        setCanvas(generatedCanvas);

        toast({
          title: "Business Model Canvas Generated!",
          description: "Your canvas is ready. Review and customize each block as needed.",
        });

        // Scroll to canvas
        setTimeout(() => {
          const canvasElement = document.getElementById('bmc-canvas');
          if (canvasElement) {
            canvasElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 500);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error generating BMC:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate Business Model Canvas. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setGenerationProgress(0);
        setGenerationStep('');
      }, 1000);
    }
  };

  const handleClearForm = () => {
    setAppIdea('');
    setIndustry('');
    setTargetMarket('');
    setBusinessType('b2c');
    setAdditionalContext('');
    setCanvas(null);
    localStorage.removeItem('bmc-canvas');

    toast({
      title: "Form cleared",
      description: "All form data has been cleared. You can start fresh with a new idea.",
    });
  };

  const handleTryExample = () => {
    setAppIdea('A mobile app that helps students track their daily study habits and collaborate with peers through group challenges');
    setIndustry('EdTech');
    setTargetMarket('High school and college students');
    setBusinessType('b2c');
    setAdditionalContext('Focus on gamification and social features to increase engagement and retention');

    toast({
      title: "Example loaded",
      description: "Click 'Generate Business Model Canvas' to see AI in action!",
    });
  };

  const handleCanvasUpdate = (updatedCanvas: BusinessModelCanvas) => {
    setCanvas(updatedCanvas);
    localStorage.setItem('bmc-canvas', JSON.stringify(updatedCanvas));
  };

  const handleLoadRecentCanvas = () => {
    const recentCanvas = localStorage.getItem('bmc-canvas');
    if (recentCanvas) {
      const parsedCanvas = JSON.parse(recentCanvas);
      setCanvas(parsedCanvas);
      setAppIdea(parsedCanvas.appIdea);
      if (parsedCanvas.metadata) {
        setIndustry(parsedCanvas.metadata.industry || '');
        setTargetMarket(parsedCanvas.metadata.targetMarket || '');
        setBusinessType(parsedCanvas.metadata.businessType || 'b2c');
      }
      
      toast({
        title: "Canvas loaded",
        description: "Your recent Business Model Canvas has been loaded.",
      });

      // Scroll to canvas
      setTimeout(() => {
        const canvasElement = document.getElementById('bmc-canvas');
        if (canvasElement) {
          canvasElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/workspace"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Workspace</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-green-600/20 text-green-300 border-green-600/40">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
        </div>

        {/* Header Section */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-green-600/20 border border-green-500/30">
              <Target className="h-10 w-10 text-green-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">AI Business Model Canvas Generator</h2>
          </div>
          <p className="text-gray-300 text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed px-4">
            Transform your app or business idea into a complete, professional Business Model Canvas.
            Our AI analyzes your concept and generates expert-level strategic insights across all 9 essential blocks.
          </p>

          {/* Example Preview */}
          <div className="mt-8 p-6 sm:p-8 bg-black/20 rounded-xl border border-white/10 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="h-6 w-6 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">Example Output</h3>
            </div>
            <div className="text-left space-y-6">
              <p className="text-sm sm:text-base text-gray-300">
                <strong className="text-green-400">Input:</strong> "A mobile app that helps students track their daily study habits and collaborate with peers through group challenges."
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                  <p className="text-blue-400 font-medium mb-2">Customer Segments</p>
                  <p className="text-xs text-gray-400">High school and college students seeking productivity tools...</p>
                </div>
                <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                  <p className="text-green-400 font-medium mb-2">Value Proposition</p>
                  <p className="text-xs text-gray-400">Gamified habit tracking with social accountability...</p>
                </div>
                <div className="bg-black/30 p-4 rounded-lg border border-white/10 sm:col-span-2 lg:col-span-1">
                  <p className="text-yellow-400 font-medium mb-2">Revenue Streams</p>
                  <p className="text-xs text-gray-400">Freemium model with premium analytics...</p>
                </div>
              </div>
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleTryExample}
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10 px-6 py-2"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Try This Example
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <Card className="bg-black/40 border-white/10 max-w-5xl mx-auto mb-8">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-white text-xl">
              <Lightbulb className="h-6 w-6 text-yellow-400" />
              Tell Us About Your Idea
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="appIdea" className="text-white font-medium text-sm">
                    App or Business Idea *
                  </Label>
                  <span className={`text-xs ${
                    appIdea.length > 1000 ? 'text-red-400' :
                    appIdea.length > 800 ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>
                    {appIdea.length}/1000
                  </span>
                </div>
                <Textarea
                  id="appIdea"
                  placeholder="Describe your app or business idea in 1-2 sentences..."
                  value={appIdea}
                  onChange={(e) => setAppIdea(e.target.value)}
                  className={`bg-black/30 border-white/20 text-white placeholder:text-gray-400 min-h-[120px] resize-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 ${
                    appIdea.length > 1000 ? 'border-red-500/50' : ''
                  }`}
                  maxLength={1000}
                />
                {appIdea.length < 10 && appIdea.length > 0 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Please provide more details (minimum 10 characters)
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="industry" className="text-white font-medium text-sm block">
                  Industry (Optional)
                </Label>
                <Input
                  id="industry"
                  placeholder="e.g., FinTech, HealthTech, EdTech"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="bg-black/30 border-white/20 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="targetMarket" className="text-white font-medium text-sm block">
                  Target Market (Optional)
                </Label>
                <Input
                  id="targetMarket"
                  placeholder="e.g., Young professionals, Small businesses"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  className="bg-black/30 border-white/20 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="businessType" className="text-white font-medium text-sm block">
                  Business Type
                </Label>
                <Select value={businessType} onValueChange={(value: 'b2b' | 'b2c' | 'b2b2c') => setBusinessType(value)}>
                  <SelectTrigger className="bg-black/30 border-white/20 text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="b2c">B2C (Business to Consumer)</SelectItem>
                    <SelectItem value="b2b">B2B (Business to Business)</SelectItem>
                    <SelectItem value="b2b2c">B2B2C (Business to Business to Consumer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <Label htmlFor="additionalContext" className="text-white font-medium text-sm block">
                  Additional Context (Optional)
                </Label>
                <Textarea
                  id="additionalContext"
                  placeholder="Any additional details about your business model, target audience, or unique aspects..."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  className="bg-black/30 border-white/20 text-white placeholder:text-gray-400 min-h-[80px] resize-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                />
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-white/10">
              {isGenerating && (
                <div className="space-y-3 max-w-md mx-auto">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium">
                      {generationStep || 'Generating your Business Model Canvas...'}
                    </span>
                    <span className="text-gray-400 font-mono">{Math.round(generationProgress)}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-3" />
                  {generationProgress >= 85 && generationProgress < 100 && (
                    <div className="text-center text-xs text-green-400 animate-pulse">
                      ✨ Applying deduplication for professional quality
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !appIdea.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg font-medium w-full sm:w-auto sm:min-w-[280px] h-10 sm:h-12"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 animate-spin" />
                      <span className="hidden sm:inline">Generating Canvas...</span>
                      <span className="sm:hidden">Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                      <span className="hidden sm:inline">Generate Business Model Canvas</span>
                      <span className="sm:hidden">Generate Canvas</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleClearForm}
                  className="border-white/20 text-white hover:bg-white/10 px-4 py-2 text-sm sm:text-base"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Form
                </Button>

                {hasRecentCanvas && (
                  <Button
                    variant="outline"
                    onClick={handleLoadRecentCanvas}
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10 px-4 py-2 text-sm sm:text-base"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Load Recent Canvas
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Canvas Display */}
        {canvas && (
          <div id="bmc-canvas" className="space-y-8">
            <BMCBlockGrid
              canvas={canvas}
              onCanvasUpdate={handleCanvasUpdate}
              isGenerating={isGenerating}
            />

            <div className="flex justify-center">
              <Button
                onClick={() => setShowExportPanel(!showExportPanel)}
                variant="outline"
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {showExportPanel ? 'Hide Export Options' : 'Export & Share'}
              </Button>
            </div>

            <BMCExportPanel
              canvas={canvas}
              isVisible={showExportPanel}
              onToggle={() => setShowExportPanel(!showExportPanel)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

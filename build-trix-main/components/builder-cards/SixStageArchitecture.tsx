"use client"

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Lightbulb, 
  Layers, 
  Wand2, 
  GitBranch, 
  Download,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { useBuilder, builderActions } from "@/lib/builderContext";
import { AppIdeaCard } from "./AppIdeaCard";
import { ValidationCard } from "./ValidationCard";
import { BlueprintCard } from "./BlueprintCard";
import { PromptGeneratorCard } from "./PromptGeneratorCard";
import { FlowDescriptionCard } from "./FlowDescriptionCard";
import { ExportComposerCard } from "./ExportComposerCard";

const STAGES = [
  {
    id: 1,
    title: "Tool-Adaptive Engine",
    description: "Define your app concept and preferences",
    icon: Brain,
    color: "text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800"
  },
  {
    id: 2,
    title: "Idea Interpreter",
    description: "Validate and understand your journey",
    icon: Lightbulb,
    color: "text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800"
  },
  {
    id: 3,
    title: "App Skeleton Generator",
    description: "Generate app structure and architecture",
    icon: Layers,
    color: "text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800"
  },
  {
    id: 4,
    title: "Prompt Generator",
    description: "Create detailed implementation prompts",
    icon: Wand2,
    color: "text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800"
  },
  {
    id: 5,
    title: "Flow Description",
    description: "Define navigation and user journey",
    icon: GitBranch,
    color: "text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    borderColor: "border-cyan-200 dark:border-cyan-800"
  },
  {
    id: 6,
    title: "Export Composer",
    description: "Generate final prompts for AI tools",
    icon: Download,
    color: "text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800"
  }
];

interface SixStageArchitectureProps {
  mode?: 'overview' | 'builder';
}

export function SixStageArchitecture({ mode = 'overview' }: SixStageArchitectureProps) {
  const { state, dispatch } = useBuilder();

  const getStageStatus = (stageId: number) => {
    if (stageId < state.currentCard) return 'completed';
    if (stageId === state.currentCard) return 'current';
    return 'pending';
  };

  const getStageProgress = () => {
    const completedStages = state.currentCard - 1;
    return (completedStages / 6) * 100;
  };

  const handleStageClick = (stageId: number) => {
    if (mode === 'overview' || stageId <= state.currentCard) {
      dispatch(builderActions.setCurrentCard(stageId));
    }
  };

  const renderCurrentCard = () => {
    switch (state.currentCard) {
      case 1:
        return <AppIdeaCard />;
      case 2:
        return <ValidationCard />;
      case 3:
        return <BlueprintCard />;
      case 4:
        return <PromptGeneratorCard />;
      case 5:
        return <FlowDescriptionCard />;
      case 6:
        return <ExportComposerCard />;
      default:
        return <AppIdeaCard />;
    }
  };

  if (mode === 'builder') {
    return (
      <div className="space-y-6">
        {/* Progress Header */}
        <div className="bg-white dark:bg-gray-900 border-b sticky top-0 z-10 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">MVP Studio Builder</h1>
              <Badge variant="outline">
                Step {state.currentCard} of 6
              </Badge>
            </div>
            <Progress value={getStageProgress()} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Progress: {Math.round(getStageProgress())}%</span>
              <span>{state.currentCard === 6 ? 'Almost done!' : `${6 - state.currentCard} steps remaining`}</span>
            </div>
          </div>
        </div>

        {/* Current Stage Card */}
        <div className="max-w-4xl mx-auto px-4">
          {renderCurrentCard()}
        </div>

        {/* Stage Navigation */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {STAGES.map((stage) => {
              const StageIcon = stage.icon;
              const status = getStageStatus(stage.id);
              
              return (
                <Button
                  key={stage.id}
                  variant={status === 'current' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-auto p-2 flex flex-col items-center gap-1 ${
                    status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' : ''
                  }`}
                  onClick={() => handleStageClick(stage.id)}
                  disabled={stage.id > state.currentCard}
                >
                  <div className="flex items-center gap-1">
                    {status === 'completed' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : status === 'current' ? (
                      <StageIcon className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium">{stage.id}</span>
                  </div>
                  <span className="text-xs text-center leading-tight">{stage.title}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Overview mode
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">6-Stage MVP Builder</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Transform your app idea into implementation-ready prompts through our comprehensive 6-stage process.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((stage) => {
          const StageIcon = stage.icon;
          const status = getStageStatus(stage.id);
          
          return (
            <Card 
              key={stage.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                status === 'current' ? stage.borderColor : ''
              } ${status === 'completed' ? 'bg-green-50 dark:bg-green-950/10' : ''}`}
              onClick={() => handleStageClick(stage.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${stage.bgColor}`}>
                    <StageIcon className={`w-6 h-6 ${stage.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{stage.title}</h3>
                      {status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {status === 'current' && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {stage.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        Stage {stage.id}
                      </Badge>
                      {status !== 'pending' && (
                        <Button variant="ghost" size="sm">
                          {status === 'current' ? 'Continue' : 'Review'}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress Summary */}
      {state.currentCard > 1 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Your Progress</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {state.currentCard === 6 ? 'Project completed!' : `${state.currentCard - 1} of 6 stages completed`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(getStageProgress())}%
                </div>
                <Progress value={getStageProgress()} className="w-32 h-2 mt-1" />
              </div>
            </div>
            {state.currentCard < 6 && (
              <Button 
                className="mt-4" 
                onClick={() => handleStageClick(state.currentCard)}
              >
                Continue Building
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

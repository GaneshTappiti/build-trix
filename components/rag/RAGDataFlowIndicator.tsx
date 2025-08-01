'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowRight, Brain, Database, Zap } from 'lucide-react';
import { useBuilder } from '@/lib/builderContext';

interface StageStatus {
  stage: number;
  name: string;
  completed: boolean;
  ragEnhanced: boolean;
  confidenceScore?: number;
  dataPreserved: boolean;
}

export function RAGDataFlowIndicator() {
  const { state } = useBuilder();

  // Calculate stage statuses based on current state
  const getStageStatuses = (): StageStatus[] => {
    return [
      {
        stage: 1,
        name: 'App Idea',
        completed: !!state.appIdea.appName,
        ragEnhanced: false, // No RAG for this stage
        dataPreserved: !!state.appIdea.appName
      },
      {
        stage: 2,
        name: 'Validation & Tool Selection',
        completed: state.validationQuestions.hasValidated && !!state.validationQuestions.preferredAITool,
        ragEnhanced: false, // Tool selection only
        dataPreserved: !!state.validationQuestions.preferredAITool
      },
      {
        stage: 3,
        name: 'Blueprint',
        completed: !!state.appBlueprint && state.appBlueprint.screens.length > 0,
        ragEnhanced: !!state.appBlueprint?.ragEnhanced,
        confidenceScore: state.appBlueprint?.confidenceScore,
        dataPreserved: !!state.appBlueprint
      },
      {
        stage: 4,
        name: 'Screen Prompts',
        completed: state.screenPrompts.length > 0,
        ragEnhanced: state.screenPrompts.some(p => p.ragEnhanced),
        confidenceScore: state.screenPrompts.find(p => p.confidenceScore)?.confidenceScore,
        dataPreserved: state.screenPrompts.length > 0
      },
      {
        stage: 5,
        name: 'Flow Description',
        completed: !!state.appFlow,
        ragEnhanced: false, // No RAG for this stage
        dataPreserved: !!state.appFlow
      },
      {
        stage: 6,
        name: 'Export',
        completed: !!state.exportPrompts,
        ragEnhanced: false, // Uses tool from stage 2
        dataPreserved: !!state.exportPrompts
      }
    ];
  };

  const stages = getStageStatuses();
  const currentStage = state.currentCard;
  const selectedTool = state.validationQuestions.preferredAITool;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          RAG Data Flow & Enhancement Status
        </CardTitle>
        {selectedTool && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">Selected Tool: {selectedTool}</Badge>
            <Badge variant="secondary">
              <Zap className="h-3 w-3 mr-1" />
              RAG Enhanced
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stage Flow Visualization */}
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {stages.map((stage, index) => (
              <React.Fragment key={stage.stage}>
                <div className="flex flex-col items-center min-w-[120px]">
                  {/* Stage Circle */}
                  <div className={`
                    relative flex items-center justify-center w-12 h-12 rounded-full border-2 mb-2
                    ${stage.completed 
                      ? 'bg-green-100 border-green-500 text-green-700' 
                      : currentStage === stage.stage
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }
                  `}>
                    {stage.completed ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                    
                    {/* RAG Enhancement Indicator */}
                    {stage.ragEnhanced && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                        <Brain className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Stage Name */}
                  <div className="text-center">
                    <div className="text-sm font-medium">{stage.name}</div>
                    <div className="text-xs text-gray-500">Stage {stage.stage}</div>
                  </div>
                  
                  {/* Data Status */}
                  <div className="mt-1 flex flex-col items-center gap-1">
                    {stage.dataPreserved && (
                      <Badge variant="outline" className="text-xs">
                        <Database className="h-2 w-2 mr-1" />
                        Data Saved
                      </Badge>
                    )}
                    
                    {stage.ragEnhanced && stage.confidenceScore && (
                      <Badge variant="secondary" className="text-xs">
                        {(stage.confidenceScore * 100).toFixed(0)}% Confidence
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Arrow between stages */}
                {index < stages.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400 mx-2 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Data Flow Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Completed Stages</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stages.filter(s => s.completed).length}/6
              </div>
              <Progress 
                value={(stages.filter(s => s.completed).length / 6) * 100} 
                className="mt-2"
              />
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">RAG Enhanced</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {stages.filter(s => s.ragEnhanced).length}/2
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Blueprint & Screen Prompts
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Data Preserved</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stages.filter(s => s.dataPreserved).length}/6
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Auto-saved & Persistent
              </div>
            </Card>
          </div>

          {/* RAG Enhancement Details */}
          {(state.appBlueprint?.ragEnhanced || state.screenPrompts.some(p => p.ragEnhanced)) && (
            <Card className="p-4 bg-purple-50 border-purple-200">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                RAG Enhancement Details
              </h4>
              <div className="space-y-2 text-sm">
                {state.appBlueprint?.ragEnhanced && (
                  <div className="flex items-center justify-between">
                    <span>Blueprint Enhanced</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {state.appBlueprint.toolSpecificRecommendations?.length || 0} Recommendations
                      </Badge>
                      {state.appBlueprint.confidenceScore && (
                        <Badge variant="secondary">
                          {(state.appBlueprint.confidenceScore * 100).toFixed(0)}% Confidence
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {state.screenPrompts.some(p => p.ragEnhanced) && (
                  <div className="flex items-center justify-between">
                    <span>Screen Prompts Enhanced</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {state.screenPrompts.filter(p => p.ragEnhanced).length} Screens
                      </Badge>
                      <Badge variant="secondary">
                        Tool-Optimized for {selectedTool}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Data Flow Integrity Check */}
          <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Database className="h-3 w-3" />
              <span className="font-medium">Data Flow Integrity:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>App Idea → Validation: {state.appIdea.appName && state.validationQuestions.hasValidated ? '✅' : '⏳'}</div>
              <div>Validation → Blueprint: {state.validationQuestions.preferredAITool && state.appBlueprint ? '✅' : '⏳'}</div>
              <div>Blueprint → Screen Prompts: {state.appBlueprint && state.screenPrompts.length > 0 ? '✅' : '⏳'}</div>
              <div>Tool Selection Preserved: {selectedTool ? '✅' : '⏳'}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

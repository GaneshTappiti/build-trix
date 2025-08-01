"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Code, 
  FileText, 
  Lightbulb, 
  Brain,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface Module {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
  isNew?: boolean;
}

export default function WorkspacePage() {
  const router = useRouter();

  const modules: Module[] = [
    {
      id: "mvp-studio",
      name: "MVP Studio",
      description: "Your AI-powered build orchestrator. Generate prompts, get tool recommendations, and build your MVP with the best AI builders in the market.",
      path: "/mvp-studio",
      icon: "🚀"
    },
    {
      id: "business-model-canvas",
      name: "AI Business Model Canvas",
      description: "🆕 Generate professional Business Model Canvas with AI. Transform your idea into a complete strategic framework across all 9 essential blocks. Export-ready for investors and stakeholders.",
      path: "/workspace/business-model-canvas",
      icon: "🎯",
      isNew: true
    },
    {
      id: "task-planner",
      name: "Task Planner",
      description: "Plan and organize your development tasks with AI assistance.",
      path: "/task-planner",
      icon: "📋"
    },
    {
      id: "your-mvps",
      name: "Your MVPs",
      description: "View and manage your created MVPs and projects.",
      path: "/your-mvps",
      icon: "💼"
    }
  ];

  const handleModuleClick = (module: Module) => {
    router.push(module.path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-green-600/20 border border-green-500/30">
              <Brain className="h-10 w-10 text-green-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Workspace</h1>
          </div>
          <p className="text-gray-300 text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed">
            Your AI-powered startup development hub. Access all the tools you need to build, validate, and launch your ideas.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {modules.map((module) => (
            <Card 
              key={module.id}
              className="relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg bg-black/40 border-white/10 hover:border-white/20 cursor-pointer group"
              onClick={() => handleModuleClick(module)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="text-3xl flex-shrink-0 mt-1">{module.icon}</div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg font-semibold leading-tight text-white group-hover:text-green-400 transition-colors">
                        {module.name}
                      </CardTitle>
                      {module.isNew && (
                        <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs mt-2">
                          <Sparkles className="h-3 w-3 mr-1" />
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-400 transition-colors flex-shrink-0" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  {module.description}
                </p>
                
                <Button 
                  variant="outline" 
                  className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10 group-hover:border-green-400/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModuleClick(module);
                  }}
                >
                  Open Module
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

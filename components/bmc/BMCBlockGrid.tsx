"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Copy, 
  Edit3, 
  RefreshCw, 
  Check, 
  X, 
  Sparkles,
  Clock,
  TrendingUp
} from "lucide-react";
import { BusinessModelCanvas, BMC_BLOCK_CONFIGS, BMCBlock } from "@/types/businessModelCanvas";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BMCBlockGridProps {
  canvas: BusinessModelCanvas;
  onCanvasUpdate: (canvas: BusinessModelCanvas) => void;
  isGenerating?: boolean;
}

interface BMCBlockCardProps {
  block: BMCBlock;
  config: typeof BMC_BLOCK_CONFIGS[0];
  onUpdate: (updatedBlock: BMCBlock) => void;
  onRegenerate: (blockId: string) => void;
  isRegenerating?: boolean;
}

function BMCBlockCard({ block, config, onUpdate, onRegenerate, isRegenerating }: BMCBlockCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(block.content);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(block.content);
      toast({
        title: "Copied to clipboard",
        description: `${config.title} content copied successfully.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleSave = () => {
    const updatedBlock: BMCBlock = {
      ...block,
      content: editContent,
      isGenerated: false,
      lastUpdated: new Date()
    };
    onUpdate(updatedBlock);
    setIsEditing(false);
    toast({
      title: "Block updated",
      description: `${config.title} has been updated successfully.`,
    });
  };

  const handleCancel = () => {
    setEditContent(block.content);
    setIsEditing(false);
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg",
      "bg-black/40 border-white/10 hover:border-white/20 h-full",
      isRegenerating && "opacity-60"
    )}>
      {/* Gradient overlay */}
      <div className={cn("absolute inset-0 opacity-10", `bg-gradient-to-br ${config.gradient}`)} />

      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="text-2xl flex-shrink-0 mt-1">{config.icon}</div>
            <div className="min-w-0 flex-1">
              <CardTitle className={cn("text-lg font-semibold leading-tight", config.color)}>
                {config.title}
              </CardTitle>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">{config.description}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {block.isGenerated && (
              <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI
              </Badge>
            )}
            {block.confidence && (
              <Badge variant="outline" className={cn("border-opacity-30 text-xs", getConfidenceColor(block.confidence))}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {Math.round(block.confidence * 100)}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-4 flex-1 flex flex-col">
        {isEditing ? (
          <div className="space-y-4 flex-1 flex flex-col">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[140px] bg-black/30 border-white/20 text-white resize-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 flex-1"
              placeholder={config.placeholder}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="border-white/20 text-white hover:bg-white/10 px-4"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-4"
              >
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-white text-sm leading-relaxed min-h-[100px] flex-1">
              {block.content && !block.content.includes('Error generating content') ? (
                <div className="whitespace-pre-wrap">{block.content}</div>
              ) : (
                <div className="space-y-3">
                  <span className="text-gray-400 italic block">
                    {config.placeholder}
                  </span>
                  <div className="text-xs text-gray-500">
                    <p className="font-medium mb-1">Consider including:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {config.examples.slice(0, 3).map((example, idx) => (
                        <li key={idx}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                <span>Updated {new Date(block.lastUpdated).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="text-gray-400 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                  title="Copy content"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-gray-400 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                  title="Edit content"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRegenerate(block.id)}
                  disabled={isRegenerating}
                  className="text-gray-400 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                  title="Regenerate with AI"
                >
                  <RefreshCw className={cn("h-4 w-4", isRegenerating && "animate-spin")} />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function BMCBlockGrid({ canvas, onCanvasUpdate, isGenerating }: BMCBlockGridProps) {
  const [regeneratingBlocks, setRegeneratingBlocks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleBlockUpdate = (blockId: keyof BusinessModelCanvas['blocks'], updatedBlock: BMCBlock) => {
    const updatedCanvas: BusinessModelCanvas = {
      ...canvas,
      blocks: {
        ...canvas.blocks,
        [blockId]: updatedBlock
      },
      updatedAt: new Date()
    };
    onCanvasUpdate(updatedCanvas);
  };

  const handleRegenerate = async (blockId: string) => {
    setRegeneratingBlocks(prev => new Set(prev).add(blockId));

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'bmc-block',
          prompt: JSON.stringify({
            blockId,
            appIdea: canvas.appIdea,
            existingCanvas: canvas
          })
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        // If AI generation failed, provide a helpful fallback
        const blockConfig = BMC_BLOCK_CONFIGS.find(config => config.id === blockId);
        if (blockConfig) {
          const fallbackBlock: BMCBlock = {
            id: blockId,
            title: blockConfig.title,
            content: `Please customize this ${blockConfig.title.toLowerCase()} section for your business idea: "${canvas.appIdea}"\n\n${blockConfig.description}\n\nConsider: ${blockConfig.examples.join(', ')}`,
            isGenerated: false,
            lastUpdated: new Date(),
            confidence: 0.3
          };

          handleBlockUpdate(blockId as keyof BusinessModelCanvas['blocks'], fallbackBlock);

          toast({
            title: "Template provided",
            description: `AI regeneration failed, but we've provided a template for ${blockConfig.title}.`,
            variant: "destructive"
          });
        } else {
          throw new Error(data.error || 'Failed to regenerate block');
        }
      } else {
        handleBlockUpdate(blockId as keyof BusinessModelCanvas['blocks'], data.data);

        toast({
          title: "Block regenerated",
          description: `${data.data.title} has been regenerated successfully.`,
        });
      }
    } catch (error) {
      console.error('Error regenerating block:', error);
      toast({
        title: "Regeneration failed",
        description: error instanceof Error ? error.message : "Failed to regenerate block. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRegeneratingBlocks(prev => {
        const newSet = new Set(prev);
        newSet.delete(blockId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-0">
        <div className="space-y-2">
          <h3 className="text-2xl sm:text-3xl font-bold text-white">Your Business Model Canvas</h3>
          <p className="text-gray-400 text-sm sm:text-base">
            Review and refine each block. Click edit to customize or regenerate for new AI suggestions.
          </p>
        </div>
        <Badge variant="outline" className="text-green-400 border-green-400/30 self-start sm:self-center">
          <Sparkles className="h-4 w-4 mr-2" />
          AI Generated
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-4 sm:px-0">
        {BMC_BLOCK_CONFIGS.map((config) => {
          const block = canvas.blocks[config.id];
          return (
            <BMCBlockCard
              key={config.id}
              block={block}
              config={config}
              onUpdate={(updatedBlock) => handleBlockUpdate(config.id, updatedBlock)}
              onRegenerate={handleRegenerate}
              isRegenerating={regeneratingBlocks.has(config.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Download, 
  Copy, 
  FileText, 
  Share2, 
  ExternalLink,
  Rocket,
  CheckCircle
} from "lucide-react";
import { BusinessModelCanvas, BMCExportOptions } from "@/types/businessModelCanvas";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BMCExportPanelProps {
  canvas: BusinessModelCanvas;
  isVisible: boolean;
  onToggle: () => void;
}

export function BMCExportPanel({ canvas, isVisible, onToggle }: BMCExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'markdown' | 'json'>('markdown');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeTimestamps, setIncludeTimestamps] = useState(false);
  const [template, setTemplate] = useState<'standard' | 'detailed' | 'pitch'>('standard');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const generateMarkdownContent = () => {
    const metadata = canvas.metadata;
    let content = `# Business Model Canvas\n\n`;
    
    if (includeMetadata && metadata) {
      content += `## Project Information\n`;
      content += `**Business Idea:** ${canvas.appIdea}\n`;
      if (metadata.industry) content += `**Industry:** ${metadata.industry}\n`;
      if (metadata.targetMarket) content += `**Target Market:** ${metadata.targetMarket}\n`;
      if (metadata.businessType) content += `**Business Type:** ${metadata.businessType.toUpperCase()}\n`;
      if (includeTimestamps) {
        content += `**Created:** ${new Date(canvas.createdAt).toLocaleDateString()}\n`;
        content += `**Last Updated:** ${new Date(canvas.updatedAt).toLocaleDateString()}\n`;
      }
      content += `\n`;
    }

    // Add blocks in BMC order
    const blockOrder = [
      'keyPartnerships', 'keyActivities', 'keyResources', 'valueProposition',
      'customerRelationships', 'channels', 'customerSegments', 'costStructure', 'revenueStreams'
    ];

    blockOrder.forEach(blockId => {
      const block = canvas.blocks[blockId as keyof typeof canvas.blocks];
      if (block && block.content) {
        content += `## ${block.title}\n\n${block.content}\n\n`;
      }
    });

    return content;
  };

  const handleCopyAll = async () => {
    try {
      const content = generateMarkdownContent();

      if (!navigator.clipboard) {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } else {
        await navigator.clipboard.writeText(content);
      }

      toast({
        title: "Copied to clipboard",
        description: "Complete Business Model Canvas copied to clipboard.",
      });
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard. Please try selecting and copying manually.",
        variant: "destructive"
      });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const options: BMCExportOptions = {
        format: exportFormat,
        includeMetadata,
        includeTimestamps,
        template
      };

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case 'markdown':
          content = generateMarkdownContent();
          filename = `business-model-canvas-${Date.now()}.md`;
          mimeType = 'text/markdown';
          break;
        case 'json':
          content = JSON.stringify(canvas, null, 2);
          filename = `business-model-canvas-${Date.now()}.json`;
          mimeType = 'application/json';
          break;
        case 'pdf':
          // For PDF, we'll generate markdown and let the user convert it
          content = generateMarkdownContent();
          filename = `business-model-canvas-${Date.now()}.md`;
          mimeType = 'text/markdown';
          toast({
            title: "PDF Export",
            description: "Markdown file downloaded. You can convert it to PDF using online tools or Pandoc.",
          });
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Business Model Canvas exported as ${exportFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export canvas. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="bg-black/40 border-white/10 mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          <Share2 className="h-5 w-5 text-green-400" />
          Export & Share
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-white font-medium">Export Format</Label>
              <Select value={exportFormat} onValueChange={(value: 'pdf' | 'markdown' | 'json') => setExportFormat(value)}>
                <SelectTrigger className="bg-black/30 border-white/20 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">Markdown (.md)</SelectItem>
                  <SelectItem value="json">JSON (.json)</SelectItem>
                  <SelectItem value="pdf">PDF (via Markdown)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="metadata" 
                  checked={includeMetadata} 
                  onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                />
                <Label htmlFor="metadata" className="text-white text-sm">Include metadata</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="timestamps" 
                  checked={includeTimestamps} 
                  onCheckedChange={(checked) => setIncludeTimestamps(checked as boolean)}
                />
                <Label htmlFor="timestamps" className="text-white text-sm">Include timestamps</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-white font-medium">Template Style</Label>
              <Select value={template} onValueChange={(value: 'standard' | 'detailed' | 'pitch') => setTemplate(value)}>
                <SelectTrigger className="bg-black/30 border-white/20 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="pitch">Pitch Ready</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleCopyAll}
                variant="outline"
                className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All Content
              </Button>
              
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isExporting ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-pulse" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Canvas
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="text-blue-400 border-blue-400/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Investor Ready
            </Badge>
            <Badge variant="outline" className="text-purple-400 border-purple-400/30">
              <Rocket className="h-3 w-3 mr-1" />
              MVP Planning
            </Badge>
            <Badge variant="outline" className="text-orange-400 border-orange-400/30">
              <ExternalLink className="h-3 w-3 mr-1" />
              Shareable
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

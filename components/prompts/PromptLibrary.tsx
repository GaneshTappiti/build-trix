'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Star, 
  Copy, 
  Download, 
  Archive, 
  Brain, 
  Zap,
  Calendar,
  Target,
  MoreVertical,
  Heart,
  HeartOff,
  Trash2,
  Edit,
  Eye,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStoredPrompts, StoredPrompt } from '@/hooks/useStoredPrompts';
import { useToast } from '@/hooks/use-toast';

interface PromptLibraryProps {
  mvpId?: string;
  onSelectPrompt?: (prompt: StoredPrompt) => void;
  showActions?: boolean;
}

export function PromptLibrary({ mvpId, onSelectPrompt, showActions = true }: PromptLibraryProps) {
  const { toast } = useToast();
  const {
    prompts,
    isLoading,
    error,
    pagination,
    fetchPrompts,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    copyPrompt,
    searchPrompts,
    getPromptsByType,
    getPromptsByTool,
    getFavoritePrompts,
    getRagEnhancedPrompts,
    loadMore
  } = useStoredPrompts();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showRagOnly, setShowRagOnly] = useState(false);
  const [filteredPrompts, setFilteredPrompts] = useState<StoredPrompt[]>([]);

  // Filter prompts based on current filters
  useEffect(() => {
    let filtered = prompts;

    // Apply search
    if (searchQuery.trim()) {
      filtered = searchPrompts(searchQuery);
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.promptType === selectedType);
    }

    // Apply tool filter
    if (selectedTool !== 'all') {
      filtered = filtered.filter(p => p.targetTool === selectedTool);
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(p => p.isFavorite);
    }

    // Apply RAG filter
    if (showRagOnly) {
      filtered = filtered.filter(p => p.isRagEnhanced);
    }

    // Filter by MVP ID if provided
    if (mvpId) {
      // This would need to be implemented in the backend
      // filtered = filtered.filter(p => p.mvpId === mvpId);
    }

    setFilteredPrompts(filtered);
  }, [prompts, searchQuery, selectedType, selectedTool, showFavoritesOnly, showRagOnly, mvpId, searchPrompts]);

  const handleCopyPrompt = async (prompt: StoredPrompt) => {
    const success = await copyPrompt(prompt);
    if (success) {
      toast({
        title: "Copied!",
        description: "Prompt copied to clipboard",
      });
    } else {
      toast({
        title: "Copy Failed",
        description: "Failed to copy prompt to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async (prompt: StoredPrompt) => {
    try {
      await toggleFavorite(prompt.id, !prompt.isFavorite);
      toast({
        title: prompt.isFavorite ? "Removed from Favorites" : "Added to Favorites",
        description: `"${prompt.promptTitle}" ${prompt.isFavorite ? 'removed from' : 'added to'} favorites`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const handleDeletePrompt = async (prompt: StoredPrompt) => {
    try {
      await deletePrompt(prompt.id);
      toast({
        title: "Prompt Deleted",
        description: `"${prompt.promptTitle}" has been archived`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete prompt",
        variant: "destructive",
      });
    }
  };

  const getPromptTypeIcon = (type: string) => {
    switch (type) {
      case 'blueprint': return <Target className="h-4 w-4" />;
      case 'screen_prompt': return <Eye className="h-4 w-4" />;
      case 'unified': return <Zap className="h-4 w-4" />;
      case 'export': return <Download className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getPromptTypeColor = (type: string) => {
    switch (type) {
      case 'blueprint': return 'bg-purple-100 text-purple-800';
      case 'screen_prompt': return 'bg-blue-100 text-blue-800';
      case 'unified': return 'bg-green-100 text-green-800';
      case 'export': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading prompts: {error}</p>
            <Button onClick={() => fetchPrompts()} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Prompt Library</h2>
          <p className="text-gray-600">Manage your saved and generated prompts</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredPrompts.length} prompts
          </Badge>
          {showRagOnly && (
            <Badge variant="secondary">
              <Brain className="h-3 w-3 mr-1" />
              RAG Enhanced
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Types</option>
              <option value="blueprint">Blueprint</option>
              <option value="screen_prompt">Screen Prompts</option>
              <option value="unified">Unified</option>
              <option value="export">Export</option>
            </select>

            {/* Tool Filter */}
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Tools</option>
              <option value="lovable">Lovable</option>
              <option value="cursor">Cursor</option>
              <option value="v0">V0</option>
              <option value="bolt">Bolt</option>
              <option value="claude">Claude</option>
            </select>

            {/* Toggle Filters */}
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star className="h-4 w-4 mr-1" />
              Favorites
            </Button>

            <Button
              variant={showRagOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRagOnly(!showRagOnly)}
            >
              <Brain className="h-4 w-4 mr-1" />
              RAG Enhanced
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && filteredPrompts.length === 0 ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredPrompts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No prompts found</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search or filters' : 'Start by generating some prompts in MVP Studio'}
            </p>
          </div>
        ) : (
          filteredPrompts.map((prompt) => (
            <Card key={prompt.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {prompt.promptTitle}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={getPromptTypeColor(prompt.promptType)}>
                        {getPromptTypeIcon(prompt.promptType)}
                        <span className="ml-1 capitalize">{prompt.promptType.replace('_', ' ')}</span>
                      </Badge>
                      <Badge variant="outline">
                        {prompt.targetTool}
                      </Badge>
                    </div>
                  </div>
                  
                  {showActions && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyPrompt(prompt)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFavorite(prompt)}>
                          {prompt.isFavorite ? (
                            <>
                              <HeartOff className="h-4 w-4 mr-2" />
                              Remove from Favorites
                            </>
                          ) : (
                            <>
                              <Heart className="h-4 w-4 mr-2" />
                              Add to Favorites
                            </>
                          )}
                        </DropdownMenuItem>
                        {onSelectPrompt && (
                          <DropdownMenuItem onClick={() => onSelectPrompt(prompt)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeletePrompt(prompt)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {prompt.promptContent.substring(0, 150)}...
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    {prompt.isRagEnhanced && (
                      <div className="flex items-center gap-1">
                        <Brain className="h-3 w-3 text-purple-500" />
                        <span>RAG Enhanced</span>
                      </div>
                    )}
                    {prompt.isFavorite && (
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    )}
                    {prompt.confidenceScore && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span>{(prompt.confidenceScore * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(prompt.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {pagination.hasMore && (
        <div className="text-center">
          <Button 
            onClick={loadMore} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}

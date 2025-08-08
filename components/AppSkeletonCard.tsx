"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Eye, 
  Database, 
  Monitor,
  Smartphone,
  Globe,
  Calendar
} from 'lucide-react';
import { AppSkeleton } from '@/types/app-skeleton';
import { SkeletonUtils } from '@/hooks/useAppSkeletonGenerator';

interface AppSkeletonCardProps {
  skeleton: AppSkeleton;
  onView?: (skeleton: AppSkeleton) => void;
  onExport?: (skeleton: AppSkeleton) => void;
  compact?: boolean;
}

export function AppSkeletonCard({ 
  skeleton, 
  onView, 
  onExport, 
  compact = false 
}: AppSkeletonCardProps) {
  
  const getAppTypeIcon = () => {
    switch (skeleton.appType) {
      case 'web':
        return <Monitor className="w-4 h-4" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'hybrid':
        return <Globe className="w-4 h-4" />;
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport(skeleton);
    } else {
      // Default export behavior
      const dataStr = JSON.stringify(skeleton, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${skeleton.name.replace(/\s+/g, '-').toLowerCase()}-skeleton.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getAppTypeIcon()}
                <h4 className="font-medium text-sm truncate">{skeleton.name}</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                {skeleton.description}
              </p>
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs">
                  {skeleton.screens.length} screens
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {skeleton.complexity}
                </Badge>
              </div>
            </div>
            <div className="flex gap-1 ml-2">
              {onView && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(skeleton)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                className="h-8 w-8 p-0"
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getAppTypeIcon()}
              <CardTitle className="text-lg truncate">{skeleton.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {skeleton.description}
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            {onView && (
              <Button variant="outline" size="sm" onClick={() => onView(skeleton)}>
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {skeleton.screens.length}
            </div>
            <div className="text-xs text-muted-foreground">Screens</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {skeleton.userRoles.length}
            </div>
            <div className="text-xs text-muted-foreground">Roles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {skeleton.dataModels.length}
            </div>
            <div className="text-xs text-muted-foreground">Models</div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            className={SkeletonUtils.getAppTypeBadgeColor(skeleton.appType)}
            variant="secondary"
          >
            {skeleton.appType}
          </Badge>
          <Badge 
            className={SkeletonUtils.getComplexityBadgeColor(skeleton.complexity)}
            variant="secondary"
          >
            {skeleton.complexity}
          </Badge>
          {skeleton.modals.length > 0 && (
            <Badge variant="outline">
              {skeleton.modals.length} modals
            </Badge>
          )}
          {skeleton.integrations.length > 0 && (
            <Badge variant="outline">
              {skeleton.integrations.length} integrations
            </Badge>
          )}
        </div>

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          {SkeletonUtils.generateSkeletonSummary(skeleton)}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          Created {new Date(skeleton.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}

// Grid component for displaying multiple skeletons
interface AppSkeletonGridProps {
  skeletons: AppSkeleton[];
  onView?: (skeleton: AppSkeleton) => void;
  onExport?: (skeleton: AppSkeleton) => void;
  compact?: boolean;
  emptyMessage?: string;
}

export function AppSkeletonGrid({ 
  skeletons, 
  onView, 
  onExport, 
  compact = false,
  emptyMessage = "No app skeletons found. Generate your first one to get started!"
}: AppSkeletonGridProps) {
  if (skeletons.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`grid gap-4 ${
      compact 
        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
        : 'grid-cols-1 lg:grid-cols-2'
    }`}>
      {skeletons.map((skeleton) => (
        <AppSkeletonCard
          key={skeleton.id}
          skeleton={skeleton}
          onView={onView}
          onExport={onExport}
          compact={compact}
        />
      ))}
    </div>
  );
}

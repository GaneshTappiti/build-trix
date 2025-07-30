"use client";

import { Copy, Check, Monitor, Smartphone, Palette, Users, FileText, Code2, Building2, Gamepad2, Minimize, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useMVP } from "@/hooks/use-mvps";
import { useState } from "react";
import Link from "next/link";
import { DesignStyle, MvpStatus, PlatformType } from "@/types/mvp";
import React from "react";

interface MvpDetailsPageProps {
  params: Promise<{ mvp_id: string }>;
}

export default function MvpDetailsPage({ params }: MvpDetailsPageProps) {
  const [mvpId, setMvpId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Handle async params
  React.useEffect(() => {
    const getParams = async () => {
      const { mvp_id } = await params;
      setMvpId(mvp_id);
    };
    getParams();
  }, [params]);

  const { mvp, isLoading, error, refetch } = useMVP(mvpId || '');

  const copyToClipboard = async () => {
    if (!mvp?.generated_prompt) return;

    try {
      await navigator.clipboard.writeText(mvp.generated_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getStatusBadgeVariant = (status: MvpStatus) => {
    switch (status) {
      case "Built":
        return "secondary" as const;
      case "Launched":
        return "default" as const;
      case "Abandoned":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const getStyleIcon = (style: DesignStyle) => {
    switch (style) {
      case "Minimal & Clean":
        return <Minimize className="h-4 w-4" />;
      case "Playful & Animated":
        return <Gamepad2 className="h-4 w-4" />;
      case "Business & Professional":
        return <Building2 className="h-4 w-4" />;
      default:
        return <Palette className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading || !mvpId) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  if (!mvp) {
    return <NotFoundState />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/your-mvps">
            <ArrowLeft className="h-4 w-4" />
            Back to MVPs
          </Link>
        </Button>
      </div>

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <h1 className="text-4xl font-bold text-foreground">{mvp.app_name}</h1>
          <Badge variant={getStatusBadgeVariant(mvp.status)} className="text-sm px-3 py-1">
            {mvp.status}
          </Badge>
        </div>

        {/* Platform badges */}
        <div className="flex gap-2 mb-6">
          {mvp.platforms.includes("web" as PlatformType) && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              Web
            </Badge>
          )}
          {mvp.platforms.includes("mobile" as PlatformType) && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              Mobile
            </Badge>
          )}
        </div>

        {/* Metadata */}
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Created: {formatDate(mvp.created_at)}</div>
          {mvp.updated_at !== mvp.created_at && (
            <div>Last updated: {formatDate(mvp.updated_at)}</div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - App Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Style Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStyleIcon(mvp.style)}
                Design Style
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="secondary" className="w-fit">
                {mvp.style}
              </Badge>
              {mvp.style_description && (
                <p className="text-muted-foreground leading-relaxed">
                  {mvp.style_description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* App Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                App Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-sans">
                  {mvp.app_description}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Generated Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Generated Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Button
                  onClick={copyToClipboard}
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
                <ScrollArea className="h-96 w-full rounded-md border p-4 pt-12">
                  <pre className="whitespace-pre-wrap text-xs text-foreground leading-relaxed font-mono">
                    {mvp.generated_prompt}
                  </pre>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* Project Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusBadgeVariant(mvp.status)} className="w-fit">
                {mvp.status}
              </Badge>
            </CardContent>
          </Card>

          {/* Platforms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Platforms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mvp.platforms.includes("web" as PlatformType) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Web Application</span>
                </div>
              )}
              {mvp.platforms.includes("mobile" as PlatformType) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Mobile Application</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target Users */}
          {mvp.target_users && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Target Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {mvp.target_users}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">MVP ID</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {mvp.id}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Platforms</span>
                <span className="text-sm font-medium">
                  {mvp.platforms.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Style</span>
                <span className="text-sm font-medium">
                  {mvp.style}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/your-mvps">
            <ArrowLeft className="h-4 w-4" />
            Back to MVPs
          </Link>
        </Button>
      </div>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/your-mvps">
            <ArrowLeft className="h-4 w-4" />
            Back to MVPs
          </Link>
        </Button>
      </div>

      <Card className="text-center p-8">
        <CardContent className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">MVP Not Found</h3>
            <p className="text-muted-foreground">
              The MVP you are looking for does not exist or you do not have access to it.
            </p>
          </div>
          <Button asChild>
            <Link href="/your-mvps">View All MVPs</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
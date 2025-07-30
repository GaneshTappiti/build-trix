"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Monitor, Smartphone, Building2, Gamepad2, Minimize, Palette, AlertCircle, RefreshCw } from "lucide-react";
import { useMVPs } from "@/hooks/use-mvps";
import { useRateLimit } from "@/hooks/use-rate-limit";
import { MVP, DesignStyle, MvpStatus, PlatformType } from "@/types/mvp";

export default function Page() {
  const { mvps, isLoading, error, refetch } = useMVPs({
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const { rateLimitInfo, isLoading: isRateLimitLoading } = useRateLimit();

  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Your MVPs</h2>
        <Badge variant="outline" className="text-sm">
          {mvps.length} {mvps.length === 1 ? 'MVP' : 'MVPs'}
        </Badge>
      </div>

      {/* Rate Limit Alert */}
      {!isRateLimitLoading && rateLimitInfo && rateLimitInfo.remaining <= 2 && (
        <Alert variant={rateLimitInfo.remaining === 0 ? "destructive" : "default"} className={rateLimitInfo.remaining === 0 ? "" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{rateLimitInfo.remaining === 0 ? 'Monthly Limit Reached' : 'Low on Monthly MVPs'}</strong>
            <br />
            {rateLimitInfo.remaining === 0
              ? `You've used all ${rateLimitInfo.limit} MVPs for this month. Your limit will reset on ${rateLimitInfo.resetDate}.`
              : `You have ${rateLimitInfo.remaining} MVP${rateLimitInfo.remaining === 1 ? '' : 's'} remaining this month (${rateLimitInfo.used}/${rateLimitInfo.limit} used). Limit resets on ${rateLimitInfo.resetDate}.`
            }
          </AlertDescription>
        </Alert>
      )}

      {mvps.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {mvps.map((mvp) => (
            <MVPCard key={mvp.id} mvp={mvp} />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-16" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Your MVPs</h2>
        <Badge variant="outline" className="text-sm">Error</Badge>
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

function EmptyState() {
  return (
    <Card className="text-center p-8">
      <CardContent className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">No MVPs yet</h3>
          <p className="text-muted-foreground">
            Get started by creating your first MVP idea
          </p>
        </div>
        <Button asChild>
          <Link href="/mvp-generator">Create Your First MVP</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function MVPCard({ mvp }: { mvp: MVP }) {
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:border-green-500/50 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl group-hover:text-primary transition-colors">
            {mvp.app_name}
          </CardTitle>
          <Badge variant={getStatusBadgeVariant(mvp.status)} className="shrink-0">
            {mvp.status}
          </Badge>
        </div>

        {/* Platform badges */}
        <div className="flex gap-2 mt-2">
          {mvp.platforms.includes("web" as PlatformType) && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Monitor className="h-3 w-3" />
              Web
            </Badge>
          )}
          {mvp.platforms.includes("mobile" as PlatformType) && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Smartphone className="h-3 w-3" />
              Mobile
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Style */}
        <div className="flex items-center gap-2">
          {getStyleIcon(mvp.style)}
          <span className="text-sm font-medium text-muted-foreground">
            {mvp.style}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {mvp.app_description}
        </p>

        {/* Target Users */}
        {mvp.target_users && (
          <div className="text-xs text-muted-foreground/80">
            <span className="font-medium">Target:</span> {mvp.target_users.split(',')[0]}...
          </div>
        )}

        {/* Created date */}
        <div className="text-xs text-muted-foreground/60">
          Created {formatDate(mvp.created_at)}
        </div>

        <Button variant="outline" className="w-full mt-4 group-hover:bg-primary transition-colors" asChild>
          <Link href={`/your-mvps/${mvp.id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
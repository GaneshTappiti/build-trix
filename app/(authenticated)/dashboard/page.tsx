"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Rocket,
  TrendingUp,
  Target,
  Monitor,
  Smartphone,
  Building2,
  Lightbulb,
  Calendar,
  Clock,
  Star,
  Zap,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  BarChart3,
  CheckCircle2
} from "lucide-react";
import { useMVPs } from "@/hooks/use-mvps";
import { useRateLimit } from "@/hooks/use-rate-limit";
import { MVP, MvpStatus, PlatformType } from "@/types/mvp";

export default function DashboardPage() {
  const { mvps, isLoading, error, refetch } = useMVPs({
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const { rateLimitInfo, isLoading: isRateLimitLoading } = useRateLimit();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  const recentMVPs = mvps.slice(0, 3);
  const stats = calculateStats(mvps);

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Welcome back, builder! 🚀</h1>
        <p className="text-lg text-muted-foreground">
          Ready to turn your next big idea into reality? Let&apos;s see how your MVP journey is going.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total MVPs"
          value={stats.total}
          icon={<Rocket className="h-5 w-5" />}
          description="Ideas generated"
          trend={stats.total > 0 ? "Keep building!" : "Start your journey"}
        />
        <StatsCard
          title="This Month"
          value={stats.thisMonth}
          icon={<TrendingUp className="h-5 w-5" />}
          description="MVPs created"
          trend={stats.thisMonth > 0 ? "Great momentum!" : "Time to create?"}
        />
        {!isRateLimitLoading && rateLimitInfo ? (
          <StatsCard
            title="Monthly Limit"
            value={`${rateLimitInfo.used}/${rateLimitInfo.limit}`}
            icon={<BarChart3 className="h-5 w-5" />}
            description="MVPs this month"
            trend={rateLimitInfo.remaining > 0 ? `${rateLimitInfo.remaining} left` : "Limit reached"}
            className={rateLimitInfo.remaining === 0 ? "border-red-200 dark:border-red-800" : rateLimitInfo.remaining <= 2 ? "border-yellow-200 dark:border-yellow-800" : ""}
          />
        ) : (
          <StatsCard
            title="Platforms"
            value={stats.uniquePlatforms}
            icon={<Target className="h-5 w-5" />}
            description="Different targets"
            trend="Diversifying nicely"
          />
        )}
        <StatsCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={<BarChart3 className="h-5 w-5" />}
          description="Built or launched"
          trend={stats.successRate > 50 ? "Excellent!" : "Keep pushing!"}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Activity & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button asChild className="h-auto flex-col gap-2 p-6">
                  <Link href="/workspace/mvp-studio">
                    <Plus className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">New MVP Idea</div>
                      <div className="text-xs opacity-90">Build with MVP Studio</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto flex-col gap-2 p-6">
                  <Link href="/your-mvps">
                    <Building2 className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">View All MVPs</div>
                      <div className="text-xs opacity-90">Manage your projects</div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent MVPs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent MVPs
              </CardTitle>
              {mvps.length > 3 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/your-mvps" className="flex items-center gap-1">
                    View all
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {recentMVPs.length === 0 ? (
                <EmptyRecentMVPs />
              ) : (
                <div className="space-y-4">
                  {recentMVPs.map((mvp) => (
                    <RecentMVPItem key={mvp.id} mvp={mvp} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Overview */}
          {mvps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBreakdown mvps={mvps} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Insights & Tips */}
        <div className="space-y-6">
          {/* Motivational Card */}
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Star className="h-5 w-5" />
                Indie Hacker Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-green-700 dark:text-green-300">
                <p className="text-sm leading-relaxed">
                  <strong>Ship fast, learn faster!</strong> The best MVPs solve real problems with minimal features.
                  Focus on your core value proposition and get it in front of users ASAP.
                </p>
                <div className="text-xs opacity-90">
                  💡 Remember: Done is better than perfect!
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limit Status */}
          {!isRateLimitLoading && rateLimitInfo && (
            <Card className={rateLimitInfo.remaining <= 2 ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Limit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">MVPs Generated</span>
                  <span className="text-lg font-bold">
                    {rateLimitInfo.used}/{rateLimitInfo.limit}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${rateLimitInfo.remaining <= 2
                      ? 'bg-yellow-500'
                      : rateLimitInfo.remaining <= 0
                        ? 'bg-red-500'
                        : 'bg-green-500'
                      }`}
                    style={{ width: `${(rateLimitInfo.used / rateLimitInfo.limit) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Resets on {rateLimitInfo.resetDate}
                </div>
                {rateLimitInfo.remaining <= 2 && (
                  <div className="space-y-2">
                    <div className={`text-xs font-medium ${rateLimitInfo.remaining === 0 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                      {rateLimitInfo.remaining === 0
                        ? '⚠️ Limit reached! Wait for reset to create more MVPs.'
                        : `⚠️ Only ${rateLimitInfo.remaining} MVP${rateLimitInfo.remaining === 1 ? '' : 's'} remaining this month.`
                      }
                    </div>
                    {rateLimitInfo.remaining === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/rate-limit/clear', { method: 'POST' });
                            const result = await response.json();
                            if (result.success) {
                              window.location.reload();
                            }
                          } catch (error) {
                            console.error('Failed to clear rate limit:', error);
                          }
                        }}
                        className="text-xs h-6"
                      >
                        Fix Rate Limit Issue
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Platform Distribution */}
          {mvps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Platform Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlatformDistribution mvps={mvps} />
              </CardContent>
            </Card>
          )}

          {/* Journey Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Your Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <JourneyProgress stats={stats} />
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Lightbulb className="h-5 w-5" />
                What&apos;s Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-blue-700 dark:text-blue-300">
                {getNextStepSuggestion(stats)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, description, trend, className }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  trend: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
          {trend}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentMVPItem({ mvp }: { mvp: MVP }) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold truncate">{mvp.app_name}</h4>
          <Badge variant={getStatusBadgeVariant(mvp.status)} className="text-xs">
            {mvp.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {mvp.app_description}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex gap-1">
            {mvp.platforms.includes("web" as PlatformType) && (
              <Monitor className="h-3 w-3 text-muted-foreground" />
            )}
            {mvp.platforms.includes("mobile" as PlatformType) && (
              <Smartphone className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(mvp.created_at)}
          </span>
        </div>
      </div>
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/your-mvps/${mvp.id}`}>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}

function EmptyRecentMVPs() {
  return (
    <div className="text-center py-8 space-y-3">
      <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
        <Rocket className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <h4 className="font-semibold">No MVPs yet</h4>
        <p className="text-sm text-muted-foreground">
          Ready to build your first MVP?
        </p>
      </div>
      <Button asChild size="sm">
        <Link href="/workspace/mvp-studio">
          <Plus className="h-3 w-3 mr-1" />
          Create MVP
        </Link>
      </Button>
    </div>
  );
}

function StatusBreakdown({ mvps }: { mvps: MVP[] }) {
  const statusCounts = mvps.reduce((acc, mvp) => {
    acc[mvp.status] = (acc[mvp.status] || 0) + 1;
    return acc;
  }, {} as Record<MvpStatus, number>);

  const statuses: { status: MvpStatus; label: string; color: string }[] = [
    { status: "Yet To Build", label: "Yet To Build", color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20" },
    { status: "Built", label: "Built", color: "text-green-600 bg-green-100 dark:bg-green-900/20" },
    { status: "Launched", label: "Launched", color: "text-purple-600 bg-purple-100 dark:bg-purple-900/20" },
    { status: "Abandoned", label: "Abandoned", color: "text-red-600 bg-red-100 dark:bg-red-900/20" },
  ];

  return (
    <div className="space-y-3">
      {statuses.map(({ status, label, color }) => {
        const count = statusCounts[status] || 0;
        const percentage = mvps.length > 0 ? (count / mvps.length) * 100 : 0;

        return (
          <div key={status} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{label}</span>
              <span className="text-muted-foreground">{count}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full ${color.split(' ')[1]}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlatformDistribution({ mvps }: { mvps: MVP[] }) {
  const platformCounts = mvps.reduce((acc, mvp) => {
    mvp.platforms.forEach((platform) => {
      acc[platform] = (acc[platform] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {Object.entries(platformCounts).map(([platform, count]) => (
        <div key={platform} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {platform === "web" ? (
              <Monitor className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium capitalize">{platform}</span>
          </div>
          <Badge variant="secondary">{count}</Badge>
        </div>
      ))}
    </div>
  );
}

function JourneyProgress({ stats }: { stats: ReturnType<typeof calculateStats> }) {
  const milestones = [
    { target: 1, label: "First MVP", achieved: stats.total >= 1 },
    { target: 5, label: "5 MVPs", achieved: stats.total >= 5 },
    { target: 1, label: "First Build", achieved: stats.built >= 1 },
    { target: 1, label: "First Launch", achieved: stats.launched >= 1 },
  ];

  return (
    <div className="space-y-3">
      {milestones.map((milestone, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${milestone.achieved
            ? "bg-green-500"
            : "bg-muted border-2 border-muted-foreground"
            }`} />
          <span className={`text-sm ${milestone.achieved
            ? "text-foreground font-medium"
            : "text-muted-foreground"
            }`}>
            {milestone.label}
          </span>
          {milestone.achieved && (
            <CheckCircle2 className="h-3 w-3 text-green-500 ml-auto" />
          )}
        </div>
      ))}
    </div>
  );
}

function getNextStepSuggestion(stats: ReturnType<typeof calculateStats>) {
  if (stats.total === 0) {
    return (
      <>
        <p className="text-sm">
          🎯 <strong>Create your first MVP idea</strong> - Every successful indie hacker started with idea #1!
        </p>
        <Button asChild size="sm" className="w-full">
          <Link href="/workspace/mvp-studio">Generate Your First MVP</Link>
        </Button>
      </>
    );
  }

  if (stats.built === 0) {
    return (
      <>
        <p className="text-sm">
          🔨 <strong>Time to build!</strong> Pick your strongest idea and start coding. Remember: progress over perfection.
        </p>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href="/your-mvps">Review Your Ideas</Link>
        </Button>
      </>
    );
  }

  if (stats.launched === 0) {
    return (
      <>
        <p className="text-sm">
          🚀 <strong>Launch time!</strong> Get your MVP in front of real users. The feedback will be invaluable.
        </p>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href="/your-mvps">Update Project Status</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <p className="text-sm">
        🌟 <strong>Keep innovating!</strong> You&apos;re on a roll. What&apos;s your next big idea?
      </p>
      <Button asChild size="sm" className="w-full">
        <Link href="/workspace/mvp-studio">Create Another MVP</Link>
      </Button>
    </>
  );
}

function calculateStats(mvps: MVP[]) {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const total = mvps.length;
  const thisMonthCount = mvps.filter(mvp => new Date(mvp.created_at) >= thisMonth).length;
  const built = mvps.filter(mvp => mvp.status === "Built" || mvp.status === "Launched").length;
  const launched = mvps.filter(mvp => mvp.status === "Launched").length;

  const allPlatforms = new Set(mvps.flatMap(mvp => mvp.platforms));
  const uniquePlatforms = allPlatforms.size;

  const successRate = total > 0 ? Math.round((built / total) * 100) : 0;

  return {
    total,
    thisMonth: thisMonthCount,
    built,
    launched,
    uniquePlatforms,
    successRate
  };
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-6 w-[500px]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
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
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Something went wrong loading your dashboard.
        </p>
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
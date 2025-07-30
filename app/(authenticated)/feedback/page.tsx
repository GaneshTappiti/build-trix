import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail,
  MessageCircle,
  Bug,
  HelpCircle,
  Lightbulb,
  Star,
  Heart,
  Zap
} from "lucide-react";

export default function FeedbackPage() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Feedback</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Hello there! Thanks for trying out Buildtrix. We&apos;d love to hear your thoughts and suggestions.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Feedback Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Get In Touch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Right now, we don&apos;t have a feedback form, but you can reach out to us directly.
                  We personally read and respond to every message!
                </p>

                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="mailto:hello@buildtrix.com" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    hello@buildtrix.com
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                  * Or, you can reach out to us on <a href="https://x.com/CharanMNX" className="text-primary underline">X/Twitter</a>
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Please please please reach out to us if...
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Bug className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Something&apos;s broken</div>
                      <div className="text-sm text-muted-foreground">Found a bug or error?</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">You have a question</div>
                      <div className="text-sm text-muted-foreground">Need help or clarification?</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">You have a suggestion</div>
                      <div className="text-sm text-muted-foreground">Ideas to make us better?</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Star className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">You want a feature</div>
                      <div className="text-sm text-muted-foreground">Missing functionality?</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 sm:col-span-2">
                    <Zap className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">You find something missing</div>
                      <div className="text-sm text-muted-foreground">Expected something that wasn&apos;t there?</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Response Promise Card */}
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Heart className="h-5 w-5" />
                Our Promise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                We&apos;ll do our best to respond to your feedback as soon as possible!
                Your input helps us build a better product for everyone.
              </p>
            </CardContent>
          </Card>

          {/* Quick Links Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/mvp-generator" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Try MVP Generator
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/your-mvps" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  View Your MVPs
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
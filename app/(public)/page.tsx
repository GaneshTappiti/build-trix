import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Rocket,
  Lightbulb,
  Target,
  Zap,
  CheckCircle2,
  Monitor,
  Smartphone,
  Building2,
  Gamepad2,
  Minimize,
  ArrowRight,
  // Star,
  TrendingUp,
  Users,
  Code2,
  Sparkles
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-950/20 dark:via-blue-950/20 dark:to-purple-950/20">
        <div className="container mx-auto max-w-6xl text-center">
          <Badge variant="outline" className="mb-6 px-4 py-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Turn Ideas into Reality
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Build Your Next
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400">
              {" "}MVP
            </span>
            <br />
            with AI Precision
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your brilliant ideas into detailed, AI-ready prompts that help you build and launch
            successful products faster than ever before.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-4" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Start Building Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {/* <Button variant="outline" size="lg" className="text-lg px-8 py-4" disabled>
              <Monitor className="h-5 w-5 mr-2" />
              Watch Demo
            </Button> */}
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              No coding required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              AI-powered prompts
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Multiple platforms
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {/* <section className="py-12 px-4 border-b">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-foreground">500+</div>
              <div className="text-sm text-muted-foreground">MVPs Generated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">95%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">48hrs</div>
              <div className="text-sm text-muted-foreground">Avg. Build Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">$0</div>
              <div className="text-sm text-muted-foreground">To Get Started</div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Target className="h-3 w-3 mr-1" />
              Features
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need to Launch
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From idea validation to AI-ready prompts, we&apos;ve got your entire MVP journey covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Idea Validation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Guide your ideas through proven validation frameworks to ensure market fit before you build.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Code2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>AI-Ready Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Generate detailed, structured prompts that AI tools can use to build your exact vision.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Multi-Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create prompts for web apps, mobile apps, or both. Choose your platform and style preferences.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Monitor your MVP journey from idea to launch with built-in progress tracking and insights.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <CardTitle>User-Centric Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Define your target users and get tailored suggestions for features that matter most.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle>Rapid Iteration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Generate multiple variations and iterate quickly to find the perfect product-market fit.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Rocket className="h-3 w-3 mr-1" />
              How It Works
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              From Idea to MVP in 3 Simple Steps
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our streamlined process takes you from a rough idea to a detailed, buildable plan in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Describe Your Idea</h3>
              <p className="text-muted-foreground">
                Tell us about your app idea, target users, and design preferences. Our guided form helps you think through the details.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Validation Questions</h3>
              <p className="text-muted-foreground">
                Answer quick questions about market research and user feedback to strengthen your MVP strategy.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Get AI Prompt</h3>
              <p className="text-muted-foreground">
                Receive a detailed, structured prompt that AI tools can use to build your MVP exactly as envisioned.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Options */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Monitor className="h-3 w-3 mr-1" />
              Platform Support
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Build for Any Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your target platform and design style to get optimized prompts for your specific needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card className="border-2 hover:border-green-500/50 transition-colors">
              <CardHeader className="text-center">
                <Monitor className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <CardTitle>Web Applications</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Perfect for SaaS products, dashboards, and web-based tools that users access through browsers.
                </p>
                <Badge variant="outline">React</Badge>
                <Badge variant="outline" className="ml-2">Next.js</Badge>
                <Badge variant="outline" className="ml-2">Vue</Badge>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-500/50 transition-colors">
              <CardHeader className="text-center">
                <Smartphone className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <CardTitle>Mobile Applications</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Ideal for on-the-go experiences, native functionality, and mobile-first user interactions.
                </p>
                <Badge variant="outline">React Native</Badge>
                <Badge variant="outline" className="ml-2">Flutter</Badge>
                <Badge variant="outline" className="ml-2">Swift</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Design Styles */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Design Styles</h3>
            <p className="text-muted-foreground">Choose from curated design styles that match your brand and users</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <Minimize className="h-8 w-8 mx-auto mb-3 text-gray-600" />
              <h4 className="font-semibold mb-2">Minimal & Clean</h4>
              <p className="text-sm text-muted-foreground">Simple, elegant interfaces that focus on content and usability</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <Gamepad2 className="h-8 w-8 mx-auto mb-3 text-purple-600" />
              <h4 className="font-semibold mb-2">Playful & Animated</h4>
              <p className="text-sm text-muted-foreground">Fun, engaging designs with micro-interactions and vibrant colors</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <Building2 className="h-8 w-8 mx-auto mb-3 text-blue-600" />
              <h4 className="font-semibold mb-2">Business & Professional</h4>
              <p className="text-sm text-muted-foreground">Corporate-ready designs that build trust and credibility</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Star className="h-3 w-3 mr-1" />
              Success Stories
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Indie Hackers Love Buildtrix
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of makers who&apos;ve turned their ideas into successful products.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground">
                  &quot;Buildtrix helped me turn my vague idea into a crystal-clear prompt. Built my MVP in 2 days with Claude!&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    S
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Sarah Chen</div>
                    <div className="text-xs text-muted-foreground">Founder @ TaskFlow</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground">
                  &quot;The validation questions made me realize I was missing key features. Saved me months of building the wrong thing.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    M
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Mike Rodriguez</div>
                    <div className="text-xs text-muted-foreground">Solo Developer</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground">
                  &quot;From idea to profitable SaaS in 3 weeks. The AI prompts were so detailed, development was a breeze.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    A
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Alex Kumar</div>
                    <div className="text-xs text-muted-foreground">Indie Hacker</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Build Your Next Big Thing?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of makers who&apos;ve accelerated their MVP journey with AI-powered prompts.
            Start building today—it&apos;s completely free.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4 text-white" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Start Building Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {/* <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-gray-900" disabled>
              <Monitor className="h-5 w-5 mr-2" />
              Schedule Demo
            </Button> */}
          </div>

          <p className="text-sm mt-6 opacity-75">
            No credit card required • Generate unlimited MVPs • Export prompts anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-foreground mb-4">Buildtrix</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Turn your ideas into prompts that help AI tools build your product.
                Built for indie hackers, by indie hackers.
              </p>
              <p className="text-sm text-muted-foreground">
                by{' '}
                <a href="https://devsforfun.com" className="underline hover:text-foreground transition-colors" target="_blank">
                  devsForFun
                </a>
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="/mvp-generator" className="hover:text-foreground transition-colors">MVP Generator</Link></li>
                <li><span className="opacity-50">Documentation</span></li>
                <li><span className="opacity-50">API</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><span className="opacity-50">About</span></li>
                <li><span className="opacity-50">Blog</span></li>
                <li><span className="opacity-50">Contact</span></li>
                <li><span className="opacity-50">Privacy</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} devsForFun studio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

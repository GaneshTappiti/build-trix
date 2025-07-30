"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  HelpCircle,
  Rocket,
  Monitor,
  Smartphone,
  Building2,
  Gamepad2,
  Minimize,
  MessageCircle,
  CheckCircle,
  Heart,
  AlertCircle
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useRateLimit } from "@/hooks/use-rate-limit";
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MVPIdeaFormData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  QuestionnaireResponse,
  GenerateMVPRequest
} from "@/types/questionnaire";

// Form validation schemas
const ideaSchema = z.object({
  app_name: z.string().min(1, "App name is required").max(100, "App name too long"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  style: z.string().min(1, "Select a design style"),
  style_description: z.string().optional(),
  app_description: z.string().min(10, "Provide a detailed description (min 10 characters)"),
  target_users: z.string().optional(),
});

const questionnaireSchema = z.object({
  idea_validated: z.boolean(),
  talked_to_people: z.boolean(),
  motivation: z.string().optional(),
});

type IdeaFormData = z.infer<typeof ideaSchema>;
type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;

const STEPS = [
  { id: 1, title: "App Idea", icon: Lightbulb, description: "Tell us about your app idea" },
  { id: 2, title: "Questionnaire", icon: HelpCircle, description: "Quick validation questions" },
  { id: 3, title: "Generate", icon: Rocket, description: "Generate your MVP prompt" },
];

const PLATFORMS = [
  { id: "web", label: "Web", icon: Monitor },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

const STYLES = [
  { id: "Minimal & Clean", label: "Minimal & Clean", icon: Minimize, description: "Clean, simple interface" },
  { id: "Playful & Animated", label: "Playful & Animated", icon: Gamepad2, description: "Fun, engaging design" },
  { id: "Business & Professional", label: "Business & Professional", icon: Building2, description: "Corporate, professional look" },
];

export default function MVPGeneratorPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ideaData, setIdeaData] = useState<IdeaFormData | null>(null);
  const { rateLimitInfo, isLoading: isRateLimitLoading, refetch: refetchRateLimit } = useRateLimit();

  const ideaForm = useForm<IdeaFormData>({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      app_name: "",
      platforms: [],
      style: "",
      style_description: "",
      app_description: "",
      target_users: "",
    },
  });

  const questionnaireForm = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      idea_validated: false,
      talked_to_people: false,
      motivation: "",
    },
  });

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onIdeaSubmit = async (data: IdeaFormData) => {
    setIdeaData(data);
    nextStep();
  };

  const onQuestionnaireSubmit = async (data: QuestionnaireFormData) => {
    if (!ideaData) {
      toast.error("Something went wrong. Please restart the process.");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData: GenerateMVPRequest = {
        ideaDetails: ideaData,
        questionnaire: data,
      };

      const response = await fetch('/api/generate-mvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success && result.mvp_id) {
        toast.success("MVP generated successfully!");
        // Refetch rate limit info after successful generation
        refetchRateLimit();
        router.push(`/your-mvps/${result.mvp_id}`);
      } else {
        if (response.status === 429) {
          // Rate limit exceeded
          toast.error("Monthly MVP generation limit reached!");
          refetchRateLimit(); // Update the rate limit info
        } else {
          toast.error(result.error || "Failed to generate MVP");
        }
      }
    } catch (error) {
      console.error('Error generating MVP:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            MVP Generator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Transform your idea into a detailed AI-ready prompt
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${currentStep >= step.id
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                  >
                    <StepIcon className="w-6 h-6" />
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Rate Limit Alert */}
        {!isRateLimitLoading && rateLimitInfo && rateLimitInfo.remaining <= 2 && (
          <Card className={`mb-6 ${rateLimitInfo.remaining === 0 ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {rateLimitInfo.remaining === 0 ? (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                )}
                <div>
                  <h4 className={`font-semibold ${rateLimitInfo.remaining === 0 ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                    {rateLimitInfo.remaining === 0 ? 'Monthly Limit Reached' : 'Low on Monthly MVPs'}
                  </h4>
                  <p className={`text-sm ${rateLimitInfo.remaining === 0 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {rateLimitInfo.remaining === 0
                      ? `You've used all ${rateLimitInfo.limit} MVPs for this month. Your limit will reset on ${rateLimitInfo.resetDate}.`
                      : `You have ${rateLimitInfo.remaining} MVP${rateLimitInfo.remaining === 1 ? '' : 's'} remaining this month (${rateLimitInfo.used}/${rateLimitInfo.limit} used). Limit resets on ${rateLimitInfo.resetDate}.`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step Content */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Tell us about your app idea
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...ideaForm}>
                <form onSubmit={ideaForm.handleSubmit(onIdeaSubmit)} className="space-y-6">
                  <FormField
                    control={ideaForm.control}
                    name="app_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., TaskFlow Pro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ideaForm.control}
                    name="platforms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform(s) *</FormLabel>
                        <div className="grid grid-cols-2 gap-4">
                          {PLATFORMS.map((platform) => {
                            const PlatformIcon = platform.icon;
                            const isSelected = field.value?.includes(platform.id) || false;

                            return (
                              <div key={platform.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`platform-${platform.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, platform.id]);
                                    } else {
                                      field.onChange(current.filter((p) => p !== platform.id));
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={`platform-${platform.id}`}
                                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors flex-1 ${isSelected
                                    ? "border-green-500/50 bg-green-50 dark:bg-green-500/10"
                                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                                    }`}
                                >
                                  <PlatformIcon className="w-5 h-5" />
                                  <span>{platform.label}</span>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ideaForm.control}
                    name="style"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Design Style *</FormLabel>
                        <RadioGroup value={field.value} onValueChange={field.onChange}>
                          <div className="grid gap-4">
                            {STYLES.map((style) => {
                              const StyleIcon = style.icon;
                              return (
                                <div key={style.id}>
                                  <RadioGroupItem value={style.id} id={style.id} className="sr-only" />
                                  <Label
                                    htmlFor={style.id}
                                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${field.value === style.id
                                      ? "border-green-500/50 bg-green-50 dark:bg-green-500/10"
                                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                                      }`}
                                  >
                                    <StyleIcon className="w-6 h-6" />
                                    <div>
                                      <p className="font-medium">{style.label}</p>
                                      <p className="text-sm text-gray-500">{style.description}</p>
                                    </div>
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ideaForm.control}
                    name="style_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Style Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe any specific design preferences..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ideaForm.control}
                    name="app_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Describe your app idea in detail *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain what your app does, what problems it solves, key features, etc..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ideaForm.control}
                    name="target_users"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Users (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Who will use this app? Describe your target audience..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" className="min-w-[120px]">
                      Next Step
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Quick Validation Questions
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Help us understand where you are in your journey
              </p>
            </CardHeader>
            <CardContent>
              <Form {...questionnaireForm}>
                <form onSubmit={questionnaireForm.handleSubmit(onQuestionnaireSubmit)} className="space-y-8">

                  <FormField
                    control={questionnaireForm.control}
                    name="idea_validated"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center gap-2 text-base font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Did you validate your idea?
                          </FormLabel>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Have you tested your idea with potential users or done market research?
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={questionnaireForm.control}
                    name="talked_to_people"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center gap-2 text-base font-medium">
                            <MessageCircle className="w-4 h-4" />
                            Did you talk to people about your idea?
                          </FormLabel>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Have you discussed your idea with friends, potential users, or mentors?
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={questionnaireForm.control}
                    name="motivation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base font-medium">
                          <Heart className="w-4 h-4" />
                          What is your motivation to try this out? (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share what drives you to build this idea..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          This helps us create a more personalized prompt for your journey
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || (!isRateLimitLoading && rateLimitInfo?.remaining === 0)}
                      className="min-w-[140px]"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (!isRateLimitLoading && rateLimitInfo?.remaining === 0) ? (
                        <>
                          Limit Reached
                          <AlertCircle className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Generate MVP
                          <Rocket className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
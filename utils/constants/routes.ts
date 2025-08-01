import { Calendar, Code, LayoutDashboard, LucideIcon, List, MessageCircle, Rocket, Target, Brain } from 'lucide-react';

export type Route = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
};

export const ROUTES: Route[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Workspace',
    url: '/workspace',
    icon: Brain,
  },
  {
    title: 'MVP Studio',
    url: '/mvp-studio',
    icon: Rocket,
  },
  {
    title: 'Business Model Canvas',
    url: '/workspace/business-model-canvas',
    icon: Target,
  },
  {
    title: 'Task Planner',
    url: '/task-planner',
    icon: Calendar,
  },
  {
    title: 'Your MVPs',
    url: '/your-mvps',
    icon: List,
  },
  {
    title: 'Feedback',
    url: '/feedback',
    icon: MessageCircle,
  },
];

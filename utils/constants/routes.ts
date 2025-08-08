import { LayoutDashboard, LucideIcon, List, MessageCircle, Rocket, Brain } from 'lucide-react';

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
    title: 'MVP Studio',
    url: '/mvp-studio',
    icon: Rocket,
  },
  {
    title: 'Advanced Generator',
    url: '/advanced-generator',
    icon: Brain,
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

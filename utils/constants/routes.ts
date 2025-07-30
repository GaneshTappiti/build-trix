import { Code, LayoutDashboard, LucideIcon, List, MessageCircle, Rocket } from 'lucide-react';

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
    url: '/workspace/mvp-studio',
    icon: Rocket,
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

"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  Brain, 
  Database, 
  Palette, 
  Code, 
  Users, 
  Settings,
  ChevronLeft,
  Home,
  Sparkles
} from 'lucide-react';

const WORKSPACE_MODULES = [
  {
    id: 'mvp-studio',
    title: 'MVP Studio',
    description: 'Build your app from idea to implementation',
    icon: Rocket,
    href: '/workspace/mvp-studio',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    isNew: true
  },
  {
    id: 'ai-tools',
    title: 'AI Tools Database',
    description: 'Discover and compare AI development tools',
    icon: Brain,
    href: '/workspace/ai-tools',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20'
  },
  {
    id: 'templates',
    title: 'MVP Templates',
    description: 'Ready-to-use app templates and patterns',
    icon: Database,
    href: '/workspace/templates',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20'
  },
  {
    id: 'design-system',
    title: 'Design System',
    description: 'UI components and design guidelines',
    icon: Palette,
    href: '/workspace/design-system',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20'
  },
  {
    id: 'code-snippets',
    title: 'Code Snippets',
    description: 'Reusable code patterns and examples',
    icon: Code,
    href: '/workspace/code-snippets',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/20'
  },
  {
    id: 'collaboration',
    title: 'Collaboration Hub',
    description: 'Share and collaborate on projects',
    icon: Users,
    href: '/workspace/collaboration',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50 dark:bg-pink-950/20'
  }
];

interface WorkspaceSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function WorkspaceSidebar({ isCollapsed = false, onToggle }: WorkspaceSidebarProps) {
  const pathname = usePathname();

  const isActiveModule = (href: string) => {
    return pathname.startsWith(href);
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold">Workspace</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Build & Create</p>
            </div>
          )}
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed && "rotate-180"
              )} />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Back to Home */}
        <div className="mb-4">
          <Link href="/">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isCollapsed ? "px-2" : "px-3"
              )}
            >
              <Home className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Back to Home</span>}
            </Button>
          </Link>
        </div>

        {/* Workspace Modules */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Modules
              </h3>
            </div>
          )}
          
          {WORKSPACE_MODULES.map((module) => {
            const ModuleIcon = module.icon;
            const isActive = isActiveModule(module.href);
            
            return (
              <Link key={module.id} href={module.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start relative",
                    isCollapsed ? "px-2" : "px-3",
                    isActive && "bg-gray-100 dark:bg-gray-800"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-md",
                    isActive ? module.bgColor : ""
                  )}>
                    <ModuleIcon className={cn(
                      "h-4 w-4",
                      isActive ? module.color : "text-gray-600 dark:text-gray-400"
                    )} />
                  </div>
                  
                  {!isCollapsed && (
                    <div className="ml-3 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{module.title}</span>
                        {module.isNew && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            <Sparkles className="w-3 h-3 mr-1" />
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {module.description}
                      </p>
                    </div>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <Link href="/workspace/settings">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isCollapsed ? "px-2" : "px-3"
            )}
          >
            <Settings className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Settings</span>}
          </Button>
        </Link>
      </div>
    </div>
  );
}

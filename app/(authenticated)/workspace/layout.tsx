"use client"

import React, { useState } from 'react';
import { WorkspaceSidebar } from '@/components/WorkspaceSidebar';
import { BuilderProvider } from '@/lib/builderContext';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <BuilderProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <WorkspaceSidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </BuilderProvider>
  );
}

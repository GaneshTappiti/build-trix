"use client"

import React from 'react';
import { SixStageArchitecture } from '@/components/builder-cards/SixStageArchitecture';

export default function MVPStudioBuilderPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SixStageArchitecture mode="builder" />
    </div>
  );
}

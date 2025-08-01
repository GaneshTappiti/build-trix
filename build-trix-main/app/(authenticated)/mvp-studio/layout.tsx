"use client"

import React from 'react';
import { BuilderProvider } from '@/lib/builderContext';

export default function MVPStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BuilderProvider>
      {children}
    </BuilderProvider>
  );
}

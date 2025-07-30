'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function AuthCodeErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Authentication Error</CardTitle>
        <CardDescription>
          There was a problem signing you in. This could be due to a network issue or an expired link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="text-sm text-muted-foreground">
              <strong>Error:</strong> {error}
              {errorDescription && (
                <div className="mt-1">
                  <strong>Details:</strong> {errorDescription}
                </div>
              )}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Please try signing in again. If the problem persists, contact support.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Try Again</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AuthCodeError() {
  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthCodeErrorContent />
      </Suspense>
    </div>
  );
} 
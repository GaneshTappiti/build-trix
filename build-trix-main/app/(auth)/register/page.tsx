'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login since we only use Google OAuth now
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-black/80 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-lg">Redirecting...</p>
      </div>
    </div>
  );
}

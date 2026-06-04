'use client';

import React, { useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoginSection } from '@/components/sections/login/LoginSection';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function LoginContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/select-module?intro=true';

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-50 dark:bg-black text-neutral-800 dark:text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-xs font-semibold tracking-wider text-neutral-450 uppercase animate-pulse">
            Checking session...
          </span>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <LoginSection />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-50 dark:bg-black text-neutral-800 dark:text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-xs font-semibold tracking-wider text-neutral-450 uppercase animate-pulse">
            Loading...
          </span>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

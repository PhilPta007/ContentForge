'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6">
      <p className="text-sm font-mono text-red-400">Error</p>
      <h1 className="mt-2 text-2xl font-bold text-white">Something went wrong</h1>
      <p className="mt-2 max-w-md text-center text-sm text-neutral-400">
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>
      <Button
        onClick={reset}
        className="mt-6 bg-indigo-600 text-white hover:bg-indigo-500"
      >
        Try again
      </Button>
    </div>
  );
}

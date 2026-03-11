'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function CreateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[create] Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/10">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Creation failed</h2>
          <p className="mt-1 text-sm text-neutral-400">
            {error.message || 'Something went wrong during content creation.'}
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex h-9 items-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

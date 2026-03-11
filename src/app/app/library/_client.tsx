'use client';

import { AssetGrid } from '@/components/library/asset-grid';

export function LibraryPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Your Library</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Browse and manage your completed generations
        </p>
      </div>

      <AssetGrid />
    </div>
  );
}

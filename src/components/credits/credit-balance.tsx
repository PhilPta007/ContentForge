'use client';

import { Coins } from 'lucide-react';
import { useCreditStore } from '@/stores/credit-store';
import { SkeletonBlock } from '@/components/shared/loading';

export function CreditBalance() {
  const { balance, isLoading } = useCreditStore();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Coins className="h-4 w-4 text-neutral-500" />
        <SkeletonBlock className="h-4 w-12" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-400">
      <Coins className="h-4 w-4 text-amber-500" />
      <span className="font-medium text-white">{balance.toLocaleString()}</span>
      <span>credits</span>
    </div>
  );
}

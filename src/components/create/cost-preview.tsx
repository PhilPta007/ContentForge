'use client';

import Link from 'next/link';
import { calculateCredits } from '@/lib/credits';
import { useCreditStore } from '@/stores/credit-store';
import type { GenerationConfig } from '@/lib/types';

interface CostPreviewProps {
  config: GenerationConfig;
}

export function CostPreview({ config }: CostPreviewProps) {
  const { balance } = useCreditStore();
  const totalCredits = calculateCredits(config);
  const hasEnough = balance >= totalCredits;
  const priceZar = (totalCredits * 1.5).toFixed(2);

  return (
    <div className="p-4 border border-[#1e1e1e] rounded-lg bg-[#111111]/50">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-neutral-500">Estimated cost</span>
        <span className="text-2xl font-bold text-neutral-100">
          {totalCredits} credits
        </span>
      </div>

      <div className="text-sm text-neutral-500 mb-3">
        ≈ R{priceZar}
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-neutral-400">Your balance:</span>
        <span className={hasEnough ? 'text-green-500' : 'text-red-500'}>
          {balance} credits
        </span>
      </div>

      {!hasEnough && (
        <Link
          href="/app/credits"
          className="mt-3 block w-full text-center rounded-lg border border-[#1e1e1e] px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
        >
          Buy more credits
        </Link>
      )}
    </div>
  );
}

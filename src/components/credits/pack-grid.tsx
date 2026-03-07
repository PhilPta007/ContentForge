'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CreditPackCard } from './credit-pack-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CreditPack } from '@/lib/types';

interface PackGridProps {
  onBuy: (pack: CreditPack) => void;
}

export function PackGrid({ onBuy }: PackGridProps) {
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('ZAR');

  useEffect(() => {
    async function fetchPacks() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('credit_packs')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setPacks(data as CreditPack[]);
      }
      setIsLoading(false);
    }
    fetchPacks();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-400">Currency:</span>
        <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
          <button
            onClick={() => setCurrency('ZAR')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              currency === 'ZAR'
                ? 'bg-neutral-700 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            ZAR (R)
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              currency === 'USD'
                ? 'bg-neutral-700 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            USD ($)
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-64 bg-neutral-800 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {packs.map((pack) => (
            <CreditPackCard
              key={pack.id}
              pack={pack}
              currency={currency}
              recommended={pack.name === 'Pro'}
              onBuy={onBuy}
            />
          ))}
        </div>
      )}
    </div>
  );
}

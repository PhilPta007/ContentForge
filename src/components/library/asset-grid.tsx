'use client';

import { useEffect, useState, useMemo } from 'react';
import { FolderOpen, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';
import { EmptyState } from '@/components/shared/empty-state';
import { SkeletonBlock } from '@/components/shared/loading';
import { AssetCard } from '@/components/library/asset-card';
import type { Generation, GenerationType } from '@/lib/types';

type TypeFilter = 'all' | GenerationType;

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mp3', label: 'MP3' },
  { value: 'video', label: 'Video' },
  { value: 'description', label: 'Description' },
  { value: 'thumbnail', label: 'Thumbnail' },
  { value: 'social', label: 'Social' },
];

function AssetGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[#1e1e1e] bg-[#111111]"
        >
          <SkeletonBlock className="h-36 rounded-b-none rounded-t-lg" />
          <div className="space-y-2 p-3">
            <SkeletonBlock className="h-4 w-3/4" />
            <div className="flex justify-between">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AssetGrid() {
  const { user } = useUserStore();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;

    async function fetchGenerations() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('generations')
          .select('*')
          .eq('user_id', user!.id)
          .eq('status', 'complete')
          .order('completed_at', { ascending: false });

        if (error) {
          console.error('Failed to fetch generations:', error.message);
          return;
        }

        setGenerations((data as Generation[]) || []);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGenerations();
  }, [user]);

  const filtered = useMemo(() => {
    let items = generations;

    if (typeFilter !== 'all') {
      items = items.filter((g) => g.type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter((g) =>
        g.input_topic.toLowerCase().includes(q)
      );
    }

    return items;
  }, [generations, typeFilter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-neutral-800/50 text-neutral-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-neutral-800 bg-neutral-900 pl-8 pr-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-indigo-600/50 sm:w-56"
          />
        </div>
      </div>

      {isLoading ? (
        <AssetGridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={generations.length === 0 ? 'No assets yet' : 'No matching assets'}
          description={
            generations.length === 0
              ? 'Your completed generations will appear here'
              : 'Try adjusting your filters or search query'
          }
          action={
            generations.length === 0
              ? { label: 'Create Content', href: '/app/create' }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((generation) => (
            <AssetCard key={generation.id} generation={generation} />
          ))}
        </div>
      )}
    </div>
  );
}

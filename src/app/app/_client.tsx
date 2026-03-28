'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Headphones,
  Video,
  FileText,
  Image,
  Share2,
  Coins,
  ArrowRight,
  Clock,
  TrendingUp,
  FolderOpen,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';
import { useCreditStore } from '@/stores/credit-store';
import { Skeleton } from '@/components/ui/skeleton';
import type { Generation } from '@/lib/types';

const GENERATION_TYPES = [
  { type: 'mp3', label: 'Podcast', icon: Headphones, href: '/app/create/mp3', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { type: 'video', label: 'Video', icon: Video, href: '/app/create/video', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { type: 'description', label: 'Description', icon: FileText, href: '/app/create/description', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { type: 'thumbnail', label: 'Thumbnail', icon: Image, href: '/app/create/thumbnail', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { type: 'social', label: 'Social', icon: Share2, href: '/app/create/social', color: 'text-pink-400', bg: 'bg-pink-500/10' },
] as const;

function formatTimeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function typeIcon(type: string) {
  const t = GENERATION_TYPES.find((g) => g.type === type);
  if (!t) return FileText;
  return t.icon;
}

function typeColor(type: string) {
  const t = GENERATION_TYPES.find((g) => g.type === type);
  return t?.color ?? 'text-neutral-400';
}

export function DashboardPage() {
  const { user, profile } = useUserStore();
  const { balance, isLoading: balanceLoading } = useCreditStore();
  const [recentJobs, setRecentJobs] = useState<Generation[]>([]);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  useEffect(() => {
    if (!user) return;

    async function load() {
      const supabase = createClient();

      const [recentRes, countRes] = await Promise.all([
        supabase
          .from('generations')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('generations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id),
      ]);

      setRecentJobs((recentRes.data as Generation[]) ?? []);
      setTotalGenerations(countRes.count ?? 0);
      setIsLoading(false);
    }

    load();
  }, [user]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-neutral-400">
          What would you like to create today?
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Coins className="h-3.5 w-3.5 text-amber-500" />
            Credits
          </div>
          {balanceLoading ? (
            <Skeleton className="mt-2 h-7 w-16 bg-neutral-800" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-white">{balance.toLocaleString()}</p>
          )}
        </div>

        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
            Generations
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-12 bg-neutral-800" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-white">{totalGenerations}</p>
          )}
        </div>

        <Link
          href="/app/credits"
          className="col-span-2 sm:col-span-1 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4 hover:border-indigo-600/50 transition-colors group"
        >
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Coins className="h-3.5 w-3.5" />
            Need more?
          </div>
          <p className="mt-1 text-sm font-medium text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
            Buy Credits <ArrowRight className="h-3 w-3" />
          </p>
        </Link>
      </div>

      {/* Quick create */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-neutral-400">Quick Create</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {GENERATION_TYPES.map((g) => (
            <Link
              key={g.type}
              href={g.href}
              className="flex flex-col items-center gap-2 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4 hover:border-neutral-700 transition-colors group"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${g.bg}`}>
                <g.icon className={`h-4.5 w-4.5 ${g.color}`} />
              </div>
              <span className="text-xs font-medium text-neutral-300 group-hover:text-white">
                {g.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-400">Recent Activity</h2>
          {recentJobs.length > 0 && (
            <Link
              href="/app/jobs"
              className="text-xs text-neutral-500 hover:text-white transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg bg-neutral-800" />
            ))}
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#1e1e1e] bg-[#111111] py-12">
            <FolderOpen className="h-8 w-8 text-neutral-600" />
            <p className="mt-3 text-sm text-neutral-500">No generations yet</p>
            <Link
              href="/app/create"
              className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Create your first
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentJobs.map((job) => {
              const Icon = typeIcon(job.type);
              const color = typeColor(job.type);
              const statusColor =
                job.status === 'complete'
                  ? 'text-emerald-400'
                  : job.status === 'failed'
                    ? 'text-red-400'
                    : 'text-amber-400';

              return (
                <Link
                  key={job.id}
                  href={job.status === 'complete' ? `/app/library/${job.id}` : `/app/jobs?highlight=${job.id}`}
                  className="flex items-center gap-3 rounded-lg border border-[#1e1e1e] bg-[#111111] px-4 py-3 hover:border-neutral-700 transition-colors"
                >
                  <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-200">{job.input_topic}</p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <span className="capitalize">{job.type}</span>
                      <span>·</span>
                      <span className={statusColor}>{job.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-neutral-600 shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(job.created_at)}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

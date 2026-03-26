'use client';

import Link from 'next/link';
import { Headphones, Video, FileText, Image, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Generation, GenerationType } from '@/lib/types';

const TYPE_CONFIG: Record<
  GenerationType,
  { icon: typeof Headphones; label: string; gradient: string }
> = {
  mp3: {
    icon: Headphones,
    label: 'MP3',
    gradient: 'from-indigo-900/40 to-indigo-800/20',
  },
  video: {
    icon: Video,
    label: 'Video',
    gradient: 'from-purple-900/40 to-purple-800/20',
  },
  description: {
    icon: FileText,
    label: 'Description',
    gradient: 'from-emerald-900/40 to-emerald-800/20',
  },
  thumbnail: {
    icon: Image,
    label: 'Thumbnail',
    gradient: 'from-amber-900/40 to-amber-800/20',
  },
  social: {
    icon: Share2,
    label: 'Social',
    gradient: 'from-cyan-900/40 to-cyan-800/20',
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface AssetCardProps {
  generation: Generation;
}

export function AssetCard({ generation }: AssetCardProps) {
  const config = TYPE_CONFIG[generation.type];
  const Icon = config.icon;

  return (
    <Link
      href={`/app/library/${generation.id}`}
      className="group block rounded-lg border border-[#1e1e1e] bg-[#111111] transition-colors hover:border-indigo-600/50"
    >
      <div
        className={`flex h-36 items-center justify-center rounded-t-lg bg-gradient-to-br ${config.gradient}`}
      >
        <Icon className="h-10 w-10 text-neutral-500 transition-colors group-hover:text-neutral-400" />
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-white">
            {generation.input_topic}
          </p>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {config.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>
            {generation.completed_at
              ? formatDate(generation.completed_at)
              : formatDate(generation.created_at)}
          </span>
          <span>{generation.credits_used} credits</span>
        </div>
      </div>
    </Link>
  );
}

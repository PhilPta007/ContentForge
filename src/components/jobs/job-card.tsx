'use client';

import Link from 'next/link';
import { Headphones, Video, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Generation, GenerationType } from '@/lib/types';

interface JobCardProps {
  job: Generation;
  isHighlighted?: boolean;
}

const TYPE_ICONS: Record<GenerationType, typeof Headphones> = {
  mp3: Headphones,
  video: Video,
  description: FileText,
  thumbnail: Image,
};

const TYPE_LABELS: Record<GenerationType, string> = {
  mp3: 'MP3 Episode',
  video: 'Video',
  description: 'Description',
  thumbnail: 'Thumbnail',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  complete: 'bg-green-500/10 text-green-500 border-green-500/20',
  failed: 'bg-red-500/10 text-red-500 border-red-500/20',
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function JobCard({ job, isHighlighted }: JobCardProps) {
  const Icon = TYPE_ICONS[job.type];

  const content = (
    <div
      className={cn(
        'flex items-center gap-4 p-4 border rounded-lg transition-colors',
        isHighlighted
          ? 'border-indigo-600/50 bg-indigo-600/5'
          : 'border-[#1e1e1e] hover:border-[#2a2a2a]'
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800/50 flex-shrink-0">
        <Icon className="h-5 w-5 text-neutral-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-200 truncate">
            {job.input_topic}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-neutral-500">
            {TYPE_LABELS[job.type]}
          </span>
          <span className="text-xs text-neutral-600">|</span>
          <span className="text-xs text-neutral-500">
            {job.credits_used} credits
          </span>
          <span className="text-xs text-neutral-600">|</span>
          <span className="text-xs text-neutral-500">
            {formatRelativeTime(job.created_at)}
          </span>
        </div>
      </div>

      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border flex-shrink-0',
          STATUS_STYLES[job.status]
        )}
      >
        {job.status}
      </span>
    </div>
  );

  if (job.status === 'complete' && job.output_url) {
    return (
      <Link href={`/app/library/${job.id}`}>
        {content}
      </Link>
    );
  }

  return content;
}

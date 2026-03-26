'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Headphones, Video, FileText, Image, Share2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';
import { Spinner } from '@/components/shared/loading';
import { AssetPlayer } from '@/components/library/asset-player';
import { DownloadButton } from '@/components/library/download-button';
import { SocialPostsDisplay } from '@/components/library/social-posts-display';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import type { Generation, GenerationType, SocialOutput } from '@/lib/types';

const TYPE_ICONS: Record<GenerationType, typeof Headphones> = {
  mp3: Headphones,
  video: Video,
  description: FileText,
  thumbnail: Image,
  social: Share2,
};

const TYPE_LABELS: Record<GenerationType, string> = {
  mp3: 'MP3 Audio',
  video: 'Video',
  description: 'SEO Description',
  thumbnail: 'Thumbnail',
  social: 'Social Posts',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTier(tier: string | null): string {
  if (!tier) return '-';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function formatTone(tone: string | null): string {
  if (!tone) return '-';
  return tone
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function AssetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUserStore();
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user || !params.id) return;

    async function fetchGeneration() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('generations')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error || !data) {
          setNotFound(true);
          return;
        }

        setGeneration(data as Generation);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGeneration();
  }, [user, params.id]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (notFound || !generation) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/app/library"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Link>
        <div className="flex flex-col items-center justify-center py-24">
          <h2 className="text-lg font-semibold text-white">Asset not found</h2>
          <p className="mt-1 text-sm text-neutral-400">
            This generation does not exist or you do not have access to it.
          </p>
        </div>
      </div>
    );
  }

  const Icon = TYPE_ICONS[generation.type];

  const metadataRows: { label: string; value: string }[] = [
    { label: 'Type', value: TYPE_LABELS[generation.type] },
    { label: 'Topic', value: generation.input_topic },
    { label: 'Tone', value: formatTone(generation.tone) },
    { label: 'Status', value: generation.status.charAt(0).toUpperCase() + generation.status.slice(1) },
    { label: 'Credits Used', value: String(generation.credits_used) },
  ];

  if (generation.voice_tier) {
    metadataRows.push({ label: 'Voice Tier', value: formatTier(generation.voice_tier) });
  }
  if (generation.image_tier) {
    metadataRows.push({ label: 'Image Tier', value: formatTier(generation.image_tier) });
  }
  if (generation.motion_tier) {
    metadataRows.push({ label: 'Motion Tier', value: formatTier(generation.motion_tier) });
  }
  if (generation.input_duration) {
    metadataRows.push({ label: 'Duration', value: `${generation.input_duration} min` });
  }
  if (generation.scene_count) {
    metadataRows.push({ label: 'Scenes', value: String(generation.scene_count) });
  }
  if (generation.input_style) {
    metadataRows.push({ label: 'Style', value: generation.input_style });
  }

  metadataRows.push(
    { label: 'Created', value: formatDate(generation.created_at) },
    { label: 'Started', value: formatDate(generation.started_at) },
    { label: 'Completed', value: formatDate(generation.completed_at) }
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/app/library"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Library
      </Link>

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-800/50">
          <Icon className="h-5 w-5 text-neutral-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-white">{generation.input_topic}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {TYPE_LABELS[generation.type]}
            </Badge>
            <span className="text-xs text-neutral-500">
              {generation.credits_used} credits
            </span>
          </div>
        </div>
      </div>

      {generation.type === 'social' && generation.output_metadata?.posts ? (
        <SocialPostsDisplay
          output={generation.output_metadata as unknown as SocialOutput}
        />
      ) : (
        <AssetPlayer generation={generation} />
      )}

      <DownloadButton
        url={generation.output_url}
        type={generation.type}
        topic={generation.input_topic}
      />

      <div className="rounded-lg border border-[#1e1e1e] bg-[#111111]">
        <div className="border-b border-[#1e1e1e] px-4 py-2.5">
          <h2 className="text-sm font-medium text-neutral-400">Generation Details</h2>
        </div>
        <Table>
          <TableBody>
            {metadataRows.map((row) => (
              <TableRow key={row.label} className="border-[#1e1e1e]">
                <TableCell className="w-40 text-xs font-medium text-neutral-500">
                  {row.label}
                </TableCell>
                <TableCell className="text-sm text-neutral-300">
                  {row.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

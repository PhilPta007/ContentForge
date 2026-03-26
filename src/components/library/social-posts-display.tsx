'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SocialOutput, SocialPost } from '@/lib/types';

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  twitter: { label: 'Twitter/X', color: 'text-sky-400' },
  linkedin: { label: 'LinkedIn', color: 'text-blue-400' },
  instagram: { label: 'Instagram', color: 'text-pink-400' },
  facebook: { label: 'Facebook', color: 'text-indigo-400' },
  threads: { label: 'Threads', color: 'text-neutral-300' },
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} post copied`);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function PostCard({ post }: { post: SocialPost }) {
  const meta = PLATFORM_META[post.platform] ?? {
    label: post.platform,
    color: 'text-neutral-400',
  };

  return (
    <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${meta.color}`}>
          {meta.label}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">
            {post.characterCount} chars
          </span>
          <CopyButton text={post.content} label={meta.label} />
        </div>
      </div>

      <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
        {post.content}
      </p>

      {post.hashtags && post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.hashtags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5"
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

interface SocialPostsDisplayProps {
  output: SocialOutput;
}

export function SocialPostsDisplay({ output }: SocialPostsDisplayProps) {
  async function handleCopyAll() {
    const allText = output.posts
      .map((post) => {
        const meta = PLATFORM_META[post.platform];
        const label = meta?.label ?? post.platform;
        return `--- ${label} ---\n${post.content}`;
      })
      .join('\n\n');

    await navigator.clipboard.writeText(allText);
    toast.success('All posts copied');
  }

  return (
    <div className="space-y-4">
      {output.extractedTitle && (
        <p className="text-sm text-neutral-400">
          Source: <span className="text-neutral-200">{output.extractedTitle}</span>
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">
          {output.posts.length} post{output.posts.length !== 1 ? 's' : ''} generated
        </span>
        <Button variant="outline" size="sm" onClick={handleCopyAll}>
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          Copy All
        </Button>
      </div>

      <div className="space-y-3">
        {output.posts.map((post, i) => (
          <PostCard key={`${post.platform}-${i}`} post={post} />
        ))}
      </div>
    </div>
  );
}

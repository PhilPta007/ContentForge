'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CostPreview } from '@/components/create/cost-preview';
import { GenerateButton } from '@/components/create/generate-button';
import { useCreditStore } from '@/stores/credit-store';
import { cn } from '@/lib/utils';
import type { GenerationConfig, SocialPlatform } from '@/lib/types';

const PLATFORMS: { id: SocialPlatform; name: string; maxChars: number }[] = [
  { id: 'twitter', name: 'Twitter/X', maxChars: 280 },
  { id: 'linkedin', name: 'LinkedIn', maxChars: 3000 },
  { id: 'instagram', name: 'Instagram', maxChars: 2200 },
  { id: 'facebook', name: 'Facebook', maxChars: 63206 },
  { id: 'threads', name: 'Threads', maxChars: 500 },
];

export function SocialForm() {
  const router = useRouter();
  const { deductCredits } = useCreditStore();

  const [inputType, setInputType] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    'twitter',
    'linkedin',
    'instagram',
    'facebook',
  ]);

  const config: GenerationConfig = { type: 'social' };

  const isValid =
    selectedPlatforms.length > 0 &&
    (inputType === 'url'
      ? url.trim().startsWith('http')
      : text.trim().length >= 100);

  function togglePlatform(platform: SocialPlatform) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }

  async function handleGenerate() {
    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one platform');
      return;
    }

    const res = await fetch('/api/generate/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputType,
        url: inputType === 'url' ? url.trim() : undefined,
        text: inputType === 'text' ? text.trim() : undefined,
        platforms: selectedPlatforms,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? 'Failed to start generation');
      return;
    }

    const { generationId, creditsUsed } = await res.json();
    deductCredits(creditsUsed);
    toast.success('Generating social posts...');
    router.push(`/app/jobs?highlight=${generationId}`);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div className="space-y-8">
        {/* Input Type Toggle */}
        <div className="space-y-4">
          <Label>Content Source</Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setInputType('url')}
              className={cn(
                'px-4 py-2 text-sm rounded-md border transition-colors',
                inputType === 'url'
                  ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400'
                  : 'border-[#1e1e1e] text-neutral-400 hover:border-neutral-700'
              )}
            >
              Blog/Article URL
            </button>
            <button
              type="button"
              onClick={() => setInputType('text')}
              className={cn(
                'px-4 py-2 text-sm rounded-md border transition-colors',
                inputType === 'text'
                  ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400'
                  : 'border-[#1e1e1e] text-neutral-400 hover:border-neutral-700'
              )}
            >
              Paste Text
            </button>
          </div>
        </div>

        {/* URL Input */}
        {inputType === 'url' && (
          <div className="space-y-2">
            <Label htmlFor="social-url">Blog/Article URL</Label>
            <Input
              id="social-url"
              type="url"
              placeholder="https://your-blog.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-10"
            />
            <p className="text-xs text-neutral-500">
              We&apos;ll extract the content and key points automatically
            </p>
          </div>
        )}

        {/* Text Input */}
        {inputType === 'text' && (
          <div className="space-y-2">
            <Label htmlFor="social-text">Your Content</Label>
            <textarea
              id="social-text"
              rows={10}
              placeholder="Paste your blog post, article, or any content you want to turn into social posts..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-3 text-sm text-white outline-none focus-visible:border-indigo-600/50 focus-visible:ring-1 focus-visible:ring-indigo-600/50 resize-y min-h-[200px]"
            />
            <p className="text-xs text-neutral-500">
              {text.length} characters{text.length < 100 ? ' (minimum 100)' : ''}
            </p>
          </div>
        )}

        {/* Platform Selection */}
        <div className="space-y-4">
          <Label>Platforms</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => togglePlatform(platform.id)}
                className={cn(
                  'p-3 rounded-lg border text-left transition-colors',
                  selectedPlatforms.includes(platform.id)
                    ? 'border-indigo-600 bg-indigo-600/10'
                    : 'border-[#1e1e1e] hover:border-neutral-700'
                )}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    selectedPlatforms.includes(platform.id)
                      ? 'text-indigo-400'
                      : 'text-neutral-300'
                  )}
                >
                  {platform.name}
                </span>
                <p className="text-xs text-neutral-500 mt-1">
                  Max {platform.maxChars.toLocaleString()} chars
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Preview Sidebar */}
      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <CostPreview config={config} />
        <p className="text-xs text-neutral-500 text-center">
          Generates {selectedPlatforms.length} platform-optimised post{selectedPlatforms.length !== 1 ? 's' : ''}
        </p>
        <GenerateButton
          config={config}
          isValid={isValid}
          onGenerate={handleGenerate}
        />
      </div>
    </div>
  );
}

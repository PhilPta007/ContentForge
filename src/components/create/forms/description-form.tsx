'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CostPreview } from '@/components/create/cost-preview';
import { GenerateButton } from '@/components/create/generate-button';
import { createClient } from '@/lib/supabase/client';
import { useCreditStore } from '@/stores/credit-store';
import { cn } from '@/lib/utils';
import type { GenerationConfig, AffiliateLink } from '@/lib/types';

export function DescriptionForm() {
  const router = useRouter();
  const { deductCredits } = useCreditStore();
  const supabase = createClient();

  const [topic, setTopic] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [useBrandVoice, setUseBrandVoice] = useState(false);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);

  useEffect(() => {
    async function fetchLinks() {
      const { data } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('is_active', true)
        .order('label');
      setAffiliateLinks(data ?? []);
      setIsLoadingLinks(false);
    }
    fetchLinks();
  }, [supabase]);

  function toggleLink(id: string) {
    setSelectedLinkIds((prev) =>
      prev.includes(id) ? prev.filter((lid) => lid !== id) : [...prev, id]
    );
  }

  const config: GenerationConfig = { type: 'description' };
  const isValid = topic.trim().length > 0 || youtubeUrl.trim().length > 0;

  async function handleGenerate() {
    const res = await fetch('/api/generate/description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topic.trim(),
        youtubeUrl: youtubeUrl.trim() || undefined,
        useBrandVoice,
        affiliateLinkIds: selectedLinkIds,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? 'Failed to start generation');
      return;
    }

    const { generationId, creditsUsed } = await res.json();
    deductCredits(creditsUsed);
    toast.success('Generation started');
    router.push(`/app/jobs?highlight=${generationId}`);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="desc-topic">Topic / Title</Label>
            <Input
              id="desc-topic"
              placeholder="e.g. Top 10 Productivity Apps for 2026"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube-url">
              YouTube URL{' '}
              <span className="text-neutral-500 font-normal">(optional)</span>
            </Label>
            <Input
              id="youtube-url"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="h-10"
            />
            <p className="text-xs text-neutral-500">
              Provide a YouTube URL to generate a description based on transcript
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Brand Voice</Label>
          <button
            type="button"
            onClick={() => setUseBrandVoice(!useBrandVoice)}
            className={cn(
              'flex items-center gap-3 w-full p-3 border rounded-lg text-left transition-colors',
              useBrandVoice
                ? 'border-indigo-600 bg-indigo-600/5'
                : 'border-[#1e1e1e] hover:border-indigo-600/50'
            )}
          >
            <div
              className={cn(
                'h-4 w-4 rounded border flex items-center justify-center',
                useBrandVoice
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'border-neutral-600'
              )}
            >
              {useBrandVoice && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-200">
                Use my brand voice
              </div>
              <div className="text-xs text-neutral-500">
                Apply your saved brand voice settings to the output
              </div>
            </div>
          </button>
        </div>

        <div className="space-y-2">
          <Label>Affiliate Links</Label>
          {isLoadingLinks ? (
            <div className="text-sm text-neutral-500">Loading links...</div>
          ) : affiliateLinks.length === 0 ? (
            <div className="text-sm text-neutral-500">
              No affiliate links configured.{' '}
              <a
                href="/app/settings/links"
                className="text-indigo-400 hover:underline"
              >
                Add some
              </a>
            </div>
          ) : (
            <div className="space-y-1">
              {affiliateLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => toggleLink(link.id)}
                  className={cn(
                    'flex items-center gap-3 w-full p-2.5 border rounded-lg text-left transition-colors text-sm',
                    selectedLinkIds.includes(link.id)
                      ? 'border-indigo-600 bg-indigo-600/5'
                      : 'border-[#1e1e1e] hover:border-indigo-600/50'
                  )}
                >
                  <div
                    className={cn(
                      'h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0',
                      selectedLinkIds.includes(link.id)
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-neutral-600'
                    )}
                  >
                    {selectedLinkIds.includes(link.id) && (
                      <svg
                        className="h-2.5 w-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-neutral-200">{link.label}</span>
                  <span className="text-neutral-500 text-xs ml-auto truncate max-w-[200px]">
                    {link.url}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <CostPreview config={config} />
        <GenerateButton
          config={config}
          isValid={isValid}
          onGenerate={handleGenerate}
        />
      </div>
    </div>
  );
}

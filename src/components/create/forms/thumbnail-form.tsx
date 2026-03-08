'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TierSelector } from '@/components/create/tier-selector';
import { CostPreview } from '@/components/create/cost-preview';
import { GenerateButton } from '@/components/create/generate-button';
import { IMAGE_CREDITS } from '@/lib/credits';
import { useCreditStore } from '@/stores/credit-store';
import type { ImageTier, GenerationConfig } from '@/lib/types';

const IMAGE_OPTIONS = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Kie.ai Nano',
    creditsPerUnit: IMAGE_CREDITS.standard,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Imagen 4.0',
    creditsPerUnit: IMAGE_CREDITS.premium,
    recommended: true,
  },
  {
    id: 'ultra',
    name: 'Ultra',
    description: 'Imagen Ultra',
    creditsPerUnit: IMAGE_CREDITS.ultra,
  },
];

export function ThumbnailForm() {
  const router = useRouter();
  const { deductCredits } = useCreditStore();

  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('');
  const [imageTier, setImageTier] = useState<ImageTier>('premium');

  const config: GenerationConfig = { type: 'thumbnail' };
  const isValid = topic.trim().length > 0;

  async function handleGenerate() {
    const res = await fetch('/api/generate/thumbnail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topic.trim(),
        style: style.trim() || undefined,
        imageTier,
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
            <Label htmlFor="thumb-topic">Topic / Title</Label>
            <Input
              id="thumb-topic"
              placeholder="e.g. Why Ancient Rome Fell"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumb-style">
              Style / Mood{' '}
              <span className="text-neutral-500 font-normal">(optional)</span>
            </Label>
            <Input
              id="thumb-style"
              placeholder="e.g. Dark cinematic, bold text overlay"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        <TierSelector
          label="Image Quality"
          options={IMAGE_OPTIONS}
          value={imageTier}
          onChange={(v) => setImageTier(v as ImageTier)}
          unit="per image"
        />

        <div className="p-3 border border-[#1e1e1e] rounded-lg bg-[#111111]/30">
          <p className="text-sm text-neutral-400">
            Generates <span className="text-neutral-200 font-medium">3 thumbnail options</span> for
            a fixed cost of <span className="text-neutral-200 font-medium">8 credits</span>.
          </p>
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

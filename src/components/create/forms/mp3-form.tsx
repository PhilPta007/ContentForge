'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TopicInput } from '@/components/create/topic-input';
import { ToneSelector } from '@/components/create/tone-selector';
import { TierSelector } from '@/components/create/tier-selector';
import { CostPreview } from '@/components/create/cost-preview';
import { GenerateButton } from '@/components/create/generate-button';
import { VOICE_CREDITS } from '@/lib/credits';
import { useCreditStore } from '@/stores/credit-store';
import type { ContentTone, VoiceTier, GenerationConfig } from '@/lib/types';

const VOICE_OPTIONS = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Kokoro TTS',
    creditsPerUnit: VOICE_CREDITS.standard,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Google WaveNet',
    creditsPerUnit: VOICE_CREDITS.premium,
    recommended: true,
  },
  {
    id: 'ultra',
    name: 'Ultra',
    description: 'ElevenLabs',
    creditsPerUnit: VOICE_CREDITS.ultra,
  },
];

export function Mp3Form() {
  const router = useRouter();
  const { deductCredits } = useCreditStore();

  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(10);
  const [tone, setTone] = useState<ContentTone>('podcast');
  const [voiceTier, setVoiceTier] = useState<VoiceTier>('premium');

  const config: GenerationConfig = {
    type: 'mp3',
    duration,
    tone,
    voiceTier,
  };

  const isValid = topic.trim().length > 0;

  async function handleGenerate() {
    const res = await fetch('/api/generate/mp3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: topic.trim(), duration, tone, voiceTier }),
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
        <TopicInput
          value={topic}
          onChange={setTopic}
          duration={duration}
          onDurationChange={setDuration}
          showDuration
          type="mp3"
        />

        <ToneSelector value={tone} onChange={setTone} />

        <TierSelector
          label="Voice Quality"
          options={VOICE_OPTIONS}
          value={voiceTier}
          onChange={(v) => setVoiceTier(v as VoiceTier)}
          unit="per minute"
        />
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

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TopicInput } from '@/components/create/topic-input';
import { ToneSelector } from '@/components/create/tone-selector';
import { TierSelector } from '@/components/create/tier-selector';
import { CostPreview } from '@/components/create/cost-preview';
import { GenerateButton } from '@/components/create/generate-button';
import { VOICE_CREDITS, IMAGE_CREDITS, MOTION_CREDITS } from '@/lib/credits';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCreditStore } from '@/stores/credit-store';
import type {
  ContentTone,
  VoiceTier,
  ImageTier,
  MotionTier,
  GenerationConfig,
} from '@/lib/types';

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

const IMAGE_OPTIONS = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Nano Banana',
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

const MOTION_OPTIONS = [
  {
    id: 'static',
    name: 'Static',
    description: 'Ken Burns effect',
    creditsPerUnit: MOTION_CREDITS.static,
  },
  {
    id: 'ai',
    name: 'AI Motion',
    description: 'VEO3 Fast',
    creditsPerUnit: MOTION_CREDITS.ai,
    recommended: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Kling 1.5 Pro',
    creditsPerUnit: MOTION_CREDITS.premium,
  },
];

export function VideoForm() {
  const router = useRouter();
  const { deductCredits } = useCreditStore();

  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(10);
  const [tone, setTone] = useState<ContentTone>('storytelling');
  const [voiceTier, setVoiceTier] = useState<VoiceTier>('premium');
  const [imageTier, setImageTier] = useState<ImageTier>('premium');
  const [motionTier, setMotionTier] = useState<MotionTier>('static');
  const [sceneCountOverride, setSceneCountOverride] = useState('');

  const sceneCount = useMemo(() => {
    const override = parseInt(sceneCountOverride, 10);
    return override > 0 ? override : Math.ceil(duration * 2);
  }, [sceneCountOverride, duration]);

  const config: GenerationConfig = {
    type: 'video',
    duration,
    tone,
    voiceTier,
    imageTier,
    motionTier,
    sceneCount,
  };

  const isValid = topic.trim().length > 0;

  async function handleGenerate() {
    const res = await fetch('/api/generate/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topic.trim(),
        duration,
        tone,
        voiceTier,
        imageTier,
        motionTier,
        sceneCount,
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
        <TopicInput
          value={topic}
          onChange={setTopic}
          duration={duration}
          onDurationChange={setDuration}
          showDuration
          type="video"
        />

        <ToneSelector value={tone} onChange={setTone} />

        <TierSelector
          label="Voice Quality"
          options={VOICE_OPTIONS}
          value={voiceTier}
          onChange={(v) => setVoiceTier(v as VoiceTier)}
          unit="per minute"
        />

        <TierSelector
          label="Image Quality"
          options={IMAGE_OPTIONS}
          value={imageTier}
          onChange={(v) => setImageTier(v as ImageTier)}
          unit="per image"
        />

        <TierSelector
          label="Motion Style"
          options={MOTION_OPTIONS}
          value={motionTier}
          onChange={(v) => setMotionTier(v as MotionTier)}
          unit="per clip"
        />

        <div className="space-y-2">
          <Label htmlFor="sceneCount">
            Scene Count Override{' '}
            <span className="text-neutral-500 font-normal">
              (default: {Math.ceil(duration * 2)} scenes)
            </span>
          </Label>
          <Input
            id="sceneCount"
            type="number"
            min={1}
            max={100}
            placeholder={String(Math.ceil(duration * 2))}
            value={sceneCountOverride}
            onChange={(e) => setSceneCountOverride(e.target.value)}
            className="h-10 max-w-[200px]"
          />
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

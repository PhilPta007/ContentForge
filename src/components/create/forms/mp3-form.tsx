'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TopicInput } from '@/components/create/topic-input';
import { ToneSelector } from '@/components/create/tone-selector';
import { TierSelector } from '@/components/create/tier-selector';
import { CostPreview } from '@/components/create/cost-preview';
import { GenerateButton } from '@/components/create/generate-button';
import { Label } from '@/components/ui/label';
import { VOICE_CREDITS } from '@/lib/credits';
import { useCreditStore } from '@/stores/credit-store';
import { cn } from '@/lib/utils';
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
    description: 'ElevenLabs',
    creditsPerUnit: VOICE_CREDITS.premium,
    recommended: true,
  },
  {
    id: 'ultra',
    name: 'Ultra',
    description: 'ElevenLabs HD',
    creditsPerUnit: VOICE_CREDITS.ultra,
  },
];

export function Mp3Form() {
  const router = useRouter();
  const { deductCredits } = useCreditStore();

  const [topic, setTopic] = useState('');
  const [customScript, setCustomScript] = useState('');
  const [useCustomScript, setUseCustomScript] = useState(false);
  const [duration, setDuration] = useState(10);
  const [tone, setTone] = useState<ContentTone>('podcast');
  const [voiceTier, setVoiceTier] = useState<VoiceTier>('premium');

  const config: GenerationConfig = {
    type: 'mp3',
    duration,
    tone,
    voiceTier,
  };

  const isValid = useCustomScript
    ? customScript.trim().length >= 50
    : topic.trim().length > 0;

  async function handleGenerate() {
    const res = await fetch('/api/generate/mp3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: useCustomScript ? `Custom script: ${customScript.substring(0, 50)}...` : topic.trim(),
        duration,
        tone,
        voiceTier,
        ...(useCustomScript && { customScript: customScript.trim() }),
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setUseCustomScript(false)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md border transition-colors',
                !useCustomScript
                  ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400'
                  : 'border-[#1e1e1e] text-neutral-400 hover:border-neutral-700'
              )}
            >
              AI-generated script
            </button>
            <button
              type="button"
              onClick={() => setUseCustomScript(true)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md border transition-colors',
                useCustomScript
                  ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400'
                  : 'border-[#1e1e1e] text-neutral-400 hover:border-neutral-700'
              )}
            >
              My own script
            </button>
          </div>

          {useCustomScript ? (
            <div className="space-y-2">
              <Label htmlFor="custom-script">Your Script</Label>
              <textarea
                id="custom-script"
                rows={10}
                placeholder="Paste or type your script here. This text will be narrated directly — no AI rewriting."
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus-visible:border-indigo-600/50 focus-visible:ring-1 focus-visible:ring-indigo-600/50 resize-y min-h-[200px]"
              />
              <p className="text-xs text-neutral-500">
                {customScript.length} characters
                {customScript.length < 50 && ' (minimum 50)'}
              </p>
            </div>
          ) : (
            <TopicInput
              value={topic}
              onChange={setTopic}
              duration={duration}
              onDurationChange={setDuration}
              showDuration
              type="mp3"
            />
          )}
        </div>

        {!useCustomScript && <ToneSelector value={tone} onChange={setTone} />}

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

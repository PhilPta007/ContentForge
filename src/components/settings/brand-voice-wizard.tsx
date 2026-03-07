'use client';

import { useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { BrandVoice } from '@/lib/types';

const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal', description: 'Professional, polished language' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, conversational tone' },
  { value: 'mixed', label: 'Mixed', description: 'Adapts based on context' },
] as const;

const AUDIENCE_OPTIONS = [
  { value: 'beginners', label: 'Beginners', description: 'New to the topic' },
  { value: 'experts', label: 'Experts', description: 'Deep domain knowledge' },
  { value: 'mixed', label: 'Mixed', description: 'Broad audience range' },
] as const;

const PERSONALITY_TRAITS = [
  'Witty',
  'Authoritative',
  'Friendly',
  'Professional',
  'Edgy',
  'Inspirational',
] as const;

const STEPS = ['Sample Content', 'Brand Questions', 'Review & Save'];

export function BrandVoiceWizard() {
  const { user, profile, setProfile } = useUserStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const existing = profile?.brand_voice as BrandVoice | null;

  const [sampleContent, setSampleContent] = useState(existing?.sampleContent || '');
  const [tone, setTone] = useState<BrandVoice['tone']>(existing?.tone || 'mixed');
  const [audience, setAudience] = useState<BrandVoice['audience']>(existing?.audience || 'mixed');
  const [traits, setTraits] = useState<string[]>(existing?.traits || []);

  function toggleTrait(trait: string) {
    setTraits((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    );
  }

  function canProceed(): boolean {
    if (currentStep === 0) return sampleContent.trim().length >= 50;
    if (currentStep === 1) return traits.length >= 1;
    return true;
  }

  function buildBrandVoice(): BrandVoice {
    return {
      sampleContent: sampleContent.trim(),
      tone,
      audience,
      traits,
    };
  }

  async function handleSave() {
    if (!user) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      const brandVoice = buildBrandVoice();

      const { error } = await supabase
        .from('profiles')
        .update({ brand_voice: brandVoice as unknown as Record<string, unknown> })
        .eq('id', user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      if (profile) {
        setProfile({ ...profile, brand_voice: brandVoice as unknown as Record<string, unknown> });
      }
      toast.success('Brand voice saved');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  }

  const inputClasses = 'bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500';

  return (
    <div className="max-w-2xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {STEPS.map((step, index) => (
          <div key={step} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (index < currentStep) setCurrentStep(index);
              }}
              className={`flex items-center gap-2 text-sm transition-colors ${
                index === currentStep
                  ? 'text-white'
                  : index < currentStep
                    ? 'text-indigo-400 cursor-pointer hover:text-indigo-300'
                    : 'text-neutral-500'
              }`}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                  index === currentStep
                    ? 'bg-indigo-600 text-white'
                    : index < currentStep
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                {index < currentStep ? <Check className="size-3" /> : index + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div
                className={`h-px w-8 ${
                  index < currentStep ? 'bg-indigo-600/50' : 'bg-neutral-800'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-lg border border-neutral-800 bg-[#111111] p-6">
        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white">Paste Sample Content</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Paste a blog post, script, or description that represents your voice. At least 50
                characters.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sample-content" className="text-neutral-300">
                Sample Content
              </Label>
              <textarea
                id="sample-content"
                rows={8}
                value={sampleContent}
                onChange={(e) => setSampleContent(e.target.value)}
                placeholder="Paste your content here..."
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 ${inputClasses} resize-none`}
              />
              <p className="text-xs text-neutral-500">
                {sampleContent.length} characters{' '}
                {sampleContent.length < 50 && '(minimum 50)'}
              </p>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-white">Brand Questions</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Define your brand's tone, audience, and personality.
              </p>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <Label className="text-neutral-300">Tone</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {TONE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTone(option.value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      tone === option.value
                        ? 'border-indigo-600 bg-indigo-600/10'
                        : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{option.label}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Audience */}
            <div className="space-y-2">
              <Label className="text-neutral-300">Target Audience</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {AUDIENCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAudience(option.value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      audience === option.value
                        ? 'border-indigo-600 bg-indigo-600/10'
                        : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{option.label}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Traits */}
            <div className="space-y-2">
              <Label className="text-neutral-300">
                Personality Traits <span className="text-neutral-500">(select at least 1)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {PERSONALITY_TRAITS.map((trait) => (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => toggleTrait(trait)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      traits.includes(trait)
                        ? 'border-indigo-600 bg-indigo-600/10 text-indigo-300'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
                    }`}
                  >
                    {trait}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white">Review Brand Voice</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Review your brand voice profile before saving.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <pre className="text-xs text-neutral-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(buildBrandVoice(), null, 2)}
              </pre>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <p className="text-xs text-neutral-500">Tone</p>
                <p className="mt-1 text-sm font-medium text-white capitalize">{tone}</p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <p className="text-xs text-neutral-500">Audience</p>
                <p className="mt-1 text-sm font-medium text-white capitalize">{audience}</p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <p className="text-xs text-neutral-500">Traits</p>
                <p className="mt-1 text-sm font-medium text-white">{traits.join(', ') || 'None'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((s) => s - 1)}
          className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white"
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button
            disabled={!canProceed()}
            onClick={() => setCurrentStep((s) => s + 1)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            disabled={isSaving}
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : 'Save Brand Voice'}
          </Button>
        )}
      </div>
    </div>
  );
}

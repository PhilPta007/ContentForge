'use client';

import { CONTENT_TONES } from '@/lib/tones';
import { cn } from '@/lib/utils';
import type { ContentTone } from '@/lib/types';

interface ToneSelectorProps {
  value: ContentTone;
  onChange: (tone: ContentTone) => void;
}

const TONE_GROUPS: Record<string, ContentTone[]> = {
  'Sleep & Relaxation': ['sleep', 'asmr', 'bedtime_story'],
  Storytelling: ['storytelling', 'documentary'],
  'Educational & Podcast': ['educational', 'podcast'],
  YouTube: ['youtube_hype'],
};

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-neutral-200">
        Content Tone
      </label>

      {Object.entries(TONE_GROUPS).map(([group, tones]) => (
        <div key={group} className="space-y-2">
          <div className="text-xs text-neutral-500 uppercase tracking-wide">
            {group}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {tones.map((toneId) => {
              const tone = CONTENT_TONES[toneId];
              return (
                <button
                  key={toneId}
                  type="button"
                  onClick={() => onChange(toneId)}
                  className={cn(
                    'p-3 border rounded-lg text-left transition-colors',
                    value === toneId
                      ? 'border-indigo-600 bg-indigo-600/5'
                      : 'border-[#1e1e1e] hover:border-indigo-600/50'
                  )}
                >
                  <div className="font-medium text-sm text-neutral-200">
                    {tone.name}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {tone.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

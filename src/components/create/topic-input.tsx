'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { GenerationType } from '@/lib/types';

interface TopicInputProps {
  value: string;
  onChange: (value: string) => void;
  duration?: number;
  onDurationChange?: (duration: number) => void;
  showDuration?: boolean;
  type?: GenerationType;
}

const DURATION_OPTIONS = [5, 10, 15, 20, 30];

export function TopicInput({
  value,
  onChange,
  duration,
  onDurationChange,
  showDuration = false,
}: TopicInputProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="topic">Topic / Title</Label>
        <Input
          id="topic"
          placeholder="e.g. The History of Ancient Rome"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10"
        />
      </div>

      {showDuration && (
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <select
            id="duration"
            value={duration ?? 10}
            onChange={(e) => onDurationChange?.(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 text-sm text-white outline-none focus-visible:border-indigo-600/50 focus-visible:ring-1 focus-visible:ring-indigo-600/50"
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d} value={d} className="bg-neutral-900 text-white">
                {d} minutes
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

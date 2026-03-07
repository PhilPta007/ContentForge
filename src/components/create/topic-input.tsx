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
            className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d} minutes
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

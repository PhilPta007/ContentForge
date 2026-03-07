'use client';

import { cn } from '@/lib/utils';

export interface TierOption {
  id: string;
  name: string;
  description: string;
  creditsPerUnit: number;
  recommended?: boolean;
}

interface TierSelectorProps {
  label: string;
  options: TierOption[];
  value: string;
  onChange: (value: string) => void;
  unit: string;
}

export function TierSelector({
  label,
  options,
  value,
  onChange,
  unit,
}: TierSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-200">{label}</label>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'relative p-4 border rounded-lg text-left transition-colors',
              value === option.id
                ? 'border-indigo-600 bg-indigo-600/5'
                : 'border-[#1e1e1e] hover:border-indigo-600/50'
            )}
          >
            {option.recommended && (
              <span className="absolute -top-2 right-2 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded">
                Recommended
              </span>
            )}
            <div className="font-medium text-sm text-neutral-200">
              {option.name}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              {option.description}
            </div>
            <div className="mt-2 text-sm">
              <span className="font-semibold text-neutral-200">
                {option.creditsPerUnit}
              </span>
              <span className="text-neutral-500"> credits {unit}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

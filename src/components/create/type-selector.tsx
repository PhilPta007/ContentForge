'use client';

import { Headphones, Video, FileText, Image, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GenerationType } from '@/lib/types';

interface TypeSelectorProps {
  value: GenerationType | null;
  onChange: (type: GenerationType) => void;
}

const GENERATION_TYPES: {
  id: GenerationType;
  label: string;
  description: string;
  icon: typeof Headphones;
}[] = [
  {
    id: 'mp3',
    label: 'MP3 Episode',
    description: 'AI-narrated podcast episode',
    icon: Headphones,
  },
  {
    id: 'video',
    label: 'Video',
    description: 'Static or AI-motion video',
    icon: Video,
  },
  {
    id: 'description',
    label: 'Description',
    description: 'SEO-optimised description',
    icon: FileText,
  },
  {
    id: 'thumbnail',
    label: 'Thumbnail',
    description: '3 thumbnail options',
    icon: Image,
  },
  {
    id: 'social',
    label: 'Social Posts',
    description: 'Multi-platform posts',
    icon: Share2,
  },
];

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-200">Content Type</label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {GENERATION_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.id;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange(type.id)}
              className={cn(
                'flex flex-col items-start gap-2 p-4 border rounded-lg text-left transition-colors',
                isSelected
                  ? 'border-indigo-600 bg-indigo-600/5'
                  : 'border-[#1e1e1e] hover:border-indigo-600/50'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  isSelected ? 'text-indigo-400' : 'text-neutral-400'
                )}
              />
              <div>
                <div className="font-medium text-sm text-neutral-200">
                  {type.label}
                </div>
                <div className="text-xs text-neutral-500">{type.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

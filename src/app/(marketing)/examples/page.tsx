import type { Metadata } from 'next';
import { Headphones, Video, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Examples — ContentForge',
  description:
    'See sample podcast episodes, videos, and descriptions created with ContentForge.',
};

interface ExampleItem {
  title: string;
  description: string;
  type: 'podcast' | 'video' | 'description';
  tier: string;
  duration?: string;
}

const EXAMPLES: ExampleItem[] = [
  {
    title: 'The History of the Silk Road',
    description:
      'A 15-minute documentary-style podcast covering the ancient trade routes, narrated with a cinematic tone.',
    type: 'podcast',
    tier: 'Ultra',
    duration: '15 min',
  },
  {
    title: 'Sleep Sounds: Ocean Waves',
    description:
      'A calming 30-minute sleep podcast with gentle narration and ambient pacing.',
    type: 'podcast',
    tier: 'Premium',
    duration: '30 min',
  },
  {
    title: 'Top 10 Coding Frameworks in 2026',
    description:
      'An educational YouTube video with AI-generated visuals and smooth transitions between scenes.',
    type: 'video',
    tier: 'Premium',
    duration: '8 min',
  },
  {
    title: 'Ancient Egypt: Rise of the Pharaohs',
    description:
      'A cinematic storytelling video with Ultra voice narration and AI motion for dramatic scene transitions.',
    type: 'video',
    tier: 'Ultra',
    duration: '12 min',
  },
  {
    title: 'SEO Description: Tech Review Channel',
    description:
      'An optimized YouTube description with brand voice, timestamps, and affiliate links integrated naturally.',
    type: 'description',
    tier: 'Standard',
  },
  {
    title: 'SEO Description: True Crime Podcast',
    description:
      'A compelling podcast description with episode highlights, sponsor mentions, and social links.',
    type: 'description',
    tier: 'Standard',
  },
];

const TYPE_CONFIG = {
  podcast: { icon: Headphones, label: 'Podcast', color: 'text-indigo-400 bg-indigo-600/10' },
  video: { icon: Video, label: 'Video', color: 'text-amber-400 bg-amber-600/10' },
  description: { icon: FileText, label: 'Description', color: 'text-emerald-400 bg-emerald-600/10' },
};

export default function ExamplesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Examples
        </h1>
        <p className="mt-3 text-base text-neutral-400">
          Sample outputs showing what ContentForge can create across different
          content types and quality tiers.
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-indigo-600/20 bg-indigo-600/5 px-4 py-3">
        <p className="text-sm text-indigo-300">
          Real audio and video examples are coming soon. These entries show the
          types of content you can generate.
        </p>
      </div>

      {/* Podcast Examples */}
      <section className="mt-12 border-t border-[#1e1e1e] pt-12">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Podcast samples
        </h2>
        <div className="mt-6 space-y-px overflow-hidden rounded-lg border border-[#1e1e1e]">
          {EXAMPLES.filter((e) => e.type === 'podcast').map((example) => (
            <ExampleRow key={example.title} example={example} />
          ))}
        </div>
      </section>

      {/* Video Examples */}
      <section className="mt-12 border-t border-[#1e1e1e] pt-12">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Video samples
        </h2>
        <div className="mt-6 space-y-px overflow-hidden rounded-lg border border-[#1e1e1e]">
          {EXAMPLES.filter((e) => e.type === 'video').map((example) => (
            <ExampleRow key={example.title} example={example} />
          ))}
        </div>
      </section>

      {/* Description Examples */}
      <section className="mt-12 border-t border-[#1e1e1e] pt-12">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Description samples
        </h2>
        <div className="mt-6 space-y-px overflow-hidden rounded-lg border border-[#1e1e1e]">
          {EXAMPLES.filter((e) => e.type === 'description').map((example) => (
            <ExampleRow key={example.title} example={example} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ExampleRow({ example }: { example: ExampleItem }) {
  const config = TYPE_CONFIG[example.type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-4 border-b border-[#1e1e1e] bg-[#0a0a0a] p-5 last:border-b-0 hover:bg-[#111111] transition-colors">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white">{example.title}</h3>
          <Badge
            variant="secondary"
            className="border-0 bg-[#1e1e1e] text-xs text-neutral-400"
          >
            {example.tier}
          </Badge>
          {example.duration && (
            <span className="text-xs text-neutral-500">{example.duration}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-neutral-400">{example.description}</p>
      </div>
    </div>
  );
}

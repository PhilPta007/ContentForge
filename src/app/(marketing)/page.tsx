import Link from 'next/link';
import type { Metadata } from 'next';
import { Headphones, Video, FileText, Image, ArrowRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const metadata: Metadata = {
  title: 'ContentForge — AI Content Creation for Creators',
  description:
    'Create podcast episodes, YouTube videos, SEO descriptions, and thumbnails with AI. Choose your quality tier, pay per credit, no subscription.',
};

const FEATURES = [
  {
    icon: Headphones,
    title: 'MP3 Podcasts',
    description:
      'Generate full podcast episodes with natural-sounding voices. Choose from Standard, Premium, or Ultra voice quality.',
  },
  {
    icon: Video,
    title: 'YouTube Videos',
    description:
      'Create videos with AI-generated visuals and motion. Static Ken Burns, AI motion, or premium cinematic clips.',
  },
  {
    icon: FileText,
    title: 'SEO Descriptions',
    description:
      'Write optimized video and podcast descriptions with your brand voice and affiliate links baked in.',
  },
  {
    icon: Image,
    title: 'Thumbnails',
    description:
      'Generate eye-catching thumbnails tailored to your content. Three options per request so you can pick the best.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Choose your content type',
    description: 'Podcast, video, description, or thumbnail. Pick what you need.',
  },
  {
    step: '02',
    title: 'Pick quality tiers',
    description:
      'Standard, Premium, or Ultra for voice, images, and motion. You control the cost.',
  },
  {
    step: '03',
    title: 'Generate and download',
    description: 'Hit generate, watch the progress, and download your finished content.',
  },
];

const TIERS = [
  {
    name: 'Standard',
    voice: 'Kokoro',
    image: 'Nano Banana',
    motion: 'Ken Burns',
    cost: 'Lowest',
  },
  {
    name: 'Premium',
    voice: 'Google WaveNet',
    image: 'Imagen',
    motion: 'VEO3',
    cost: 'Mid',
  },
  {
    name: 'Ultra',
    voice: 'ElevenLabs',
    image: 'Imagen Ultra',
    motion: 'Kling',
    cost: 'Highest',
  },
];

const CREDIT_PACKS = [
  { name: 'Starter', credits: 50, price: '$4.49', perCredit: '$0.090', savings: '—' },
  { name: 'Creator', credits: 150, price: '$11.99', perCredit: '$0.080', savings: '11%' },
  { name: 'Pro', credits: 500, price: '$35.99', perCredit: '$0.072', savings: '20%' },
  { name: 'Studio', credits: 1500, price: '$89.99', perCredit: '$0.060', savings: '33%' },
  { name: 'Agency', credits: 5000, price: '$239.99', perCredit: '$0.048', savings: '47%' },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      {/* Hero */}
      <section className="py-24 sm:py-32">
        <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
          Create Podcast &amp;{' '}
          <br className="hidden sm:block" />
          Video Content with AI
        </h1>
        <p className="mt-6 max-w-xl text-lg text-neutral-400">
          You pick the quality. You pick the style. Standard, Premium, or Ultra
          voices, images, and motion — pay per credit, no subscription.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Start Creating
            <ArrowRight className="ml-2 size-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#1e1e1e] px-6 text-sm font-medium text-neutral-300 transition-colors hover:bg-[#111111] hover:text-white"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[#1e1e1e] py-20">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          What you can create
        </h2>
        <div className="mt-8 grid gap-px rounded-lg border border-[#1e1e1e] bg-[#1e1e1e] sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-3 bg-[#0a0a0a] p-6 first:rounded-tl-lg last:rounded-br-lg sm:[&:nth-child(2)]:rounded-tr-lg sm:[&:nth-child(3)]:rounded-bl-lg"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-600/10">
                <feature.icon className="size-5 text-indigo-400" />
              </div>
              <h3 className="text-base font-medium text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-[#1e1e1e] py-20">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          How it works
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.step} className="space-y-3">
              <span className="text-xs font-mono text-indigo-400">{step.step}</span>
              <h3 className="text-base font-medium text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tier Showcase */}
      <section className="border-t border-[#1e1e1e] py-20">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Quality tiers
        </h2>
        <p className="mt-3 text-base text-neutral-400">
          Mix and match tiers across voice, images, and motion to fit your budget.
        </p>
        <div className="mt-8 overflow-hidden rounded-lg border border-[#1e1e1e]">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1e1e1e] hover:bg-transparent">
                <TableHead className="text-neutral-500">Tier</TableHead>
                <TableHead className="text-neutral-500">Voice</TableHead>
                <TableHead className="text-neutral-500">Images</TableHead>
                <TableHead className="text-neutral-500">Motion</TableHead>
                <TableHead className="text-right text-neutral-500">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TIERS.map((tier) => (
                <TableRow key={tier.name} className="border-[#1e1e1e] hover:bg-[#111111]">
                  <TableCell className="font-medium text-white">{tier.name}</TableCell>
                  <TableCell className="text-neutral-400">{tier.voice}</TableCell>
                  <TableCell className="text-neutral-400">{tier.image}</TableCell>
                  <TableCell className="text-neutral-400">{tier.motion}</TableCell>
                  <TableCell className="text-right text-neutral-400">{tier.cost}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Credit Packs */}
      <section className="border-t border-[#1e1e1e] py-20">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Credit packs
        </h2>
        <p className="mt-3 text-base text-neutral-400">
          Buy once, use anytime. Credits never expire.
        </p>
        <div className="mt-8 overflow-hidden rounded-lg border border-[#1e1e1e]">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1e1e1e] hover:bg-transparent">
                <TableHead className="text-neutral-500">Pack</TableHead>
                <TableHead className="text-right text-neutral-500">Credits</TableHead>
                <TableHead className="text-right text-neutral-500">Price</TableHead>
                <TableHead className="text-right text-neutral-500">Per Credit</TableHead>
                <TableHead className="text-right text-neutral-500">Savings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CREDIT_PACKS.map((pack) => (
                <TableRow key={pack.name} className="border-[#1e1e1e] hover:bg-[#111111]">
                  <TableCell className="font-medium text-white">{pack.name}</TableCell>
                  <TableCell className="text-right text-neutral-300">{pack.credits}</TableCell>
                  <TableCell className="text-right text-neutral-300">{pack.price}</TableCell>
                  <TableCell className="text-right text-neutral-400">{pack.perCredit}</TableCell>
                  <TableCell className="text-right">
                    {pack.savings === '—' ? (
                      <span className="text-neutral-500">—</span>
                    ) : (
                      <span className="text-indigo-400">{pack.savings}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/pricing"
            className="text-sm text-neutral-400 transition-colors hover:text-white"
          >
            View detailed pricing &rarr;
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#1e1e1e] py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Start Creating Today
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base text-neutral-400">
          Sign up, buy a credit pack, and generate your first podcast or video in
          minutes.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Create your account
          <ArrowRight className="ml-2 size-4" />
        </Link>
      </section>
    </div>
  );
}

'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BrandVoiceWizard } from '@/components/settings/brand-voice-wizard';

export function BrandVoicePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/app/settings"
          className="flex size-8 items-center justify-center rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Brand Voice</h1>
          <p className="text-xs text-neutral-400">
            Configure your brand voice for AI-generated content.
          </p>
        </div>
      </div>

      <BrandVoiceWizard />
    </div>
  );
}

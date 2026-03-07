'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AffiliateLinkManager } from '@/components/settings/affiliate-link-manager';

export default function AffiliateLinkPage() {
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
          <h1 className="text-xl font-bold text-white">Affiliate Links</h1>
          <p className="text-xs text-neutral-400">
            Manage affiliate links for SEO descriptions.
          </p>
        </div>
      </div>

      <AffiliateLinkManager />
    </div>
  );
}

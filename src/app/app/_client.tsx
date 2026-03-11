'use client';

import Link from 'next/link';
import { Sparkles, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/stores/user-store';
import { CreditBalance } from '@/components/credits/credit-balance';

export function DashboardPage() {
  const { profile } = useUserStore();

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-neutral-400">
          What would you like to create today?
        </p>
      </div>

      <Card className="bg-[#111111] border-[#1e1e1e]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-400">Credit Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <CreditBalance />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-[#111111] border-[#1e1e1e] hover:border-indigo-600/50 transition-colors">
          <CardContent className="flex flex-col items-center gap-3 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10">
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-white">Create Content</p>
              <p className="mt-1 text-xs text-neutral-400">Generate podcasts, videos, and more</p>
            </div>
            <Link
              href="/app/create"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Get Started
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-[#1e1e1e] hover:border-amber-600/50 transition-colors">
          <CardContent className="flex flex-col items-center gap-3 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600/10">
              <Coins className="h-5 w-5 text-amber-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-white">Buy Credits</p>
              <p className="mt-1 text-xs text-neutral-400">Top up your credit balance</p>
            </div>
            <Link
              href="/app/credits"
              className="inline-flex items-center justify-center rounded-lg border border-[#1e1e1e] px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              View Packs
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

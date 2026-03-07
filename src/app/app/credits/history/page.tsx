'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { TransactionTable } from '@/components/credits/transaction-table';

export default function CreditHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <nav className="flex items-center gap-1 text-sm text-neutral-500 mb-2">
          <Link
            href="/app/credits"
            className="hover:text-white transition-colors"
          >
            Credits
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-neutral-300">History</span>
        </nav>
        <h1 className="text-xl font-semibold text-white">Transaction History</h1>
        <p className="text-sm text-neutral-400">
          Full record of all credit transactions on your account.
        </p>
      </div>

      <TransactionTable />
    </div>
  );
}

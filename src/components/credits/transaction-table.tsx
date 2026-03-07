'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import type { CreditTransaction, TransactionType } from '@/lib/types';

const TYPE_STYLES: Record<TransactionType, { label: string; className: string }> = {
  purchase: { label: 'Purchase', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  generation: { label: 'Generation', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  refund: { label: 'Refund', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  bonus: { label: 'Bonus', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

const PAGE_SIZE = 20;

export function TransactionTable() {
  const { user } = useUserStore();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = useCallback(async (offset = 0) => {
    if (!user) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) return;

    const rows = (data ?? []) as CreditTransaction[];
    if (offset === 0) {
      setTransactions(rows);
    } else {
      setTransactions((prev) => [...prev, ...rows]);
    }
    setHasMore(rows.length === PAGE_SIZE);
  }, [user]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      await fetchTransactions(0);
      setIsLoading(false);
    }
    load();
  }, [fetchTransactions]);

  async function loadMore() {
    setIsLoadingMore(true);
    await fetchTransactions(transactions.length);
    setIsLoadingMore(false);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full bg-neutral-800" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-neutral-500">
        No transactions yet. Purchase credits to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="border-neutral-800 hover:bg-transparent">
            <TableHead className="text-neutral-400">Date</TableHead>
            <TableHead className="text-neutral-400">Type</TableHead>
            <TableHead className="text-neutral-400">Description</TableHead>
            <TableHead className="text-right text-neutral-400">Amount</TableHead>
            <TableHead className="text-right text-neutral-400">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const style = TYPE_STYLES[tx.type];
            const isPositive = tx.amount > 0;

            return (
              <TableRow key={tx.id} className="border-neutral-800">
                <TableCell className="text-neutral-300">
                  {formatDate(tx.created_at)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={style.className}
                  >
                    {style.label}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[300px] truncate text-neutral-300">
                  {tx.description ?? '-'}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? '+' : ''}{tx.amount}
                </TableCell>
                <TableCell className="text-right text-neutral-300">
                  {tx.balance_after}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="border-neutral-800 text-neutral-400 hover:text-white"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PackGrid } from '@/components/credits/pack-grid';
import { PurchaseModal } from '@/components/credits/purchase-modal';
import { TransactionTable } from '@/components/credits/transaction-table';
import { useCreditStore } from '@/stores/credit-store';
import { toast } from 'sonner';
import { Coins } from 'lucide-react';
import type { CreditPack } from '@/lib/types';

export default function CreditsPage() {
  const searchParams = useSearchParams();
  const { balance } = useCreditStore();
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Payment successful! Credits have been added to your account.');
    }
    if (searchParams.get('cancelled') === 'true') {
      toast.info('Payment was cancelled.');
    }
  }, [searchParams]);

  function handleBuy(pack: CreditPack) {
    setSelectedPack(pack);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Credits</h1>
          <p className="text-sm text-neutral-400">
            Purchase credits to generate content.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2">
          <Coins className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-neutral-400">Balance:</span>
          <span className="font-semibold text-white">
            {balance.toLocaleString()}
          </span>
        </div>
      </div>

      <Tabs defaultValue="buy">
        <TabsList>
          <TabsTrigger value="buy">Buy Credits</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="pt-4">
          <PackGrid onBuy={handleBuy} />
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <TransactionTable />
        </TabsContent>
      </Tabs>

      <PurchaseModal
        pack={selectedPack}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}

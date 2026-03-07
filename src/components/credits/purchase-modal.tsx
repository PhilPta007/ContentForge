'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, CreditCard, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { CreditPack } from '@/lib/types';

interface PurchaseModalProps {
  pack: CreditPack | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PaymentMethod = 'payfast' | 'stripe';

export function PurchaseModal({ pack, open, onOpenChange }: PurchaseModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('payfast');
  const [isLoading, setIsLoading] = useState(false);

  if (!pack) return null;

  async function handlePurchase() {
    if (!pack) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Purchase failed');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Purchase failed. Please try again.';
      toast.error(message);
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy {pack.name} Credits</DialogTitle>
          <DialogDescription>
            You are purchasing {pack.credits.toLocaleString()} credits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-white">{pack.name} Pack</p>
                <p className="text-sm text-neutral-400">
                  {pack.credits.toLocaleString()} credits
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-white">
                {formatCurrency(
                  paymentMethod === 'payfast' ? pack.price_zar : pack.price_usd,
                  paymentMethod === 'payfast' ? 'ZAR' : 'USD'
                )}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-300">Payment method</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('payfast')}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  paymentMethod === 'payfast'
                    ? 'border-indigo-600 bg-indigo-600/10 text-white'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">PayFast</p>
                  <p className="text-xs text-neutral-500">ZAR &middot; EFT &middot; Cards</p>
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod('stripe')}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  paymentMethod === 'stripe'
                    ? 'border-indigo-600 bg-indigo-600/10 text-white'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">Stripe</p>
                  <p className="text-xs text-neutral-500">USD &middot; Cards &middot; Apple Pay</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                Pay{' '}
                {formatCurrency(
                  paymentMethod === 'payfast' ? pack.price_zar : pack.price_usd,
                  paymentMethod === 'payfast' ? 'ZAR' : 'USD'
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

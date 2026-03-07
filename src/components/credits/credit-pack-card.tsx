'use client';

import { Coins, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { CreditPack } from '@/lib/types';

interface CreditPackCardProps {
  pack: CreditPack;
  currency: 'ZAR' | 'USD';
  recommended?: boolean;
  onBuy: (pack: CreditPack) => void;
}

export function CreditPackCard({ pack, currency, recommended, onBuy }: CreditPackCardProps) {
  const price = currency === 'ZAR' ? pack.price_zar : pack.price_usd;

  return (
    <Card
      className={
        recommended
          ? 'relative border-indigo-600 ring-1 ring-indigo-600'
          : 'relative'
      }
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-indigo-600 text-white">
            <Sparkles className="mr-1 h-3 w-3" />
            Recommended
          </Badge>
        </div>
      )}

      <CardHeader className="text-center">
        <CardTitle className="text-lg">{pack.name}</CardTitle>
        {pack.discount_percent > 0 && (
          <Badge variant="secondary" className="mx-auto w-fit">
            {pack.discount_percent}% off
          </Badge>
        )}
      </CardHeader>

      <CardContent className="text-center space-y-3">
        <div className="flex items-center justify-center gap-1.5 text-amber-500">
          <Coins className="h-5 w-5" />
          <span className="text-2xl font-bold text-white">
            {pack.credits.toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-neutral-400">credits</p>

        <div className="pt-2">
          <span className="text-xl font-semibold text-white">
            {formatCurrency(price, currency)}
          </span>
        </div>

        <p className="text-xs text-neutral-500">
          {formatCurrency(Math.round(price / pack.credits), currency)} per credit
        </p>
      </CardContent>

      <CardFooter className="justify-center border-t-0 bg-transparent">
        <Button
          onClick={() => onBuy(pack)}
          className={
            recommended
              ? 'w-full bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'w-full'
          }
          variant={recommended ? 'default' : 'outline'}
        >
          Buy {pack.name}
        </Button>
      </CardFooter>
    </Card>
  );
}

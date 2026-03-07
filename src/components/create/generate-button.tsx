'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateCredits } from '@/lib/credits';
import { useCreditStore } from '@/stores/credit-store';
import type { GenerationConfig } from '@/lib/types';

interface GenerateButtonProps {
  config: GenerationConfig;
  isValid: boolean;
  onGenerate: () => Promise<void>;
}

export function GenerateButton({
  config,
  isValid,
  onGenerate,
}: GenerateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { balance } = useCreditStore();
  const totalCredits = calculateCredits(config);
  const hasEnough = balance >= totalCredits;
  const disabled = !isValid || !hasEnough || isLoading;

  async function handleClick() {
    if (disabled) return;
    setIsLoading(true);
    try {
      await onGenerate();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      size="lg"
      className="w-full h-11"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : !hasEnough ? (
        'Insufficient credits'
      ) : (
        `Generate (${totalCredits} credits)`
      )}
    </Button>
  );
}

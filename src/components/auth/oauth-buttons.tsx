'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type Provider = 'google' | 'github';

export function OAuthButtons() {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);

  async function handleOAuth(provider: Provider) {
    setLoadingProvider(provider);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        setLoadingProvider(null);
      }
    } catch {
      toast.error('An unexpected error occurred');
      setLoadingProvider(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative flex items-center">
        <Separator className="flex-1 bg-neutral-800" />
        <span className="px-3 text-xs text-neutral-500">or</span>
        <Separator className="flex-1 bg-neutral-800" />
      </div>

      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={loadingProvider !== null}
          onClick={() => handleOAuth('google')}
          className="w-full border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white"
        >
          {loadingProvider === 'google' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Continue with Google'
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={loadingProvider !== null}
          onClick={() => handleOAuth('github')}
          className="w-full border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white"
        >
          {loadingProvider === 'github' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Continue with GitHub'
          )}
        </Button>
      </div>
    </div>
  );
}

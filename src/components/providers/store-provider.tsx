'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';
import { useCreditStore } from '@/stores/credit-store';
import type { Profile } from '@/lib/types';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading, clear } = useUserStore();
  const { setBalance } = useCreditStore();

  useEffect(() => {
    const supabase = createClient();

    const fetchProfile = (userId: string) => {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single<Profile>()
        .then(({ data }) => {
          if (data) {
            setProfile(data);
            useCreditStore.getState().setBalance(data.credits);
          }
        });
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        fetchProfile(user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile, setLoading, clear, setBalance]);

  return <>{children}</>;
}

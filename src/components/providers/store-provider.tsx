'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';
import { useCreditStore } from '@/stores/credit-store';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading, clear } = useUserStore();
  const { fetchBalance } = useCreditStore();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        fetchBalance(user.id);
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data);
          });
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchBalance(session.user.id);
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data);
          });
      } else {
        clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile, setLoading, clear, fetchBalance]);

  return <>{children}</>;
}

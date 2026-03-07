import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

interface CreditState {
  balance: number;
  isLoading: boolean;
  setBalance: (balance: number) => void;
  deductCredits: (amount: number) => void;
  addCredits: (amount: number) => void;
  fetchBalance: (userId: string) => Promise<void>;
}

export const useCreditStore = create<CreditState>((set) => ({
  balance: 0,
  isLoading: true,
  setBalance: (balance) => set({ balance }),
  deductCredits: (amount) =>
    set((state) => ({ balance: state.balance - amount })),
  addCredits: (amount) =>
    set((state) => ({ balance: state.balance + amount })),
  fetchBalance: async (userId: string) => {
    set({ isLoading: true });
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single<{ credits: number }>();
    set({ balance: data?.credits ?? 0, isLoading: false });
  },
}));

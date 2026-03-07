import { createAdminClient } from './supabase/admin';
import type { CreditTransaction } from './types';

export async function addCredits(
  userId: string,
  amount: number,
  type: CreditTransaction['type'],
  description: string,
  referenceId?: string
): Promise<{ balance: number }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description,
    p_reference_id: referenceId ?? null,
  });

  if (error) {
    throw new Error(`Failed to add credits: ${error.message}`);
  }

  return { balance: data as number };
}

export async function deductCredits(
  userId: string,
  amount: number,
  type: CreditTransaction['type'],
  description: string,
  referenceId?: string
): Promise<{ balance: number }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description,
    p_reference_id: referenceId ?? null,
  });

  if (error) {
    if (error.message.includes('Insufficient credits')) {
      throw new Error('Insufficient credits');
    }
    throw new Error(`Failed to deduct credits: ${error.message}`);
  }

  return { balance: data as number };
}

export async function transactionExists(referenceId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('transaction_exists', {
    p_reference_id: referenceId,
  });

  if (error) {
    throw new Error(`Failed to check transaction: ${error.message}`);
  }

  return data as boolean;
}

export async function getBalance(userId: string): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single<{ credits: number }>();

  if (error || !data) {
    throw new Error(`Failed to fetch balance: ${error?.message}`);
  }

  return data.credits;
}

export async function getTransactions(
  userId: string,
  limit = 20,
  offset = 0
): Promise<CreditTransaction[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return (data ?? []) as CreditTransaction[];
}

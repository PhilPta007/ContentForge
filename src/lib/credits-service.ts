import { createClient } from '@supabase/supabase-js';
import type { CreditTransaction } from './types';

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function addCredits(
  userId: string,
  amount: number,
  type: CreditTransaction['type'],
  description: string,
  referenceId?: string
): Promise<{ balance: number }> {
  const supabase = createServiceClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single<{ credits: number }>();

  if (profileError || !profile) {
    throw new Error(`Failed to fetch user profile: ${profileError?.message}`);
  }

  const newBalance = profile.credits + amount;

  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount,
      type,
      description,
      reference_id: referenceId ?? null,
      balance_after: newBalance,
    });

  if (txError) {
    throw new Error(`Failed to insert credit transaction: ${txError.message}`);
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits: newBalance })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to update profile credits: ${updateError.message}`);
  }

  return { balance: newBalance };
}

export async function deductCredits(
  userId: string,
  amount: number,
  type: CreditTransaction['type'],
  description: string,
  referenceId?: string
): Promise<{ balance: number }> {
  const supabase = createServiceClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single<{ credits: number }>();

  if (profileError || !profile) {
    throw new Error(`Failed to fetch user profile: ${profileError?.message}`);
  }

  if (profile.credits < amount) {
    throw new Error('Insufficient credits');
  }

  const newBalance = profile.credits - amount;

  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: -amount,
      type,
      description,
      reference_id: referenceId ?? null,
      balance_after: newBalance,
    });

  if (txError) {
    throw new Error(`Failed to insert credit transaction: ${txError.message}`);
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits: newBalance })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Failed to update profile credits: ${updateError.message}`);
  }

  return { balance: newBalance };
}

export async function getBalance(userId: string): Promise<number> {
  const supabase = createServiceClient();

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
  const supabase = createServiceClient();

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

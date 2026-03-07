import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCredits(credits: number): string {
  return credits === 1 ? '1 credit' : `${credits} credits`;
}

export function formatCurrency(cents: number, currency: 'ZAR' | 'USD' = 'ZAR'): string {
  const amount = cents / 100;
  if (currency === 'ZAR') return `R${amount.toFixed(2)}`;
  return `$${amount.toFixed(2)}`;
}

import { describe, it, expect } from 'vitest';
import { formatCredits, formatCurrency } from '@/lib/utils';

describe('formatCredits', () => {
  it('returns singular for 1 credit', () => {
    expect(formatCredits(1)).toBe('1 credit');
  });

  it('returns plural for multiple credits', () => {
    expect(formatCredits(5)).toBe('5 credits');
  });

  it('returns plural for 0 credits', () => {
    expect(formatCredits(0)).toBe('0 credits');
  });
});

describe('formatCurrency', () => {
  it('formats ZAR by default', () => {
    expect(formatCurrency(1500)).toBe('R15.00');
  });

  it('formats USD when specified', () => {
    expect(formatCurrency(999, 'USD')).toBe('$9.99');
  });
});

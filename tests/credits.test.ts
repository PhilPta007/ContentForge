import { describe, it, expect } from 'vitest';
import { calculateCredits, FIXED_CREDITS } from '@/lib/credits';

describe('calculateCredits', () => {
  it('returns fixed cost for description', () => {
    expect(calculateCredits({ type: 'description' })).toBe(FIXED_CREDITS.description);
  });

  it('returns fixed cost for thumbnail', () => {
    expect(calculateCredits({ type: 'thumbnail' })).toBe(FIXED_CREDITS.thumbnail);
  });

  it('returns fixed cost for social', () => {
    expect(calculateCredits({ type: 'social' })).toBe(FIXED_CREDITS.social);
  });

  it('calculates mp3 cost based on voice tier and duration', () => {
    expect(calculateCredits({ type: 'mp3', voiceTier: 'standard', duration: 10 })).toBe(5);
    expect(calculateCredits({ type: 'mp3', voiceTier: 'premium', duration: 10 })).toBe(10);
    expect(calculateCredits({ type: 'mp3', voiceTier: 'ultra', duration: 10 })).toBe(40);
  });

  it('returns 0 for mp3 without voice tier', () => {
    expect(calculateCredits({ type: 'mp3', duration: 10 })).toBe(0);
  });

  it('calculates video cost with all tiers', () => {
    const result = calculateCredits({
      type: 'video',
      voiceTier: 'standard',
      imageTier: 'standard',
      motionTier: 'static',
      duration: 10,
      sceneCount: 5,
    });
    // voice: 0.5 * 10 = 5, images: 0.5 * 5 = 2.5, motion: 0 * 5 = 0 → ceil(7.5) = 8
    expect(result).toBe(8);
  });

  it('returns 0 for unknown type', () => {
    // @ts-expect-error testing unknown type
    expect(calculateCredits({ type: 'unknown' })).toBe(0);
  });
});

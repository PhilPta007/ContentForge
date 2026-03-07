import type { GenerationConfig, VoiceTier, ImageTier, MotionTier } from './types';

export const VOICE_CREDITS: Record<VoiceTier, number> = {
  standard: 0.5,
  premium: 1,
  ultra: 4,
} as const;

export const IMAGE_CREDITS: Record<ImageTier, number> = {
  standard: 0.5,
  premium: 1.2,
  ultra: 2,
} as const;

export const MOTION_CREDITS: Record<MotionTier, number> = {
  static: 0,
  ai: 8,
  premium: 15,
} as const;

export const FIXED_CREDITS = {
  description: 5,
  thumbnail: 8,
} as const;

export function calculateCredits(config: GenerationConfig): number {
  const { type, duration = 0, voiceTier, imageTier, motionTier, sceneCount = 0 } = config;

  switch (type) {
    case 'description':
      return FIXED_CREDITS.description;

    case 'thumbnail':
      return FIXED_CREDITS.thumbnail;

    case 'mp3': {
      if (!voiceTier) return 0;
      return Math.ceil(VOICE_CREDITS[voiceTier] * duration);
    }

    case 'video': {
      let total = 0;

      if (voiceTier) {
        total += VOICE_CREDITS[voiceTier] * duration;
      }

      if (imageTier && sceneCount > 0) {
        total += IMAGE_CREDITS[imageTier] * sceneCount;
      }

      if (motionTier && sceneCount > 0) {
        total += MOTION_CREDITS[motionTier] * sceneCount;
      }

      return Math.ceil(total);
    }

    default:
      return 0;
  }
}

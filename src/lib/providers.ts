import type { VoiceTier, ImageTier, MotionTier } from './types';

interface ProviderConfig {
  provider: string;
  model: string;
  endpoint: string;
  voice?: string;
}

export const VOICE_PROVIDERS: Record<VoiceTier, ProviderConfig> = {
  standard: {
    provider: 'Kokoro',
    model: 'kokoro-v1',
    endpoint: '/api/tts/kokoro',
    voice: 'af_heart',
  },
  premium: {
    provider: 'ElevenLabs',
    model: 'eleven_multilingual_v2',
    endpoint: '/api/tts/elevenlabs',
    voice: 'rachel',
  },
  ultra: {
    provider: 'ElevenLabs',
    model: 'eleven_turbo_v2_5',
    endpoint: '/api/tts/elevenlabs',
    voice: 'adam',
  },
} as const;

export const IMAGE_PROVIDERS: Record<ImageTier, ProviderConfig> = {
  standard: {
    provider: 'Fal AI',
    model: 'fal-ai/flux/schnell',
    endpoint: '/api/images/fal',
  },
  premium: {
    provider: 'Fal AI',
    model: 'fal-ai/flux/dev',
    endpoint: '/api/images/fal',
  },
  ultra: {
    provider: 'Fal AI',
    model: 'fal-ai/flux-pro/v1.1-ultra',
    endpoint: '/api/images/fal',
  },
} as const;

export const MOTION_PROVIDERS: Record<MotionTier, ProviderConfig | null> = {
  static: null,
  ai: {
    provider: 'Kie.ai',
    model: 'veo3_fast',
    endpoint: 'https://api.kie.ai/api/v1/veo/generate',
  },
  premium: {
    provider: 'Kie.ai',
    model: 'veo3_fast',
    endpoint: 'https://api.kie.ai/api/v1/veo/generate',
  },
} as const;

export const PROVIDERS = {
  voice: VOICE_PROVIDERS,
  image: IMAGE_PROVIDERS,
  motion: MOTION_PROVIDERS,
} as const;

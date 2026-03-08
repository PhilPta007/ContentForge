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
    endpoint: 'http://31.97.118.216:5099/tts',
    voice: 'af_heart',
  },
  premium: {
    provider: 'Google',
    model: 'en-US-WaveNet-D',
    endpoint: 'https://texttospeech.googleapis.com/v1/text:synthesize',
    voice: 'en-US-WaveNet-D',
  },
  ultra: {
    provider: 'ElevenLabs',
    model: 'eleven_multilingual_v2',
    endpoint: 'https://api.elevenlabs.io/v1/text-to-speech',
    voice: 'adam',
  },
} as const;

export const IMAGE_PROVIDERS: Record<ImageTier, ProviderConfig> = {
  standard: {
    provider: 'Kie.ai',
    model: 'nano-banana',
    endpoint: 'https://api.kie.ai/api/v1/generate',
  },
  premium: {
    provider: 'Google',
    model: 'imagen-4.0-generate-001',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict',
  },
  ultra: {
    provider: 'Google',
    model: 'imagen-4.0-ultra-generate-001',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-001:predict',
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

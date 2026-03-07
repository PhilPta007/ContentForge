import type { ContentTone } from './types';

interface ToneConfig {
  id: ContentTone;
  name: string;
  description: string;
  promptModifiers: {
    pace: string;
    tone: string;
    pauses: string;
    energy: string;
  };
  voiceRecommendation: string;
  ttsSpeed: number;
}

export const CONTENT_TONES: Record<ContentTone, ToneConfig> = {
  sleep: {
    id: 'sleep',
    name: 'Sleep',
    description: 'Calm, soothing narration designed to help listeners drift off to sleep',
    promptModifiers: {
      pace: 'very slow and measured',
      tone: 'whisper-soft, calming, monotone',
      pauses: 'long pauses between sentences',
      energy: 'minimal, hypnotic',
    },
    voiceRecommendation: 'deep, warm female or male voice',
    ttsSpeed: 0.8,
  },
  asmr: {
    id: 'asmr',
    name: 'ASMR',
    description: 'Intimate, close-mic whisper style with gentle triggers',
    promptModifiers: {
      pace: 'slow and deliberate',
      tone: 'intimate whisper, breathy',
      pauses: 'frequent micro-pauses',
      energy: 'very low, intimate',
    },
    voiceRecommendation: 'soft, breathy voice',
    ttsSpeed: 0.75,
  },
  bedtime_story: {
    id: 'bedtime_story',
    name: 'Bedtime Story',
    description: 'Warm, nurturing storytelling perfect for winding down',
    promptModifiers: {
      pace: 'gentle and unhurried',
      tone: 'warm, nurturing, slightly playful',
      pauses: 'natural story pauses',
      energy: 'low to moderate, cozy',
    },
    voiceRecommendation: 'warm, friendly voice',
    ttsSpeed: 0.85,
  },
  storytelling: {
    id: 'storytelling',
    name: 'Storytelling',
    description: 'Engaging narrative style with dramatic pacing and expression',
    promptModifiers: {
      pace: 'varied, matching story beats',
      tone: 'expressive, dramatic, engaging',
      pauses: 'dramatic pauses for effect',
      energy: 'moderate to high, dynamic',
    },
    voiceRecommendation: 'expressive, versatile voice',
    ttsSpeed: 1.0,
  },
  documentary: {
    id: 'documentary',
    name: 'Documentary',
    description: 'Authoritative, informative narration like nature documentaries',
    promptModifiers: {
      pace: 'steady, measured',
      tone: 'authoritative, informative, serious',
      pauses: 'purposeful pauses for emphasis',
      energy: 'moderate, controlled',
    },
    voiceRecommendation: 'deep, authoritative voice',
    ttsSpeed: 0.95,
  },
  educational: {
    id: 'educational',
    name: 'Educational',
    description: 'Clear, instructional tone optimised for learning and retention',
    promptModifiers: {
      pace: 'moderate, clear enunciation',
      tone: 'clear, instructional, encouraging',
      pauses: 'pauses after key concepts',
      energy: 'moderate, focused',
    },
    voiceRecommendation: 'clear, articulate voice',
    ttsSpeed: 0.95,
  },
  podcast: {
    id: 'podcast',
    name: 'Podcast',
    description: 'Conversational, natural delivery like a casual podcast host',
    promptModifiers: {
      pace: 'natural conversational',
      tone: 'casual, friendly, conversational',
      pauses: 'natural speech pauses',
      energy: 'moderate, approachable',
    },
    voiceRecommendation: 'natural, conversational voice',
    ttsSpeed: 1.0,
  },
  youtube_hype: {
    id: 'youtube_hype',
    name: 'YouTube Hype',
    description: 'High-energy, enthusiastic delivery for engaging YouTube content',
    promptModifiers: {
      pace: 'fast, punchy',
      tone: 'enthusiastic, excited, bold',
      pauses: 'short, snappy pauses',
      energy: 'high, infectious',
    },
    voiceRecommendation: 'energetic, charismatic voice',
    ttsSpeed: 1.1,
  },
};

export function getTonePrompt(tone: ContentTone): string {
  const config = CONTENT_TONES[tone];
  const { pace, tone: toneStyle, pauses, energy } = config.promptModifiers;

  return [
    `Pace: ${pace}.`,
    `Tone: ${toneStyle}.`,
    `Pauses: ${pauses}.`,
    `Energy: ${energy}.`,
    `Voice recommendation: ${config.voiceRecommendation}.`,
    `TTS speed: ${config.ttsSpeed}x.`,
  ].join(' ');
}

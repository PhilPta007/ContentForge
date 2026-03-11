export interface GenerationPayload {
  generationId: string;
  userId: string;
  type: 'mp3' | 'video' | 'description' | 'thumbnail';

  topic: string;
  duration?: number;
  tone?: 'sleep' | 'asmr' | 'bedtime_story' | 'storytelling' | 'documentary' | 'educational' | 'podcast' | 'youtube_hype';

  voiceTier?: 'standard' | 'premium' | 'ultra';
  imageTier?: 'standard' | 'premium' | 'ultra';
  motionTier?: 'static' | 'ai' | 'premium';
  sceneCount?: number;

  youtubeUrl?: string;
  style?: string;
  brandVoice?: Record<string, unknown>;
  affiliateLinks?: { label: string; url: string }[];
  customScript?: string;

  callbackUrl: string;
}

export async function triggerGeneration(payload: GenerationPayload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET!,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'no response body');
      throw new Error(
        `Failed to trigger generation: ${response.status} ${response.statusText} - ${text}`
      );
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

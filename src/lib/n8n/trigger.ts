export interface GenerationPayload {
  generationId: string;
  userId: string;
  type: 'mp3' | 'video' | 'description' | 'thumbnail' | 'social';

  topic: string;

  // Social-specific fields
  inputType?: 'url' | 'text';
  sourceUrl?: string;
  sourceText?: string;
  platforms?: string[];
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
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('N8N_WEBHOOK_URL environment variable is not configured');
  }

  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('N8N_WEBHOOK_SECRET environment variable is not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhookSecret,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'no response body');
      throw new Error(
        `n8n trigger failed: ${response.status} ${response.statusText} - ${text}`
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('n8n webhook timed out after 15s');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

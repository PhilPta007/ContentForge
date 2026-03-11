import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCredits } from '@/lib/credits';
import { deductCredits, addCredits } from '@/lib/credits-service';
import { triggerGeneration } from '@/lib/n8n/trigger';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import type { GenerationConfig } from '@/lib/types';

const bodySchema = z.object({
  topic: z.string().min(1).max(500),
  duration: z.number().int().min(5).max(30),
  tone: z.enum([
    'sleep', 'asmr', 'bedtime_story', 'storytelling',
    'documentary', 'educational', 'podcast', 'youtube_hype',
  ]),
  voiceTier: z.enum(['standard', 'premium', 'ultra']),
  imageTier: z.enum(['standard', 'premium', 'ultra']),
  motionTier: z.enum(['static', 'ai', 'premium']),
  sceneCount: z.number().int().min(1).max(100),
  customScript: z.string().min(50).max(50000).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success: withinLimit } = rateLimit(getClientIp(request), 10, 60_000);
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { topic, duration, tone, voiceTier, imageTier, motionTier, sceneCount, customScript } = parsed.data;

    const config: GenerationConfig = {
      type: 'video',
      duration,
      tone,
      voiceTier,
      imageTier,
      motionTier,
      sceneCount,
    };
    const creditsNeeded = calculateCredits(config);

    const admin = createAdminClient();

    const { data: generation, error: genError } = await admin
      .from('generations')
      .insert({
        user_id: user.id,
        type: 'video',
        status: 'pending',
        credits_used: creditsNeeded,
        input_topic: topic,
        input_duration: duration,
        tone,
        voice_tier: voiceTier,
        image_tier: imageTier,
        motion_tier: motionTier,
        scene_count: sceneCount,
      })
      .select('id')
      .single();

    if (genError || !generation) {
      return NextResponse.json({ error: 'Failed to create generation' }, { status: 500 });
    }

    try {
      await deductCredits(
        user.id,
        creditsNeeded,
        'generation',
        `Video: ${topic}`,
        generation.id
      );
    } catch (error) {
      await admin.from('generations').delete().eq('id', generation.id);
      const message = error instanceof Error ? error.message : 'Failed to deduct credits';
      const status = message.includes('Insufficient') ? 402 : 500;
      return NextResponse.json({ error: message }, { status });
    }

    const callbackUrl = process.env.N8N_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n`;

    await triggerGeneration({
      generationId: generation.id,
      userId: user.id,
      type: 'video',
      topic,
      duration,
      tone,
      voiceTier,
      imageTier,
      motionTier,
      sceneCount,
      callbackUrl,
      ...(customScript && { customScript }),
    }).catch(async () => {
      await admin
        .from('generations')
        .update({ status: 'failed', error_message: 'Failed to trigger n8n workflow' })
        .eq('id', generation.id);
      await addCredits(user.id, creditsNeeded, 'refund', `Refund: Video generation failed`, generation.id);
    });

    return NextResponse.json({
      generationId: generation.id,
      creditsUsed: creditsNeeded,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const { topic, duration, tone, voiceTier, customScript } = parsed.data;

    const config: GenerationConfig = { type: 'mp3', duration, tone, voiceTier };
    const creditsNeeded = calculateCredits(config);

    const admin = createAdminClient();

    // Create generation record first
    const { data: generation, error: genError } = await admin
      .from('generations')
      .insert({
        user_id: user.id,
        type: 'mp3',
        status: 'pending',
        credits_used: creditsNeeded,
        input_topic: topic,
        input_duration: duration,
        tone,
        voice_tier: voiceTier,
      })
      .select('id')
      .single();

    if (genError || !generation) {
      return NextResponse.json({ error: 'Failed to create generation' }, { status: 500 });
    }

    // Atomic credit deduction (checks balance + deducts in one transaction)
    try {
      await deductCredits(
        user.id,
        creditsNeeded,
        'generation',
        `MP3: ${topic}`,
        generation.id
      );
    } catch (error) {
      // Rollback generation record
      await admin.from('generations').delete().eq('id', generation.id);
      const message = error instanceof Error ? error.message : 'Failed to deduct credits';
      const status = message.includes('Insufficient') ? 402 : 500;
      return NextResponse.json({ error: message }, { status });
    }

    const callbackUrl = process.env.N8N_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n`;

    try {
      await triggerGeneration({
        generationId: generation.id,
        userId: user.id,
        type: 'mp3',
        topic,
        duration,
        tone,
        voiceTier,
        callbackUrl,
        ...(customScript && { customScript }),
      });
    } catch (triggerError) {
      const errorMsg = triggerError instanceof Error ? triggerError.message : String(triggerError);
      console.error(`[generate/mp3] Trigger failed for ${generation.id}:`, errorMsg);
      await admin
        .from('generations')
        .update({ status: 'failed', error_message: `Trigger failed: ${errorMsg}` })
        .eq('id', generation.id);
      await addCredits(user.id, creditsNeeded, 'refund', `Refund: MP3 trigger failed`, generation.id);
      return NextResponse.json(
        { error: 'Failed to start MP3 generation', detail: errorMsg, generationId: generation.id },
        { status: 502 }
      );
    }

    return NextResponse.json({
      generationId: generation.id,
      creditsUsed: creditsNeeded,
    });
  } catch (error) {
    console.error('[generate/mp3] Unhandled error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

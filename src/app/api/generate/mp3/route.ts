import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCredits } from '@/lib/credits';
import { triggerGeneration } from '@/lib/n8n/trigger';
import type { GenerationConfig } from '@/lib/types';

const bodySchema = z.object({
  topic: z.string().min(1).max(500),
  duration: z.number().int().min(5).max(30),
  tone: z.enum([
    'sleep', 'asmr', 'bedtime_story', 'storytelling',
    'documentary', 'educational', 'podcast', 'youtube_hype',
  ]),
  voiceTier: z.enum(['standard', 'premium', 'ultra']),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { topic, duration, tone, voiceTier } = parsed.data;

    const config: GenerationConfig = { type: 'mp3', duration, tone, voiceTier };
    const creditsNeeded = calculateCredits(config);

    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.credits < creditsNeeded) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: creditsNeeded, available: profile.credits },
        { status: 402 }
      );
    }

    const newBalance = profile.credits - creditsNeeded;

    const { error: deductError } = await admin
      .from('profiles')
      .update({ credits: newBalance })
      .eq('id', user.id);

    if (deductError) {
      return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 });
    }

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
      await admin
        .from('profiles')
        .update({ credits: profile.credits })
        .eq('id', user.id);
      return NextResponse.json({ error: 'Failed to create generation' }, { status: 500 });
    }

    await admin.from('credit_transactions').insert({
      user_id: user.id,
      amount: -creditsNeeded,
      type: 'generation',
      description: `MP3: ${topic}`,
      reference_id: generation.id,
      balance_after: newBalance,
    });

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n`;

    await triggerGeneration({
      generationId: generation.id,
      userId: user.id,
      type: 'mp3',
      topic,
      duration,
      tone,
      voiceTier,
      callbackUrl,
    }).catch(async () => {
      await admin
        .from('generations')
        .update({ status: 'failed', error_message: 'Failed to trigger n8n workflow' })
        .eq('id', generation.id);
    });

    return NextResponse.json({
      generationId: generation.id,
      creditsUsed: creditsNeeded,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FIXED_CREDITS } from '@/lib/credits';
import { triggerGeneration } from '@/lib/n8n/trigger';

const bodySchema = z.object({
  topic: z.string().min(1).max(500),
  style: z.string().max(500).optional(),
  imageTier: z.enum(['standard', 'premium', 'ultra']),
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

    const { topic, style, imageTier } = parsed.data;
    const creditsNeeded = FIXED_CREDITS.thumbnail;

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
        type: 'thumbnail',
        status: 'pending',
        credits_used: creditsNeeded,
        input_topic: topic,
        input_style: style ?? null,
        image_tier: imageTier,
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
      description: `Thumbnail: ${topic}`,
      reference_id: generation.id,
      balance_after: newBalance,
    });

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n`;

    await triggerGeneration({
      generationId: generation.id,
      userId: user.id,
      type: 'thumbnail',
      topic,
      imageTier,
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

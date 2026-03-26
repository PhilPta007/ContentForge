import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FIXED_CREDITS } from '@/lib/credits';
import { deductCredits, addCredits } from '@/lib/credits-service';
import { triggerGeneration } from '@/lib/n8n/trigger';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const bodySchema = z
  .object({
    inputType: z.enum(['url', 'text']),
    url: z.string().url().optional(),
    text: z.string().min(100).max(50000).optional(),
    platforms: z
      .array(z.enum(['twitter', 'linkedin', 'instagram', 'facebook', 'threads']))
      .min(1)
      .max(5),
  })
  .refine(
    (data) => (data.inputType === 'url' ? !!data.url : !!data.text),
    { message: 'URL or text required based on input type' }
  );

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success: withinLimit } = rateLimit(getClientIp(request), 20, 60_000);
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

    const { inputType, url, text, platforms } = parsed.data;
    const creditsNeeded = FIXED_CREDITS.social;
    const topic =
      inputType === 'url'
        ? url!
        : text!.substring(0, 200) + (text!.length > 200 ? '...' : '');

    const admin = createAdminClient();

    const { data: generation, error: genError } = await admin
      .from('generations')
      .insert({
        user_id: user.id,
        type: 'social',
        status: 'pending',
        credits_used: creditsNeeded,
        input_topic: topic,
        use_brand_voice: false,
        output_metadata: { platforms, inputType },
      })
      .select('id')
      .single();

    if (genError || !generation) {
      return NextResponse.json(
        { error: 'Failed to create generation' },
        { status: 500 }
      );
    }

    try {
      await deductCredits(
        user.id,
        creditsNeeded,
        'generation',
        `Social posts: ${platforms.join(', ')}`,
        generation.id
      );
    } catch (error) {
      await admin.from('generations').delete().eq('id', generation.id);
      const message =
        error instanceof Error ? error.message : 'Failed to deduct credits';
      const status = message.includes('Insufficient') ? 402 : 500;
      return NextResponse.json({ error: message }, { status });
    }

    const callbackUrl =
      process.env.N8N_CALLBACK_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n`;

    await triggerGeneration({
      generationId: generation.id,
      userId: user.id,
      type: 'social',
      topic,
      inputType,
      sourceUrl: inputType === 'url' ? url : undefined,
      sourceText: inputType === 'text' ? text : undefined,
      platforms,
      callbackUrl,
    }).catch(async () => {
      await admin
        .from('generations')
        .update({
          status: 'failed',
          error_message: 'Failed to trigger n8n workflow',
        })
        .eq('id', generation.id);
      await addCredits(
        user.id,
        creditsNeeded,
        'refund',
        'Refund: Social posts generation failed',
        generation.id
      );
    });

    return NextResponse.json({
      generationId: generation.id,
      creditsUsed: creditsNeeded,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

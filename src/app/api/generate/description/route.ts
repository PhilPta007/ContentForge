import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FIXED_CREDITS } from '@/lib/credits';
import { triggerGeneration } from '@/lib/n8n/trigger';

const bodySchema = z.object({
  topic: z.string().min(1).max(500),
  youtubeUrl: z.string().url().optional(),
  useBrandVoice: z.boolean().default(false),
  affiliateLinkIds: z.array(z.string().uuid()).default([]),
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

    const { topic, youtubeUrl, useBrandVoice, affiliateLinkIds } = parsed.data;
    const creditsNeeded = FIXED_CREDITS.description;

    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('credits, brand_voice')
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

    let affiliateLinks: { label: string; url: string }[] = [];
    if (affiliateLinkIds.length > 0) {
      const { data: links } = await admin
        .from('affiliate_links')
        .select('label, url')
        .in('id', affiliateLinkIds)
        .eq('user_id', user.id);
      affiliateLinks = links ?? [];
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
        type: 'description',
        status: 'pending',
        credits_used: creditsNeeded,
        input_topic: topic,
        use_brand_voice: useBrandVoice,
        affiliate_link_ids: affiliateLinkIds.length > 0 ? affiliateLinkIds : null,
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
      description: `Description: ${topic}`,
      reference_id: generation.id,
      balance_after: newBalance,
    });

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n`;

    await triggerGeneration({
      generationId: generation.id,
      userId: user.id,
      type: 'description',
      topic,
      youtubeUrl,
      brandVoice: useBrandVoice ? (profile.brand_voice as Record<string, unknown>) ?? undefined : undefined,
      affiliateLinks: affiliateLinks.length > 0 ? affiliateLinks : undefined,
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

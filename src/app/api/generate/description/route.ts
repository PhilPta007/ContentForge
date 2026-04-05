import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FIXED_CREDITS } from '@/lib/credits';
import { deductCredits, addCredits } from '@/lib/credits-service';
import { triggerGeneration } from '@/lib/n8n/trigger';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

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

    const { topic, youtubeUrl, useBrandVoice, affiliateLinkIds } = parsed.data;
    const creditsNeeded = FIXED_CREDITS.description;

    const admin = createAdminClient();

    // Fetch brand voice and affiliate links if needed
    const { data: profile } = await admin
      .from('profiles')
      .select('brand_voice')
      .eq('id', user.id)
      .single();

    let affiliateLinks: { label: string; url: string }[] = [];
    if (affiliateLinkIds.length > 0) {
      const { data: links } = await admin
        .from('affiliate_links')
        .select('label, url')
        .in('id', affiliateLinkIds)
        .eq('user_id', user.id);
      affiliateLinks = links ?? [];
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
      return NextResponse.json({ error: 'Failed to create generation' }, { status: 500 });
    }

    try {
      await deductCredits(
        user.id,
        creditsNeeded,
        'generation',
        `Description: ${topic}`,
        generation.id
      );
    } catch (error) {
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
        type: 'description',
        topic,
        youtubeUrl,
        brandVoice: useBrandVoice ? (profile?.brand_voice as Record<string, unknown>) ?? undefined : undefined,
        affiliateLinks: affiliateLinks.length > 0 ? affiliateLinks : undefined,
        callbackUrl,
      });
    } catch (triggerError) {
      const errorMsg = triggerError instanceof Error ? triggerError.message : String(triggerError);
      console.error(`[generate/description] Trigger failed for ${generation.id}:`, errorMsg);
      await admin
        .from('generations')
        .update({ status: 'failed', error_message: `Trigger failed: ${errorMsg}` })
        .eq('id', generation.id);
      await addCredits(user.id, creditsNeeded, 'refund', `Refund: Description trigger failed`, generation.id);
      return NextResponse.json(
        { error: 'Failed to start description generation', detail: errorMsg, generationId: generation.id },
        { status: 502 }
      );
    }

    return NextResponse.json({
      generationId: generation.id,
      creditsUsed: creditsNeeded,
    });
  } catch (error) {
    console.error('[generate/description] Unhandled error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

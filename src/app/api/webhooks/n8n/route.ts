import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { addCredits } from '@/lib/credits-service';

const progressSchema = z.object({
  stage: z.string(),
  current: z.number().optional(),
  total: z.number().optional(),
  message: z.string(),
});

const callbackSchema = z.object({
  generationId: z.string().uuid(),
  status: z.enum(['pending', 'processing', 'complete', 'failed']),
  outputUrl: z.string().url().nullish(),
  metadata: z.object({
    duration: z.number().optional(),
    fileSize: z.number().optional(),
    format: z.string().optional(),
    thumbnailUrl: z.string().url().optional(),
    thumbnailUrls: z.array(z.string().url()).optional(),
    clipCount: z.number().optional(),
    description: z.string().optional(),
    // Social posts output
    posts: z.array(z.object({
      platform: z.string(),
      content: z.string(),
      characterCount: z.number(),
      hashtags: z.array(z.string()).optional(),
      suggestedImagePrompt: z.string().optional(),
    })).optional(),
    sourceType: z.enum(['url', 'text']).optional(),
    sourceUrl: z.string().optional(),
    extractedTitle: z.string().optional(),
    extractedKeyPoints: z.array(z.string()).optional(),
  }).nullish(),
  error: z.string().nullish(),
  progress: progressSchema.nullish(),
});

export async function POST(request: Request) {
  const secret = request.headers.get('X-Webhook-Secret');
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let rawPayload: unknown;
  try {
    rawPayload = await request.json();
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  const parsed = callbackSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid payload', details: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const payload = parsed.data;

  try {
    const admin = createAdminClient();

    const updateData: Record<string, unknown> = {
      status: payload.status,
    };

    if (payload.progress) {
      updateData.progress = payload.progress;
    }

    if (payload.outputUrl) {
      updateData.output_url = payload.outputUrl;
      updateData.output_metadata = payload.metadata ?? null;
      updateData.completed_at = new Date().toISOString();
      updateData.progress = null;
    }

    // For thumbnail generations, store the thumbnailUrls array in output_metadata
    if (payload.metadata?.thumbnailUrls && payload.metadata.thumbnailUrls.length > 0) {
      updateData.output_metadata = {
        ...payload.metadata,
        thumbnailUrls: payload.metadata.thumbnailUrls,
      };
    }

    if (payload.error) {
      updateData.error_message = payload.error;
      updateData.completed_at = new Date().toISOString();
      updateData.progress = null;
    }

    const { error: updateError } = await admin
      .from('generations')
      .update(updateData)
      .eq('id', payload.generationId);

    if (updateError) {
      return new NextResponse('Database error', { status: 500 });
    }

    // Atomic refund on failure
    if (payload.status === 'failed') {
      const { data: generation } = await admin
        .from('generations')
        .select('id, user_id, credits_used')
        .eq('id', payload.generationId)
        .single();

      if (generation) {
        await addCredits(
          generation.user_id,
          generation.credits_used,
          'refund',
          'Refund: generation failed',
          generation.id
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

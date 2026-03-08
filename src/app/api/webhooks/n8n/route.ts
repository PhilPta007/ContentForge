import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { addCredits } from '@/lib/credits-service';

interface ProgressInfo {
  stage: string;
  current?: number;
  total?: number;
  message: string;
}

interface CallbackPayload {
  generationId: string;
  status: string;
  outputUrl?: string;
  metadata?: {
    duration?: number;
    fileSize?: number;
    format?: string;
    thumbnailUrl?: string;
    clipCount?: number;
  };
  error?: string;
  progress?: ProgressInfo;
}

export async function POST(request: Request) {
  const secret = request.headers.get('X-Webhook-Secret');
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const payload: CallbackPayload = await request.json();
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
    }

    if (payload.error) {
      updateData.error_message = payload.error;
      updateData.completed_at = new Date().toISOString();
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

    return new NextResponse('OK');
  } catch {
    return new NextResponse('Invalid payload', { status: 400 });
  }
}

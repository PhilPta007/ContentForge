import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface CallbackPayload {
  generationId: string;
  status: 'complete' | 'failed';
  outputUrl?: string;
  metadata?: {
    duration?: number;
    fileSize?: number;
    format?: string;
  };
  error?: string;
}

export async function POST(request: Request) {
  const secret = request.headers.get('X-Webhook-Secret');
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const payload: CallbackPayload = await request.json();
    const admin = createAdminClient();

    const { data: generation, error: fetchError } = await admin
      .from('generations')
      .select('id, user_id, credits_used')
      .eq('id', payload.generationId)
      .single();

    if (fetchError || !generation) {
      return new NextResponse('Generation not found', { status: 404 });
    }

    const { error: updateError } = await admin
      .from('generations')
      .update({
        status: payload.status,
        output_url: payload.outputUrl ?? null,
        output_metadata: payload.metadata ?? null,
        error_message: payload.error ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', payload.generationId);

    if (updateError) {
      return new NextResponse('Database error', { status: 500 });
    }

    if (payload.status === 'failed') {
      const { data: profile } = await admin
        .from('profiles')
        .select('credits')
        .eq('id', generation.user_id)
        .single();

      if (profile) {
        const refundedBalance = profile.credits + generation.credits_used;

        await admin
          .from('profiles')
          .update({ credits: refundedBalance })
          .eq('id', generation.user_id);

        await admin.from('credit_transactions').insert({
          user_id: generation.user_id,
          amount: generation.credits_used,
          type: 'refund',
          description: `Refund: generation failed`,
          reference_id: generation.id,
          balance_after: refundedBalance,
        });
      }
    }

    return new NextResponse('OK');
  } catch {
    return new NextResponse('Invalid payload', { status: 400 });
  }
}

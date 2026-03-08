import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { addCredits } from '@/lib/credits-service';

const STALE_THRESHOLD_MINUTES = 30;

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const admin = createAdminClient();

  const cutoff = new Date(
    Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000
  ).toISOString();

  const { data: staleJobs, error: fetchError } = await admin
    .from('generations')
    .select('id, user_id, credits_used, type')
    .eq('status', 'processing')
    .lt('created_at', cutoff);

  if (fetchError) {
    return NextResponse.json(
      { error: `Failed to query stale jobs: ${fetchError.message}` },
      { status: 500 }
    );
  }

  if (!staleJobs || staleJobs.length === 0) {
    return NextResponse.json({ cleaned: 0, jobs: [] });
  }

  const results: { id: string; type: string; creditsRefunded: number }[] = [];
  const errors: { id: string; error: string }[] = [];

  for (const job of staleJobs) {
    try {
      const { error: updateError } = await admin
        .from('generations')
        .update({
          status: 'failed',
          error_message:
            'Generation timed out (no response from processing server)',
          completed_at: new Date().toISOString(),
          progress: null,
        })
        .eq('id', job.id);

      if (updateError) {
        errors.push({ id: job.id, error: updateError.message });
        continue;
      }

      await addCredits(
        job.user_id,
        job.credits_used,
        'refund',
        'Refund: generation timed out',
        job.id
      );

      results.push({
        id: job.id,
        type: job.type,
        creditsRefunded: job.credits_used,
      });
    } catch (err) {
      errors.push({
        id: job.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    cleaned: results.length,
    failed: errors.length,
    totalCreditsRefunded: results.reduce((sum, r) => sum + r.creditsRefunded, 0),
    jobs: results,
    ...(errors.length > 0 && { errors }),
  });
}

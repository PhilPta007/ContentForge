import { NextRequest, NextResponse } from 'next/server';
import { generatePayFastSignature } from '@/lib/payfast';
import { addCredits, transactionExists } from '@/lib/credits-service';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CreditPack } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = Object.fromEntries(new URLSearchParams(body));

    const receivedSignature = params.signature;
    delete params.signature;

    const expectedSignature = generatePayFastSignature(
      params,
      process.env.PAYFAST_PASSPHRASE
    );

    if (receivedSignature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    if (params.payment_status !== 'COMPLETE') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const userId = params.custom_str1;
    const packId = params.custom_str2;

    if (!userId || !packId) {
      return NextResponse.json(
        { error: 'Missing user or pack ID' },
        { status: 400 }
      );
    }

    // Idempotency check — prevent duplicate credit grants on webhook retry
    const referenceId = params.m_payment_id;
    if (referenceId && await transactionExists(referenceId)) {
      return NextResponse.json({ status: 'already_processed' }, { status: 200 });
    }

    const supabase = createAdminClient();
    const { data: pack, error: packError } = await supabase
      .from('credit_packs')
      .select('*')
      .eq('id', packId)
      .single<CreditPack>();

    if (packError || !pack) {
      return NextResponse.json(
        { error: 'Credit pack not found' },
        { status: 404 }
      );
    }

    await addCredits(
      userId,
      pack.credits,
      'purchase',
      `Purchased ${pack.name} pack (${pack.credits} credits) via PayFast`,
      referenceId
    );

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

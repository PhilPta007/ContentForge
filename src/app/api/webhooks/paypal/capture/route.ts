import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { addCredits, transactionExists } from '@/lib/credits-service';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CreditPack } from '@/lib/types';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/app/credits?error=missing_token`
    );
  }

  try {
    // Capture the payment
    const { status, userId, packId, transactionId } = await capturePayPalOrder(token);

    if (status !== 'COMPLETED') {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/credits?error=payment_not_completed`
      );
    }

    // Idempotency check
    if (await transactionExists(transactionId)) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/credits?success=true`
      );
    }

    // Look up the credit pack
    const supabase = createAdminClient();
    const { data: pack, error: packError } = await supabase
      .from('credit_packs')
      .select('*')
      .eq('id', packId)
      .single<CreditPack>();

    if (packError || !pack) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/app/credits?error=pack_not_found`
      );
    }

    // Add credits atomically
    await addCredits(
      userId,
      pack.credits,
      'purchase',
      `Purchased ${pack.name} pack (${pack.credits} credits) via PayPal`,
      transactionId
    );

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/app/credits?success=true`
    );
  } catch {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/app/credits?error=capture_failed`
    );
  }
}

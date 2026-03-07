import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { addCredits, transactionExists } from '@/lib/credits-service';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CreditPack } from '@/lib/types';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature';
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const packId = session.metadata?.packId;

    if (!userId || !packId) {
      return NextResponse.json(
        { error: 'Missing metadata' },
        { status: 400 }
      );
    }

    // Idempotency check — prevent duplicate credit grants on webhook retry
    if (await transactionExists(session.id)) {
      return NextResponse.json({ status: 'already_processed' }, { status: 200 });
    }

    try {
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
        `Purchased ${pack.name} pack (${pack.credits} credits) via Stripe`,
        session.id
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

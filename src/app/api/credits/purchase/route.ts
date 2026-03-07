import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPayFastUrl } from '@/lib/payfast';
import { createStripeCheckout } from '@/lib/stripe';
import type { CreditPack } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { packId, paymentMethod } = body as {
      packId: string;
      paymentMethod: 'payfast' | 'stripe';
    };

    if (!packId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing packId or paymentMethod' },
        { status: 400 }
      );
    }

    if (paymentMethod !== 'payfast' && paymentMethod !== 'stripe') {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    const { data: pack, error: packError } = await supabase
      .from('credit_packs')
      .select('*')
      .eq('id', packId)
      .eq('active', true)
      .single<CreditPack>();

    if (packError || !pack) {
      return NextResponse.json(
        { error: 'Credit pack not found' },
        { status: 404 }
      );
    }

    const userName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User';

    if (paymentMethod === 'payfast') {
      const url = createPayFastUrl(
        user.id,
        pack.id,
        pack.name,
        pack.price_zar / 100,
        user.email!,
        userName
      );
      return NextResponse.json({ url });
    }

    const url = await createStripeCheckout(
      user.id,
      pack.id,
      pack.name,
      pack.credits,
      pack.price_usd,
      user.email!
    );

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

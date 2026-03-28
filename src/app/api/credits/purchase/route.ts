import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createPayFastUrl } from '@/lib/payfast';
import { createPayPalOrder } from '@/lib/paypal';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import type { CreditPack } from '@/lib/types';

const purchaseSchema = z.object({
  packId: z.string().uuid(),
  paymentMethod: z.enum(['payfast', 'paypal']),
});

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

    const { success: withinLimit } = rateLimit(getClientIp(request), 10, 60_000);
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = purchaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { packId, paymentMethod } = parsed.data;

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

    if (!user.email) {
      return NextResponse.json(
        { error: 'Email is required for purchases' },
        { status: 400 }
      );
    }

    const userName = user.user_metadata?.full_name ?? user.email.split('@')[0] ?? 'User';

    if (paymentMethod === 'payfast') {
      const url = createPayFastUrl(
        user.id,
        pack.id,
        pack.name,
        pack.price_zar / 100,
        user.email,
        userName
      );
      return NextResponse.json({ url });
    }

    // PayPal
    const url = await createPayPalOrder(
      user.id,
      pack.id,
      pack.name,
      pack.credits,
      pack.price_usd,
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Credit purchase error:', error);
    return NextResponse.json({ error: 'Purchase failed. Please try again.' }, { status: 500 });
  }
}

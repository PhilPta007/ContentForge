import { NextRequest, NextResponse } from 'next/server';
import { generatePayFastSignature } from '@/lib/payfast';
import { addCredits, transactionExists } from '@/lib/credits-service';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CreditPack } from '@/lib/types';

// PayFast ITN source IP ranges (CIDR notation)
// https://developers.payfast.co.za/docs#ip-addresses
const PAYFAST_CIDR_RANGES = [
  { start: ipToNumber('197.97.145.144'), end: ipToNumber('197.97.145.159') },     // 197.97.145.144/28
  { start: ipToNumber('41.74.179.192'), end: ipToNumber('41.74.179.223') },        // 41.74.179.192/27
  { start: ipToNumber('197.110.200.0'), end: ipToNumber('197.110.201.255') },      // 197.110.200.0/23
];

const LOCALHOST_IPS = new Set(['127.0.0.1', '::1']);

function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isPayFastIp(ip: string): boolean {
  if (LOCALHOST_IPS.has(ip)) return true;

  // IPv6-mapped IPv4 (e.g. ::ffff:197.97.145.150)
  const normalized = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (!normalized.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) return false;

  const num = ipToNumber(normalized);
  return PAYFAST_CIDR_RANGES.some(range => num >= range.start && num <= range.end);
}

export async function POST(request: NextRequest) {
  try {
    // Verify request originates from PayFast infrastructure
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '';

    if (!clientIp || !isPayFastIp(clientIp)) {
      console.warn(`PayFast webhook rejected: untrusted IP ${clientIp || 'unknown'}`);
      return NextResponse.json(
        { error: 'Forbidden: IP not in PayFast allowlist' },
        { status: 403 }
      );
    }

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

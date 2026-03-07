import crypto from 'crypto';

interface PayFastParams {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  email_address: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  custom_str1?: string;
  custom_str2?: string;
}

export function generatePayFastSignature(
  data: Record<string, string>,
  passphrase?: string
): string {
  const params = Object.keys(data)
    .filter((key) => data[key] !== '')
    .sort()
    .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&');

  const stringToSign = passphrase
    ? `${params}&passphrase=${encodeURIComponent(passphrase)}`
    : params;

  return crypto.createHash('md5').update(stringToSign).digest('hex');
}

export function createPayFastUrl(
  userId: string,
  packId: string,
  packName: string,
  amountZar: number,
  userEmail: string,
  userName: string
): string {
  const params: PayFastParams = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/credits?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/credits?cancelled=true`,
    notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payfast`,
    name_first: userName.split(' ')[0],
    email_address: userEmail,
    m_payment_id: `${userId}-${packId}-${Date.now()}`,
    amount: amountZar.toFixed(2),
    item_name: `ContentForge ${packName} Credits`,
    custom_str1: userId,
    custom_str2: packId,
  };

  const paramsRecord = params as unknown as Record<string, string>;
  const signature = generatePayFastSignature(
    paramsRecord,
    process.env.PAYFAST_PASSPHRASE
  );

  const searchParams = new URLSearchParams({
    ...paramsRecord,
    signature,
  });

  const baseUrl = process.env.PAYFAST_SANDBOX === 'true'
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  return `${baseUrl}?${searchParams.toString()}`;
}

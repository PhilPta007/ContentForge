const PAYPAL_API_BASE = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(
  userId: string,
  packId: string,
  packName: string,
  credits: number,
  priceUsd: number,
): Promise<string> {
  const accessToken = await getAccessToken();
  const amountStr = (priceUsd / 100).toFixed(2);

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `${userId}-${packId}`,
        description: `ContentForge ${packName} (${credits} credits)`,
        custom_id: JSON.stringify({ userId, packId }),
        amount: {
          currency_code: 'USD',
          value: amountStr,
        },
      }],
      application_context: {
        brand_name: 'ContentForge',
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paypal/capture`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/credits?cancelled=true`,
        user_action: 'PAY_NOW',
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`PayPal order creation failed: ${err}`);
  }

  const order = await response.json();
  const approveLink = order.links?.find((l: { rel: string }) => l.rel === 'approve');

  if (!approveLink?.href) {
    throw new Error('PayPal did not return an approval URL');
  }

  return approveLink.href;
}

export async function capturePayPalOrder(orderId: string): Promise<{
  status: string;
  userId: string;
  packId: string;
  transactionId: string;
}> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`PayPal capture failed: ${err}`);
  }

  const data = await response.json();
  const customId = data.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id
    ?? data.purchase_units?.[0]?.custom_id;

  let userId = '';
  let packId = '';
  try {
    const parsed = JSON.parse(customId);
    userId = parsed.userId;
    packId = parsed.packId;
  } catch {
    throw new Error('Invalid custom_id in PayPal order');
  }

  const transactionId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? data.id;

  return { status: data.status, userId, packId, transactionId };
}

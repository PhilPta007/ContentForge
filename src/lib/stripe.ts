import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
});

export { stripe };

export async function createStripeCheckout(
  userId: string,
  packId: string,
  packName: string,
  credits: number,
  priceUsd: number,
  userEmail: string,
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: userEmail,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `ContentForge ${packName} Credits`,
          description: `${credits} credits`,
        },
        unit_amount: priceUsd,
      },
      quantity: 1,
    }],
    metadata: { userId, packId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/credits?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/credits?cancelled=true`,
  });

  return session.url!;
}

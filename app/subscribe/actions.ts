'use server';

import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
});

export async function checkoutAction(formData: FormData) {
  const priceId = formData.get('priceId') as string;
  if (!priceId) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const headersList = await headers();
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    client_reference_id: user.id,
    customer_email: user.email,
    success_url: `${origin}/dashboard?success=true`,
    cancel_url: `${origin}/subscribe`,
  });

  if (session.url) {
    redirect(session.url);
  }
}

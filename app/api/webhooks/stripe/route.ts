import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// Use service role client since webhooks have no user session
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription' && session.client_reference_id) {
          const userId = session.client_reference_id;
          const subscriptionId = session.subscription as string;
          
          if (!subscriptionId) {
            console.error('No subscription ID found on session');
            break;
          }

          // Retrieve the subscription from Stripe
          const stripeSubscription = (await stripe.subscriptions.retrieve(subscriptionId)) as any;
          console.log(`[Webhook] Retrieved subscription ${subscriptionId}. current_period_end:`, stripeSubscription.current_period_end);
          
          // Determine the plan based on the interval
          const interval = stripeSubscription.items?.data?.[0]?.plan?.interval || stripeSubscription.items?.data?.[0]?.price?.recurring?.interval;
          const plan = interval === 'year' ? 'yearly' : 'monthly';
          
          const periodEnd = stripeSubscription.current_period_end 
            ? new Date(stripeSubscription.current_period_end * 1000).toISOString() 
            : new Date().toISOString();

          // Upsert the subscription row
          const { error: subError } = await supabase.from('subscriptions').insert({
            user_id: userId,
            plan: plan,
            status: stripeSubscription.status,
            current_period_end: periodEnd,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
          });

          if (subError) throw subError;

          // Fetch the user's profile to get charity details
          const { data: profile } = await supabase
            .from('profiles')
            .select('charity_id, charity_pct')
            .eq('id', userId)
            .single();

          if (profile && profile.charity_id) {
            const amountInDollars = (session.amount_total || 0) / 100;
            const contributionAmount = amountInDollars * (profile.charity_pct / 100);

            const { error: contribError } = await supabase.from('contributions').insert({
              user_id: userId,
              charity_id: profile.charity_id,
              amount: contributionAmount,
              source: 'subscription',
            });

            if (contribError) throw contribError;
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        console.log(`[Webhook] Subscription updated ${subscription.id}. current_period_end:`, subscription.current_period_end);
        
        if (subscription.current_period_end) {
          await supabase
            .from('subscriptions')
            .update({
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);
        } else {
          await supabase
            .from('subscriptions')
            .update({ status: subscription.status })
            .eq('stripe_subscription_id', subscription.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
    }
  } catch (err: any) {
    console.error(`Error processing webhook [${event.type}]: ${err.message}`, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

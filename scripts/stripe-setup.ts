import { loadEnvConfig } from '@next/env';
import Stripe from 'stripe';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY in environment variables.');
  process.exit(1);
}

// Ignore typescript warning on apiVersion, defaults will fallback gracefully
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia' as any,
});

async function setup() {
  console.log('Setting up Stripe Products and Prices in USD...');

  try {
    const product = await stripe.products.create({
      name: 'Digital Heroes Subscription',
      description: 'Access to the Digital Heroes platform, monthly draws, and automated charity giving.',
    });

    console.log(`Created Product: ${product.id}`);

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 1900, // $19.00
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    console.log(`Created Monthly Price: ${monthlyPrice.id}`);

    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 19000, // $190.00
      currency: 'usd',
      recurring: { interval: 'year' },
    });

    console.log(`Created Yearly Price: ${yearlyPrice.id}`);

    console.log('\n=============================================');
    console.log('✅ Stripe Setup completed successfully!');
    console.log('=============================================');
    console.log('Please copy and paste these into your .env.local file:\n');
    console.log(`STRIPE_PRICE_MONTHLY=${monthlyPrice.id}`);
    console.log(`STRIPE_PRICE_YEARLY=${yearlyPrice.id}`);
    console.log('\n');
    
  } catch (err) {
    console.error('Error setting up Stripe:', err);
  }
}

setup();

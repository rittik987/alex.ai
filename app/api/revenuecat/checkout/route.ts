import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SUBSCRIPTION_PLANS } from '@/lib/revenuecat/config';

export async function POST(req: Request) {
  try {
    console.log('🛒 Creating RevenueCat checkout session...');
    
    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await req.json();
    const { productId, planKey, successUrl, cancelUrl } = body;

    console.log('📦 Checkout details:', { productId, planKey, successUrl, cancelUrl });

    // Validate plan
    const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan) {
      console.error('❌ Invalid plan key:', planKey);
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    console.log('🎯 Creating checkout for plan:', plan.name);

    // For demo purposes, we'll create a simple checkout URL
    // In production, you would integrate with RevenueCat's web checkout or Stripe
    const checkoutUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/payment-demo?plan=${planKey}&price=${plan.price}&success=${encodeURIComponent(successUrl)}&cancel=${encodeURIComponent(cancelUrl)}`;

    console.log('✅ Checkout URL created:', checkoutUrl);

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('❌ Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

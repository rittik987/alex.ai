import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const WEBHOOK_AUTH_TOKEN = process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN;

export async function POST(req: Request) {
  try {
    console.log('🎣 Received RevenueCat webhook');

    // Verify webhook authenticity
    const authToken = req.headers.get('authorization');

    if (authToken !== `Bearer ${WEBHOOK_AUTH_TOKEN}`) {
      console.error('❌ Invalid webhook auth token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse webhook data
    const body = await req.json();
    console.log('📦 Webhook event:', body.event);

    const supabase = createRouteHandlerClient({ cookies });

    // Handle different event types
    switch (body.event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'NON_RENEWING_PURCHASE': {
        console.log('💰 Processing purchase event');
        
        const { 
          app_user_id: userId,
          product_id: productId,
          entitlement_id: entitlementId,
          expires_date: expiresDate
        } = body.event;

        // Map product ID to subscription plan
        let subscriptionPlan = 'free';
        if (productId.includes('starter')) {
          subscriptionPlan = 'starter';
        } else if (productId.includes('pro')) {
          subscriptionPlan = 'pro';
        }

        console.log('📝 Updating subscription:', { userId, subscriptionPlan, expiresDate });

        // Update user's subscription in database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_plan: subscriptionPlan,
            subscription_expiry: expiresDate || null,
          })
          .eq('id', userId);

        if (updateError) {
          console.error('❌ Failed to update subscription:', updateError);
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          );
        }

        console.log('✅ Subscription updated successfully');
        break;
      }

      case 'CANCELLATION':
      case 'EXPIRATION':
      case 'BILLING_ISSUE': {
        console.log('🚫 Processing cancellation/expiration event');
        
        const { app_user_id: userId } = body.event;

        // Reset subscription to free
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_plan: 'free',
            subscription_expiry: null,
          })
          .eq('id', userId);

        if (updateError) {
          console.error('❌ Failed to reset subscription:', updateError);
          return NextResponse.json(
            { error: 'Failed to reset subscription' },
            { status: 500 }
          );
        }

        console.log('✅ Subscription reset successfully');
        break;
      }

      case 'UNCANCELLATION': {
        console.log('🔄 Processing uncancellation event');
        
        const { 
          app_user_id: userId,
          product_id: productId,
          expires_date: expiresDate
        } = body.event;

        // Map product ID to subscription plan
        let subscriptionPlan = 'free';
        if (productId.includes('starter')) {
          subscriptionPlan = 'starter';
        } else if (productId.includes('pro')) {
          subscriptionPlan = 'pro';
        }

        // Restore subscription
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_plan: subscriptionPlan,
            subscription_expiry: expiresDate || null,
          })
          .eq('id', userId);

        if (updateError) {
          console.error('❌ Failed to restore subscription:', updateError);
          return NextResponse.json(
            { error: 'Failed to restore subscription' },
            { status: 500 }
          );
        }

        console.log('✅ Subscription restored successfully');
        break;
      }

      default:
        console.log('⏩ Unhandled event type:', body.event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

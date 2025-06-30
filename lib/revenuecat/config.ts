// RevenueCat configuration for web applications
export const REVENUECAT_CONFIG = {
  // Replace with your actual RevenueCat public SDK key
  publicApiKey: process.env.NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY || '',
  
  // Product IDs for different subscription tiers
  products: {
    starter: 'alex_starter_monthly',
    pro: 'alex_pro_monthly',
  },

  // Feature limits
  limits: {
    free: {
      interviewMinutes: 10, // 10 minutes free limit
    },
    starter: {
      interviewMinutes: 120, // 2 hours limit
    },
    pro: {
      interviewMinutes: Infinity, // Unlimited
    },
  },
};

// Subscription plan types
export type SubscriptionPlan = 'free' | 'starter' | 'pro';

// Subscription plan details
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    description: 'Get started with basic interview practice',
    features: [
      '10 minutes of interview practice',
      'Basic chat interviews',
      'Limited video interviews',
    ],
    price: 0,
    priceId: null,
  },
  starter: {
    name: 'Starter',
    description: 'Perfect for interview preparation',
    features: [
      'Unlimited chat interviews',
      'Up to 2 hours of video interviews/month',
      'Basic performance analytics',
      'Interview history',
    ],
    price: 9.99,
    priceId: REVENUECAT_CONFIG.products.starter,
  },
  pro: {
    name: 'Pro',
    description: 'Comprehensive interview mastery',
    features: [
      'Unlimited chat & video interviews',
      'Advanced analytics & insights',
      'Personalized feedback',
      'Priority support',
    ],
    price: 19.99,
    priceId: REVENUECAT_CONFIG.products.pro,
  },
} as const;

// Get customer info from RevenueCat API
export const getCustomerInfo = async (userId: string) => {
  try {
    console.log('👤 Fetching customer info for user:', userId);
    
    const response = await fetch(`/api/revenuecat/customer/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch customer info');
    }

    const data = await response.json();
    console.log('✅ Customer info retrieved:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to get customer info:', error);
    return null;
  }
};

// Create a web checkout session
export const createCheckoutSession = async (planId: string): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    console.log('🛒 Creating checkout session for plan:', planId);
    
    const { supabase } = await import('@/lib/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/revenuecat/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        planId,
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: `${window.location.origin}/subscription?canceled=true`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    return { success: true, url };
  } catch (error: any) {
    console.error('❌ Failed to create checkout session:', error);
    return { success: false, error: error.message };
  }
};

// Check if user has access to a specific plan
export const checkPlanAccess = async (userId: string, plan: SubscriptionPlan): Promise<boolean> => {
  try {
    const customerInfo = await getCustomerInfo(userId);
    if (!customerInfo) return false;

    // For free plan, always return true
    if (plan === 'free') return true;

    // Check if user has an active subscription for the plan
    const subscription = customerInfo.subscriber.subscriptions[REVENUECAT_CONFIG.products[plan]];
    if (!subscription) return false;

    // Check if subscription is active
    const expiryDate = new Date(subscription.expires_date);
    return expiryDate > new Date();
  } catch (error) {
    console.error('❌ Failed to check plan access:', error);
    return false;
  }
};

// Get remaining minutes for current plan
export const getRemainingMinutes = async (userId: string): Promise<number> => {
  try {
    const customerInfo = await getCustomerInfo(userId);
    if (!customerInfo) return 0;

    // Get current plan
    let currentPlan: SubscriptionPlan = 'free';
    if (await checkPlanAccess(userId, 'pro')) {
      currentPlan = 'pro';
    } else if (await checkPlanAccess(userId, 'starter')) {
      currentPlan = 'starter';
    }

    // Get minutes used from database
    const { supabase } = await import('@/lib/supabase/client');
    const { data: profile } = await supabase
      .from('profiles')
      .select('interview_minutes_used')
      .eq('id', userId)
      .single();

    const minutesUsed = profile?.interview_minutes_used || 0;
    const totalMinutes = REVENUECAT_CONFIG.limits[currentPlan].interviewMinutes;

    return Math.max(0, totalMinutes - minutesUsed);
  } catch (error) {
    console.error('❌ Failed to get remaining minutes:', error);
    return 0;
  }
};

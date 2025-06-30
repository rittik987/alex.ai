'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { REVENUECAT_CONFIG, SubscriptionPlan, getCustomerInfo, createCheckoutSession } from './config';
import { supabase } from '@/lib/supabase/client';

interface SubscriptionInfo {
  plan: SubscriptionPlan;
  isActive: boolean;
  expiresAt: Date | null;
  minutesUsed: number;
}

interface SubscriptionContextType {
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  checkEntitlement: () => Promise<void>;
  purchaseSubscription: (planId: string) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  error: Error | null;
  canUseFeature: (feature: 'chat' | 'video') => boolean;
  getRemainingMinutes: () => number;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    checkEntitlement();
  }, []);

  const checkEntitlement = async () => {
    console.log('🔍 Checking subscription entitlement...');
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Auth check result:', { user: user?.id, authError });
      
      if (authError || !user) {
        console.log('❌ No authenticated user found');
        setSubscription({
          plan: 'free',
          isActive: false,
          expiresAt: null,
          minutesUsed: 0,
        });
        return;
      }

      console.log('📊 Fetching profile data for user:', user.id);
      
      // Try to get subscription data from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_expiry, interview_minutes_used')
        .eq('id', user.id)
        .single();

      console.log('📋 Profile query result:', { profile, profileError });

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        
        // If profile doesn't exist, create one
        if (profileError.code === 'PGRST116') {
          console.log('🆕 Profile not found, creating default profile...');
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || '',
              subscription_plan: 'free',
              subscription_expiry: null,
              interview_minutes_used: 0
            })
            .select('subscription_plan, subscription_expiry, interview_minutes_used')
            .single();
          
          if (insertError) {
            console.error('❌ Failed to create profile:', insertError);
          }
          
          setSubscription({
            plan: 'free',
            isActive: false,
            expiresAt: null,
            minutesUsed: 0,
          });
          return;
        }
        
        // For other errors, set default subscription
        console.log('🔄 Setting default subscription due to error:', profileError.message);
        setSubscription({
          plan: 'free',
          isActive: false,
          expiresAt: null,
          minutesUsed: 0,
        });
        return;
      }

      // Successfully got profile data
      const currentPlan = (profile?.subscription_plan as SubscriptionPlan) || 'free';
      const expiresAt = profile?.subscription_expiry ? new Date(profile.subscription_expiry) : null;
      const isActive = currentPlan !== 'free' && (!expiresAt || expiresAt > new Date());

      const subscriptionData = {
        plan: currentPlan,
        isActive,
        expiresAt,
        minutesUsed: profile?.interview_minutes_used || 0,
      };

      console.log('✅ Subscription data loaded:', subscriptionData);
      setSubscription(subscriptionData);
      
    } catch (err) {
      console.error('❌ Subscription check failed:', err);
      setError(err as Error);
      
      // Set default subscription even on error
      setSubscription({
        plan: 'free',
        isActive: false,
        expiresAt: null,
        minutesUsed: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseSubscription = async (planId: string): Promise<boolean> => {
    console.log('🛒 Starting purchase for plan:', planId);
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create checkout session
      const result = await createCheckoutSession(planId);
      
      if (result.success && result.url) {
        console.log('✅ Checkout session created, redirecting...');
        window.location.href = result.url;
        return true;
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('❌ Purchase failed:', err);
      setError(err as Error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get latest customer info from RevenueCat
      const customerInfo = await getCustomerInfo(user.id);
      
      if (customerInfo) {
        // Sync with database and refresh subscription
        await checkEntitlement();
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const canUseFeature = (feature: 'chat' | 'video'): boolean => {
    if (!subscription) return false;
    
    if (subscription.plan === 'pro') return true;
    if (subscription.plan === 'starter') {
      // Starter plan has limited video interviews
      if (feature === 'video') {
        return subscription.minutesUsed < REVENUECAT_CONFIG.limits.starter.interviewMinutes;
      }
      return true;
    }
    
    // Free tier - check minutes limit
    return subscription.minutesUsed < REVENUECAT_CONFIG.limits.free.interviewMinutes;
  };

  const getRemainingMinutes = (): number => {
    if (!subscription) return 0;
    
    const limit = REVENUECAT_CONFIG.limits[subscription.plan].interviewMinutes;
    if (limit === Infinity) return Infinity;
    
    return Math.max(0, limit - subscription.minutesUsed);
  };

  // Alias checkEntitlement as refreshSubscription for clarity
  const refreshSubscription = checkEntitlement;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        checkEntitlement,
        purchaseSubscription,
        restorePurchases,
        error,
        canUseFeature,
        getRemainingMinutes,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

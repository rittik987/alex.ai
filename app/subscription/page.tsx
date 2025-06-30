'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Crown, Zap, Star, Clock, AlertCircle } from 'lucide-react';
import { useSubscription } from '@/lib/revenuecat/provider';
import { SUBSCRIPTION_PLANS } from '@/lib/revenuecat/config';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SubscriptionPage() {
  const { subscription, isLoading, purchaseSubscription, error } = useSubscription();
  const [purchasingPlan, setPurchasingPlan] = useState<string | null>(null);

  const handleUpgrade = async (planKey: string) => {
    const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan.priceId) return;

    setPurchasingPlan(planKey);
    try {
      await purchaseSubscription(plan.priceId);
    } catch (err) {
      console.error('Purchase failed:', err);
    } finally {
      setPurchasingPlan(null);
    }
  };

  const getUsagePercentage = () => {
    if (!subscription) return 0;
    if (subscription.plan === 'pro') return 0; // Unlimited
    
    const limits = {
      free: 10,
      starter: 120,
      pro: Infinity
    };
    
    const limit = limits[subscription.plan];
    if (limit === Infinity) return 0;
    
    return Math.min(100, (subscription.minutesUsed / limit) * 100);
  };

  const getRemainingMinutes = () => {
    if (!subscription) return 0;
    if (subscription.plan === 'pro') return Infinity;
    
    const limits = {
      free: 10,
      starter: 120,
      pro: Infinity
    };
    
    const limit = limits[subscription.plan];
    return Math.max(0, limit - subscription.minutesUsed);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-gray-300">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  const usagePercentage = getUsagePercentage();
  const remainingMinutes = getRemainingMinutes();
  const isLowUsage = subscription?.plan === 'free' && remainingMinutes <= 2;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Unlock your interview potential with our comprehensive practice platform
          </p>
        </div>

        {/* Current Usage */}
        {subscription && (
          <Card className="mb-8 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Current Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">
                  Current Plan: <Badge variant="outline" className="ml-2 text-white border-gray-600">
                    {SUBSCRIPTION_PLANS[subscription.plan].name}
                  </Badge>
                </span>
                <span className="text-gray-400">
                  {subscription.plan === 'pro' 
                    ? 'Unlimited' 
                    : `${subscription.minutesUsed} / ${subscription.plan === 'free' ? 10 : 120} minutes`
                  }
                </span>
              </div>
              
              {subscription.plan !== 'pro' && (
                <div className="space-y-2">
                  <Progress 
                    value={usagePercentage} 
                    className={`h-3 ${isLowUsage ? 'bg-red-900/50' : 'bg-gray-700'}`}
                  />
                  <p className="text-sm text-gray-400">
                    {remainingMinutes} minutes remaining
                  </p>
                </div>
              )}

              {isLowUsage && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Low Time Remaining</AlertTitle>
                  <AlertDescription>
                    You have {remainingMinutes} minutes left. Consider upgrading to continue practicing.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-8 bg-red-900/50 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
            const isCurrentPlan = subscription?.plan === key;
            const isPurchasing = purchasingPlan === key;
            
            return (
              <Card 
                key={key} 
                className={`relative bg-gray-800 border-gray-700 ${
                  key === 'starter' ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
              >
                {key === 'starter' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {key === 'free' && <Zap className="h-8 w-8 text-gray-400" />}
                    {key === 'starter' && <Star className="h-8 w-8 text-blue-400" />}
                    {key === 'pro' && <Crown className="h-8 w-8 text-yellow-400" />}
                  </div>
                  
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-300">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-400">/month</span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4">
                    {isCurrentPlan ? (
                      <Button 
                        disabled 
                        className="w-full bg-gray-600 text-gray-300"
                      >
                        Current Plan
                      </Button>
                    ) : key === 'free' ? (
                      <Button 
                        disabled 
                        variant="outline" 
                        className="w-full border-gray-600 text-gray-400"
                      >
                        Free Forever
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUpgrade(key)}
                        disabled={isPurchasing}
                        className={`w-full ${
                          key === 'starter' 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-yellow-600 hover:bg-yellow-700'
                        }`}
                      >
                        {isPurchasing ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </div>
                        ) : (
                          `Upgrade to ${plan.name}`
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Debug Info */}
        <Card className="mt-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-gray-300 bg-gray-900 p-4 rounded overflow-auto">
              {JSON.stringify({ subscription, isLoading, error: error?.message }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/lib/revenuecat/provider';
import { SUBSCRIPTION_PLANS } from '@/lib/revenuecat/config';
import { Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function UsageIndicator() {
  const { subscription } = useSubscription();

  if (!subscription) return null;

  const { plan, minutesUsed } = subscription;
  const planDetails = SUBSCRIPTION_PLANS[plan];

  // Get total minutes based on plan
  const getTotalMinutes = () => {
    switch (plan) {
      case 'pro':
        return Infinity;
      case 'starter':
        return 120; // 2 hours
      default:
        return 10; // Free tier
    }
  };

  const totalMinutes = getTotalMinutes();
  const remainingMinutes = Math.max(0, totalMinutes - minutesUsed);
  const usagePercentage = totalMinutes === Infinity ? 0 : (minutesUsed / totalMinutes) * 100;
  const isLowUsage = remainingMinutes <= 2 && plan === 'free';

  return (
    <div className="space-y-4">
      {/* Usage Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">
            {plan === 'pro' ? 'Unlimited Usage' : `${minutesUsed} / ${totalMinutes} minutes used`}
          </span>
          <span className="text-gray-400">
            {plan === 'pro' ? '∞' : `${remainingMinutes} min left`}
          </span>
        </div>
        <Progress 
          value={usagePercentage} 
          className={`h-2 ${
            plan === 'pro' 
              ? 'bg-gray-700'
              : remainingMinutes <= 2
              ? 'bg-red-900/50'
              : 'bg-gray-700'
          }`}
        />
      </div>

      {/* Low Usage Warning */}
      {isLowUsage && (
        <Alert variant="destructive" className="bg-red-900/50 border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Time Remaining</AlertTitle>
          <AlertDescription>
            You have {remainingMinutes} minutes left in your free tier.
            Consider upgrading to continue practicing.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan Info */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
        <div className="flex items-center space-x-3">
          <Clock className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-200">
              {planDetails.name} Plan
            </p>
            <p className="text-xs text-gray-400">
              {plan === 'pro' 
                ? 'Unlimited interview time'
                : plan === 'starter'
                ? 'Up to 2 hours per month'
                : '10 minutes free trial'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-300">
            ${planDetails.price}
          </p>
          <p className="text-xs text-gray-400">per month</p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useSubscription } from '@/lib/revenuecat/provider';
import { supabase } from '@/lib/supabase/client';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSubscription } = useSubscription();
  const [isUpdating, setIsUpdating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const planId = searchParams.get('plan') || 'starter';

  useEffect(() => {
    const updateSubscription = async () => {
      try {
        console.log('🎉 Payment success - updating subscription to:', planId);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Calculate expiry date (1 month from now)
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        // Update subscription in database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_plan: planId,
            subscription_expiry: expiryDate.toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('❌ Failed to update subscription:', updateError);
          throw updateError;
        }

        console.log('✅ Subscription updated successfully');
        
        // Refresh subscription context
        await refreshSubscription();
        
        setIsUpdating(false);
      } catch (err) {
        console.error('❌ Error updating subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to update subscription');
        setIsUpdating(false);
      }
    };

    updateSubscription();
  }, [planId, refreshSubscription]);

  if (isUpdating) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Processing Payment</h2>
              <p className="text-gray-300">Updating your subscription...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-900/50 flex items-center justify-center mx-auto">
                <span className="text-red-400 text-xl">✕</span>
              </div>
              <h2 className="text-xl font-semibold text-white">Update Failed</h2>
              <p className="text-gray-300">{error}</p>
              <Button 
                onClick={() => router.push('/subscription')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Back to Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-full bg-green-900/50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <CardTitle className="text-2xl text-white">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-300">
            Your subscription has been upgraded to <span className="font-semibold text-white capitalize">{planId}</span> plan.
          </p>
          <p className="text-sm text-gray-400">
            You now have access to all premium features.
          </p>
          <div className="space-y-2 pt-4">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </Button>
            <Button 
              onClick={() => router.push('/interview')}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Start Interview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Loading...</h2>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

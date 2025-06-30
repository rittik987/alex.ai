'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/revenuecat/config';

function PaymentDemoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);

  const plan = searchParams.get('plan') || 'starter';
  const price = searchParams.get('price') || '9.99';
  const successUrl = searchParams.get('success') || '/payment-success';
  const cancelUrl = searchParams.get('cancel') || '/subscription';

  const planDetails = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Redirect to success page
    window.location.href = `${successUrl}?plan=${plan}`;
  };

  const handleCancel = () => {
    router.push(cancelUrl);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-full bg-blue-900/50 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-blue-400" />
          </div>
          <CardTitle className="text-2xl text-white">Complete Your Purchase</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Plan Summary */}
          <div className="bg-gray-900/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Plan:</span>
              <span className="font-semibold text-white capitalize">{planDetails?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Price:</span>
              <span className="font-semibold text-white">${price}/month</span>
            </div>
            <div className="pt-2 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                {planDetails?.description}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <h4 className="font-medium text-white">What you'll get:</h4>
            <ul className="space-y-1">
              {planDetails?.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Demo Payment Form */}
          <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-gray-400 text-center">
              🎭 Demo Mode - No real payment required
            </p>
            <div className="text-xs text-gray-500 text-center">
              This is a demonstration. Click "Complete Payment" to simulate a successful purchase.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing Payment...
                </div>
              ) : (
                'Complete Payment'
              )}
            </Button>
            
            <Button
              onClick={handleCancel}
              disabled={isProcessing}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By completing this purchase, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentDemoPage() {
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
      <PaymentDemoContent />
    </Suspense>
  );
}

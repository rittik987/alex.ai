'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { useSubscription } from '@/lib/revenuecat/provider';
import { SUBSCRIPTION_PLANS } from '@/lib/revenuecat/config';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  remainingMinutes?: number;
  trigger?: string;
}

export function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const { purchaseSubscription } = useSubscription();
  const [purchasingPlan, setPurchasingPlan] = useState<string | null>(null);

  const handleUpgrade = async (planKey: string) => {
    const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan.priceId) return;

    setPurchasingPlan(planKey);
    try {
      await purchaseSubscription(plan.priceId);
      onClose();
    } catch (err) {
      console.error('Purchase failed:', err);
    } finally {
      setPurchasingPlan(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white text-center">
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-center">
            {reason || 'Unlock unlimited interview practice and advanced features'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {Object.entries(SUBSCRIPTION_PLANS)
            .filter(([key]) => key !== 'free')
            .map(([key, plan]) => {
              const isPurchasing = purchasingPlan === key;
              
              return (
                <div 
                  key={key}
                  className={`relative p-6 rounded-lg border ${
                    key === 'starter' 
                      ? 'border-blue-500 bg-blue-900/20' 
                      : 'border-gray-600 bg-gray-900/50'
                  }`}
                >
                  {key === 'starter' && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                      Recommended
                    </Badge>
                  )}
                  
                  <div className="text-center mb-4">
                    <div className="flex justify-center mb-3">
                      {key === 'starter' && <Star className="h-8 w-8 text-blue-400" />}
                      {key === 'pro' && <Crown className="h-8 w-8 text-yellow-400" />}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-gray-300 text-sm mb-3">{plan.description}</p>
                    
                    <div className="text-3xl font-bold text-white">
                      ${plan.price}
                      <span className="text-lg text-gray-400">/month</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
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
                </div>
              );
            })}
        </div>

        <div className="mt-6 text-center">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

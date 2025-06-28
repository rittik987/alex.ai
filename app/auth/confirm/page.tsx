'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Brain, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get the token and type from URL parameters
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || type !== 'signup') {
          setStatus('error');
          setMessage('Invalid confirmation link');
          return;
        }

        // Verify the token with Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          console.error('Email confirmation error:', error);
          setStatus('error');
          setMessage(error.message || 'Failed to confirm email');
        } else if (data.user) {
          setStatus('success');
          setMessage('Email confirmed successfully!');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Email confirmation failed');
        }
      } catch (error) {
        console.error('Unexpected error during email confirmation:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 flex items-center justify-center">
      <div className="container mx-auto px-6">
        <div className="max-w-md mx-auto">
          <Card className="bg-gray-800/50 border-gray-700 p-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Brain className="h-8 w-8 text-purple-400" />
              <span className="text-xl font-bold text-white">InterviewCracker AI</span>
            </div>

            {status === 'loading' && (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 text-purple-400 animate-spin mx-auto" />
                <h2 className="text-xl font-semibold text-white">Confirming Your Email</h2>
                <p className="text-gray-400">Please wait while we verify your email address...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
                <h2 className="text-xl font-semibold text-white">Email Confirmed!</h2>
                <p className="text-gray-400">{message}</p>
                <p className="text-sm text-gray-500">Redirecting you to the dashboard...</p>
                <Link href="/dashboard">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <XCircle className="h-12 w-12 text-red-400 mx-auto" />
                <h2 className="text-xl font-semibold text-white">Confirmation Failed</h2>
                <p className="text-gray-400">{message}</p>
                <div className="space-y-2">
                  <Link href="/">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Back to Home
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-500">
                    If you continue to have issues, please try signing up again or contact support.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
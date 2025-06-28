'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Brain } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/?error=auth_error');
          return;
        }

        if (data.session) {
          // Check if user has completed profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (!profile || !profile.full_name || !profile.field) {
            // User needs to complete onboarding
            router.push('/onboarding');
          } else {
            // User has completed profile, redirect to dashboard
            router.push('/dashboard');
          }
        } else {
          // No session, redirect to home
          router.push('/');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.push('/?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Brain className="h-12 w-12 text-purple-400 animate-pulse mx-auto mb-4" />
        <p className="text-gray-300">Completing authentication...</p>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Github } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithGitHub } from '@/lib/supabase/auth';
import { toast } from 'sonner';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthFormData) => {
    console.log(`🔑 AuthModal: ${activeTab} attempt for:`, data.email);
    setIsLoading(true);
    
    try {
      let result;
      if (activeTab === 'signin') {
        console.log('🔑 AuthModal: Attempting sign in...');
        result = await signInWithEmail(data.email, data.password);
        
        if (result.error) {
          console.error('❌ AuthModal: Sign in error:', result.error.message);
          if (result.error.message.includes('Email not confirmed')) {
            toast.error('Please check your email and click the confirmation link to verify your account before signing in.');
          } else if (result.error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please check your credentials and try again.');
          } else {
            toast.error(result.error.message);
          }
        } else {
          console.log('✅ AuthModal: Sign in successful');
          toast.success('Signed in successfully!');
          reset();
          onClose();
        }
      } else {
        console.log('📝 AuthModal: Attempting sign up...');
        result = await signUpWithEmail(data.email, data.password);
        
        if (result.error) {
          console.error('❌ AuthModal: Sign up error:', result.error.message);
          if (result.error.message.includes('User already registered')) {
            toast.error('An account with this email already exists. Please sign in instead.');
          } else {
            toast.error(result.error.message);
          }
        } else {
          console.log('✅ AuthModal: Sign up successful');
          toast.success('Account created successfully!');
          reset();
          onClose();
        }
      }
    } catch (error) {
      console.error('💥 AuthModal: Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('🔑 AuthModal: Attempting Google sign in...');
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('❌ AuthModal: Google sign in error:', error.message);
        toast.error(error.message);
      } else {
        console.log('✅ AuthModal: Google sign in initiated');
      }
    } catch (error) {
      console.error('💥 AuthModal: Google sign in error:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    console.log('🔑 AuthModal: Attempting GitHub sign in...');
    setIsLoading(true);
    try {
      const { error } = await signInWithGitHub();
      if (error) {
        console.error('❌ AuthModal: GitHub sign in error:', error.message);
        toast.error(error.message);
      } else {
        console.log('✅ AuthModal: GitHub sign in initiated');
      }
    } catch (error) {
      console.error('💥 AuthModal: GitHub sign in error:', error);
      toast.error('Failed to sign in with GitHub');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-center">
            Welcome to InterviewCracker AI
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-center">
            Sign in to start your interview preparation journey
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="signin" className="text-gray-300">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="text-gray-300">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 border-gray-600 text-white"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="bg-gray-800 border-gray-600 text-white"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-red-400 text-sm">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-gray-300">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 border-gray-600 text-white"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-gray-300">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password (min. 6 characters)"
                  className="bg-gray-800 border-gray-600 text-white"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-red-400 text-sm">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full bg-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <Mail className="mr-2 h-4 w-4" />
            Google
          </Button>
          <Button
            variant="outline"
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
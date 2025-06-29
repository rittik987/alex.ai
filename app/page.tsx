'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/auth/AuthModal';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import { 
  Brain, 
  MessageCircle, 
  Code, 
  TrendingUp, 
  Users, 
  Zap,
  ChevronRight,
  PlayCircle,
  CheckCircle
} from 'lucide-react';

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle redirects for authenticated users
  useEffect(() => {
    if (!loading && isMounted && user) {
      console.log('🏠 HomePage: User authenticated, checking profile...', { 
        user: user.email, 
        profile: profile?.full_name,
        field: profile?.field 
      });
      
      if (profile && profile.full_name && profile.field) {
        console.log('➡️ HomePage: Complete profile found, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('➡️ HomePage: Incomplete profile, redirecting to onboarding');
        router.push('/onboarding');
      }
    }
  }, [user, profile, loading, isMounted, router]);

  console.log('🏠 HomePage: Render state:', { 
    user: user?.email, 
    profile: profile?.full_name, 
    loading,
    isMounted
  });

  const handleGetStarted = () => {
    console.log('🚀 HomePage: Get Started clicked');
    if (user) {
      console.log('👤 HomePage: User exists, checking profile...');
      if (profile && profile.full_name && profile.field) {
        console.log('➡️ HomePage: Complete profile, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('➡️ HomePage: Incomplete profile, redirecting to onboarding');
        router.push('/onboarding');
      }
    } else {
      console.log('🔑 HomePage: No user, showing auth modal');
      setShowAuthModal(true);
    }
  };

  const handleDashboardClick = () => {
    console.log('📊 HomePage: Dashboard button clicked');
    if (user) {
      if (profile && profile.full_name && profile.field) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } else {
      setShowAuthModal(true);
    }
  };

  if (loading || !isMounted) {
    console.log('⏳ HomePage: Loading...');
    return <DashboardSkeleton />;
  }

  // Don't render the page content if user is authenticated (they should be redirected)
  if (user) {
    console.log('👤 HomePage: User authenticated, should be redirected');
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-purple-400" />
            <span className="text-xl font-bold text-white">InterviewCracker AI</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
              How It Works
            </Link>
            {user ? (
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleDashboardClick}
              >
                Dashboard
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
                onClick={() => setShowAuthModal(true)}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-6 bg-purple-500/20 text-purple-300 border-purple-500/30">
            🚀 AI-Powered Interview Coaching
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            InterviewCracker AI
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Your Personal AI Interview Coach
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Master technical interviews with personalized AI coaching, real-time feedback, and adaptive practice sessions. 
            Get hired at top tech companies with confidence.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold group"
              onClick={handleGetStarted}
            >
              Get Started
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg group">
              <PlayCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">10,000+</div>
              <div className="text-gray-400">Successful Interviews</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400 mb-2">95%</div>
              <div className="text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">500+</div>
              <div className="text-gray-400">Companies</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Powerful Features for Interview Success
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to ace your next technical interview
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/70 transition-colors group">
            <div className="bg-purple-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">AI-Powered Coaching</h3>
            <p className="text-gray-400">
              Get personalized feedback and guidance from advanced AI that understands your strengths and weaknesses.
            </p>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/70 transition-colors group">
            <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
              <MessageCircle className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Interactive Chat</h3>
            <p className="text-gray-400">
              Practice behavioral and technical questions with our intelligent chatbot that adapts to your responses.
            </p>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/70 transition-colors group">
            <div className="bg-green-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500/30 transition-colors">
              <Code className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Code Editor</h3>
            <p className="text-gray-400">
              Solve coding challenges in a real interview environment with syntax highlighting and auto-completion.
            </p>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/70 transition-colors group">
            <div className="bg-pink-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-500/30 transition-colors">
              <TrendingUp className="h-6 w-6 text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Performance Analytics</h3>
            <p className="text-gray-400">
              Track your progress with detailed analytics and identify areas for improvement.
            </p>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/70 transition-colors group">
            <div className="bg-yellow-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-500/30 transition-colors">
              <Users className="h-6 w-6 text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Mock Interviews</h3>
            <p className="text-gray-400">
              Simulate real interview scenarios with company-specific questions and formats.
            </p>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/70 transition-colors group">
            <div className="bg-orange-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500/30 transition-colors">
              <Zap className="h-6 w-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Real-time Feedback</h3>
            <p className="text-gray-400">
              Receive instant feedback on your answers, communication style, and technical solutions.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Simple steps to interview mastery
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="flex items-start space-x-6">
              <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Choose Your Focus</h3>
                <p className="text-gray-400">
                  Select the type of interview you want to practice - behavioral, technical, or company-specific.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Practice with AI</h3>
                <p className="text-gray-400">
                  Engage in realistic interview conversations with our advanced AI coach that adapts to your skill level.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Get Detailed Feedback</h3>
                <p className="text-gray-400">
                  Receive comprehensive analysis of your performance with actionable insights for improvement.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Land Your Dream Job</h3>
                <p className="text-gray-400">
                  Apply your improved skills and confidence to real interviews and secure offers from top companies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16">
        <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Crack Your Next Interview?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of successful candidates who have landed their dream jobs with InterviewCracker AI.
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold"
            onClick={handleGetStarted}
          >
            Start Your Free Practice Session
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-purple-400" />
              <span className="text-lg font-semibold text-white">InterviewCracker AI</span>
            </div>
            <div className="text-gray-400">
              © 2025 InterviewCracker AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { 
  Brain, 
  MessageCircle, 
  Video,
  Code, 
  TrendingUp, 
  Clock,
  Target,
  Award,
  LogOut,
  Calendar,
  BookOpen,
  Edit,
  Play,
  Zap,
  Database,
  Globe,
  Layers,
  History,
  UserCog,
  Bot,
  ArrowUp,
  CheckCircle2,
  Timer,
  Trophy,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/supabase/auth';
import DashboardSkeleton from './DashboardSkeleton';
import PersonalizedWelcomeModal from './PersonalizedWelcomeModal';

interface DashboardClientProps {
  user: User;
  profile: Profile;
}

const topics = [
  {
    id: 'problem-solving-dsa',
    title: 'Problem Solving & DSA',
    description: 'Data structures, algorithms, and problem-solving techniques',
    icon: Database,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'reactjs-deep-dive',
    title: 'ReactJS Deep Dive',
    description: 'Advanced React concepts, hooks, and best practices',
    icon: Zap,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'nextjs-fullstack',
    title: 'Next.js & Full-Stack',
    description: 'Full-stack development with Next.js and modern tools',
    icon: Globe,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'system-design-basics',
    title: 'System Design Basics',
    description: 'Scalable system architecture and design principles',
    icon: Layers,
    color: 'from-orange-500 to-red-500'
  }
];

const upcomingFeatures = [
  {
    title: "Chat History & Analytics",
    description: "Access your complete interview history with detailed performance analytics and AI-powered insights.",
    icon: History,
    benefits: [
      "Track your progress over time",
      "Identify improvement areas",
      "Review past interview responses"
    ],
    color: "from-blue-600 to-cyan-600"
  },
  {
    title: "Enhanced Personalization",
    description: "Get a fully personalized interview experience tailored to your skills, goals, and learning style.",
    icon: UserCog,
    benefits: [
      "Custom learning paths",
      "Adaptive difficulty",
      "Industry-specific questions"
    ],
    color: "from-purple-600 to-pink-600"
  },
  {
    title: "Alex 2.0 - Next Gen AI Coach",
    description: "Experience our most advanced AI interviewer with enhanced capabilities and natural interactions.",
    icon: Bot,
    benefits: [
      "More natural conversations",
      "Advanced feedback system",
      "Real-time coaching"
    ],
    color: "from-green-600 to-emerald-600"
  }
];

const recentActivities = [
  {
    type: "practice",
    title: "System Design Interview",
    score: 85,
    date: "2 hours ago",
    icon: Globe,
    improvement: "+5%"
  },
  {
    type: "challenge",
    title: "Data Structures Challenge",
    score: 92,
    date: "Yesterday",
    icon: Database,
    improvement: "+8%"
  },
  {
    type: "achievement",
    title: "First Perfect Score!",
    description: "Achieved 100% in React Fundamentals",
    date: "2 days ago",
    icon: Trophy
  }
];

const whyChooseUs = [
  {
    title: "AI-Powered Practice",
    description: "Get instant, personalized feedback from our advanced AI interview coach",
    icon: Brain
  },
  {
    title: "Comprehensive Coverage",
    description: "From technical skills to behavioral questions, we've got you covered",
    icon: CheckCircle2
  },
  {
    title: "Real-Time Analytics",
    description: "Track your progress and identify areas for improvement",
    icon: TrendingUp
  }
];

export default function DashboardClient({ user, profile }: DashboardClientProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'chat' | 'video' | null>(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState({
    full_name: profile.full_name || '',
    field: profile.field || '',
    branch: profile.branch || '',
    city: profile.city || ''
  });

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Check if user should see welcome modal (first time visit)
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(`welcome_seen_${user.id}`);
    console.log('🔍 Checking welcome modal status:', {
      hasSeenWelcome: !!hasSeenWelcome,
      userName: profile.full_name,
      showWelcomeModal
    });
    
    if (!hasSeenWelcome && profile.full_name && !showWelcomeModal) {
      console.log('✨ First time user detected, showing welcome modal');
      // Show welcome modal after a short delay to let dashboard load
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user.id, profile.full_name]);

  const handleWelcomeModalClose = () => {
    setShowWelcomeModal(false);
    // Mark as seen so it doesn't show again
    localStorage.setItem(`welcome_seen_${user.id}`, 'true');
  };

  // Show skeleton while signing out
  if (isSigningOut) {
    return <DashboardSkeleton />;
  }

  const handleSignOut = async () => {
    console.log('🔄 Starting sign out process...');
    setShowSignOutModal(false);
    setIsSigningOut(true);

    // Give time for skeleton to render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      console.log('🔐 Calling signOut from auth context...');
      await signOut();
      console.log('✅ Auth signOut completed');
      
      console.log('🧹 Clearing localStorage...');
      localStorage.clear();
      
      console.log('🧹 Clearing sessionStorage...');
      sessionStorage.clear();
      
      // Give a moment to show the skeleton loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔄 Redirecting to landing page...');
      window.location.replace('/');
      
    } catch (error) {
      console.error('❌ Error during sign out:', error);
      
      // Show error state briefly before redirecting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔄 Force redirecting due to error...');
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/');
    }
  };

  const handleEditProfile = () => {
    setEditingProfile({
      full_name: profile.full_name || '',
      field: profile.field || '',
      branch: profile.branch || '',
      city: profile.city || ''
    });
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = () => {
    // Here you would typically make an API call to update the profile
    // For now, we'll just close the modal
    setShowEditProfileModal(false);
    // You can add actual profile update logic here
  };

  // Non-technical users on waitlist
  if (profile.field === 'Non-Technical') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Welcome, {profile.full_name}!</h1>
                <p className="text-gray-400">You're on our waitlist</p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut} className="border-gray-600 text-gray-300">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <div className="max-w-2xl mx-auto text-center">
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 p-8">
              <div className="mb-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">You're on the Waitlist!</h2>
                <p className="text-gray-300">
                  Thank you for your interest in InterviewCracker AI. We're currently focusing on technical roles, 
                  but we're expanding to include non-technical positions soon.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">What's Next?</h3>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• We'll notify you as soon as non-technical interviews are available</li>
                    <li>• You'll get early access to our expanded platform</li>
                    <li>• Your profile is saved and ready to go</li>
                  </ul>
                </div>
                
                <Badge className="bg-purple-500/20 text-purple-300">
                  Expected Launch: Q2 2025
                </Badge>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const handleInterviewModeSelect = (mode: 'chat' | 'video') => {
    setSelectedMode(mode);
    setShowTopicModal(true);
  };

  const handleTopicSelect = (topicId: string) => {
    setShowTopicModal(false);
    router.push(`/interview?topic=${topicId}&mode=${selectedMode}`);
  };

  // Technical users dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <Brain className="h-8 w-8 text-purple-400" />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                Welcome back, {profile.full_name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-400">Ready to ace your next interview?</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setShowSignOutModal(true)} 
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-gray-300 border-t-transparent rounded-full" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Profile Summary */}
        <Card className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-purple-500/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">Profile Summary</h2>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Field:</span>
                  <Badge className="bg-purple-500/20 text-purple-300">{profile.field}</Badge>
                </div>
                {profile.branch && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Branch:</span>
                    <Badge className="bg-blue-500/20 text-blue-300">{profile.branch}</Badge>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Location:</span>
                  <span className="text-gray-300">{profile.city}</span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={handleEditProfile} className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </Card>

        {/* Quick Stats with Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 p-6 hover:from-blue-600/30 hover:to-cyan-600/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Practice Sessions</p>
                <p className="text-3xl font-bold text-white">12</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center text-sm text-green-400">
              <ArrowUp className="h-4 w-4 mr-1" />
              <span>+3 this week</span>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30 p-6 hover:from-green-600/30 hover:to-emerald-600/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Coding Challenges</p>
                <p className="text-3xl font-bold text-white">8</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Code className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <div className="flex items-center text-sm text-green-400">
              <ArrowUp className="h-4 w-4 mr-1" />
              <span>85% success rate</span>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6 hover:from-purple-600/30 hover:to-pink-600/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Average Score</p>
                <p className="text-3xl font-bold text-white">88%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center text-sm text-green-400">
              <ArrowUp className="h-4 w-4 mr-1" />
              <span>+5% improvement</span>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/30 p-6 hover:from-orange-600/30 hover:to-red-600/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Readiness</p>
                <p className="text-3xl font-bold text-white">75%</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-400" />
              </div>
            </div>
            <Progress value={75} className="h-2" />
          </Card>
        </div>

        {/* Interview Mode Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Choose Your Interview Mode</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chat Interview Card */}
            <Card 
              className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 p-8 cursor-pointer hover:from-blue-600/30 hover:to-cyan-600/30 transition-all duration-300 group"
              onClick={() => handleInterviewModeSelect('chat')}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-500/30 transition-colors">
                  <MessageCircle className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Chat Interview</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Practice with our AI coach through a text-based, interactive chat. 
                    Perfect for behavioral questions and technical discussions.
                  </p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white group-hover:scale-105 transition-transform">
                  <Play className="h-4 w-4 mr-2" />
                  Start Chat Interview
                </Button>
              </div>
            </Card>

            {/* Virtual AI Video Call Card */}
            <Card 
              className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 p-8 cursor-pointer hover:from-purple-600/30 hover:to-pink-600/30 transition-all duration-300 group"
              onClick={() => handleInterviewModeSelect('video')}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto group-hover:bg-purple-500/30 transition-colors">
                  <Video className="h-8 w-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Virtual AI Video Call</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Experience a realistic, face-to-face mock interview with a virtual AI coach. 
                    Complete with video and voice interaction.
                  </p>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white group-hover:scale-105 transition-transform">
                  <Play className="h-4 w-4 mr-2" />
                  Start Video Interview
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Upcoming Features Carousel */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-yellow-400" />
            Coming Soon
          </h2>
          <Carousel className="w-full">
            <CarouselContent className="-ml-4">
              {upcomingFeatures.map((feature, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className={`bg-gradient-to-br ${feature.color}/20 border-${feature.color.split(' ')[1]}/30 p-6 h-full`}>
                    <div className="space-y-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} bg-opacity-20 flex items-center justify-center`}>
                        {<feature.icon className="h-6 w-6 text-white" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                        <p className="text-gray-300 text-sm mb-4">{feature.description}</p>
                        <div className="space-y-2">
                          {feature.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-center text-sm text-gray-400">
                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Why Choose Us Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose InterviewCracker AI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {whyChooseUs.map((item, index) => (
              <Card key={index} className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border-gray-600/30 p-6 hover:from-gray-800/70 hover:to-gray-700/70 transition-all duration-300">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-gray-300 text-sm">{item.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity with Sample Data */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 rounded-lg bg-gray-700/20 border border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <activity.icon className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-white">{activity.title}</h3>
                        <span className="text-sm text-gray-400">{activity.date}</span>
                      </div>
                      {activity.score && (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-400">{activity.score}%</span>
                          <Badge className="bg-green-500/20 text-green-300">
                            {activity.improvement}
                          </Badge>
                        </div>
                      )}
                      {activity.description && (
                        <p className="text-sm text-gray-300 mt-1">{activity.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Interview Readiness Sidebar */}
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Interview Readiness</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Overall Progress</span>
                    <span className="text-white">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Communication</span>
                    <span className="text-green-400">85%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Technical Skills</span>
                    <span className="text-blue-400">78%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Problem Solving</span>
                    <span className="text-purple-400">82%</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Getting Started</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span className="text-gray-300 text-sm">Complete your first practice session</span>
                </div>
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-300 text-sm">Try different interview topics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="h-4 w-4 text-yellow-400" />
                  <span className="text-gray-300 text-sm">Build your interview confidence</span>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">💡 Pro Tip</h3>
              <p className="text-gray-300 text-sm">
                Start with a chat interview to get comfortable, then try the video mode for a more realistic experience!
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Topic Selection Modal */}
      <Dialog open={showTopicModal} onOpenChange={setShowTopicModal}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              What topic would you like to focus on today?
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {topics.map((topic) => {
              const IconComponent = topic.icon;
              return (
                <Card
                  key={topic.id}
                  className="bg-gray-800/50 border-gray-700 p-6 cursor-pointer hover:bg-gray-800/70 transition-all duration-200 group"
                  onClick={() => handleTopicSelect(topic.id)}
                >
                  <div className="space-y-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${topic.color} bg-opacity-20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{topic.title}</h3>
                      <p className="text-gray-400 text-sm">{topic.description}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className={`w-full bg-gradient-to-r ${topic.color} hover:opacity-90 transition-opacity`}
                    >
                      Start Interview
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={showSignOutModal} onOpenChange={setShowSignOutModal}>
        <DialogContent className="bg-gray-900 border-gray-700 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-white">Sign Out</DialogTitle>
          </DialogHeader>
          <div className="text-gray-300 py-4">
            Are you sure you want to sign out?
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSignOutModal(false)}
              disabled={isSigningOut}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSignOut} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Signing out...
                </>
              ) : (
                'Sign Out'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfileModal} onOpenChange={setShowEditProfileModal}>
        <DialogContent className="bg-gray-900 border-gray-700 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Profile</DialogTitle>
          </DialogHeader>
          
          {/* Security Notice */}
          <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 rounded-full bg-yellow-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-400 text-xs">!</span>
              </div>
              <div>
                <h4 className="text-yellow-400 font-medium text-sm">Security Notice</h4>
                <p className="text-yellow-300 text-xs mt-1">
                  Due to security reasons, profile editing is currently disabled. Please contact support if you need to update your information.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-white">Full Name</Label>
              <Input
                id="name"
                value={editingProfile.full_name}
                onChange={(e) => setEditingProfile({ ...editingProfile, full_name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                disabled
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="field" className="text-white">Field</Label>
              <Select 
                value={editingProfile.field}
                onValueChange={(value) => setEditingProfile({ ...editingProfile, field: value })}
                disabled
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Non-Technical">Non-Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="branch" className="text-white">Branch</Label>
              <Input
                id="branch"
                value={editingProfile.branch}
                onChange={(e) => setEditingProfile({ ...editingProfile, branch: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                disabled
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city" className="text-white">City</Label>
              <Input
                id="city"
                value={editingProfile.city}
                onChange={(e) => setEditingProfile({ ...editingProfile, city: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                disabled
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProfileModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Personalized Welcome Modal */}
      <PersonalizedWelcomeModal
        userName={profile.full_name?.split(' ')[0] || ''}
        isOpen={showWelcomeModal}
        onClose={handleWelcomeModalClose}
      />
    </div>
  );
}

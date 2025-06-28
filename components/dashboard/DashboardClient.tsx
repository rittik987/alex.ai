'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Brain, 
  MessageCircle, 
  Video,
  Code, 
  TrendingUp, 
  Clock,
  Target,
  Award,
  Settings,
  LogOut,
  Calendar,
  BookOpen,
  Edit,
  Play,
  Zap,
  Database,
  Globe,
  Layers
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/supabase/auth';

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

export default function DashboardClient({ user, profile }: DashboardClientProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'chat' | 'video' | null>(null);

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
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={signOut} className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
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
            <Button variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </Card>

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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/70 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Practice Sessions</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-400" />
            </div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/70 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Coding Challenges</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <Code className="h-8 w-8 text-green-400" />
            </div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/70 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Score</p>
                <p className="text-2xl font-bold text-white">-</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/70 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Readiness</p>
                <p className="text-2xl font-bold text-white">0%</p>
              </div>
              <Target className="h-8 w-8 text-pink-400" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No recent activity yet</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Start your first interview practice session to see your progress here
                </p>
                <Button 
                  onClick={() => handleInterviewModeSelect('chat')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Your First Interview
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Interview Readiness</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Overall Progress</span>
                    <span className="text-white">0%</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Communication</span>
                    <span className="text-gray-400">Not assessed</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Technical Skills</span>
                    <span className="text-gray-400">Not assessed</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Problem Solving</span>
                    <span className="text-gray-400">Not assessed</span>
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
    </div>
  );
}
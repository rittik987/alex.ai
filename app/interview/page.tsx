'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/interview/ChatInterface';
import CodeEditor from '@/components/interview/CodeEditor';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Code, MessageCircle, Video, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const topicTitles: Record<string, string> = {
  'problem-solving-dsa': 'Problem Solving & DSA',
  'reactjs-deep-dive': 'ReactJS Deep Dive',
  'nextjs-fullstack': 'Next.js & Full-Stack',
  'system-design-basics': 'System Design Basics'
};

export default function InterviewPage() {
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState<string>('problem-solving-dsa');
  const [mode, setMode] = useState<string>('chat');
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    // Safely handle searchParams with error boundary
    const initializePage = () => {
      try {
        const topicParam = searchParams?.get('topic') || 'problem-solving-dsa';
        const modeParam = searchParams?.get('mode') || 'chat';
        
        console.log('🎯 Interview Page: Setting topic and mode:', { topicParam, modeParam });
        
        setTopic(topicParam);
        setMode(modeParam);
      } catch (error) {
        console.error('❌ Interview Page: Error reading search params:', error);
        // Use defaults if there's an error
        setTopic('problem-solving-dsa');
        setMode('chat');
      } finally {
        setIsPageLoading(false);
      }
    };

    // Add a small delay to ensure searchParams are ready
    const timer = setTimeout(initializePage, 100);
    return () => clearTimeout(timer);
  }, [searchParams]);

  const topicTitle = topicTitles[topic] || 'Interview Practice';

  // Show loading state while page is initializing
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-300">Loading interview session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Interview Practice Session</h1>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-500/20 text-purple-300">
                    {topicTitle}
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-300">
                    {mode === 'chat' ? 'Chat Mode' : 'Video Mode'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Mode Notice */}
        {mode === 'video' && (
          <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6 mb-6">
            <div className="flex items-center gap-3">
              <Video className="h-6 w-6 text-purple-400" />
              <div>
                <h3 className="text-white font-semibold">Video Interview Mode</h3>
                <p className="text-gray-300 text-sm">
                  Video interview functionality is coming soon! For now, enjoy our advanced chat-based interview practice.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Panel - Chat & Coding Tabs */}
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <Tabs defaultValue="chat" className="h-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-700/50">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Chat Interview
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Coding Challenge
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="h-[calc(100%-3rem)]">
                <ChatInterface topic={topic} />
              </TabsContent>
              
              <TabsContent value="code" className="h-[calc(100%-3rem)]">
                <CodeEditor />
              </TabsContent>
            </Tabs>
          </Card>

          {/* Right Panel - AI Coach Feedback */}
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">AI Coach Feedback</h2>
            </div>
            
            <div className="space-y-4 h-[calc(100%-3rem)] overflow-y-auto">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-300 mb-2">Real-time Analysis</h3>
                <p className="text-gray-300 text-sm">
                  Start your interview practice to receive personalized feedback and coaching tips for {topicTitle}.
                </p>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-300 mb-2">Performance Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Communication</span>
                    <span className="text-gray-300 text-sm">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Technical Skills</span>
                    <span className="text-gray-300 text-sm">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Problem Solving</span>
                    <span className="text-gray-300 text-sm">-</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-300 mb-2">Topic Focus: {topicTitle}</h3>
                <p className="text-gray-300 text-sm">
                  {topic === 'problem-solving-dsa' && 'Focus on algorithmic thinking, data structure selection, and code optimization.'}
                  {topic === 'reactjs-deep-dive' && 'Demonstrate knowledge of React hooks, state management, and component lifecycle.'}
                  {topic === 'nextjs-fullstack' && 'Show understanding of SSR, API routes, and full-stack architecture.'}
                  {topic === 'system-design-basics' && 'Explain scalability, load balancing, and distributed system concepts.'}
                </p>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-300 mb-2">Suggestions</h3>
                <p className="text-gray-300 text-sm">
                  Coaching suggestions will appear here as you progress through the interview.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
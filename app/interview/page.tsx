'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/interview/ChatInterface';
import CodeEditor from '@/components/interview/CodeEditor';
import VideoInterface from '@/components/interview/VideoInterface';
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

function InterviewContent() {
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

        {/* Video Mode */}
        {mode === 'video' ? (
          <VideoInterface topic={topic} />
        ) : (
          <div className="h-[calc(100vh-12rem)]">
            <ChatInterface topic={topic} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-300">Loading interview session...</p>
        </div>
      </div>
    }>
      <InterviewContent />
    </Suspense>
  );
}

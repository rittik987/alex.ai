'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Play } from 'lucide-react';

interface PersonalizedWelcomeModalProps {
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PersonalizedWelcomeModal({
  userName,
  isOpen,
  onClose
}: PersonalizedWelcomeModalProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState<'initializing' | 'generating' | 'processing'>('initializing');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && !videoUrl && !videoId) {
      console.log('🎬 Modal opened, resetting state for:', userName);
      setIsLoading(true);
      setError(null);
      setLoadingProgress(0);
      setLoadingStage('initializing');
    }
  }, [isOpen, userName, videoUrl, videoId]);

  // Remove the loading animation sequence since we'll use actual progress

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let hasStartedGeneration = false;

    const generateVideo = async () => {
      if (hasStartedGeneration) return;
      hasStartedGeneration = true;

      try {
        setIsLoading(true);
        setError(null);
        setLoadingStage('generating');

        console.log('🎬 Starting video generation for:', userName);

        // Request video generation
        const response = await fetch('/api/tavus/personalized-greeting', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userName }),
        });

        if (!response.ok) {
          console.error('❌ Failed to generate video:', response.status);
          throw new Error('Failed to generate welcome video');
        }

        const data = await response.json();
        console.log('✅ Video generation started, ID:', data.video_id);
        setVideoId(data.video_id);

        // Set initial progress based on initial response
        if (data.generation_progress) {
          const progressMatch = data.generation_progress.match(/(\d+)\/100/);
          if (progressMatch) {
            setLoadingProgress(parseInt(progressMatch[1]));
          }
        } else {
          setLoadingProgress(10); // Initial progress
        }

        // Check if video is already available
        if (data.hosted_url && data.status === 'completed') {
          console.log('🎉 Video already completed:', data.hosted_url);
          setVideoUrl(data.hosted_url);
          setIsLoading(false);
          return;
        }

    // Start polling for video status
    pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(`/api/tavus/personalized-greeting?video_id=${data.video_id}`);
        const statusData = await statusResponse.json();

        console.log('📊 Video status:', statusData.status, 'Progress:', statusData.generation_progress);
        
        // Extract progress from generation_progress field
        if (statusData.generation_progress) {
          const progressMatch = statusData.generation_progress.match(/(\d+)\/100/);
          if (progressMatch) {
            const currentProgress = parseInt(progressMatch[1]);
            setLoadingProgress(currentProgress);
            console.log('📈 Progress updated:', currentProgress + '%');
          }
        }

        // Update progress based on status
        switch (statusData.status) {
          case 'queued':
            setLoadingStage('generating');
            // Keep existing progress or set minimum
            if (loadingProgress < 10) setLoadingProgress(10);
            break;
          case 'processing':
            setLoadingStage('processing');
            // Keep existing progress or set minimum
            if (loadingProgress < 50) setLoadingProgress(50);
            break;
          case 'completed':
            if (statusData.hosted_url) {
              setLoadingProgress(100);
              setVideoUrl(statusData.hosted_url);
              setIsLoading(false);
              clearInterval(pollInterval);
              console.log('🎉 Video completed:', statusData.hosted_url);
              // Force video player to reload with new URL
              const videoElement = document.querySelector('video');
              if (videoElement) {
                videoElement.load();
              }
            }
            break;
          case 'failed':
            console.error('❌ Video generation failed');
            setError('Failed to generate welcome video');
            setIsLoading(false);
            clearInterval(pollInterval);
            break;
          default:
            // Keep current progress for unknown status
            console.log('⏳ Waiting for video generation...');
        }
          } catch (pollError) {
            console.error('❌ Error polling video status:', pollError);
            // Don't fail immediately on polling errors, keep trying
          }
        }, 3000); // Poll every 3 seconds

        // Timeout after 2 minutes
        setTimeout(() => {
          if (isLoading) {
            console.log('⏰ Video generation timeout');
            setError('Video generation is taking longer than expected. Please try again.');
            setIsLoading(false);
            clearInterval(pollInterval);
          }
        }, 120000);

      } catch (error) {
        console.error('💥 Error generating welcome video:', error);
        setError('Failed to generate welcome video');
        setIsLoading(false);
      }
    };

    if (isOpen && !videoUrl && !videoId && isLoading) {
      generateVideo();
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isOpen, userName, videoId, videoUrl, isLoading]);

  // Determine if we should show video
  const showVideo = !isLoading && !error && videoUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-white text-center">
            {isLoading ? 'Creating Your Personalized Welcome' : 
             showVideo ? 'Your Personalized Welcome Message' :
             'Welcome to InterviewCracker AI!'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 py-6">
          {isLoading ? (
            <div className="text-center space-y-4">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="w-full h-full rounded-full border-4 border-purple-500/20 flex items-center justify-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {loadingProgress}
                    <span className="text-lg ml-1">%</span>
                  </div>
                </div>
                <div 
                  className="absolute inset-0 rounded-full border-4 border-purple-500"
                  style={{
                    clipPath: `circle(${loadingProgress}% at 50% 50%)`,
                    transition: 'clip-path 0.3s ease-in-out'
                  }}
                />
              </div>
              <h3 className="text-xl font-semibold text-white">
                {loadingStage === 'initializing' && 'Initializing AI Replica...'}
                {loadingStage === 'generating' && 'Generating your personalized welcome message...'}
                {loadingStage === 'processing' && 'Processing final touches...'}
              </h3>
              <div className="space-y-2">
                <p className="text-gray-400">
                  Please wait while Alex creates a special greeting just for you.
                </p>
                <p className="text-sm text-gray-500">
                  {loadingStage === 'initializing' && 'Setting up the AI environment...'}
                  {loadingStage === 'generating' && 'Creating personalized video with your name...'}
                  {loadingStage === 'processing' && 'Finalizing the video quality...'}
                </p>
              </div>
            </div>
          ) : videoUrl ? (
            // Show video when available
            <div className="space-y-6 w-full">
              <div className="relative aspect-video w-full bg-gray-800 rounded-lg overflow-hidden">
                <video
                  key={videoUrl} // Force remount when URL changes
                  src={videoUrl}
                  controls
                  autoPlay
                  muted={false}
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                  poster="/alex_replica.mp4"
                  onError={(e) => {
                    console.error('❌ Video playback error:', e);
                    setError('Video playback failed');
                  }}
                  onLoadStart={() => console.log('📹 Video loading started')}
                  onCanPlay={() => console.log('✅ Video ready to play')}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Welcome to Your Interview Success Journey, {userName}!
                </h3>
                <p className="text-gray-300 text-sm">
                  Alex has created this personalized message just for you.
                </p>
                <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">
                  <Play className="h-4 w-4 mr-2" />
                  Start Your Journey
                </Button>
              </div>
            </div>
          ) : (
            // Show welcome message if no video and no error
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-white">
                Welcome to InterviewCracker AI, {userName}!
              </h3>
              <p className="text-gray-300">
                We're excited to help you prepare for your interviews and achieve your career goals.
              </p>
              <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">
                Get Started
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

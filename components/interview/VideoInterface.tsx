'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Button } from '@/components/ui/button';
import { Brain, Mic, MicOff, Code, Play, Send, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

enum InterviewState {
  IDLE = 'IDLE',
  AI_SPEAKING = 'AI_SPEAKING',
  USER_LISTENING = 'USER_LISTENING',
  AI_THINKING = 'AI_THINKING',
}

interface CurrentQuestion {
  id: number;
  type: string;
  text: string;
  difficulty?: string;
}

export default function VideoInterface({ topic }: { topic: string }) {
  const [interviewState, setInterviewState] = useState<InterviewState>(InterviewState.IDLE);
  const [aiText, setAiText] = useState('');
  const [subtitle, setSubtitle] = useState('Welcome to your video interview! Starting automatically...');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [isInterviewActive, setIsInterviewActive] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();

  // Start the interview automatically on mount
  useEffect(() => {
    if (isInterviewActive) {
      startInterview();
    }
  }, [isInterviewActive]);

  // Auto-detect silence and process speech
  useEffect(() => {
    if (interviewState === InterviewState.USER_LISTENING && isListening) {
      // Clear existing timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      // Set new timeout for silence detection (3 seconds)
      silenceTimeoutRef.current = setTimeout(() => {
        if (transcript.trim() !== '') {
          console.log('🎤 Silence detected, processing speech:', transcript);
          stopListening();
          setInterviewState(InterviewState.AI_THINKING);
          setSubtitle('Processing your response...');
          processUserResponse(transcript.trim());
          resetTranscript();
        }
      }, 3000);
    }

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [transcript, isListening, interviewState]);

  // Start the interview by fetching the first question
  const startInterview = async () => {
    setInterviewState(InterviewState.AI_THINKING);
    setSubtitle('Starting your interview...');
    
    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, history: [], currentQuestionIndex: 0 }),
      });
      const data = await response.json();
      if (data.aiResponse) {
        setAiText(data.aiResponse);
        setSubtitle(data.aiResponse);
        await generateAndPlayAudio(data.aiResponse);
      } else {
        setInterviewState(InterviewState.IDLE);
        setSubtitle('Failed to start interview. Please try again.');
      }
    } catch (error) {
      console.error('Failed to start interview:', error);
      setInterviewState(InterviewState.IDLE);
      setSubtitle('Failed to start interview. Please try again.');
    }
  };

  // Generate audio using ElevenLabs TTS and play it
  const generateAndPlayAudio = async (text: string) => {
    setInterviewState(InterviewState.AI_SPEAKING);
    console.log('🎵 Generating audio for text:', text);
    
    try {
      const response = await fetch('/api/interview/voice-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      console.log('🎵 TTS API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎵 TTS API error:', errorText);
        throw new Error(`Failed to generate audio: ${response.status}`);
      }

      const data = await response.json();
      console.log('🎵 TTS API response data:', data);
      
      if (data.audioData) {
        setAudioUrl(data.audioData);
        console.log('🎵 Audio URL set, should start playing...');
        // Audio will auto-play due to autoPlay attribute
      } else {
        console.error('🎵 No audio data in response');
        throw new Error('No audio data received');
      }
    } catch (error) {
      console.error('🎵 Failed to generate audio:', error);
      // Fallback: proceed to listening without audio
      setTimeout(() => {
        setInterviewState(InterviewState.USER_LISTENING);
        setSubtitle('Audio generation failed. Your turn to speak...');
        startListening();
      }, 2000);
    }
  };

  // When audio playback ends, automatically start user listening
  const handleAudioEnded = () => {
    if (isInterviewActive && !showCodeEditor) {
      setInterviewState(InterviewState.USER_LISTENING);
      setSubtitle('Your turn to speak...');
      setTimeout(() => {
        startListening();
      }, 500);
    }
  };

  // Process user response by sending to chat API and then generating audio
  const processUserResponse = async (userText: string) => {
    const userMessage = {
      id: `user-${Date.now()}`,
      content: userText,
      sender: 'user',
      timestamp: new Date()
    };

    const updatedHistory = [...conversationHistory, userMessage];
    setConversationHistory(updatedHistory);

    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic, 
          history: updatedHistory, 
          currentQuestionIndex 
        }),
      });

      const data = await response.json();
      if (data.aiResponse) {
        const aiMessage = {
          id: `ai-${Date.now()}`,
          content: data.aiResponse,
          sender: 'ai',
          timestamp: new Date()
        };

        setConversationHistory(prev => [...prev, aiMessage]);
        setAiText(data.aiResponse);
        setSubtitle(data.aiResponse);

        // Update question index if moving to next question
        if (data.currentQuestionIndex !== undefined) {
          setCurrentQuestionIndex(data.currentQuestionIndex);
        }

        // Check if next question is coding type
        if (data.nextQuestion) {
          setCurrentQuestion(data.nextQuestion);
          const isCodingQuestion = data.nextQuestion.type === 'coding';
          setShowCodeEditor(isCodingQuestion);
          
          if (isCodingQuestion) {
            setUserCode('// Write your solution here\n');
          }
        }

        await generateAndPlayAudio(data.aiResponse);
      } else {
        setInterviewState(InterviewState.IDLE);
        setSubtitle('Interview completed. Thank you!');
        setIsInterviewActive(false);
      }
    } catch (error) {
      console.error('Failed to process user response:', error);
      setInterviewState(InterviewState.IDLE);
      setSubtitle('Error processing response. Please try again.');
    }
  };

  // Handle code compilation and submission
  const handleCodeCompile = async () => {
    if (!userCode.trim()) return;

    setInterviewState(InterviewState.AI_THINKING);
    setSubtitle('Analyzing your code...');

    const codeMessage = `Here's my solution in ${selectedLanguage}:\n\n\`\`\`${selectedLanguage}\n${userCode}\n\`\`\`\n\nPlease review this code and provide feedback.`;
    
    await processUserResponse(codeMessage);
  };

  const handleCodeSubmit = async () => {
    if (!userCode.trim()) return;

    setInterviewState(InterviewState.AI_THINKING);
    setSubtitle('Submitting your solution...');

    const submitMessage = `I'm ready to submit this solution:\n\n\`\`\`${selectedLanguage}\n${userCode}\n\`\`\`\n\nPlease move to the next question.`;
    
    await processUserResponse(submitMessage);
    setShowCodeEditor(false);
    setUserCode('');
  };

  const endInterview = () => {
    setIsInterviewActive(false);
    setInterviewState(InterviewState.IDLE);
    setSubtitle('Interview ended. Thank you for your time!');
    stopListening();
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  if (showCodeEditor) {
    return (
      <div className="w-full h-screen bg-gray-900 flex text-white">
        {/* Left Panel - Alex Interface */}
        <div className="w-1/2 flex flex-col">
          <div className="relative flex-1 bg-black rounded-xl overflow-hidden shadow-2xl m-4">
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <div className="text-4xl">🤖</div>
                </div>
                <h3 className="text-xl font-bold text-white">Alex AI Coach</h3>
                <p className="text-white/80 text-sm">Code Review Assistant</p>
              </div>
            </div>
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="text-center">
                <p className="text-white text-sm font-medium leading-relaxed">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Status and Controls */}
          <div className="p-4 flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-3">
              {interviewState === InterviewState.AI_THINKING && (
                <div className="flex items-center space-x-2 text-yellow-400">
                  <Brain className="animate-spin w-4 h-4" />
                  <span className="font-medium text-sm">Analyzing...</span>
                </div>
              )}
              {interviewState === InterviewState.AI_SPEAKING && (
                <div className="flex items-center space-x-2 text-green-400">
                  <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium text-sm">Speaking...</span>
                </div>
              )}
            </div>

            <Button
              onClick={endInterview}
              variant="destructive"
              size="sm"
              className="flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>End Interview</span>
            </Button>
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="w-1/2 flex flex-col p-4">
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Code className="w-5 h-5 mr-2" />
              Coding Challenge
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {currentQuestion?.text || 'Loading question...'}
            </p>
          </div>

          <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex space-x-2">
                <Button
                  onClick={handleCodeCompile}
                  size="sm"
                  className="flex items-center space-x-2"
                  disabled={interviewState === InterviewState.AI_THINKING}
                >
                  <Play className="w-4 h-4" />
                  <span>Compile & Review</span>
                </Button>
                <Button
                  onClick={handleCodeSubmit}
                  size="sm"
                  variant="secondary"
                  className="flex items-center space-x-2"
                  disabled={interviewState === InterviewState.AI_THINKING}
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Solution</span>
                </Button>
              </div>
            </div>

            <Textarea
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              placeholder="Write your solution here..."
              className="flex-1 font-mono text-sm bg-gray-900 border-gray-600 resize-none"
            />
          </div>
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl || undefined}
          onEnded={handleAudioEnded}
          autoPlay
          hidden
        />
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6">
      <div className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl mb-8">
        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
              <div className="text-6xl">🤖</div>
            </div>
            <h3 className="text-2xl font-bold text-white">Alex AI Coach</h3>
            <p className="text-white/80">Your Interview Assistant</p>
          </div>
        </div>
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="text-center">
            <p className="text-white text-lg font-medium leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-6">
        {/* Status Indicator */}
        <div className="flex items-center space-x-3">
          {interviewState === InterviewState.USER_LISTENING && (
            <div className="flex items-center space-x-2 text-blue-400">
              <Mic className="animate-pulse w-5 h-5" />
              <span className="font-medium">Listening...</span>
            </div>
          )}
          {interviewState === InterviewState.AI_THINKING && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <Brain className="animate-spin w-5 h-5" />
              <span className="font-medium">Processing...</span>
            </div>
          )}
          {interviewState === InterviewState.AI_SPEAKING && (
            <div className="flex items-center space-x-2 text-green-400">
              <div className="w-5 h-5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-medium">Speaking...</span>
            </div>
          )}
          {!isInterviewActive && (
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
              <span className="font-medium">Interview Ended</span>
            </div>
          )}
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl || undefined}
          onEnded={handleAudioEnded}
          onLoadStart={() => console.log('🎵 Audio loading started')}
          onCanPlay={() => console.log('🎵 Audio can play')}
          onPlay={() => console.log('🎵 Audio started playing')}
          onError={(e) => console.error('🎵 Audio error:', e)}
          autoPlay
          hidden
        />

        {/* End Interview Button */}
        {isInterviewActive && (
          <Button
            onClick={endInterview}
            variant="destructive"
            size="lg"
            className="flex items-center space-x-2"
          >
            <X className="w-5 h-5" />
            <span>End Interview</span>
          </Button>
        )}

        {/* Speech Recognition Status */}
        {!isSupported && (
          <p className="text-red-400 text-sm">
            Speech recognition is not supported in your browser.
          </p>
        )}

        {/* Current Transcript */}
        {transcript && interviewState === InterviewState.USER_LISTENING && (
          <div className="bg-gray-800 rounded-lg p-4 max-w-2xl">
            <p className="text-gray-300 text-sm">
              <span className="text-blue-400 font-medium">You're saying:</span> {transcript}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

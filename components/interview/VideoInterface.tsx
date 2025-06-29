'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Button } from '@/components/ui/button';
import { Brain, Mic, MicOff, Code, Play, Send, X, CheckCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AudioStreamHandler } from '@/lib/utils/audio-handler';
import CodeEditor from '@/components/interview/CodeEditor';
import { TeachingMode } from '@/components/interview/TeachingMode';

enum InterviewState {
  IDLE = 'IDLE',
  AI_SPEAKING = 'AI_SPEAKING',
  USER_LISTENING = 'USER_LISTENING',
  AI_THINKING = 'AI_THINKING',
  COMPLETED = 'COMPLETED',
}

interface CurrentQuestion {
  id: number;
  type: string;
  text: string;
  difficulty?: string;
}

interface TeachingStep {
  type: 'markdown' | 'code';
  content: string;
  explanation: string;
}

interface TeachingSession {
  active: boolean;
  content: string;
  questionText: string;
  modelAnswer: string;
}

interface InterviewFeedback {
  communication: string;
  technicalSkills: string;
  problemSolving: string;
  suggestions: string[];
}

interface InterviewData {
  responses: string[];
  startTime: Date | null;
  endTime: Date | null;
  questionsAnswered: number;
}

export default function VideoInterface({ topic }: { topic: string }) {
  const [interviewState, setInterviewState] = useState<InterviewState>(InterviewState.IDLE);
  const [aiText, setAiText] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [subtitle, setSubtitle] = useState('Welcome! Click "Start Interview" to begin.');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [questionSet, setQuestionSet] = useState<CurrentQuestion[]>([]);
  const [isInterviewActive, setIsInterviewActive] = useState(true);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [teachingSession, setTeachingSession] = useState<TeachingSession>({
    active: false,
    content: '',
    questionText: '',
    modelAnswer: ''
  });
  const [feedback, setFeedback] = useState<InterviewFeedback>({
    communication: '-',
    technicalSkills: '-',
    problemSolving: '-',
    suggestions: []
  });
  const [interviewData, setInterviewData] = useState<InterviewData>({
    responses: [],
    startTime: null,
    endTime: null,
    questionsAnswered: 0
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioStreamHandler = useRef<AudioStreamHandler | null>(null);
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();

  // Initialize audio handler and start interview
  useEffect(() => {
    audioStreamHandler.current = new AudioStreamHandler();
    setIsInterviewActive(true);
    setInterviewState(InterviewState.IDLE);
    setSubtitle('Welcome! Click "Start Interview" to begin.');

    return () => {
      if (audioStreamHandler.current) {
        audioStreamHandler.current.dispose();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
      }
      stopListening();
    };
  }, []);

  // Start the interview
  const startInterview = async () => {
    setInterviewState(InterviewState.AI_THINKING);
    setSubtitle('Starting your interview...');
    setCurrentQuestionIndex(0);
    
    // Initialize interview data
    setInterviewData({
      responses: [],
      startTime: new Date(),
      endTime: null,
      questionsAnswered: 0
    });

    // Initialize feedback
    setFeedback({
      communication: 'Evaluating...',
      technicalSkills: 'Evaluating...',
      problemSolving: 'Evaluating...',
      suggestions: ['Interview in progress...']
    });
    
    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, history: [], currentQuestionIndex: 0 }),
      });
      const data = await response.json();
      if (data.aiResponse) {
        setAiText(data.aiResponse);
        if (data.questionSet) {
          setQuestionSet(data.questionSet);
          setCurrentQuestion(data.questionSet[0]);
        }
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

  // Handle audio playback end
  const handleAudioEnded = () => {
    if (isInterviewActive) {
      setInterviewState(InterviewState.USER_LISTENING);
      setSubtitle('Your turn to speak...');
      resetTranscript();
      lastTranscriptRef.current = '';
      stopListening();
      setTimeout(() => {
        console.log('Starting speech recognition...');
        startListening();
      }, 500);
    }
  };

  // Generate feedback based on interview data
  const generateFeedback = () => {
    const { responses, startTime, questionsAnswered } = interviewData;
    
    // Calculate metrics
    const averageResponseLength = responses.reduce((sum, r) => sum + r.length, 0) / responses.length;
    const completionRate = (questionsAnswered / questionSet.length) * 100;
    const duration = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 60000) : 0;
    
    // Generate feedback based on metrics
    const communication = averageResponseLength > 200 ? 'Excellent' : averageResponseLength > 100 ? 'Good' : 'Needs Improvement';
    const technicalSkills = completionRate > 80 ? 'Strong' : completionRate > 60 ? 'Good' : 'Developing';
    const problemSolving = duration < 30 ? 'Efficient' : duration < 45 ? 'Methodical' : 'Thorough';
    
    // Generate suggestions
    const suggestions = [];
    if (averageResponseLength < 150) suggestions.push('Try to provide more detailed responses');
    if (completionRate < 80) suggestions.push('Focus on completing all questions thoroughly');
    if (duration > 45) suggestions.push('Work on improving response time while maintaining quality');
    suggestions.push('Keep practicing and stay confident!');
    
    return {
      communication,
      technicalSkills,
      problemSolving,
      suggestions
    };
  };

  // Process user response and generate AI reply
  const processUserResponse = async (userInput: string) => {
    if (!userInput.trim() || !isInterviewActive) return;
    
    // Track user response for feedback
    setInterviewData(prev => ({
      ...prev,
      responses: [...prev.responses, userInput]
    }));
    
    // Stop listening and update state
    stopListening();
    setInterviewState(InterviewState.AI_THINKING);
    setSubtitle('Processing your response...');

    // Check if user is asking for help/teaching
    const helpKeywords = ['teach me', 'help me', 'explain', 'i dont know', "i don't know", 'how to', 'show me'];
    const isAskingForHelp = helpKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword)
    );

    if (isAskingForHelp && currentQuestion) {
      console.log('🎓 Help request detected:', userInput);
      console.log('🎓 Current question:', currentQuestion);
      
      try {
        const response = await fetch('/api/interview/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            currentQuestionIndex,
            questionType: currentQuestion.type,
            isTeachingRequest: true,
            questionText: currentQuestion.text
          }),
        });

        console.log('🎓 Teaching response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Teaching API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('🎓 Teaching response data:', data);
        
        if (!data.teachingContent) {
          throw new Error('No teaching content in response');
        }

        setTeachingSession({
          active: true,
          content: data.teachingContent,
          questionText: currentQuestion.text,
          modelAnswer: data.modelAnswer || ''
        });
        
        setInterviewState(InterviewState.IDLE);
        setSubtitle('Teaching mode activated. Check the teaching panel on the right.');
        return;
      } catch (error) {
        console.error('🎓 Failed to start teaching mode:', error);
        setInterviewState(InterviewState.USER_LISTENING);
        setSubtitle('Sorry, I couldn\'t prepare the teaching materials. Please try again.');
        setTimeout(() => {
          startListening();
        }, 1000);
        return;
      }
    }
    
    // Stop listening and update state
    stopListening();
    setInterviewState(InterviewState.AI_THINKING);
    setSubtitle('Processing your response...');

    // Clear silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    try {
      // Send to AI for response
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic, 
          userInput,
          currentQuestionIndex,
          questionType: currentQuestion?.type 
        }),
      });

      const data = await response.json();
      
      if (data.aiResponse) {
        setAiText(data.aiResponse);
        
        // Update question index and current question
        if (data.moveToNext && data.currentQuestionIndex !== undefined) {
          const newIndex = data.currentQuestionIndex;
          setCurrentQuestionIndex(newIndex);
          if (questionSet[newIndex]) {
            setCurrentQuestion(questionSet[newIndex]);
          }
          console.log('✅ Updated to question index:', newIndex);
          
          // Close teaching mode when moving to next question
          setTeachingSession(prev => ({ ...prev, active: false }));
          
          // If we moved to next question, ask the next question instead of the AI response
          if (questionSet[newIndex]) {
            const nextQuestionText = questionSet[newIndex].text;
            console.log('🎯 Asking next question:', nextQuestionText);
            await generateAndPlayAudio(nextQuestionText);
            return; // Don't play the AI response, play the next question
          }
        }

        // Check if next question is coding type
        if (data.nextQuestionType === 'coding') {
          setShowCodeEditor(true);
        } else {
          setShowCodeEditor(false);
        }

        // Generate and play audio response (only if not moving to next question)
        if (!data.moveToNext) {
          await generateAndPlayAudio(data.aiResponse);
        }
      } else {
        throw new Error('No AI response received');
      }
    } catch (error) {
      console.error('Failed to process user response:', error);
      setInterviewState(InterviewState.USER_LISTENING);
      setSubtitle('Sorry, there was an error. Please try again.');
      setTimeout(() => {
        startListening();
      }, 1000);
    }
  };

  // Start teaching mode
  const startTeachingMode = async (question: CurrentQuestion) => {
    setInterviewState(InterviewState.AI_THINKING);
    setSubtitle('Preparing teaching materials...');
    stopListening();

    try {
      console.log('🎓 Starting teaching mode for question:', question);
      
      const requestBody = {
        topic,
        currentQuestionIndex,
        questionType: question.type,
        isTeachingRequest: true,
        questionText: question.text
      };
      
      console.log('🎓 Teaching request body:', requestBody);

      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('🎓 Teaching response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Teaching API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('🎓 Teaching response data:', data);
      
      if (data.teachingContent) {
        console.log('🎓 Teaching content received, activating teaching mode');
        setTeachingSession({
          active: true,
          content: data.teachingContent,
          questionText: question.text,
          modelAnswer: data.modelAnswer || ''
        });
        
        setInterviewState(InterviewState.IDLE);
        setSubtitle('Teaching mode activated. Check the teaching panel on the right.');
      } else {
        console.error('🎓 No teaching content in response:', data);
        throw new Error(`No teaching content received. Response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('🎓 Failed to start teaching mode:', error);
      setInterviewState(InterviewState.USER_LISTENING);
      setSubtitle('Sorry, I couldn\'t prepare the teaching materials. Please try again.');
      setTimeout(() => {
        startListening();
      }, 1000);
    }
  };

  // Handle ready from teaching mode
  const handleTeachingReady = () => {
    setTeachingSession(prev => ({ ...prev, active: false }));
    setInterviewState(InterviewState.AI_SPEAKING);
    
    // Ask the question again
    if (currentQuestion) {
      generateAndPlayAudio(currentQuestion.text);
    }
  };

  // Handle code submission
  const handleCodeSubmission = async (code: string, language: string) => {
    setInterviewState(InterviewState.AI_THINKING);
    setSubtitle('Evaluating your code...');

    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          code,
          language,
          currentQuestionIndex,
          isCodeSubmission: true
        }),
      });

      const data = await response.json();
      
      if (data.aiResponse) {
        setAiText(data.aiResponse);
        
        if (data.moveToNext) {
          const newIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(newIndex);
          if (questionSet[newIndex]) {
            setCurrentQuestion(questionSet[newIndex]);
          }
          setShowCodeEditor(false);
        }

        await generateAndPlayAudio(data.aiResponse);
      }
    } catch (error) {
      console.error('Failed to process code submission:', error);
      setSubtitle('Error evaluating code. Please try again.');
    }
  };

  // Handle silence detection
  const handleSilenceDetection = () => {
    if (transcript.trim() && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      processUserResponse(transcript);
    }
  };

  // Monitor transcript changes and speech recognition state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const handleSpeechEnd = () => {
      if (transcript.trim() && transcript !== lastTranscriptRef.current) {
        console.log('Processing response after speech end:', transcript);
        lastTranscriptRef.current = transcript;
        processUserResponse(transcript);
      }
    };

    if (interviewState === InterviewState.USER_LISTENING) {
      if (!isListening && transcript.trim()) {
        // User stopped speaking - process after a short delay
        timeoutId = setTimeout(handleSpeechEnd, 1000);
      } else if (isListening && transcript.trim()) {
        // Clear any existing timeout while user is still speaking
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        // Set new silence detection timeout
        silenceTimeoutRef.current = setTimeout(handleSpeechEnd, 2000);
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, [transcript, isListening, interviewState]);

  // End the interview
  const endInterview = () => {
    setIsInterviewActive(false);
    setInterviewState(InterviewState.COMPLETED);
    setSubtitle('Interview ended. Thank you for your time!');
    stopListening();
    
    // Set end time and generate feedback
    setInterviewData(prev => ({
      ...prev,
      endTime: new Date(),
      questionsAnswered: currentQuestionIndex
    }));
    
    // Generate final feedback
    const finalFeedback = generateFeedback();
    setFeedback(finalFeedback);
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (audioStreamHandler.current) {
      audioStreamHandler.current.stop();
    }
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
  };

  // Generate and play audio
  const generateAndPlayAudio = async (text: string) => {
    console.log('🎵 Starting audio generation for text:', text);
    
    try {
      // Set AI speaking state immediately
      setInterviewState(InterviewState.AI_SPEAKING);
      setDisplayedText('');
      
      // Start TTS generation
      const response = await fetch('/api/interview/voice-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.audioData) {
        // Pre-load audio
        const audioElement = audioRef.current;
        if (!audioElement) {
          throw new Error('Audio element not initialized');
        }

        // Set up event handlers
        audioElement.oncanplay = () => {
          console.log('🎵 Audio ready to play');
          audioElement.play().catch(console.error);
        };
        
        audioElement.onplay = () => {
          console.log('🎵 Audio started playing');
          startTypewriterEffect(text);
        };
        
        audioElement.onended = () => {
          console.log('🎵 Audio ended');
          handleAudioEnded();
        };
        
        audioElement.onerror = () => {
          console.error('🎵 Audio playback error');
          handleAudioError();
        };

        // Set source and load
        setAudioUrl(data.audioData);
        audioElement.load();
        
      } else {
        throw new Error('No audio data received');
      }
      
    } catch (error) {
      console.error('🎵 Audio generation failed:', error);
      // Fallback to text-only mode
      setDisplayedText(text);
      setSubtitle(text);
      setInterviewState(InterviewState.USER_LISTENING);
      setTimeout(() => {
        startListening();
      }, 1000);
    }
  };

  // Handle audio errors gracefully
  const handleAudioError = () => {
    setDisplayedText(aiText);
    setSubtitle(aiText);
    setInterviewState(InterviewState.USER_LISTENING);
    setTimeout(() => {
      startListening();
    }, 1000);
  };

  // Typewriter effect for text display
  const startTypewriterEffect = (text: string) => {
    setDisplayedText('');
    const words = text.split(' ');
    let currentIndex = 0;
    
    const typeNextWord = () => {
      if (currentIndex < words.length) {
        setDisplayedText(words.slice(0, currentIndex + 1).join(' '));
        setSubtitle(words.slice(0, currentIndex + 1).join(' '));
        currentIndex++;
        typewriterTimeoutRef.current = setTimeout(typeNextWord, 200);
      }
    };
    
    typeNextWord();
  };

  return (
    <div className="w-full min-h-screen bg-gray-900 flex flex-col text-white">
      {/* Top Section - Progress and Video Interface */}
      <div className="flex flex-1 overflow-hidden">
        {/* Milestone Sidebar - Responsive */}
        <div className={`${teachingSession.active ? 'w-1/6' : 'w-1/4'} bg-gray-800 p-4 overflow-y-auto transition-all duration-300 ease-in-out`}>
          <h3 className="text-lg font-semibold mb-4 text-white">Progress</h3>
          <div className="space-y-2">
            {questionSet.map((question, index) => (
              <div
                key={question.id}
                className={`p-2 rounded-lg border-l-4 transition-all duration-200 ${
                  index < currentQuestionIndex
                    ? 'bg-green-900/50 border-green-400 text-green-100'
                    : index === currentQuestionIndex
                    ? 'bg-blue-900/50 border-blue-400 text-blue-100'
                    : 'bg-gray-700/50 border-gray-500 text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    index < currentQuestionIndex
                      ? 'bg-green-400'
                      : index === currentQuestionIndex
                      ? 'bg-blue-400'
                      : 'bg-gray-500'
                  }`} />
                  <span className="text-xs font-medium">Q{index + 1}</span>
                  {question.type && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-600/50">
                      {question.type}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 line-clamp-2 pl-4">{question.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area - Flexible width */}
        <div className={`${teachingSession.active ? 'flex-1' : 'flex-1'} flex flex-col overflow-hidden transition-all duration-300 ease-in-out`}>
          {/* Top Controls and Status */}
          <div className="p-4 space-y-4">
            {/* Control Buttons */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={startInterview}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                disabled={!isInterviewActive}
              >
                <Play className="w-5 h-5" />
                <span>Start Interview</span>
              </Button>
              <Button
                onClick={endInterview}
                size="lg"
                variant="destructive"
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>End Interview</span>
              </Button>
            </div>

          {/* Status Display */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-center space-x-3">
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
                  <div className="w-5 h-5 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-medium">Alex is speaking...</span>
                </div>
              )}
            </div>

            {/* User Input Display */}
            {transcript && interviewState === InterviewState.USER_LISTENING && (
              <div className="mt-4 bg-blue-900/30 rounded-lg p-3 border-l-4 border-blue-400">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 font-medium text-sm">You:</span>
                  <p className="text-white text-sm leading-relaxed flex-1">
                    {transcript}
                  </p>
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Alex Display - Optimized for visibility */}
          <div className="flex-1 p-4 flex flex-col">
            <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 opacity-75" />
              <div className="relative h-full flex flex-col items-center justify-center p-6">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <div className="text-4xl">🤖</div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Alex AI Coach</h3>
                <p className="text-white/80 text-sm mb-8">Your Interview Assistant</p>
                <div className="w-full max-w-2xl bg-black/50 rounded-lg p-4">
                  <p className="text-white text-lg font-medium leading-relaxed">
                    {displayedText || subtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Code Editor */}
          {showCodeEditor && (
            <div className="flex-1 overflow-hidden">
              <CodeEditor onSubmitCode={handleCodeSubmission} />
            </div>
          )}

          {/* Audio Element */}
          <audio
            ref={audioRef}
            src={audioUrl || undefined}
            onEnded={handleAudioEnded}
            autoPlay
            hidden
          />
        </div>

        {/* Teaching Mode Panel */}
        <TeachingMode
          content={teachingSession.content}
          onReady={handleTeachingReady}
          isVisible={teachingSession.active}
        />
      </div>

      {/* AI Coach Feedback Panel - Shows below video interface */}
      {!teachingSession.active && (interviewState === InterviewState.AI_SPEAKING || interviewState === InterviewState.USER_LISTENING || interviewState === InterviewState.AI_THINKING) && (
        <div className="bg-gray-800 border-t border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="h-6 w-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">AI Coach Feedback</h3>
          </div>
          
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gray-700/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-purple-300 mb-3">Real-time Analysis</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                {interviewData.responses.length === 0 
                  ? "Start answering questions to receive personalized feedback."
                  : `Great progress! You've answered ${interviewData.responses.length} question${interviewData.responses.length > 1 ? 's' : ''}. Keep going!`
                }
              </p>
            </div>
            
            <div className="bg-gray-700/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-blue-300 mb-3">Performance Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Communication</span>
                  <span className={`text-xs font-medium ${
                    feedback.communication === 'Excellent' ? 'text-green-400' :
                    feedback.communication === 'Good' ? 'text-blue-400' :
                    feedback.communication === 'Developing' ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>
                    {feedback.communication}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Technical Skills</span>
                  <span className={`text-xs font-medium ${
                    feedback.technicalSkills === 'Strong' ? 'text-green-400' :
                    feedback.technicalSkills === 'Good' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>
                    {feedback.technicalSkills}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Problem Solving</span>
                  <span className={`text-xs font-medium ${
                    feedback.problemSolving === 'Efficient' ? 'text-green-400' :
                    feedback.problemSolving === 'Good' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>
                    {feedback.problemSolving}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-green-300 mb-3">Topic Focus</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                {topic === 'problem-solving-dsa' && 'Focus on algorithms and data structures.'}
                {topic === 'reactjs-deep-dive' && 'Demonstrate React knowledge.'}
                {topic === 'nextjs-fullstack' && 'Show full-stack understanding.'}
                {topic === 'system-design-basics' && 'Explain system concepts.'}
              </p>
            </div>
            
            <div className="bg-gray-700/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-cyan-300 mb-3">Session Stats</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Duration</span>
                  <span className="text-white text-xs">
                    {interviewData.startTime ? Math.floor((new Date().getTime() - interviewData.startTime.getTime()) / 60000) : 0} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Questions</span>
                  <span className="text-white text-xs">
                    {currentQuestionIndex + 1}/{questionSet.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Responses</span>
                  <span className="text-white text-xs">{interviewData.responses.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Coach Feedback - Shows below when interview is completed */}
      {interviewState === InterviewState.COMPLETED && (
        <div className="bg-gray-800 border-t border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="h-8 w-8 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Interview Performance Analysis</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-sm font-medium text-purple-300 mb-3">Communication</h3>
              <p className="text-3xl font-bold text-white">{feedback.communication}</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-sm font-medium text-blue-300 mb-3">Technical Skills</h3>
              <p className="text-3xl font-bold text-white">{feedback.technicalSkills}</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-sm font-medium text-green-300 mb-3">Problem Solving</h3>
              <p className="text-3xl font-bold text-white">{feedback.problemSolving}</p>
            </div>
          </div>
          
          <div className="bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-medium text-yellow-300 mb-4">Improvement Suggestions</h3>
            <ul className="space-y-3">
              {feedback.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-300">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-base">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

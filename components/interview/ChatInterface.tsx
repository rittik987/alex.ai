'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Mic, MicOff, User, Bot, Clock, CheckCircle, Code, Play, X, Brain } from 'lucide-react';
import { TeachingMode } from './TeachingMode';
import CodeEditor from './CodeEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSubscription } from '@/lib/revenuecat/provider';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { UsageIndicator } from '@/components/subscription/UsageIndicator';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface Question {
  id: number;
  type: string;
  text: string;
  difficulty?: string;
}

interface ChatInterfaceProps {
  topic?: string;
}

enum InterviewState {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}

const topicTitles: Record<string, string> = {
  'problem-solving-dsa': 'Problem Solving & DSA',
  'reactjs-deep-dive': 'ReactJS Deep Dive',
  'nextjs-fullstack': 'Next.js & Full-Stack',
  'system-design-basics': 'System Design Basics'
};

export default function ChatInterface({ topic = 'problem-solving-dsa' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [questionSet, setQuestionSet] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewState, setInterviewState] = useState<InterviewState>(InterviewState.IDLE);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [teachingSession, setTeachingSession] = useState({
    active: false,
    content: '',
    questionText: '',
    modelAnswer: ''
  });
  const [feedback, setFeedback] = useState({
    communication: '-',
    technicalSkills: '-',
    problemSolving: '-',
    suggestions: [] as string[]
  });
  const [interviewData, setInterviewData] = useState({
    responses: [] as string[],
    startTime: null as Date | null,
    endTime: null as Date | null,
    questionsAnswered: 0
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [interviewTimeElapsed, setInterviewTimeElapsed] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Subscription hooks
  const { subscription, purchaseSubscription } = useSubscription();
  const isFreeTier = subscription?.plan === 'free';
  const remainingMinutes = subscription ? Math.max(0, 10 - (subscription.minutesUsed || 0)) : 0;
  const hasReachedLimit = isFreeTier && remainingMinutes <= 0;
  const canStartInterview = !hasReachedLimit;

  // Track interview time
  const trackInterviewTime = async (minutes: number) => {
    try {
      await fetch('/api/subscription/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: (subscription?.minutesUsed || 0) + minutes }),
      });
    } catch (error) {
      console.error('Failed to track interview time:', error);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const endInterview = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setInterviewState(InterviewState.COMPLETED);
    
    const endTime = new Date();
    setInterviewData(prev => ({
      ...prev,
      endTime
    }));

    // Track interview time for free tier users
    if (isFreeTier && interviewData.startTime) {
      const durationInMinutes = Math.ceil(
        (endTime.getTime() - interviewData.startTime.getTime()) / (1000 * 60)
      );
      await trackInterviewTime(durationInMinutes);
    }

    // Generate and set final feedback
    const finalFeedback = generateFeedback();
    setFeedback(finalFeedback);

    // Add completion message
    const completionMessage: Message = {
      id: 'completion-' + Date.now(),
      content: `
Great job completing the interview! Here's a quick summary:
- Questions Completed: ${interviewData.questionsAnswered}/${questionSet.length}
- Duration: ${Math.floor((endTime.getTime() - (interviewData.startTime?.getTime() || 0)) / 60000)} minutes
- Communication: ${finalFeedback.communication}
- Technical Skills: ${finalFeedback.technicalSkills}
- Problem Solving: ${finalFeedback.problemSolving}

Check out your detailed feedback below! 👇
${isFreeTier ? `\nYou have ${remainingMinutes} minutes remaining in your free tier.` : ''}
      `,
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, completionMessage]);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Timer effect for tracking interview time
  useEffect(() => {
    if (interviewState === InterviewState.ACTIVE && isFreeTier) {
      intervalRef.current = setInterval(() => {
        setInterviewTimeElapsed(prev => {
          const newTime = prev + 1;
          if (newTime >= remainingMinutes * 60) {
            // Time limit reached
            setShowUpgradeModal(true);
            endInterview();
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interviewState, isFreeTier, remainingMinutes]);

  // Initialize interview
  const startInterview = async () => {
    if (!canStartInterview) {
      setShowUpgradeModal(true);
      return;
    }

    setInterviewState(InterviewState.ACTIVE);
    setIsLoading(true);
    
    // Initialize interview data
    const startTime = new Date();
    setInterviewData({
      responses: [],
      startTime,
      endTime: null,
      questionsAnswered: 0
    });

    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          history: [],
          currentQuestionIndex: 0
        }),
      });

      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.questionSet) {
        setQuestionSet(data.questionSet);
        setCurrentQuestion(data.questionSet[0]);
      }

      const welcomeMessage: Message = {
        id: 'welcome-' + Date.now(),
        content: `👋 Welcome to your interview! I'm Alex, your AI interviewer. ${
          isFreeTier 
            ? `You have ${remainingMinutes} minutes remaining in your free tier.` 
            : "I'll be asking you questions and providing feedback throughout our session."
        } Let's begin!`,
        sender: 'ai',
        timestamp: new Date()
      };

      const initialMessage: Message = {
        id: 'ai-init-' + Date.now(),
        content: data.aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages([welcomeMessage, initialMessage]);
      setCurrentQuestionIndex(0);

      // Initialize feedback
      setFeedback({
        communication: 'Evaluating...',
        technicalSkills: 'Evaluating...',
        problemSolving: 'Evaluating...',
        suggestions: ['Interview in progress...']
      });

    } catch (error) {
      console.error('❌ ChatInterface: Error initializing interview:', error);
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        content: "Hi! I'm having a little trouble connecting. Let's start with a classic question: Tell me about yourself.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    // Check if user is asking for teaching help
    const teachKeywords = ['teach me', 'help me', 'explain', 'i dont know', "i don't know", 'how to', 'show me', 'can you teach'];
    const isAskingForTeach = teachKeywords.some(keyword => 
      messageContent.toLowerCase().includes(keyword)
    );

    if (isAskingForTeach && currentQuestion) {
      await handleTeachRequest();
      return;
    }

    // Track user response for feedback
    setInterviewData(prev => ({
      ...prev,
      responses: [...prev.responses, messageContent]
    }));

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          history: updatedMessages,
          currentQuestionIndex,
          userInput: messageContent
        }),
      });

      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const aiMessage: Message = {
        id: 'ai-' + Date.now(),
        content: data.aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Handle question progression
      if (data.moveToNext && data.currentQuestionIndex !== undefined) {
        const newIndex = data.currentQuestionIndex;
        setCurrentQuestionIndex(newIndex);
        
        // Update questions answered count
        setInterviewData(prev => ({
          ...prev,
          questionsAnswered: prev.questionsAnswered + 1
        }));
        
        if (questionSet[newIndex]) {
          setCurrentQuestion(questionSet[newIndex]);
          
          setTimeout(() => {
            const nextQuestionMessage: Message = {
              id: 'next-question-' + Date.now(),
              content: questionSet[newIndex].text,
              sender: 'ai',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, nextQuestionMessage]);
          }, 1500);
        } else {
          // Interview completed
          endInterview();
        }
      }

      // Update real-time feedback (simplified version)
      if (interviewData.responses.length > 0) {
        const currentResponses = [...interviewData.responses, messageContent];
        const avgLength = currentResponses.reduce((sum, r) => sum + r.length, 0) / currentResponses.length;
        
        setFeedback(prev => ({
          ...prev,
          communication: avgLength > 200 ? 'Excellent' : avgLength > 100 ? 'Good' : 'Developing',
          technicalSkills: currentResponses.length > 2 ? 'Good' : 'Evaluating...',
          problemSolving: currentResponses.length > 1 ? 'Good' : 'Evaluating...'
        }));
      }

    } catch (error) {
      console.error('❌ ChatInterface: Error sending message:', error);
      const errorResponseMessage: Message = {
        id: 'error-' + Date.now(),
        content: "I apologize, I'm experiencing a technical difficulty. Could you please rephrase your response?",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeachRequest = async () => {
    if (!currentQuestion) return;
    
    setIsLoading(true);
    try {
      // First, show a loading message
      const loadingMessage: Message = {
        id: 'loading-' + Date.now(),
        content: "Let me prepare some teaching materials for you...",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, loadingMessage]);

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

      const data = await response.json();
      
      if (data.teachingContent) {
        // Add Alex's response before showing teaching mode
        const teachMessage: Message = {
          id: 'teach-' + Date.now(),
          content: "I'll help you understand this better. Let me show you step by step...",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, teachMessage]);

        // Delay to show the animation
        await new Promise(resolve => setTimeout(resolve, 1000));

        setTeachingSession({
          active: true,
          content: data.teachingContent,
          questionText: currentQuestion.text,
          modelAnswer: data.modelAnswer || ''
        });
      }
    } catch (error) {
      console.error('Failed to start teaching mode:', error);
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        content: "I apologize, I'm having trouble preparing the teaching materials. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeachingReady = () => {
    setTeachingSession(prev => ({ ...prev, active: false }));
  };

  const handleCodeSubmit = async (code: string, language: string) => {
    const codeMessage = `Here's my solution in ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nCould you review this?`;
    handleSendMessage(codeMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-900 overflow-hidden relative">
      {/* Usage Indicator for Free Tier */}
      {isFreeTier && (
        <div className="absolute top-4 right-4 z-50 w-72">
          <UsageIndicator />
        </div>
      )}
      {/* Top Section - Progress and Chat */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Progress */}
        <div className={`${teachingSession.active ? 'w-1/6' : 'w-1/4'} bg-gray-800 border-r border-gray-700 transition-all duration-300 ease-in-out flex flex-col`}>
          <div className="p-6 border-b border-gray-700 flex-shrink-0">
            <h3 className="text-lg font-semibold text-white">Progress</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {questionSet.map((question, index) => (
                <div
                  key={question.id}
                  className={`p-3 rounded-lg border-l-4 transition-all duration-200 ${
                    index < currentQuestionIndex
                      ? 'bg-green-900/50 border-green-400 text-green-100'
                      : index === currentQuestionIndex
                      ? 'bg-blue-900/50 border-blue-400 text-blue-100'
                      : 'bg-gray-700/50 border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      index < currentQuestionIndex
                        ? 'bg-green-400'
                        : index === currentQuestionIndex
                        ? 'bg-blue-400'
                        : 'bg-gray-500'
                    }`} />
                    <span className="text-sm font-medium">Q{index + 1}</span>
                    {question.type && (
                      <span className="text-xs px-2 py-1 rounded bg-gray-600/50">
                        {question.type}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed pl-5">{question.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area - Chat */}
        <div className={`${teachingSession.active ? 'w-1/2' : 'w-3/4'} flex flex-col transition-all duration-300 ease-in-out min-h-0`}>
          {/* Control Buttons */}
          <div className="p-6 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
            <div className="flex justify-center space-x-4">
              <Button
                onClick={startInterview}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                disabled={interviewState !== InterviewState.IDLE}
              >
                <Play className="w-5 h-5" />
                <span>Start Interview</span>
              </Button>
              <Button
                onClick={endInterview}
                size="lg"
                variant="destructive"
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                disabled={interviewState !== InterviewState.ACTIVE}
              >
                <X className="w-5 h-5" />
                <span>End Interview</span>
              </Button>
            </div>
          </div>

          {/* Chat Interface - No Tabs */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat Messages - Scrollable with fixed height */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex gap-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.sender === 'ai' && (
                        <Avatar className="h-10 w-10 bg-purple-500 flex-shrink-0">
                          <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[80%] rounded-xl p-4 prose prose-invert prose-sm ${
                        message.sender === 'user' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-700 text-gray-100'
                      }`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      {message.sender === 'user' && (
                        <Avatar className="h-10 w-10 bg-blue-500 flex-shrink-0">
                          <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-4 justify-start">
                      <Avatar className="h-10 w-10 bg-purple-500 flex-shrink-0">
                        <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-700 text-gray-100 rounded-xl p-4">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input Area - Fixed at Bottom */}
            <div className="border-t border-gray-700 bg-gray-800/50 p-6 flex-shrink-0">
              <div className="flex gap-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={interviewState === InterviewState.COMPLETED ? "Interview completed!" : "Type your response..."}
                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-12"
                  disabled={isLoading || interviewState !== InterviewState.ACTIVE}
                />
                <Button 
                  variant="outline"
                  onClick={handleTeachRequest}
                  disabled={!currentQuestion || teachingSession.active || interviewState !== InterviewState.ACTIVE}
                  className="border-gray-600 text-gray-300 hover:bg-purple-600 hover:text-white h-12 px-4"
                  title="Ask Alex to teach you"
                >
                  <Brain className="h-5 w-5" />
                </Button>
                <Button 
                  onClick={() => handleSendMessage(inputValue)} 
                  disabled={!inputValue.trim() || isLoading || interviewState !== InterviewState.ACTIVE}
                  className="bg-purple-600 hover:bg-purple-700 h-12 px-6"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Teaching Mode Panel */}
        <TeachingMode
          content={teachingSession.content}
          onReady={handleTeachingReady}
          isVisible={teachingSession.active}
        />
      </div>

      {/* Bottom Section - AI Coach Feedback */}
      {interviewState === InterviewState.ACTIVE && !teachingSession.active && (
        <div className="h-64 bg-gray-800 border-t border-gray-700 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">AI Coach Feedback</h3>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-4 gap-4 h-full">
              <div className="bg-gray-700/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-purple-300 mb-2">Real-time Analysis</h4>
                <p className="text-gray-300 text-xs leading-relaxed">
                  {interviewData.responses.length === 0 
                    ? "Start answering questions to receive personalized feedback."
                    : `Great! You've answered ${interviewData.responses.length} question${interviewData.responses.length > 1 ? 's' : ''}. Keep going!`
                  }
                </p>
              </div>
              
              <div className="bg-gray-700/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-blue-300 mb-2">Performance Metrics</h4>
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
                <h4 className="text-sm font-medium text-green-300 mb-2">Topic Focus</h4>
                <p className="text-gray-300 text-xs leading-relaxed">
                  {topic === 'problem-solving-dsa' && 'Focus on algorithms and data structures.'}
                  {topic === 'reactjs-deep-dive' && 'Demonstrate React knowledge.'}
                  {topic === 'nextjs-fullstack' && 'Show full-stack understanding.'}
                  {topic === 'system-design-basics' && 'Explain system concepts.'}
                </p>
              </div>
              
              <div className="bg-gray-700/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-cyan-300 mb-2">Session Stats</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white">
                      {interviewData.startTime ? Math.floor((new Date().getTime() - interviewData.startTime.getTime()) / 60000) : 0} min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Questions</span>
                    <span className="text-white">
                      {currentQuestionIndex + 1}/{questionSet.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Responses</span>
                    <span className="text-white">{interviewData.responses.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Coach Feedback - Shows below when interview is completed */}
      {interviewState === InterviewState.COMPLETED && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-6 z-50">
          <div className="max-w-6xl mx-auto">
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
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        remainingMinutes={remainingMinutes}
        trigger={hasReachedLimit ? 'time_limit' : 'feature_limit'}
      />
    </div>
  );
}

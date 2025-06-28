'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Mic, MicOff, User, Bot, Clock, CheckCircle, Code } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import CodeEditor from './CodeEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

interface CodeEditorProps {
  question?: string;
  onSubmitCode: (code: string, language: string) => void;
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
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize interview
  useEffect(() => {
    if (!interviewStarted && topic) {
      initializeInterview();
    }
  }, [topic, interviewStarted]);

  // Check if current question is coding type and show/hide editor
  useEffect(() => {
    if (currentQuestion) {
      const isCodingQuestion = currentQuestion.type === 'coding';
      setShowCodeEditor(isCodingQuestion);
    }
  }, [currentQuestion]);

  const initializeInterview = async () => {
    console.log('🚀 ChatInterface: Initializing interview for topic:', topic);
    setIsLoading(true);

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

      const initialMessage: Message = {
        id: 'ai-init-' + Date.now(),
        content: data.aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages([initialMessage]);
      setCurrentQuestionIndex(0);
      setInterviewStarted(true);

    } catch (error) {
      console.error('❌ ChatInterface: Error initializing interview:', error);
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        content: "Hi! I'm having a little trouble connecting. Let's start with a classic question: Tell me about yourself.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([errorMessage]);
      setInterviewStarted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

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
          currentQuestionIndex
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

      if (data.isSufficient) {
        if (data.nextQuestion) {
          setCurrentQuestionIndex(data.currentQuestionIndex);
          setCurrentQuestion(data.nextQuestion);
          
          setTimeout(() => {
            const nextQuestionMessage: Message = {
              id: 'next-question-' + Date.now(),
              content: data.nextQuestion.text,
              sender: 'ai',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, nextQuestionMessage]);
          }, 1000);
        } else {
          setInterviewCompleted(true);
          setShowCodeEditor(false);
          
          setTimeout(() => {
            const completionMessage: Message = {
              id: 'completion-' + Date.now(),
              content: "Congratulations! You've completed the interview. Great job!",
              sender: 'ai',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, completionMessage]);
          }, 1000);
        }
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

  const handleTextSubmit = () => {
    handleSendMessage(inputValue);
  };
  
  const handleCodeSubmit = (code: string, language: string) => {
    const codeMessage = `Here's my solution in ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nCould you review this?`;
    handleSendMessage(codeMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording functionality to be implemented here
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-12rem)] bg-gray-800/50 rounded-lg">
      {/* Interview Progress Header */}
      {interviewStarted && questionSet.length > 0 && (
        <div className="border-b border-gray-700 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{topicTitles[topic]}</Badge>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                Question {Math.min(currentQuestionIndex + 1, questionSet.length)} of {questionSet.length}
              </div>
            </div>
            {interviewCompleted && <Badge variant="secondary">Completed</Badge>}
          </div>
          <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentQuestionIndex + (interviewCompleted ? 1 : 0)) / questionSet.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex flex-col transition-all duration-300 ${showCodeEditor ? 'w-1/2' : 'w-full'}`}>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.sender === 'ai' && <Avatar className="h-8 w-8 bg-purple-500 flex-shrink-0"><AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback></Avatar>}
                  <div className={`max-w-[85%] rounded-lg p-3 prose prose-invert prose-sm ${message.sender === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
                    {/* **MARKDOWN FIX**: Using ReactMarkdown to render content */}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  {message.sender === 'user' && <Avatar className="h-8 w-8 bg-blue-500 flex-shrink-0"><AvatarFallback><User className="h-4 w-4" /></AvatarFallback></Avatar>}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 bg-purple-500 flex-shrink-0"><AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
                  <div className="bg-gray-700 text-gray-100 rounded-lg p-3">
                    <div className="flex space-x-1">
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
          <div className="border-t border-gray-700 p-4 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={interviewCompleted ? "Interview completed!" : "Type your response..."}
                className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                disabled={isLoading || interviewCompleted || !interviewStarted}
              />
              <Button size="icon" variant="outline" onClick={handleTextSubmit} disabled={!inputValue.trim() || isLoading || interviewCompleted}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        {showCodeEditor && (
          <div className="w-1/2 border-l border-gray-700 flex flex-col">
            <CodeEditor
              question={currentQuestion?.text}
              onSubmitCode={handleCodeSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Alex - The AI Interview Coach
// Intelligent coaching system powered by Bolt AI LLM

import { boltAI } from './bolt-client';

export interface CoachingSession {
  topic: string;
  currentQuestionIndex: number;
  conversationHistory: Array<{
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
  }>;
  userProfile: {
    full_name?: string;
    field?: string;
    branch?: string;
  };
}

export interface CoachingResponse {
  message: string;
  shouldMoveToNext: boolean;
  qualityScore: number;
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
}

export class AlexCoach {
  private session: CoachingSession;

  constructor(session: CoachingSession) {
    this.session = session;
  }

  async analyzeResponse(
    userAnswer: string,
    currentQuestion: {
      id: number;
      type: string;
      text: string;
      difficulty?: string;
    }
  ): Promise<CoachingResponse> {
    try {
      console.log('🎓 Alex Coach: Analyzing user response...');

      // Use Bolt AI to analyze the response
      const analysis = await boltAI.analyzeInterviewResponse(
        userAnswer,
        currentQuestion.text,
        currentQuestion.type,
        this.session.userProfile,
        this.session.conversationHistory
      );

      // Extract feedback components from the AI response
      const feedback = this.extractFeedback(analysis.response, userAnswer);

      return {
        message: analysis.response,
        shouldMoveToNext: analysis.shouldMoveToNext,
        qualityScore: analysis.qualityScore,
        feedback
      };

    } catch (error) {
      console.error('❌ Alex Coach: Error analyzing response:', error);
      
      // Fallback to intelligent rule-based coaching
      return this.fallbackCoaching(userAnswer, currentQuestion);
    }
  }

  private extractFeedback(aiResponse: string, userAnswer: string): {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  } {
    // Extract feedback components from AI response
    // This is a simplified extraction - in production, you might want more sophisticated parsing
    
    const strengths: string[] = [];
    const improvements: string[] = [];
    const suggestions: string[] = [];

    const lowerResponse = aiResponse.toLowerCase();

    // Identify strengths
    if (lowerResponse.includes('excellent') || lowerResponse.includes('outstanding')) {
      strengths.push('Excellent overall response quality');
    }
    if (lowerResponse.includes('clear') || lowerResponse.includes('clarity')) {
      strengths.push('Clear communication');
    }
    if (lowerResponse.includes('specific') || lowerResponse.includes('detailed')) {
      strengths.push('Good use of specific examples');
    }
    if (lowerResponse.includes('structured') || lowerResponse.includes('organized')) {
      strengths.push('Well-structured response');
    }

    // Identify improvements
    if (lowerResponse.includes('more detail') || lowerResponse.includes('elaborate')) {
      improvements.push('Provide more detailed examples');
    }
    if (lowerResponse.includes('star method') || lowerResponse.includes('structure')) {
      improvements.push('Use STAR method for better structure');
    }
    if (lowerResponse.includes('grammar') || lowerResponse.includes('communication')) {
      improvements.push('Improve grammar and communication clarity');
    }
    if (lowerResponse.includes('relevant') || lowerResponse.includes('focus')) {
      improvements.push('Stay more focused on the question');
    }

    // Generate suggestions
    if (userAnswer.length < 50) {
      suggestions.push('Aim for more comprehensive answers (100-200 words)');
    }
    if (lowerResponse.includes('star')) {
      suggestions.push('Practice the STAR method: Situation, Task, Action, Results');
    }
    if (lowerResponse.includes('example')) {
      suggestions.push('Include specific, quantifiable examples when possible');
    }

    return { strengths, improvements, suggestions };
  }

  private fallbackCoaching(
    userAnswer: string,
    currentQuestion: { type: string; text: string }
  ): CoachingResponse {
    const userName = this.session.userProfile.full_name?.split(' ')[0] || 'there';
    const answerLength = userAnswer.trim().length;

    // Check for gibberish or poor quality
    if (this.isGibberishOrPoor(userAnswer)) {
      return {
        message: `${userName}, I notice your response doesn't seem to address the interview question properly. In a real interview, it's crucial to provide thoughtful, relevant answers. Could you please give me a genuine response to: "${currentQuestion.text}"? I'm here to help you practice and improve!`,
        shouldMoveToNext: false,
        qualityScore: 2,
        feedback: {
          strengths: [],
          improvements: ['Provide relevant, coherent responses', 'Address the question directly'],
          suggestions: ['Take time to understand the question before answering', 'Practice clear communication']
        }
      };
    }

    // Basic coaching based on question type and length
    if (currentQuestion.type === 'behavioral') {
      if (answerLength < 80) {
        return {
          message: `${userName}, that's a start, but behavioral questions need more depth. Try using the STAR method: describe the Situation, the Task you needed to accomplish, the Actions you took, and the Results you achieved. This structure helps you tell a compelling story. Can you expand your answer using this framework?`,
          shouldMoveToNext: false,
          qualityScore: 4,
          feedback: {
            strengths: ['Attempted to answer the question'],
            improvements: ['Use STAR method structure', 'Provide more detail and context'],
            suggestions: ['Practice storytelling with specific examples', 'Include quantifiable results']
          }
        };
      } else {
        return {
          message: `Good effort, ${userName}! You're providing good detail. To make this even stronger, ensure you're clearly showing the impact of your actions. What were the specific results? How did you measure success? Adding those concrete outcomes will make your story much more compelling. Great work so far!`,
          shouldMoveToNext: true,
          qualityScore: 7,
          feedback: {
            strengths: ['Good detail and context', 'Relevant experience shared'],
            improvements: ['Include specific results and outcomes'],
            suggestions: ['Quantify your impact when possible', 'Practice concluding with strong results']
          }
        };
      }
    }

    // Default response
    return {
      message: `${userName}, I can see you're thinking about this question. To give you the best coaching, could you provide a more comprehensive response? This will help me give you specific feedback to improve your interview skills.`,
      shouldMoveToNext: false,
      qualityScore: 5,
      feedback: {
        strengths: ['Engaged with the question'],
        improvements: ['Provide more comprehensive responses'],
        suggestions: ['Take time to structure your thoughts', 'Include specific examples and details']
      }
    };
  }

  private isGibberishOrPoor(userAnswer: string): boolean {
    const answerLength = userAnswer.trim().length;
    
    if (answerLength < 10) return true;
    
    // Check for gibberish patterns
    const words = userAnswer.toLowerCase().split(/\s+/);
    const gibberishPatterns = [
      /^[a-z]{15,}$/, // Long strings of random letters
      /(.)\1{4,}/, // Repeated characters
      /^[^aeiou\s]{8,}$/, // Too many consonants
    ];
    
    const isGibberish = gibberishPatterns.some(pattern => 
      words.some(word => pattern.test(word))
    ) || words.every(word => word.length > 12);

    // Check vowel ratio (natural language has ~40% vowels)
    const vowelCount = userAnswer.split('').filter(char => /[aeiou]/i.test(char)).length;
    const vowelRatio = vowelCount / userAnswer.length;
    
    return isGibberish || vowelRatio < 0.15;
  }

  updateSession(newMessage: { id: string; content: string; sender: 'user' | 'ai'; timestamp: Date }): void {
    this.session.conversationHistory.push(newMessage);
  }

  getSessionSummary(): {
    totalQuestions: number;
    currentProgress: number;
    averageQuality: number;
    strengths: string[];
    improvements: string[];
  } {
    const userMessages = this.session.conversationHistory.filter(msg => msg.sender === 'user');
    const totalQuestions = this.session.currentQuestionIndex + 1;
    
    // This would be enhanced with actual quality tracking
    return {
      totalQuestions,
      currentProgress: (this.session.currentQuestionIndex / totalQuestions) * 100,
      averageQuality: 7.5, // Placeholder
      strengths: ['Clear communication', 'Relevant examples'],
      improvements: ['More specific details', 'Better structure']
    };
  }
}

// Export utility functions
export function createCoachingSession(
  topic: string,
  userProfile: any,
  conversationHistory: any[] = []
): CoachingSession {
  return {
    topic,
    currentQuestionIndex: 0,
    conversationHistory,
    userProfile: {
      full_name: userProfile?.full_name,
      field: userProfile?.field,
      branch: userProfile?.branch
    }
  };
}
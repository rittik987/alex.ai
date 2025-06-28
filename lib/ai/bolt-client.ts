// Bolt AI LLM Client for Interview Coaching
// This module handles all interactions with Bolt's AI LLM service

interface BoltAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

interface BoltAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class BoltAIClient {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BOLT_API_KEY || '';
    this.baseURL = 'https://api.bolt.new/v1';
    
    if (!this.apiKey) {
      console.warn('⚠️ Bolt AI: No API key provided. AI features will use fallback responses.');
    }
  }

  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<string> {
    try {
      console.log('🧠 Bolt AI: Generating response...');

      if (!this.apiKey) {
        throw new Error('No Bolt AI API key available');
      }

      const request: BoltAIRequest = {
        model: options.model || 'claude-3-sonnet-20240229',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: options.maxTokens || 500,
        temperature: options.temperature || 0.7,
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bolt AI API error (${response.status}): ${errorText}`);
      }

      const data: BoltAIResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices returned from Bolt AI');
      }

      const aiResponse = data.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('Empty response content from Bolt AI');
      }

      console.log('✅ Bolt AI: Response generated successfully');
      console.log('📊 Bolt AI: Token usage:', data.usage);

      return aiResponse;

    } catch (error) {
      console.error('❌ Bolt AI: Error generating response:', error);
      throw error;
    }
  }

  async analyzeInterviewResponse(
    userAnswer: string,
    question: string,
    questionType: string,
    userProfile: any,
    conversationHistory: any[]
  ): Promise<{
    response: string;
    shouldMoveToNext: boolean;
    qualityScore: number;
  }> {
    try {
      const systemPrompt = this.buildAlexSystemPrompt();
      const analysisPrompt = this.buildAnalysisPrompt(
        userAnswer,
        question,
        questionType,
        userProfile,
        conversationHistory
      );

      const response = await this.generateResponse(systemPrompt, analysisPrompt, {
        maxTokens: 600,
        temperature: 0.7
      });

      // Parse the response to determine if we should move to next question
      const shouldMoveToNext = this.shouldMoveToNextQuestion(response);
      const qualityScore = this.assessResponseQuality(userAnswer, response);

      return {
        response,
        shouldMoveToNext,
        qualityScore
      };

    } catch (error) {
      console.error('❌ Bolt AI: Error analyzing interview response:', error);
      throw error;
    }
  }

  private buildAlexSystemPrompt(): string {
    return `You are Alex, an elite AI interview coach with deep expertise in technical interviews, behavioral assessments, and professional development. Your mission is to help candidates excel through intelligent analysis, constructive feedback, and skill development.

CORE IDENTITY:
- Professional yet approachable interview coach
- Expert in technical and behavioral interview techniques
- Focused on genuine improvement and skill building
- Encouraging but maintains high standards
- Provides specific, actionable feedback

COACHING PRINCIPLES:
1. INTELLIGENT ANALYSIS: Evaluate actual content quality, relevance, and coherence
2. CONSTRUCTIVE FEEDBACK: Provide specific, actionable improvement suggestions
3. SKILL DEVELOPMENT: Help with communication, structure, and professional presentation
4. PROGRESSIVE COACHING: Adapt approach based on candidate's level and progress
5. AUTHENTIC ENCOURAGEMENT: Celebrate real progress while addressing areas for improvement

RESPONSE ASSESSMENT CRITERIA:
- Content Quality: Relevance, depth, and substance
- Communication: Clarity, grammar, and professional tone
- Structure: Organization and logical flow
- Completeness: Addresses all aspects of the question
- Professional Readiness: Interview-appropriate level

COACHING APPROACH:
- For poor/irrelevant responses: Address directly, guide toward proper answers
- For weak responses: Provide frameworks and specific guidance
- For developing responses: Help refine and strengthen key points
- For good responses: Polish and perfect the delivery
- For excellent responses: Celebrate and indicate readiness to progress

Always be authentic, specific, and genuinely helpful. Your goal is to make candidates truly interview-ready.`;
  }

  private buildAnalysisPrompt(
    userAnswer: string,
    question: string,
    questionType: string,
    userProfile: any,
    conversationHistory: any[]
  ): string {
    const userName = userProfile?.full_name?.split(' ')[0] || 'there';
    
    return `INTERVIEW ANALYSIS REQUEST

CANDIDATE PROFILE:
- Name: ${userName}
- Field: ${userProfile?.field || 'Technical'}
- Branch: ${userProfile?.branch || 'Computer Science'}

CURRENT QUESTION:
- Type: ${questionType}
- Question: "${question}"

CANDIDATE'S RESPONSE:
"${userAnswer}"

CONVERSATION CONTEXT:
${conversationHistory.slice(-4).map((msg, index) => 
  `${msg.sender.toUpperCase()}: ${msg.content}`
).join('\n')}

ANALYSIS REQUIRED:
1. Assess the quality and relevance of the candidate's response
2. Identify specific strengths and areas for improvement
3. Provide constructive coaching feedback
4. Determine if the response is sufficient to move forward

COACHING RESPONSE GUIDELINES:
- Be specific about what works and what needs improvement
- Provide actionable suggestions for enhancement
- Use the candidate's name to personalize the feedback
- If the response is strong, acknowledge it and indicate readiness to progress
- If the response needs work, provide clear guidance without being discouraging
- For "Tell me about yourself" questions, ensure coverage of background, skills, and goals
- For behavioral questions, guide toward STAR method (Situation, Task, Action, Results)
- For technical questions, focus on problem-solving approach and communication

Respond as Alex with intelligent, personalized coaching that will genuinely help this candidate improve their interview skills.`;
  }

  private shouldMoveToNextQuestion(response: string): boolean {
    const moveIndicators = [
      'let\'s move to the next question',
      'ready for the next question',
      'excellent! let\'s move',
      'perfect! let\'s move',
      'outstanding! let\'s move',
      'great job! let\'s move',
      'well done! let\'s move',
      'that\'s interview-ready',
      'you\'re ready to progress'
    ];

    const lowerResponse = response.toLowerCase();
    return moveIndicators.some(indicator => lowerResponse.includes(indicator));
  }

  private assessResponseQuality(userAnswer: string, coachResponse: string): number {
    // Simple quality assessment based on response characteristics
    const answerLength = userAnswer.trim().length;
    const lowerCoachResponse = coachResponse.toLowerCase();
    
    if (lowerCoachResponse.includes('excellent') || lowerCoachResponse.includes('outstanding')) {
      return 9;
    } else if (lowerCoachResponse.includes('great') || lowerCoachResponse.includes('well done')) {
      return 8;
    } else if (lowerCoachResponse.includes('good') || lowerCoachResponse.includes('solid')) {
      return 7;
    } else if (lowerCoachResponse.includes('developing') || answerLength > 100) {
      return 6;
    } else if (answerLength > 50) {
      return 5;
    } else {
      return 3;
    }
  }
}

// Export singleton instance
export const boltAI = new BoltAIClient();

// Export types for use in other modules
export type { BoltAIRequest, BoltAIResponse };
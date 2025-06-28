// AI utility functions for interview coaching

export interface InterviewContext {
  type: 'behavioral' | 'technical' | 'system-design' | 'coding';
  difficulty: 'junior' | 'mid' | 'senior';
  company?: string;
  role?: string;
}

export interface CoachingResponse {
  feedback: string;
  suggestions: string[];
  score: number;
  areas_for_improvement: string[];
  strengths: string[];
}

export class AICoach {
  private context: InterviewContext;

  constructor(context: InterviewContext) {
    this.context = context;
  }

  /**
   * Analyze a candidate's response and provide coaching feedback
   */
  async analyzeResponse(
    question: string,
    response: string,
    previousContext?: any[]
  ): Promise<CoachingResponse> {
    // This would integrate with an actual AI service (OpenAI, Anthropic, etc.)
    // For now, returning structured mock data
    
    const mockResponse: CoachingResponse = {
      feedback: `Your response demonstrates good understanding of the concept. However, consider providing more specific examples and quantifiable results.`,
      suggestions: [
        "Use the STAR method (Situation, Task, Action, Result) for behavioral questions",
        "Include specific metrics or outcomes where possible",
        "Practice explaining technical concepts in simpler terms"
      ],
      score: Math.floor(Math.random() * 3) + 7, // Random score between 7-10
      areas_for_improvement: [
        "Be more specific with examples",
        "Improve storytelling structure",
        "Add quantifiable achievements"
      ],
      strengths: [
        "Clear communication",
        "Good technical knowledge",
        "Structured thinking"
      ]
    };

    return mockResponse;
  }

  /**
   * Generate follow-up questions based on the candidate's response
   */
  generateFollowUpQuestions(response: string): string[] {
    const followUps = [
      "Can you walk me through your thought process for that solution?",
      "How would you handle this differently if you had more time?",
      "What would you do if the requirements changed?",
      "How did you measure the success of this project?",
      "What challenges did you face and how did you overcome them?"
    ];

    // Return 1-2 random follow-up questions
    const shuffled = followUps.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 2) + 1);
  }

  /**
   * Assess overall interview performance
   */
  assessPerformance(responses: Array<{ question: string; answer: string; score: number }>): {
    overallScore: number;
    breakdown: { [key: string]: number };
    summary: string;
  } {
    const totalScore = responses.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalScore / responses.length;

    return {
      overallScore: Math.round(averageScore * 10) / 10,
      breakdown: {
        communication: Math.floor(Math.random() * 3) + 7,
        technical: Math.floor(Math.random() * 3) + 7,
        problem_solving: Math.floor(Math.random() * 3) + 7,
        cultural_fit: Math.floor(Math.random() * 3) + 7
      },
      summary: `Strong performance overall with good technical knowledge and communication skills. Focus on providing more specific examples and quantifiable results.`
    };
  }
}

/**
 * Generate practice questions based on interview type and difficulty
 */
export function generatePracticeQuestions(
  type: InterviewContext['type'],
  difficulty: InterviewContext['difficulty'],
  count: number = 5
): Array<{ question: string; category: string; difficulty: string }> {
  const questionBank = {
    behavioral: [
      { question: "Tell me about a time when you had to work with a difficult team member.", category: "Teamwork", difficulty: "mid" },
      { question: "Describe a situation where you had to meet a tight deadline.", category: "Time Management", difficulty: "junior" },
      { question: "Tell me about a time you failed and what you learned from it.", category: "Growth Mindset", difficulty: "mid" },
      { question: "Describe a time when you had to influence someone without authority.", category: "Leadership", difficulty: "senior" }
    ],
    technical: [
      { question: "Explain the difference between REST and GraphQL APIs.", category: "System Design", difficulty: "mid" },
      { question: "How would you optimize a slow database query?", category: "Database", difficulty: "senior" },
      { question: "What is the difference between authentication and authorization?", category: "Security", difficulty: "junior" },
      { question: "Explain how microservices architecture works.", category: "Architecture", difficulty: "senior" }
    ],
    coding: [
      { question: "Implement a function to reverse a linked list.", category: "Data Structures", difficulty: "mid" },
      { question: "Find the maximum sum of a contiguous subarray.", category: "Algorithms", difficulty: "mid" },
      { question: "Design a data structure that supports insert, delete, and getRandom in O(1).", category: "Data Structures", difficulty: "senior" },
      { question: "Implement a basic calculator that can handle +, -, *, / operations.", category: "Algorithms", difficulty: "senior" }
    ],
    'system-design': [
      { question: "Design a URL shortening service like bit.ly.", category: "System Design", difficulty: "senior" },
      { question: "How would you design a chat application like WhatsApp?", category: "System Design", difficulty: "senior" },
      { question: "Design a notification system for a social media platform.", category: "System Design", difficulty: "senior" },
      { question: "How would you design a file sharing system like Dropbox?", category: "System Design", difficulty: "senior" }
    ]
  };

  const questions = questionBank[type] || [];
  const filteredQuestions = questions.filter(q => q.difficulty === difficulty || difficulty === 'senior');
  
  // Shuffle and return requested number of questions
  const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Calculate interview readiness score based on practice history
 */
export function calculateReadinessScore(practiceHistory: Array<{
  date: Date;
  type: string;
  score: number;
  duration: number;
}>): {
  score: number;
  confidence: 'Low' | 'Medium' | 'High';
  recommendations: string[];
} {
  if (practiceHistory.length === 0) {
    return {
      score: 0,
      confidence: 'Low',
      recommendations: ['Start with basic behavioral questions', 'Practice coding fundamentals']
    };
  }

  const recentSessions = practiceHistory.slice(-5);
  const averageScore = recentSessions.reduce((sum, session) => sum + session.score, 0) / recentSessions.length;
  const totalSessions = practiceHistory.length;

  let confidence: 'Low' | 'Medium' | 'High' = 'Low';
  if (averageScore >= 8 && totalSessions >= 10) confidence = 'High';
  else if (averageScore >= 6 && totalSessions >= 5) confidence = 'Medium';

  const recommendations = [];
  if (averageScore < 7) recommendations.push('Focus on improving response quality');
  if (totalSessions < 5) recommendations.push('Complete more practice sessions');
  if (confidence === 'High') recommendations.push('You\'re ready for real interviews!');

  return {
    score: Math.round(averageScore * 10) / 10,
    confidence,
    recommendations
  };
}
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic';

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================
interface ChatRequest {
  topic: string;
  history: Array<{
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
  }>;
  currentQuestionIndex: number;
}

interface Question {
  id: number;
  type: string;
  text: string;
  difficulty?: string;
}

interface QuestionSet {
  questions: Question[];
}

// ===================================================================
// FALLBACK DATA (Used only if database fails)
// ===================================================================
const FALLBACK_QUESTION_SETS: Record<string, QuestionSet> = {
  'problem-solving-dsa': {
    questions: [
      { id: 1, type: "behavioral", text: "Welcome to your mock interview! Let's start with a classic: Tell me about yourself." },
      { id: 2, type: "behavioral", text: "Great! Now, can you describe a time when you faced a significant technical challenge and how you overcame it?" },
      { id: 3, type: "coding", text: "Excellent. Let's move to a coding problem. Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to the target. You may assume that each input would have exactly one solution, and you may not use the same element twice.", difficulty: "Easy" },
      { id: 4, type: "coding", text: "Great work! Here's another challenge: Given a string `s`, find the length of the longest substring without repeating characters.", difficulty: "Medium" },
      { id: 5, type: "behavioral", text: "Thanks for walking through those solutions. Finally, where do you see yourself in 5 years, and how does this role fit into your career goals?" }
    ]
  },
  // Add other topics here...
};

// ===================================================================
// MAIN API HANDLER
// ===================================================================
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Chat API: Received request');
    
    const body: ChatRequest = await request.json();
    const { topic, history, currentQuestionIndex } = body;
    
    console.log('📝 Chat API: Request data:', { topic, historyLength: history.length, currentQuestionIndex });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // --- User and Profile Fetching ---
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('🚫 Chat API: Unauthorized. User not found.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let profile = null;
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Chat API: Error fetching profile:', profileError.message);
      // Proceed without profile, but log the error. The fallback will be 'Anonymous'.
    } else {
      profile = profileData;
    }
    console.log('👤 Chat API: User profile fetched:', profile ? profile.full_name : 'Anonymous');

    // --- Question Set Fetching ---
    let questionSet: QuestionSet;
    try {
      const { data, error } = await supabase.from('question_sets').select('questions').eq('topic', topic).single();
      if (error || !data) throw new Error(error?.message || 'Question set not found.');
      questionSet = data.questions as QuestionSet;
      console.log('📋 Chat API: Question set loaded from database');
    } catch (error) {
      console.warn('📋 Chat API: Database fetch failed, using fallback question set.');
      questionSet = FALLBACK_QUESTION_SETS[topic] || FALLBACK_QUESTION_SETS['problem-solving-dsa'];
    }

    // --- Initial Request Logic (as before) ---
    if (history.length === 0) {
      const firstQuestion = questionSet.questions[0];
      return NextResponse.json({
        aiResponse: firstQuestion.text,
        isSufficient: false,
        nextQuestion: null,
        questionSet: questionSet.questions,
        currentQuestionIndex: 0
      });
    }

    // --- Main Logic: Call the Live Gemini AI ---
    return await processUserResponseWithGemini(questionSet, currentQuestionIndex, history, profile);

  } catch (error) {
    console.error('💥 Chat API: UNEXPECTED TOP-LEVEL ERROR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ===================================================================
// GEMINI AI INTEGRATION
// ===================================================================
async function processUserResponseWithGemini(
  questionSet: QuestionSet, 
  currentQuestionIndex: number, 
  history: any[], 
  profile: any
) {
  console.log('🧠 Alex AI Coach: Calling Gemini Pro...');
  
  const currentQuestion = questionSet.questions[currentQuestionIndex];
  
  // 1. Construct the detailed System Prompt for Alex
  const systemPrompt = `You are Alex, an elite AI interview coach with deep expertise in technical interviews, behavioral assessments, and professional development. Your mission is to help candidates excel through intelligent analysis and constructive feedback.

  **CORE DIRECTIVES:**
  1.  **Analyze and Coach:** Your primary function is to analyze the user's response to the current interview question and provide coaching.
  2.  **Guided Improvement:** If a response is weak, short, or generic (like 'I am Rittik'), you MUST ask guiding follow-up questions. Nudge them to include specifics like education, skills, projects, and goals. For behavioral questions, guide them towards the STAR method (Situation, Task, Action, Result).
  3.  **Strict Progression:** Only after the user's answer is strong and comprehensive, or after 2-3 coaching attempts, should you conclude your response with the EXACT phrase: "Great, that's a much stronger answer. Let's move on."
  4.  **Stay in Character:** Maintain a professional, encouraging, yet firm tone. Address the user by name if available.
  5.  **Brevity Mandate:** Your responses must be concise and to the point, ideally under 100 words. Focus on the single most important piece of feedback.
  6.  **No Off-Topic Chat:** If the user asks something unrelated to the interview, politely steer them back on topic.`;

  // 2. Construct the final prompt for the Gemini API
  const finalPrompt = `
    **System Instructions:**
    ${systemPrompt}

    ---
    **Context for your Analysis:**
    - Candidate Name: ${profile?.full_name || 'Candidate'}
    - Candidate Profile: ${JSON.stringify(profile)}
    - Current Interview Question: "${currentQuestion.text}"
    - Conversation History (last 4 messages): ${history.slice(-4).map(msg => `${msg.sender}: ${msg.content}`).join('\n')}

    ---
    **Your Task:**
    Analyze the last message from the 'user' based on your core directives. Provide a concise, targeted coaching response as 'Alex'.
  `;

  try {
    // 3. Make the fetch call to the Gemini API
    // **CRITICAL FIX**: The API key MUST be an empty string in the Bolt environment.
    // Bolt's internal proxy will securely inject the necessary credentials.
    // Using a fake or hardcoded key will cause the request to fail.
    const apiKey = process.env.GEMINI_API_KEY; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: finalPrompt }]
      }]
    };

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error('❌ Gemini API Error:', `Status: ${apiResponse.status}`, errorBody);
        throw new Error(`Gemini API call failed with status: ${apiResponse.status}`);
    }

    const result = await apiResponse.json();
    
    // Defensive coding: ensure the response structure is what we expect
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0].text) {
        console.error('❌ Gemini API Error: Invalid response structure', result);
        throw new Error('Invalid response structure from Gemini API');
    }
    
    const aiResponseText = result.candidates[0].content.parts[0].text;
    console.log('🤖 Alex coaching response generated:', aiResponseText);

    // 4. Process the AI response to determine next steps
    const isSufficient = aiResponseText.toLowerCase().includes("let's move on");
    let nextQuestion = null;
    let newIndex = currentQuestionIndex;

    if (isSufficient) {
      newIndex++;
      if (newIndex < questionSet.questions.length) {
        nextQuestion = questionSet.questions[newIndex];
        console.log('➡️ Moving to next question:', nextQuestion);
      } else {
        console.log('🎉 Interview completed!');
      }
    }
    
    return NextResponse.json({
      aiResponse: aiResponseText,
      isSufficient,
      nextQuestion,
      currentQuestionIndex: newIndex
    });

  } catch (aiError) {
    console.error('💥 Gemini AI processing error:', aiError);
    return NextResponse.json({
      aiResponse: "I'm having a brief technical moment, but let's not lose momentum. Could you elaborate on that a bit more?",
      isSufficient: false,
      nextQuestion: null,
      currentQuestionIndex
    });
  }
}

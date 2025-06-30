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
  history?: Array<{
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
  }>;
  currentQuestionIndex: number;
  userInput?: string;
  code?: string;
  language?: string;
  isCodeSubmission?: boolean;
  questionType?: string;
  isTeachingRequest?: boolean;
  questionText?: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  questionIndex: number;
}

// Extend global to include conversation history
declare global {
  var conversationHistory: ConversationMessage[] | undefined;
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
    const { topic, history = [], currentQuestionIndex } = body;
    
    console.log('📝 Chat API: Request data:', { 
      topic, 
      historyLength: history.length, 
      currentQuestionIndex,
      isTeachingRequest: body.isTeachingRequest,
      isCodeSubmission: body.isCodeSubmission,
      userInput: body.userInput ? 'present' : 'not present'
    });

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

    // Get current question first
    const currentQuestion = questionSet.questions[currentQuestionIndex];
    if (!currentQuestion) {
      return NextResponse.json({ error: 'Invalid question index' }, { status: 400 });
    }

    // Check if this is a teaching request FIRST
    if (body.isTeachingRequest) {
      console.log('🎓 Processing teaching request for question:', currentQuestion);
      const teachingContent = await generateTeachingContent(currentQuestion, topic);
      console.log('🎓 Generated teaching content:', teachingContent);
      return NextResponse.json({
        teachingContent: teachingContent.content,
        modelAnswer: teachingContent.modelAnswer
      });
    }

    // --- Initial Request Logic ---
    if (!body.userInput && !body.isCodeSubmission) {
      const firstQuestion = questionSet.questions[0];
      return NextResponse.json({
        aiResponse: firstQuestion.text,
        moveToNext: false,
        nextQuestionType: firstQuestion.type,
        questionSet: questionSet.questions,
        currentQuestionIndex: 0
      });
    }

    // Check if this is a code submission
    if (body.isCodeSubmission) {
      if (currentQuestion.type !== 'coding') {
        return NextResponse.json({ error: 'Current question is not a coding question' }, { status: 400 });
      }

      // Process code submission
      const response = await processCodeSubmission(body.code!, body.language!, currentQuestion);
      return NextResponse.json({
        aiResponse: response.feedback,
        moveToNext: response.isCorrect,
        nextQuestionType: currentQuestionIndex + 1 < questionSet.questions.length 
          ? questionSet.questions[currentQuestionIndex + 1].type 
          : null,
        currentQuestionIndex: response.isCorrect ? currentQuestionIndex + 1 : currentQuestionIndex
      });
    }

    // --- Main Logic: Process user's verbal response ---
    return await processUserResponseWithGemini(questionSet, currentQuestionIndex, currentQuestion, body.userInput!, profile);

  } catch (error) {
    console.error('💥 Chat API: UNEXPECTED TOP-LEVEL ERROR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ===================================================================
// TEACHING CONTENT GENERATION
// ===================================================================
async function generateTeachingContent(question: Question, topic: string) {
  console.log('🎓 Generating teaching content for:', { question: question.text, topic });
  
  const teachingPrompt = `You are Alex, an expert technical interviewer and teacher. A candidate has asked for help with this interview question: "${question.text}"

  Create a comprehensive teaching response that includes:
  
  1. A clear explanation of the concept/problem
  2. Step-by-step breakdown of how to approach it
  3. Key points to include in the answer
  4. Common mistakes to avoid
  5. A model answer they can use as reference
  
  Format your response in markdown, but avoid using bullet points (use natural paragraphs instead).
  For code examples, use proper markdown code blocks with language specification.
  
  Keep your explanation clear, concise, and focused on helping the candidate understand both the WHAT and the WHY.
  
  End your teaching content with a model answer that the candidate can use as reference.`;

  try {
    console.log('🎓 Calling Gemini API for teaching content...');
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('🎓 GEMINI_API_KEY not found in environment');
      throw new Error('API key not configured');
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: teachingPrompt }]
      }]
    };

    console.log('🎓 Sending request to Gemini...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('🎓 Gemini response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🎓 Gemini API error:', errorText);
      throw new Error(`Failed to generate teaching content: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('🎓 Gemini response received, processing content...');
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      console.error('🎓 Invalid Gemini response structure:', result);
      throw new Error('Invalid response structure from Gemini API');
    }
    
    const content = result.candidates[0].content.parts[0].text;
    console.log('🎓 Raw content length:', content.length);

    // Extract model answer from the content (everything after "Model Answer:")
    const modelAnswerMatch = content.match(/Model Answer:[\s\S]*$/i);
    const modelAnswer = modelAnswerMatch ? modelAnswerMatch[0].replace(/Model Answer:/i, '').trim() : '';

    // Remove model answer from the teaching content
    const teachingContent = content.replace(/Model Answer:[\s\S]*$/i, '').trim();

    console.log('🎓 Teaching content processed:', {
      contentLength: teachingContent.length,
      modelAnswerLength: modelAnswer.length
    });

    return {
      content: teachingContent,
      modelAnswer
    };
  } catch (error) {
    console.error('🎓 Failed to generate teaching content:', error);
    return {
      content: `# Understanding the Question

This is a fundamental interview question that helps the interviewer understand your background and assess your communication skills.

## How to Approach This Question

When answering "Tell me about yourself," structure your response to cover these key areas:

**Personal Introduction**: Start with your name and current role or status.

**Educational Background**: Mention your degree, university, and any relevant coursework.

**Technical Skills**: Highlight your programming languages, frameworks, and technologies you're proficient in.

**Project Experience**: Describe 1-2 significant projects you've worked on, including the technologies used and key features.

**Career Goals**: Share your short-term and long-term professional objectives.

## Key Points to Remember

Keep your answer concise but comprehensive, typically 2-3 minutes long. Focus on professional aspects rather than personal details. Use specific examples and avoid being too generic.

## Model Answer

"Hi, I'm [Your Name], a [Degree] graduate from [University]. I specialize in [Technologies] and have hands-on experience building applications using [Frameworks]. I've developed several projects including [Project 1] which features [key features] and [Project 2] that demonstrates [skills]. My goal is to [short-term goal] and eventually [long-term goal]. I'm particularly interested in [specific area] and excited about opportunities to [relevant aspiration]."`,
      modelAnswer: 'Hi, I\'m [Your Name], a [Degree] graduate from [University]. I specialize in [Technologies] and have hands-on experience building applications using [Frameworks]. I\'ve developed several projects including [Project 1] which features [key features] and [Project 2] that demonstrates [skills]. My goal is to [short-term goal] and eventually [long-term goal].'
    };
  }
}

// ===================================================================
// CODE SUBMISSION PROCESSING
// ===================================================================
async function processCodeSubmission(code: string, language: string, question: Question) {
  console.log('💻 Processing code submission:', { language, codeLength: code.length });
  
  // Simple code evaluation logic - in a real system, you'd run the code in a sandbox
  const feedback = await evaluateCode(code, language, question);
  
  return {
    feedback: feedback.message,
    isCorrect: feedback.isCorrect
  };
}

async function evaluateCode(code: string, language: string, question: Question) {
  // For now, we'll use a simple heuristic to evaluate the code
  // In a real system, you'd execute the code in a secure sandbox
  
  const codeLines = code.trim().split('\n').length;
  const hasFunction = code.includes('function') || code.includes('def ') || code.includes('public ');
  const hasLoop = code.includes('for') || code.includes('while');
  const hasReturn = code.includes('return');
  
  // Basic scoring
  let score = 0;
  if (hasFunction) score += 30;
  if (hasLoop) score += 20;
  if (hasReturn) score += 20;
  if (codeLines > 5) score += 15;
  if (code.includes('map') || code.includes('HashMap') || code.includes('dict')) score += 15;
  
  const isCorrect = score >= 60;
  
  if (isCorrect) {
    return {
      isCorrect: true,
      message: "Great solution! Your code demonstrates good understanding of the problem. The logic looks solid and you've used appropriate data structures. Let's move on to the next question."
    };
  } else {
    return {
      isCorrect: false,
      message: "I can see you're on the right track, but let me give you a hint: consider using a hash map to store the numbers you've seen and their indices. This will allow you to find the complement in O(1) time. Try implementing this approach and submit again."
    };
  }
}

// ===================================================================
// GEMINI AI INTEGRATION
// ===================================================================
async function processUserResponseWithGemini(
  questionSet: QuestionSet, 
  currentQuestionIndex: number,
  currentQuestion: Question,
  userInput: string,
  profile: any
) {
  console.log('🧠 Alex AI Coach: Calling Gemini Pro...');
  
  // Get conversation history from global storage
  const conversationHistory: ConversationMessage[] = global.conversationHistory || [];
  
  // Add current user input to history
  conversationHistory.push({
    role: 'user',
    content: userInput,
    timestamp: Date.now(),
    questionIndex: currentQuestionIndex
  });
  
  // Keep only last 20 messages to manage context size
  if (conversationHistory.length > 20) {
    conversationHistory.splice(0, conversationHistory.length - 20);
  }
  
  // Store updated history globally
  global.conversationHistory = conversationHistory;
  
  // 1. Construct the detailed System Prompt for Alex
  const systemPrompt = `You are Alex, an elite AI interview coach with deep expertise in technical interviews. Your mission is to help candidates excel through intelligent analysis and constructive feedback.

  **CORE DIRECTIVES:**

  1. **Answer Completeness Checking for "Tell me about yourself":**
     A complete answer MUST include these components with sufficient detail:
     - Introduction & Name
     - Education Background (degree, university)
     - Technical Skills (programming languages, frameworks)
     - Project Experience (at least 1-2 specific projects with details)
     - Career Goals (short-term and long-term)

  2. **Response Analysis Rules:**
     - When ALL components are present with good detail, respond: "Excellent answer! You've covered everything well - your background, skills, projects, and goals. Let's move on to the next question."
     - If missing components, specifically ask for ONLY the missing parts
     - If answer has good content but speech recognition errors, say: "I understood you mentioned [summarize key points], but some words weren't clear. Could you briefly clarify [specific unclear part]?"

  3. **Project Details Recognition:**
     Consider a project well-explained if it includes:
     - Project name/type
     - Technologies used
     - Key features/functionality
     
  4. **Example of Complete Answer:**
     "Hi, I'm [Name], a [Degree] graduate from [University]. I specialize in [Technologies] and have built several projects including [Project 1 with 2-3 features] and [Project 2 with 2-3 features]. My goal is to [Short-term goal] and eventually [Long-term goal]."

  5. **Speech Recognition Error Handling:**
     - Focus on the overall meaning rather than exact wording
     - If key information is present but worded differently, consider it valid
     - Only ask for clarification if crucial information is unclear

  6. **Question Progression:**
     - Move to next question IMMEDIATELY when answer meets completeness criteria
     - Don't ask for additional details if all components are adequately covered
     - Use EXACTLY "Let's move on to the next question" to signal completion
     - Avoid using bullet points or markdown formatting in responses - speak naturally`;

  // 2. Construct the final prompt for the Gemini API
  const finalPrompt = `
    **System Instructions:**
    ${systemPrompt}

    ---
    **Context for your Analysis:**
    - Current Question: "${currentQuestion.text}"
    - Question Type: ${currentQuestion.type}
    - Question Number: ${currentQuestionIndex + 1} of ${questionSet.questions.length}
    - Current User Response: "${userInput}"
    - Previous Conversation History: ${conversationHistory.slice(-6).map((msg: ConversationMessage) => `${msg.role}: ${msg.content}`).join('\n')}
    
    **Special Instructions for Current Question:**
    ${currentQuestion.type === 'behavioral' ? `
    This is a behavioral question. For "Tell me about yourself" type questions:
    - Analyze what components the user has provided across ALL their responses
    - Check for: Name, Education, Skills, Projects/Experience, Career Goals
    - Acknowledge what they've shared and guide them to add missing components
    - Only move to next question when answer is comprehensive with all key components
    ` : `
    This is a ${currentQuestion.type} question. Provide focused feedback and coaching.
    `}

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
    const moveToNext = aiResponseText.toLowerCase().includes("let's move on to the next question");
    let newIndex = currentQuestionIndex;

    // Check if this is a behavioral question
    const isBehavioral = currentQuestion.type === 'behavioral';
    
    // For behavioral questions, check if answer is complete
    if (isBehavioral) {
      // Extract key components from conversation history
      const allResponses = conversationHistory
        .filter(msg => msg.role === 'user' && msg.questionIndex === currentQuestionIndex)
        .map(msg => msg.content)
        .join(' ');

      // Check for required components with improved regex patterns
      const hasName = /my name|i'?m\s+[a-z]+|name\s+is\s+[a-z]+|hi,?\s+i'?m\s+[a-z]+|hello,?\s+i'?m\s+[a-z]+/i.test(allResponses);
      const hasEducation = /graduate|degree|university|bca|b\.?tech|college|education|studied/i.test(allResponses);
      const hasSkills = /javascript|python|react|next\.?js|sql|programming|languages|frameworks|skills|specialize/i.test(allResponses);
      const hasProjects = /project|built|created|developed|e-?commerce|website|system|application|app/i.test(allResponses);
      const hasGoals = /goal|aim|aspire|plan|career|future|join|company|start|firm/i.test(allResponses);

      const isComplete = hasName && hasEducation && hasSkills && hasProjects && hasGoals;
      
      console.log('Answer completeness check:', {
        hasName,
        hasEducation,
        hasSkills,
        hasProjects,
        hasGoals,
        isComplete,
        moveToNext
      });

      // Only move to next question if answer is complete and AI signals to move on
      if (isComplete && moveToNext) {
        newIndex++;
        console.log('➡️ Moving to next question, new index:', newIndex);
        // Clear conversation history when moving to next question
        global.conversationHistory = [];
      } else {
        // Add AI response to conversation history
        conversationHistory.push({
          role: 'assistant',
          content: aiResponseText,
          timestamp: Date.now(),
          questionIndex: currentQuestionIndex
        });
        global.conversationHistory = conversationHistory;
      }
    } else {
      // For non-behavioral questions, follow AI's signal to move on
      if (moveToNext) {
        newIndex++;
        console.log('➡️ Moving to next question, new index:', newIndex);
        global.conversationHistory = [];
      } else {
        conversationHistory.push({
          role: 'assistant',
          content: aiResponseText,
          timestamp: Date.now(),
          questionIndex: currentQuestionIndex
        });
        global.conversationHistory = conversationHistory;
      }
    }
    
    // Determine next question type
    const nextQuestionType = newIndex < questionSet.questions.length 
      ? questionSet.questions[newIndex].type 
      : null;

    return NextResponse.json({
      aiResponse: aiResponseText,
      moveToNext: newIndex > currentQuestionIndex,
      nextQuestionType,
      currentQuestionIndex: newIndex
    });

  } catch (aiError) {
    console.error('💥 Gemini AI processing error:', aiError);
    
    // Provide intelligent fallback responses based on question type and user input
    let fallbackResponse = "";
    
    if (currentQuestion.type === 'behavioral') {
      if (currentQuestion.text.toLowerCase().includes('tell me about yourself')) {
        // Analyze user input for completeness
        const input = userInput.toLowerCase();
        const hasName = /my name|i'm|name is|hi|hello/.test(input);
        const hasEducation = /graduate|degree|university|college|studied|education/.test(input);
        const hasSkills = /javascript|python|react|programming|skills|languages/.test(input);
        const hasProjects = /project|built|created|developed|website|app/.test(input);
        const hasGoals = /goal|aim|career|future|plan/.test(input);
        
        const missingComponents = [];
        if (!hasName) missingComponents.push("introduction");
        if (!hasEducation) missingComponents.push("educational background");
        if (!hasSkills) missingComponents.push("technical skills");
        if (!hasProjects) missingComponents.push("project experience");
        if (!hasGoals) missingComponents.push("career goals");
        
        if (missingComponents.length === 0) {
          fallbackResponse = "Excellent! You've covered all the key points - your background, skills, projects, and goals. Let's move on to the next question.";
        } else if (missingComponents.length <= 2) {
          fallbackResponse = `Great start! Could you also tell me about your ${missingComponents.join(' and ')}?`;
        } else {
          fallbackResponse = "That's a good beginning! Could you tell me more about your educational background, technical skills, and any projects you've worked on?";
        }
      } else {
        fallbackResponse = "That's a thoughtful response. Could you provide a specific example to illustrate your point?";
      }
    } else if (currentQuestion.type === 'coding') {
      fallbackResponse = "Interesting approach! Could you walk me through your thought process and explain how you would implement this solution?";
    } else {
      fallbackResponse = "Thank you for that response. Could you elaborate a bit more on that point?";
    }
    
    // Check if we should move to next question (only for complete behavioral answers)
    const shouldMoveNext = currentQuestion.type === 'behavioral' && 
                          fallbackResponse.includes("Let's move on to the next question");
    
    return NextResponse.json({
      aiResponse: fallbackResponse,
      moveToNext: shouldMoveNext,
      nextQuestionType: shouldMoveNext && currentQuestionIndex + 1 < questionSet.questions.length 
        ? questionSet.questions[currentQuestionIndex + 1].type 
        : null,
      currentQuestionIndex: shouldMoveNext ? currentQuestionIndex + 1 : currentQuestionIndex
    });
  }
}

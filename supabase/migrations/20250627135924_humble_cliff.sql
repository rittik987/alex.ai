-- =====================================================
-- COMPLETE DATABASE SCHEMA FOR INTERVIEW CRACKER AI
-- =====================================================
-- This script is a corrected and optimized version of your schema.
-- Key Change: The `profiles` table now uses the user's auth ID as its
-- primary key, which is a best practice for 1-to-1 relationships and
-- resolves potential `user_id` reference errors.
-- **UPDATE**: Added `DROP TABLE` statements to ensure a clean run every time,
-- preventing type mismatch errors from old table structures.

-- =====================================================
-- SCHEMA RESET
-- Drops existing tables to ensure a clean slate.
-- =====================================================
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.interview_history CASCADE;
DROP TABLE IF EXISTS public.interview_sessions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =====================================================
-- 1. PROFILES TABLE
-- Stores public-facing user information.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  -- Using auth.users.id as the primary key for a direct 1-to-1 link.
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  full_name text,
  age integer,
  gender text,
  city text,
  field text CHECK (field IN ('Technical', 'Non-Technical')), -- Using ENUM-like check
  branch text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Stores public user profile information, linked one-to-one with authenticated users.';
COMMENT ON COLUMN public.profiles.id IS 'Primary key, references auth.users.id.';

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profile management
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. INTERVIEW SESSIONS TABLE
-- Tracks each mock interview a user undertakes.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic text NOT NULL, -- e.g., 'problem-solving-dsa', 'reactjs-deep-dive'
  session_mode text NOT NULL CHECK (session_mode IN ('chat', 'video')),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  overall_score numeric(4, 2), -- e.g., 85.50
  duration_seconds integer,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.interview_sessions IS 'Tracks each mock interview session a user starts.';

-- Enable RLS
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for interview sessions
CREATE POLICY "Users can manage their own interview sessions"
  ON public.interview_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. INTERVIEW HISTORY TABLE
-- Stores the conversational turn-by-turn history of a session.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.interview_history (
  -- Using UUID for all primary keys for consistency.
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.interview_sessions(id) ON DELETE CASCADE NOT NULL,
  author text NOT NULL CHECK (author IN ('AI_Coach', 'User')),
  message_content text NOT NULL,
  code_snippet text, -- For when the message includes code
  language text, -- e.g., 'python', 'javascript'
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.interview_history IS 'Stores the full conversational transcript for each interview session.';

-- Enable RLS
ALTER TABLE public.interview_history ENABLE ROW LEVEL SECURITY;

-- Policies for history
CREATE POLICY "Users can manage history for their own sessions"
  ON public.interview_history
  FOR ALL TO authenticated
  USING (auth.uid() = (SELECT user_id FROM public.interview_sessions WHERE id = session_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.interview_sessions WHERE id = session_id));

-- =====================================================
-- 4. USER PROGRESS TABLE
-- A summary table for a user's overall progress and stats.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sessions integer DEFAULT 0,
  completed_sessions integer DEFAULT 0,
  average_score numeric(4, 2) DEFAULT 0,
  readiness_score numeric(4, 2) DEFAULT 0,
  confidence_level text DEFAULT 'Low' CHECK (confidence_level IN ('Low', 'Medium', 'High')),
  last_session_at timestamptz,
  streak_days integer DEFAULT 0,
  total_practice_time_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.user_progress IS 'Tracks aggregate performance and progress metrics for each user.';

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for user progress
CREATE POLICY "Users can manage their own progress"
  ON public.user_progress
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- Automate database logic for consistency.
-- =====================================================

-- Function to automatically update the `updated_at` timestamp on any table
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to call the handle_updated_at function
DROP TRIGGER IF EXISTS on_profiles_update ON public.profiles;
CREATE TRIGGER on_profiles_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_sessions_update ON public.interview_sessions;
CREATE TRIGGER on_sessions_update
  BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_progress_update ON public.user_progress;
CREATE TRIGGER on_progress_update
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- Function to create a user's profile and progress row automatically after sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile row
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Create a progress row
  INSERT INTO public.user_progress (id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the new user handler when a user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Function to update user progress after an interview session is completed
CREATE OR REPLACE FUNCTION public.update_user_progress_on_session_complete()
RETURNS TRIGGER AS $$
DECLARE
    new_average_score numeric;
BEGIN
  -- Check if the session is being marked as 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Calculate new average score
    SELECT AVG(overall_score) INTO new_average_score
    FROM public.interview_sessions
    WHERE user_id = NEW.user_id AND status = 'completed' AND overall_score IS NOT NULL;

    -- Update the user_progress table
    UPDATE public.user_progress
    SET
      total_sessions = total_sessions + 1,
      completed_sessions = completed_sessions + 1,
      last_session_at = NEW.completed_at,
      total_practice_time_seconds = total_practice_time_seconds + COALESCE(NEW.duration_seconds, 0),
      average_score = COALESCE(new_average_score, 0)
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update progress when a session is completed
DROP TRIGGER IF EXISTS on_session_complete ON public.interview_sessions;
CREATE TRIGGER on_session_complete
  AFTER UPDATE OF status ON public.interview_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_user_progress_on_session_complete();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- Crucial for a fast user experience as data grows.
-- =====================================================

-- Indexes on foreign keys and frequently queried columns
-- Note: Indexes on primary keys are created automatically by PostgreSQL.
CREATE INDEX IF NOT EXISTS interview_sessions_user_id_idx ON public.interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS interview_history_session_id_idx ON public.interview_history(session_id);

-- Create the table to hold sets of interview questions
CREATE TABLE IF NOT EXISTS public.question_sets (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  topic text UNIQUE NOT NULL, -- e.g., 'problem-solving-dsa'
  questions jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for the new table
ALTER TABLE public.question_sets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read the questions
CREATE POLICY "Allow authenticated read access"
  ON public.question_sets FOR SELECT
  TO authenticated
  USING (true);

-- Insert our first question set for DSA
INSERT INTO public.question_sets (topic, questions)
VALUES
  ('problem-solving-dsa', '{
    "questions": [
      {
        "id": 1,
        "type": "behavioral",
        "text": "Welcome to your mock interview. Let''s start with a classic: Tell me about yourself."
      },
      {
        "id": 2,
        "type": "behavioral",
        "text": "Great. Now, can you describe a time you faced a significant technical challenge and how you overcame it?"
      },
      {
        "id": 3,
        "type": "coding",
        "text": "Excellent. Let''s move to a coding problem. Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
        "difficulty": "Easy"
      },
      {
        "id": 4,
        "type": "behavioral",
        "text": "Thanks for walking through that. Finally, where do you see yourself in 5 years?"
      }
    ]
  }');
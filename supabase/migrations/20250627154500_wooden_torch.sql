/*
  # Create question sets table and seed data

  1. New Tables
    - `question_sets`
      - `id` (bigint, primary key, auto-increment)
      - `topic` (text, unique)
      - `questions` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `question_sets` table
    - Add policy for authenticated users to read questions

  3. Seed Data
    - Insert question sets for all 4 topics
*/

-- Create the question_sets table
CREATE TABLE IF NOT EXISTS question_sets (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  topic text UNIQUE NOT NULL,
  questions jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read the questions
CREATE POLICY "Allow authenticated read access to question sets"
  ON question_sets FOR SELECT
  TO authenticated
  USING (true);

-- Insert question sets for all topics
INSERT INTO question_sets (topic, questions) VALUES
-- Problem Solving & DSA
('problem-solving-dsa', '{
  "questions": [
    {
      "id": 1,
      "type": "behavioral",
      "text": "Welcome to your mock interview! Let''s start with a classic: Tell me about yourself."
    },
    {
      "id": 2,
      "type": "behavioral", 
      "text": "Great! Now, can you describe a time when you faced a significant technical challenge and how you overcame it?"
    },
    {
      "id": 3,
      "type": "coding",
      "text": "Excellent. Let''s move to a coding problem. Given an array of integers and a target sum, find two numbers in the array that add up to the target. How would you approach this problem?",
      "difficulty": "Easy"
    },
    {
      "id": 4,
      "type": "behavioral",
      "text": "Thanks for walking through that solution. Finally, where do you see yourself in 5 years, and how does this role fit into your career goals?"
    }
  ]
}'),

-- ReactJS Deep Dive  
('reactjs-deep-dive', '{
  "questions": [
    {
      "id": 1,
      "type": "behavioral",
      "text": "Welcome! Let''s start with the basics: Tell me about yourself and your experience with React."
    },
    {
      "id": 2,
      "type": "technical",
      "text": "Great! Can you explain the difference between functional and class components in React, and when you would use each?"
    },
    {
      "id": 3,
      "type": "technical",
      "text": "Excellent. Now, can you walk me through how React hooks work, particularly useState and useEffect? Can you give me an example of when you''ve used them?"
    },
    {
      "id": 4,
      "type": "behavioral",
      "text": "Perfect! Finally, describe a challenging React project you''ve worked on. What made it challenging and how did you solve the problems you encountered?"
    }
  ]
}'),

-- Next.js & Full-Stack
('nextjs-fullstack', '{
  "questions": [
    {
      "id": 1,
      "type": "behavioral", 
      "text": "Welcome to your Next.js interview! Let''s begin: Tell me about yourself and your experience with full-stack development."
    },
    {
      "id": 2,
      "type": "technical",
      "text": "Great! Can you explain the key differences between client-side rendering, server-side rendering, and static site generation in Next.js?"
    },
    {
      "id": 3,
      "type": "technical",
      "text": "Excellent understanding! Now, how would you handle API routes in Next.js? Can you walk me through creating a REST API endpoint?"
    },
    {
      "id": 4,
      "type": "behavioral",
      "text": "Perfect! Finally, tell me about a full-stack application you''ve built. What technologies did you use and what challenges did you face?"
    }
  ]
}'),

-- System Design Basics
('system-design-basics', '{
  "questions": [
    {
      "id": 1,
      "type": "behavioral",
      "text": "Welcome to your system design interview! Let''s start: Tell me about yourself and any experience you have with designing scalable systems."
    },
    {
      "id": 2,
      "type": "system-design",
      "text": "Great! Let''s dive into system design. How would you design a simple URL shortening service like bit.ly? Walk me through your high-level approach."
    },
    {
      "id": 3,
      "type": "system-design", 
      "text": "Good thinking! Now, how would you handle scaling this system to support millions of users? What are the potential bottlenecks and how would you address them?"
    },
    {
      "id": 4,
      "type": "behavioral",
      "text": "Excellent system thinking! Finally, tell me about a time when you had to optimize the performance of an application or system. What was your approach?"
    }
  ]
}');
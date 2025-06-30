-- Add subscription_plan column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan text 
DEFAULT 'free' 
CHECK (subscription_plan IN ('free', 'starter', 'pro'));

-- Add subscription_expiry column to track when subscription ends
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_expiry timestamptz;

-- Add interview_minutes_used column to track usage for free tier
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS interview_minutes_used integer DEFAULT 0;

COMMENT ON COLUMN public.profiles.subscription_plan IS 'Current subscription plan of the user (free, starter, or pro)';
COMMENT ON COLUMN public.profiles.subscription_expiry IS 'When the current subscription expires';
COMMENT ON COLUMN public.profiles.interview_minutes_used IS 'Number of interview minutes used in current billing cycle';

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS profiles_subscription_plan_idx ON public.profiles(subscription_plan);

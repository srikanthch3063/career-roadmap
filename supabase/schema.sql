-- 1. Create Tables
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  role text CHECK (role IN ('student', 'admin')) DEFAULT 'student',
  branch text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb,
  free_text text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  roadmap jsonb,
  primary_career text,
  created_at timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Quiz Responses: Users can view, insert, and update their own responses
CREATE POLICY "Users can select own quiz responses" 
  ON public.quiz_responses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz responses" 
  ON public.quiz_responses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz responses" 
  ON public.quiz_responses FOR UPDATE 
  USING (auth.uid() = user_id);

-- Roadmaps: Users can view, insert, and update their own roadmaps
CREATE POLICY "Users can select own roadmaps" 
  ON public.roadmaps FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roadmaps" 
  ON public.roadmaps FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roadmaps" 
  ON public.roadmaps FOR UPDATE 
  USING (auth.uid() = user_id);

-- 4. Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'student');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4b. Add blocked flag (Phase 6) - safe for existing DB
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_at timestamptz;

-- To make admin@careerroadmap.test an admin (run this manually after registering the user):
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@careerroadmap.test';

-- 5. System Config (for landing CMS + AI prompts + quiz)
CREATE TABLE IF NOT EXISTS public.system_config (
  id int PRIMARY KEY,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO public.system_config (id, config)
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
-- Allow authenticated read for landing/config, admin write via service_role
DROP POLICY IF EXISTS "Anyone can read config" ON public.system_config;
CREATE POLICY "Anyone can read config" ON public.system_config FOR SELECT USING (true);
-- Writes only via service_role (bypasses RLS), no public update policy

-- 6. Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  topic text NOT NULL,
  problem text NOT NULL CHECK (char_length(problem) <= 500),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert tickets" ON public.support_tickets;
CREATE POLICY "Anyone can insert tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin can read tickets" ON public.support_tickets;
CREATE POLICY "Admin can read tickets" ON public.support_tickets FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can update tickets" ON public.support_tickets;
CREATE POLICY "Admin can update tickets" ON public.support_tickets FOR UPDATE USING (true);
-- Phase 7: link tickets to user (grouped view)
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Phase 8: tracking events (time in roadmap + mentor funnel)
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('page_view','roadmap_view','mentor_message','weekly_view')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
CREATE POLICY "Users can insert own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can select own events" ON public.events;
CREATE POLICY "Users can select own events" ON public.events FOR SELECT USING (auth.uid() = user_id);
-- Admin read via service_role (bypasses RLS)

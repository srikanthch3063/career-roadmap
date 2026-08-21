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

-- To make admin@careerroadmap.test an admin (run this manually after registering the user):
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@careerroadmap.test';

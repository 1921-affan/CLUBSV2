-- Create enum for roles if not exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('student', 'club_head', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table for secure role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create clubs_pending table for approval workflow
CREATE TABLE IF NOT EXISTS public.clubs_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  faculty_advisor TEXT,
  logo_url TEXT,
  whatsapp_link TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

ALTER TABLE public.clubs_pending ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can submit clubs for approval
CREATE POLICY "Authenticated users can create pending clubs"
ON public.clubs_pending
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Users can view their own pending clubs
CREATE POLICY "Users can view their own pending clubs"
ON public.clubs_pending
FOR SELECT
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- Only admins can update pending clubs
CREATE POLICY "Admins can manage pending clubs"
ON public.clubs_pending
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update handle_new_user function to assign default student role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    new.email,
    'student'
  );
  
  -- Insert default student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'student');
  
  RETURN new;
END;
$function$;
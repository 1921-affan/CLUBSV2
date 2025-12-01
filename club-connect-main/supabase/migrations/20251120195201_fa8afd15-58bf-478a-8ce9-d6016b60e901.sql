-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('student', 'club_head', 'admin');

-- Create profiles table (one per user)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create clubs table
CREATE TABLE public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  faculty_advisor text,
  logo_url text,
  whatsapp_link text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on clubs
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Clubs policies (basic ones first)
CREATE POLICY "Anyone can view clubs"
  ON public.clubs FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create clubs"
  ON public.clubs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create club_members table (join table)
CREATE TABLE public.club_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role_in_club text NOT NULL CHECK (role_in_club IN ('member', 'head')),
  joined_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(club_id, user_id)
);

-- Enable RLS on club_members
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- Club members policies
CREATE POLICY "Anyone can view club memberships"
  ON public.club_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join clubs"
  ON public.club_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave clubs"
  ON public.club_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Club heads can manage their club members"
  ON public.club_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_members.club_id
      AND cm.user_id = auth.uid()
      AND cm.role_in_club = 'head'
    )
  );

-- Now add the club update policy that depends on club_members
CREATE POLICY "Club heads can update their clubs"
  ON public.clubs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = clubs.id
      AND user_id = auth.uid()
      AND role_in_club = 'head'
    )
  );

-- Create events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date timestamp with time zone NOT NULL,
  venue text NOT NULL,
  organizer_club uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  banner_url text,
  reminder_status boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Club heads can create events for their clubs"
  ON public.events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = organizer_club
      AND user_id = auth.uid()
      AND role_in_club = 'head'
    )
  );

CREATE POLICY "Club heads can update their club events"
  ON public.events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = organizer_club
      AND user_id = auth.uid()
      AND role_in_club = 'head'
    )
  );

CREATE POLICY "Club heads can delete their club events"
  ON public.events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = organizer_club
      AND user_id = auth.uid()
      AND role_in_club = 'head'
    )
  );

-- Create event_participants table
CREATE TABLE public.event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  timestamp timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_participants
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Event participants policies
CREATE POLICY "Anyone can view event participants"
  ON public.event_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can register for events"
  ON public.event_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unregister from events"
  ON public.event_participants FOR DELETE
  USING (auth.uid() = user_id);

-- Create announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  timestamp timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS on announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Announcements policies
CREATE POLICY "Anyone can view announcements"
  ON public.announcements FOR SELECT
  USING (true);

CREATE POLICY "Club heads can create announcements for their clubs"
  ON public.announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = announcements.club_id
      AND user_id = auth.uid()
      AND role_in_club = 'head'
    )
  );

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    new.email,
    'student'
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
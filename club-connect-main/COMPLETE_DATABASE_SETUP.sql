-- ==============================================================================
-- COMPLETE DATABASE SETUP SCRIPT (DEFINITIVE VERSION)
-- This script consolidates ALL features, fixes, and schema updates into one file.
-- It is idempotent: it checks if things exist before creating them.
-- Run this in the Supabase SQL Editor to fully set up or repair your database.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('student', 'club_head', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES (Create if not exists)

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    role public.app_role DEFAULT 'student'::public.app_role,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Clubs
CREATE TABLE IF NOT EXISTS public.clubs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    category text NOT NULL,
    description text NOT NULL,
    faculty_advisor text,
    logo_url text,
    whatsapp_link text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Clubs Pending
CREATE TABLE IF NOT EXISTS public.clubs_pending (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    faculty_advisor text,
    logo_url text,
    whatsapp_link text,
    created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- Club Members
CREATE TABLE IF NOT EXISTS public.club_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role_in_club text NOT NULL,
    joined_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(club_id, user_id)
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    date timestamptz NOT NULL,
    venue text NOT NULL,
    organizer_club uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    banner_url text,
    reminder_status boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Events Pending
CREATE TABLE IF NOT EXISTS public.events_pending (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    date timestamptz NOT NULL,
    venue text NOT NULL,
    organizer_club uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    banner_url text,
    created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Event Participants
CREATE TABLE IF NOT EXISTS public.event_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    timestamp timestamptz DEFAULT now() NOT NULL,
    attended boolean DEFAULT false,
    UNIQUE(event_id, user_id)
);

-- Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    message text NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    timestamp timestamptz DEFAULT now() NOT NULL
);

-- Announcements Pending
CREATE TABLE IF NOT EXISTS public.announcements_pending (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    message text NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Club Discussions
CREATE TABLE IF NOT EXISTS public.club_discussions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message text NOT NULL,
    parent_id uuid REFERENCES public.club_discussions(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. SCHEMA UPDATES (Ensure columns exist)
DO $$ BEGIN
    -- Profiles: bio, avatar_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    END IF;

    -- Clubs: banner_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'banner_url') THEN
        ALTER TABLE public.clubs ADD COLUMN banner_url text;
    END IF;

    -- Event Participants: attended
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participants' AND column_name = 'attended') THEN
        ALTER TABLE public.event_participants ADD COLUMN attended BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_clubs_created_by ON public.clubs(created_by);
CREATE INDEX IF NOT EXISTS idx_clubs_pending_created_by ON public.clubs_pending(created_by);
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_club ON public.events(organizer_club);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_pending_organizer_club ON public.events_pending(organizer_club);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_club_id ON public.announcements(club_id);
CREATE INDEX IF NOT EXISTS idx_announcements_pending_club_id ON public.announcements_pending(club_id);

-- 6. FUNCTIONS & TRIGGERS

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- get_user_roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- is_club_head
CREATE OR REPLACE FUNCTION public.is_club_head(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.club_members WHERE user_id = _user_id AND role_in_club = 'head')
$$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), NEW.email, 'student');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

-- check_single_admin
CREATE OR REPLACE FUNCTION public.check_single_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_count INTEGER;
BEGIN
  IF NEW.role = 'admin' THEN
    SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin' AND (TG_OP = 'INSERT' OR id != NEW.id);
    IF admin_count >= 1 THEN RAISE EXCEPTION 'Only one admin is allowed in the system. Please remove the existing admin first.'; END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS enforce_single_admin ON public.user_roles;
CREATE TRIGGER enforce_single_admin BEFORE INSERT OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.check_single_admin();

-- 7. ROW LEVEL SECURITY (RLS) & POLICIES

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_discussions ENABLE ROW LEVEL SECURITY;

-- --- PROFILES ---
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- --- USER ROLES ---
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- --- CLUBS ---
DROP POLICY IF EXISTS "Anyone can view clubs" ON public.clubs;
DROP POLICY IF EXISTS "Everyone can view clubs" ON public.clubs;
CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create clubs" ON public.clubs;
CREATE POLICY "Authenticated users can create clubs" ON public.clubs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Club heads can update their clubs" ON public.clubs;
CREATE POLICY "Club heads can update their clubs" ON public.clubs FOR UPDATE USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_id = clubs.id AND user_id = auth.uid() AND role_in_club = 'head'));

-- --- CLUBS PENDING ---
DROP POLICY IF EXISTS "Authenticated users can create pending clubs" ON public.clubs_pending;
CREATE POLICY "Authenticated users can create pending clubs" ON public.clubs_pending FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can view their own pending clubs" ON public.clubs_pending;
CREATE POLICY "Users can view their own pending clubs" ON public.clubs_pending FOR SELECT USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage pending clubs" ON public.clubs_pending;
CREATE POLICY "Admins can manage pending clubs" ON public.clubs_pending FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- --- CLUB MEMBERS ---
DROP POLICY IF EXISTS "Anyone can view club memberships" ON public.club_members;
DROP POLICY IF EXISTS "Everyone can view club members" ON public.club_members;
CREATE POLICY "Anyone can view club memberships" ON public.club_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join clubs" ON public.club_members;
CREATE POLICY "Users can join clubs" ON public.club_members FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave clubs" ON public.club_members;
CREATE POLICY "Users can leave clubs" ON public.club_members FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can insert club members" ON public.club_members;
CREATE POLICY "Admins can insert club members" ON public.club_members FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Club heads can update club members" ON public.club_members;
CREATE POLICY "Club heads can update club members" ON public.club_members FOR UPDATE USING (EXISTS (SELECT 1 FROM public.clubs WHERE id = club_members.club_id AND created_by = auth.uid()));

DROP POLICY IF EXISTS "Club heads can delete club members" ON public.club_members;
CREATE POLICY "Club heads can delete club members" ON public.club_members FOR DELETE USING (EXISTS (SELECT 1 FROM public.clubs WHERE id = club_members.club_id AND created_by = auth.uid()));

-- --- EVENTS ---
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Everyone can view events" ON public.events;
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Club heads can create events for their clubs" ON public.events;
CREATE POLICY "Club heads can create events for their clubs" ON public.events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.club_members WHERE club_id = events.organizer_club AND user_id = auth.uid() AND role_in_club = 'head'));

DROP POLICY IF EXISTS "Club heads can update their club events" ON public.events;
CREATE POLICY "Club heads can update their club events" ON public.events FOR UPDATE USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_id = events.organizer_club AND user_id = auth.uid() AND role_in_club = 'head'));

DROP POLICY IF EXISTS "Club heads can delete their club events" ON public.events;
CREATE POLICY "Club heads can delete their club events" ON public.events FOR DELETE USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_id = events.organizer_club AND user_id = auth.uid() AND role_in_club = 'head'));

-- Admin policies for Events (Added from fixes)
DROP POLICY IF EXISTS "Admins can create events" ON public.events;
CREATE POLICY "Admins can create events" ON public.events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- --- EVENTS PENDING ---
DROP POLICY IF EXISTS "Club heads can create pending events" ON public.events_pending;
CREATE POLICY "Club heads can create pending events" ON public.events_pending FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.club_members WHERE club_id = events_pending.organizer_club AND user_id = auth.uid() AND role_in_club = 'head'));

DROP POLICY IF EXISTS "Club heads can view their pending events" ON public.events_pending;
CREATE POLICY "Club heads can view their pending events" ON public.events_pending FOR SELECT USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.club_members WHERE club_id = events_pending.organizer_club AND user_id = auth.uid() AND role_in_club = 'head'));

DROP POLICY IF EXISTS "Admins can manage pending events" ON public.events_pending;
CREATE POLICY "Admins can manage pending events" ON public.events_pending FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- --- EVENT PARTICIPANTS ---
DROP POLICY IF EXISTS "Anyone can view event participants" ON public.event_participants;
CREATE POLICY "Anyone can view event participants" ON public.event_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own participation" ON public.event_participants;
CREATE POLICY "Users can view their own participation" ON public.event_participants FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Club heads can view event participants" ON public.event_participants;
CREATE POLICY "Club heads can view event participants" ON public.event_participants FOR SELECT USING (EXISTS (SELECT 1 FROM public.events JOIN public.club_members ON events.organizer_club = club_members.club_id WHERE events.id = event_participants.event_id AND club_members.user_id = auth.uid() AND club_members.role_in_club = 'head'));

DROP POLICY IF EXISTS "Users can register for events" ON public.event_participants;
CREATE POLICY "Users can register for events" ON public.event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unregister from events" ON public.event_participants;
CREATE POLICY "Users can unregister from events" ON public.event_participants FOR DELETE USING (auth.uid() = user_id);

-- --- ANNOUNCEMENTS ---
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Everyone can view announcements" ON public.announcements;
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can create announcements" ON public.announcements;
CREATE POLICY "Admins can create announcements" ON public.announcements FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Club heads can create announcements for their clubs" ON public.announcements;
CREATE POLICY "Club heads can create announcements for their clubs" ON public.announcements FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.club_members WHERE club_id = announcements.club_id AND user_id = auth.uid() AND role_in_club = 'head'));

-- --- ANNOUNCEMENTS PENDING ---
DROP POLICY IF EXISTS "Club heads can create pending announcements" ON public.announcements_pending;
CREATE POLICY "Club heads can create pending announcements" ON public.announcements_pending FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.club_members WHERE club_id = announcements_pending.club_id AND user_id = auth.uid() AND role_in_club = 'head'));

DROP POLICY IF EXISTS "Club heads can view their pending announcements" ON public.announcements_pending;
CREATE POLICY "Club heads can view their pending announcements" ON public.announcements_pending FOR SELECT USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.club_members WHERE club_id = announcements_pending.club_id AND user_id = auth.uid() AND role_in_club = 'head'));

DROP POLICY IF EXISTS "Admins can manage pending announcements" ON public.announcements_pending;
CREATE POLICY "Admins can manage pending announcements" ON public.announcements_pending FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- --- CLUB DISCUSSIONS ---
DROP POLICY IF EXISTS "Anyone can view club discussions" ON public.club_discussions;
CREATE POLICY "Anyone can view club discussions" ON public.club_discussions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can post discussions" ON public.club_discussions;
CREATE POLICY "Authenticated users can post discussions" ON public.club_discussions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own discussions" ON public.club_discussions;
CREATE POLICY "Users can delete their own discussions" ON public.club_discussions FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Club heads can delete discussions in their club" ON public.club_discussions;
CREATE POLICY "Club heads can delete discussions in their club" ON public.club_discussions FOR DELETE USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_id = club_discussions.club_id AND user_id = auth.uid() AND role_in_club = 'head'));


-- 8. PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 9. SCHEMA REFRESH
NOTIFY pgrst, 'reload schema';

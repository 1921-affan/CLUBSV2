-- Create events_pending table for event approval workflow
CREATE TABLE public.events_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue TEXT NOT NULL,
  organizer_club UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  banner_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.events_pending ENABLE ROW LEVEL SECURITY;

-- Club heads can create pending events for their clubs
CREATE POLICY "Club heads can create pending events"
ON public.events_pending
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = events_pending.organizer_club
    AND user_id = auth.uid()
    AND role_in_club = 'head'
  )
);

-- Club heads can view their own pending events
CREATE POLICY "Club heads can view their pending events"
ON public.events_pending
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  has_role(auth.uid(), 'admin')
);

-- Admins can manage all pending events
CREATE POLICY "Admins can manage pending events"
ON public.events_pending
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));
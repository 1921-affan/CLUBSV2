-- Create pending announcements table for admin approval
CREATE TABLE public.announcements_pending (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.announcements_pending ENABLE ROW LEVEL SECURITY;

-- Club heads can create pending announcements
CREATE POLICY "Club heads can create pending announcements"
ON public.announcements_pending
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = announcements_pending.club_id
    AND club_members.user_id = auth.uid()
    AND club_members.role_in_club = 'head'
  )
);

-- Club heads can view their own pending announcements
CREATE POLICY "Club heads can view their pending announcements"
ON public.announcements_pending
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  has_role(auth.uid(), 'admin')
);

-- Admins can manage all pending announcements
CREATE POLICY "Admins can manage pending announcements"
ON public.announcements_pending
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));
-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Club heads can manage their club members" ON public.club_members;

-- Create simpler, non-recursive policies for club_members
-- Users can view all club memberships (already exists, keeping it)

-- Users can insert themselves as members (already exists, keeping it)

-- Club heads can update members of their clubs (non-recursive version)
CREATE POLICY "Club heads can update club members"
ON public.club_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.clubs
    WHERE clubs.id = club_members.club_id
    AND clubs.created_by = auth.uid()
  )
);

-- Club heads can delete members from their clubs (non-recursive version)
CREATE POLICY "Club heads can delete club members"
ON public.club_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.clubs
    WHERE clubs.id = club_members.club_id
    AND clubs.created_by = auth.uid()
  )
);
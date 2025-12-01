-- Allow admins to insert club members when approving clubs
CREATE POLICY "Admins can insert club members"
ON public.club_members
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
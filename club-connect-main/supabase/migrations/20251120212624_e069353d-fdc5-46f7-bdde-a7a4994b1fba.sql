-- Allow admins to create announcements (for approving pending announcements)
CREATE POLICY "Admins can create announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));
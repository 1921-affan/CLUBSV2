-- Add foreign key constraint for events_pending.created_by to profiles table
ALTER TABLE public.events_pending
ADD CONSTRAINT events_pending_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
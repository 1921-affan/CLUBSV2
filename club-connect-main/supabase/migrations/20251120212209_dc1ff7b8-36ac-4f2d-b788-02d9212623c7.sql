-- Add foreign key constraint for created_by to enable proper joins
ALTER TABLE public.announcements_pending
ADD CONSTRAINT announcements_pending_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
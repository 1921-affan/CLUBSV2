-- Add unique constraint to prevent duplicate club names
ALTER TABLE public.clubs 
ADD CONSTRAINT unique_club_name UNIQUE (name);
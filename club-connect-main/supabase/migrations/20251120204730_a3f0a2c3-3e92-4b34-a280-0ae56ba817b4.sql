-- Create a function to enforce single admin rule
CREATE OR REPLACE FUNCTION public.check_single_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Only check if the new role is 'admin'
  IF NEW.role = 'admin' THEN
    -- Count existing admins (excluding the current row if it's an update)
    SELECT COUNT(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin'
    AND (TG_OP = 'INSERT' OR id != NEW.id);
    
    IF admin_count >= 1 THEN
      RAISE EXCEPTION 'Only one admin is allowed in the system. Please remove the existing admin first.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce single admin
DROP TRIGGER IF EXISTS enforce_single_admin ON public.user_roles;
CREATE TRIGGER enforce_single_admin
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
WHEN (NEW.role = 'admin')
EXECUTE FUNCTION public.check_single_admin();

-- Create a function to check if user is club head of any club
CREATE OR REPLACE FUNCTION public.is_club_head(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_members
    WHERE user_id = _user_id
    AND role_in_club = 'head'
  )
$$;

-- Add helpful comment
COMMENT ON FUNCTION public.check_single_admin() IS 'Ensures only one admin can exist in the system';
COMMENT ON FUNCTION public.is_club_head(_user_id UUID) IS 'Checks if a user is a club head of any club';
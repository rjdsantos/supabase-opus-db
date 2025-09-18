-- Create a function to check if user is admin without recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'::user_role
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop the problematic policies and create corrected ones
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all budget details" ON public.orcamento_detalhes;

-- Create the correct policies using the function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles
FOR SELECT 
USING (public.is_current_user_admin());

CREATE POLICY "Admins can view all budget details" 
ON public.orcamento_detalhes
FOR SELECT 
USING (public.is_current_user_admin());
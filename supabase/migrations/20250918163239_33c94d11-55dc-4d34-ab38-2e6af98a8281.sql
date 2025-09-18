-- Allow admins to read client profiles  
CREATE POLICY "Admins can view all profiles" 
ON public.profiles
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles AS p2
  WHERE p2.user_id = auth.uid() AND p2.role = 'admin'::user_role
));

-- Allow admins to read all budget details
CREATE POLICY "Admins can view all budget details" 
ON public.orcamento_detalhes
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles AS p2
  WHERE p2.user_id = auth.uid() AND p2.role = 'admin'::user_role
));
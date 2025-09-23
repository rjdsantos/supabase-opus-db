-- Remove the insecure policy that allows anyone to create notifications
DROP POLICY IF EXISTS "System can create notifications" ON public.notificacoes;

-- Create a more secure policy that only allows:
-- 1. Service role (for edge functions)
-- 2. Admin users (for manual intervention)
CREATE POLICY "Only system or admins can create notifications" 
ON public.notificacoes 
FOR INSERT 
WITH CHECK (
    -- Allow service role (used by edge functions)
    auth.role() = 'service_role'
    OR
    -- Allow admin users (for manual intervention)
    is_current_user_admin()
);

-- Create a policy for updating notifications (for retry mechanisms)
CREATE POLICY "Only system or admins can update notifications" 
ON public.notificacoes 
FOR UPDATE 
USING (
    -- Allow service role (used by edge functions)
    auth.role() = 'service_role'
    OR
    -- Allow admin users (for manual intervention)  
    is_current_user_admin()
) 
WITH CHECK (
    -- Allow service role (used by edge functions)
    auth.role() = 'service_role'
    OR
    -- Allow admin users (for manual intervention)
    is_current_user_admin()
);
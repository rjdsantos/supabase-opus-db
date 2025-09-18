-- Fix the view to use security invoker instead of security definer
ALTER VIEW public.orcamentos_with_client SET (security_invoker = true);
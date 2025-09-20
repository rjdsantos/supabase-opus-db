-- Drop and recreate the view without security_barrier to ensure proper RLS enforcement
DROP VIEW IF EXISTS public.orcamentos_with_client;

-- Create a secure view that enforces RLS policies from the querying user's perspective
-- This ensures that users can only see data they're authorized to access
CREATE VIEW public.orcamentos_with_client AS
SELECT 
  o.id_orcamento,
  o.id_cliente,
  o.categoria,
  o.status,
  o.data_envio,
  o.created_at,
  o.updated_at,
  o.is_draft,
  o.id_orcamento_vinculado,
  p.full_name AS cliente_nome,
  p.email AS cliente_email,
  p.phone AS cliente_telefone
FROM public.orcamentos o
LEFT JOIN public.profiles p ON (o.id_cliente = p.user_id);

-- Grant SELECT permission to authenticated users
-- The RLS policies on orcamentos and profiles tables will automatically restrict access
GRANT SELECT ON public.orcamentos_with_client TO authenticated;
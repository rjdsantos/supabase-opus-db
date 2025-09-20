-- Drop the existing insecure view
DROP VIEW IF EXISTS public.orcamentos_with_client;

-- Create a new secure view that respects RLS policies from base tables
-- This view will automatically enforce the RLS policies from orcamentos and profiles tables
CREATE VIEW public.orcamentos_with_client 
WITH (security_barrier = true) AS
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

-- Grant appropriate permissions
GRANT SELECT ON public.orcamentos_with_client TO authenticated;
-- Completely recreate the view with explicit security settings
DROP VIEW IF EXISTS public.orcamentos_with_client CASCADE;

-- Create a standard view that will inherit RLS from base tables
CREATE OR REPLACE VIEW public.orcamentos_with_client AS
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

-- Explicitly set the view to use invoker rights (not definer rights)
ALTER VIEW public.orcamentos_with_client SET (security_invoker = true);

-- Grant access to authenticated users
GRANT SELECT ON public.orcamentos_with_client TO authenticated;
-- Drop the current view and recreate it with proper RLS
DROP VIEW IF EXISTS public.orcamentos_with_client;

-- Recreate the view without SECURITY DEFINER (uses invoker's privileges)
CREATE VIEW public.orcamentos_with_client AS
SELECT 
  o.id_orcamento,
  o.id_cliente,
  o.categoria,
  o.status,
  o.data_envio,
  o.created_at,
  o.updated_at,
  o.id_orcamento_vinculado,
  p.full_name as cliente_nome,
  p.email as cliente_email,
  p.phone as cliente_telefone
FROM public.orcamentos o
LEFT JOIN public.profiles p ON o.id_cliente = p.user_id;
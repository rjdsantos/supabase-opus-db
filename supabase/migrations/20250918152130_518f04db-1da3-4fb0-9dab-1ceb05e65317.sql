-- Create a view to simplify orçamentos queries with client data
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
  p.full_name as cliente_nome,
  p.email as cliente_email,
  p.phone as cliente_telefone
FROM orcamentos o
LEFT JOIN profiles p ON o.id_cliente = p.user_id;

-- Grant access to the view
GRANT SELECT ON public.orcamentos_with_client TO authenticated;
GRANT SELECT ON public.orcamentos_with_client TO anon;
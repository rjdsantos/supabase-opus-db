-- Remove all draft budgets and their details from the database
DELETE FROM public.orcamento_detalhes 
WHERE id_orcamento IN (
  SELECT id_orcamento FROM public.orcamentos WHERE is_draft = true
);

DELETE FROM public.orcamentos WHERE is_draft = true;

-- Drop the view that depends on is_draft column
DROP VIEW IF EXISTS public.orcamentos_with_client;

-- Remove the is_draft column from orcamentos table since we no longer need draft functionality
ALTER TABLE public.orcamentos DROP COLUMN is_draft;

-- Update existing budgets to ensure they all have proper data_envio
UPDATE public.orcamentos 
SET data_envio = COALESCE(data_envio, created_at) 
WHERE data_envio IS NULL;

-- Recreate the view without is_draft column
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
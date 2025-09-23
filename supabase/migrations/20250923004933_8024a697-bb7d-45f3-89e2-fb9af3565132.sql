-- Remove all draft budgets and their details from the database
DELETE FROM public.orcamento_detalhes 
WHERE id_orcamento IN (
  SELECT id_orcamento FROM public.orcamentos WHERE is_draft = true
);

DELETE FROM public.orcamentos WHERE is_draft = true;

-- Remove the is_draft column from orcamentos table since we no longer need draft functionality
ALTER TABLE public.orcamentos DROP COLUMN is_draft;

-- Update existing budgets to ensure they all have proper data_envio
UPDATE public.orcamentos 
SET data_envio = COALESCE(data_envio, created_at) 
WHERE data_envio IS NULL;
-- Add column to link related budgets
ALTER TABLE public.orcamentos 
ADD COLUMN id_orcamento_vinculado uuid REFERENCES public.orcamentos(id_orcamento);

-- Add index for better performance
CREATE INDEX idx_orcamentos_vinculado ON public.orcamentos(id_orcamento_vinculado);
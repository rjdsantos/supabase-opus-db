-- Add 'presentes' to categoria_orcamento enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'presentes' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'categoria_orcamento')) THEN
        ALTER TYPE categoria_orcamento ADD VALUE 'presentes';
    END IF;
END $$;

-- Add linking columns to orcamentos table for budget relationships
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS id_orcamento_vinculado uuid REFERENCES public.orcamentos(id_orcamento);

-- Create index for performance on linked budgets queries
CREATE INDEX IF NOT EXISTS idx_orcamentos_vinculado ON public.orcamentos(id_orcamento_vinculado);

-- Update RLS policies to handle linked budgets
DROP POLICY IF EXISTS "Clients can view own budgets" ON public.orcamentos;
CREATE POLICY "Clients can view own budgets" 
ON public.orcamentos 
FOR SELECT 
USING (auth.uid() = id_cliente);

-- Allow clients to view linked budgets
CREATE POLICY "Clients can view linked budgets" 
ON public.orcamentos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orcamentos o2 
    WHERE o2.id_cliente = auth.uid() 
    AND (o2.id_orcamento_vinculado = orcamentos.id_orcamento 
         OR orcamentos.id_orcamento_vinculado = o2.id_orcamento)
  )
);
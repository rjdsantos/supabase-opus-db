-- Remove duplicate drafts keeping only the most recent one
WITH duplicates AS (
  SELECT 
    id_orcamento,
    ROW_NUMBER() OVER (
      PARTITION BY id_cliente, categoria 
      ORDER BY created_at DESC
    ) as rn
  FROM public.orcamentos 
  WHERE is_draft = true
)
DELETE FROM public.orcamentos 
WHERE id_orcamento IN (
  SELECT id_orcamento 
  FROM duplicates 
  WHERE rn > 1
);

-- Now create the unique index to prevent future duplicates
CREATE UNIQUE INDEX idx_unique_draft_per_user_category
ON public.orcamentos (id_cliente, categoria)
WHERE is_draft = true;
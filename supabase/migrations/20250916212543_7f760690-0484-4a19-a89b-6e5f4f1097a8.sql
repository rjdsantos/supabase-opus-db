-- Ensure only one draft per user and category
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_draft_per_user_category
ON public.orcamentos (id_cliente, categoria)
WHERE is_draft IS TRUE;
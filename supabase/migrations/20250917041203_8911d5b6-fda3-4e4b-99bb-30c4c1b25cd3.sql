-- Remove recursive policy that references the same table directly
DROP POLICY IF EXISTS "Clients can view linked budgets" ON public.orcamentos;

-- Create a SECURITY DEFINER function to evaluate linked access without recursion
CREATE OR REPLACE FUNCTION public.can_view_orcamento(_orcamento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- A user can view the budget if:
  -- 1) They own it
  -- 2) They own a budget that links TO it
  -- 3) They own a budget that it links TO (bidirectional relationship)
  SELECT EXISTS (
    -- Own the budget directly
    SELECT 1 FROM public.orcamentos o
    WHERE o.id_orcamento = _orcamento_id AND o.id_cliente = auth.uid()
  )
  OR EXISTS (
    -- Own a budget that links to this budget
    SELECT 1 FROM public.orcamentos o
    WHERE o.id_cliente = auth.uid() AND o.id_orcamento_vinculado = _orcamento_id
  )
  OR EXISTS (
    -- This budget links to a budget the user owns
    SELECT 1 FROM public.orcamentos o
    WHERE o.id_cliente = auth.uid() AND o.id_orcamento = (
      SELECT x.id_orcamento_vinculado FROM public.orcamentos x WHERE x.id_orcamento = _orcamento_id
    )
  );
$$;

-- Recreate a non-recursive policy using the function
CREATE POLICY "Clients can view linked budgets"
ON public.orcamentos
FOR SELECT
USING (public.can_view_orcamento(id_orcamento));
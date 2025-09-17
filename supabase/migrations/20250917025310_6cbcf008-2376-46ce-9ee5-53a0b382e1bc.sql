-- Policy to allow clients to update their own budgets (finalize and set data_envio)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orcamentos' AND policyname = 'Clients can update own budgets'
  ) THEN
    CREATE POLICY "Clients can update own budgets"
    ON public.orcamentos
    FOR UPDATE
    USING (auth.uid() = id_cliente)
    WITH CHECK (auth.uid() = id_cliente);
  END IF;
END $$;

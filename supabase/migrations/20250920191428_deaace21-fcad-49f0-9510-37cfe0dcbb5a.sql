-- Enable Row Level Security on orcamentos_with_client table
ALTER TABLE public.orcamentos_with_client ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all budget data with client information
CREATE POLICY "Admins can view all budgets with client info" 
ON public.orcamentos_with_client 
FOR SELECT 
USING (is_current_user_admin());

-- Policy: Clients can view only their own budget data
CREATE POLICY "Clients can view own budgets with client info" 
ON public.orcamentos_with_client 
FOR SELECT 
USING (auth.uid() = id_cliente);

-- Policy: Clients can view linked budgets (using the existing function)
CREATE POLICY "Clients can view linked budgets with client info" 
ON public.orcamentos_with_client 
FOR SELECT 
USING (can_view_orcamento(id_orcamento));
-- Drop the existing view
DROP VIEW IF EXISTS public.orcamentos_with_client;

-- Recreate the view properly with RLS
CREATE VIEW public.orcamentos_with_client AS
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

-- Enable RLS on the view
ALTER VIEW public.orcamentos_with_client SET (security_invoker = true);

-- Create RLS policies for the view
CREATE POLICY "Admins can view all budgets with client data" 
ON public.orcamentos_with_client
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

CREATE POLICY "Clients can view own budgets with client data" 
ON public.orcamentos_with_client
FOR SELECT 
USING (auth.uid() = id_cliente);

CREATE POLICY "Clients can view linked budgets with client data" 
ON public.orcamentos_with_client
FOR SELECT 
USING (can_view_orcamento(id_orcamento));
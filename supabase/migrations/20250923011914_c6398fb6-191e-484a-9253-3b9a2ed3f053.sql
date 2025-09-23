-- Remove the existing view that may have SECURITY DEFINER issues
DROP VIEW IF EXISTS public.orcamentos_with_client;

-- Create a more secure approach using a function that respects RLS
CREATE OR REPLACE FUNCTION public.get_orcamentos_with_client_info()
RETURNS TABLE (
    id_orcamento uuid,
    id_cliente uuid,
    categoria categoria_orcamento,
    status status_orcamento,
    data_envio timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    id_orcamento_vinculado uuid,
    cliente_nome text,
    cliente_email text,
    cliente_telefone text
) 
LANGUAGE sql
SECURITY INVOKER  -- Use INVOKER instead of DEFINER for better security
STABLE
SET search_path = public
AS $$
    SELECT 
        o.id_orcamento,
        o.id_cliente,
        o.categoria,
        o.status,
        o.data_envio,
        o.created_at,
        o.updated_at,
        o.id_orcamento_vinculado,
        p.full_name AS cliente_nome,
        p.email AS cliente_email,
        p.phone AS cliente_telefone
    FROM orcamentos o
    LEFT JOIN profiles p ON o.id_cliente = p.user_id
    WHERE 
        -- Respect existing RLS policies by only showing data the current user can access
        (
            -- User can see their own budgets
            auth.uid() = o.id_cliente
            OR 
            -- Admins can see all budgets
            is_current_user_admin()
        );
$$;
-- Add foreign key relationship between orcamentos and profiles
ALTER TABLE public.orcamentos 
ADD CONSTRAINT fk_orcamentos_cliente 
FOREIGN KEY (id_cliente) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
-- Create enum for budget categories
CREATE TYPE public.categoria_orcamento AS ENUM ('decoracao', 'lembrancinhas', 'presentes');

-- Create enum for budget status
CREATE TYPE public.status_orcamento AS ENUM ('novo', 'respondido', 'concluido');

-- Create budgets table
CREATE TABLE public.orcamentos (
  id_orcamento UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_cliente UUID NOT NULL,
  categoria categoria_orcamento NOT NULL,
  status status_orcamento NOT NULL DEFAULT 'novo',
  data_envio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin status log table for audit trail
CREATE TABLE public.admin_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_orcamento UUID NOT NULL REFERENCES public.orcamentos(id_orcamento) ON DELETE CASCADE,
  status status_orcamento NOT NULL,
  data_alteracao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orcamentos
-- Clients can view and create their own budgets
CREATE POLICY "Clients can view own budgets" 
ON public.orcamentos 
FOR SELECT 
USING (auth.uid() = id_cliente);

CREATE POLICY "Clients can create own budgets" 
ON public.orcamentos 
FOR INSERT 
WITH CHECK (auth.uid() = id_cliente);

-- Admins can view all budgets and update status
CREATE POLICY "Admins can view all budgets" 
ON public.orcamentos 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Admins can update budget status" 
ON public.orcamentos 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- RLS Policies for admin_status
-- Only admins can view and create status logs
CREATE POLICY "Admins can view status logs" 
ON public.admin_status 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Admins can create status logs" 
ON public.admin_status 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
) AND auth.uid() = admin_id);

-- Create trigger for automatic timestamp updates on orcamentos
CREATE TRIGGER update_orcamentos_updated_at
BEFORE UPDATE ON public.orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_orcamentos_id_cliente ON public.orcamentos(id_cliente);
CREATE INDEX idx_orcamentos_status ON public.orcamentos(status);
CREATE INDEX idx_orcamentos_data_envio ON public.orcamentos(data_envio DESC);
CREATE INDEX idx_admin_status_orcamento ON public.admin_status(id_orcamento);
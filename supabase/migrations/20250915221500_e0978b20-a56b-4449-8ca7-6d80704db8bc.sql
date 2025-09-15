-- Add is_draft column to orcamentos table
ALTER TABLE public.orcamentos 
ADD COLUMN is_draft BOOLEAN DEFAULT true;

-- Create orcamento_detalhes table for key-value storage
CREATE TABLE public.orcamento_detalhes (
  id_detalhe UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_orcamento UUID NOT NULL,
  chave TEXT NOT NULL,
  valor TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(id_orcamento, chave)
);

-- Enable RLS for orcamento_detalhes
ALTER TABLE public.orcamento_detalhes ENABLE ROW LEVEL SECURITY;

-- Create policies for orcamento_detalhes
CREATE POLICY "Clients can view own budget details" 
ON public.orcamento_detalhes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orcamentos 
    WHERE orcamentos.id_orcamento = orcamento_detalhes.id_orcamento 
    AND orcamentos.id_cliente = auth.uid()
  )
);

CREATE POLICY "Clients can create own budget details" 
ON public.orcamento_detalhes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orcamentos 
    WHERE orcamentos.id_orcamento = orcamento_detalhes.id_orcamento 
    AND orcamentos.id_cliente = auth.uid()
  )
);

CREATE POLICY "Clients can update own budget details" 
ON public.orcamento_detalhes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.orcamentos 
    WHERE orcamentos.id_orcamento = orcamento_detalhes.id_orcamento 
    AND orcamentos.id_cliente = auth.uid()
  )
);

CREATE POLICY "Clients can delete own budget details" 
ON public.orcamento_detalhes 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.orcamentos 
    WHERE orcamentos.id_orcamento = orcamento_detalhes.id_orcamento 
    AND orcamentos.id_cliente = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_orcamento_detalhes_updated_at
BEFORE UPDATE ON public.orcamento_detalhes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create ia_sugestoes table for AI suggestions
CREATE TABLE public.ia_sugestoes (
  id_sugestao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_orcamento UUID NOT NULL,
  campo TEXT NOT NULL,
  texto_sugerido TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'rejeitado' CHECK (status IN ('aceito', 'editado', 'rejeitado')),
  data_geracao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for ia_sugestoes
ALTER TABLE public.ia_sugestoes ENABLE ROW LEVEL SECURITY;

-- Create policies for ia_sugestoes
CREATE POLICY "Clients can view own AI suggestions" 
ON public.ia_sugestoes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orcamentos 
    WHERE orcamentos.id_orcamento = ia_sugestoes.id_orcamento 
    AND orcamentos.id_cliente = auth.uid()
  )
);

CREATE POLICY "Clients can create own AI suggestions" 
ON public.ia_sugestoes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orcamentos 
    WHERE orcamentos.id_orcamento = ia_sugestoes.id_orcamento 
    AND orcamentos.id_cliente = auth.uid()
  )
);

CREATE POLICY "Clients can update own AI suggestions" 
ON public.ia_sugestoes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.orcamentos 
    WHERE orcamentos.id_orcamento = ia_sugestoes.id_orcamento 
    AND orcamentos.id_cliente = auth.uid()
  )
);

-- Create ia_interacoes table for AI interactions
CREATE TABLE public.ia_interacoes (
  id_interacao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_sugestao UUID NOT NULL,
  id_cliente UUID NOT NULL,
  acao TEXT NOT NULL CHECK (acao IN ('aceitar', 'editar', 'rejeitar')),
  data_interacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for ia_interacoes
ALTER TABLE public.ia_interacoes ENABLE ROW LEVEL SECURITY;

-- Create policies for ia_interacoes
CREATE POLICY "Clients can view own AI interactions" 
ON public.ia_interacoes 
FOR SELECT 
USING (id_cliente = auth.uid());

CREATE POLICY "Clients can create own AI interactions" 
ON public.ia_interacoes 
FOR INSERT 
WITH CHECK (id_cliente = auth.uid());

-- Create notificacoes table
CREATE TABLE public.notificacoes (
  id_notificacao UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_orcamento UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('email_cliente', 'email_admin', 'whatsapp_cliente', 'whatsapp_admin')),
  status_envio TEXT NOT NULL DEFAULT 'pendente' CHECK (status_envio IN ('pendente', 'enviado', 'falhou')),
  data_envio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_tentativa TIMESTAMP WITH TIME ZONE,
  erro_mensagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for notificacoes
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Create policies for notificacoes (admins can see all, clients can see their own)
CREATE POLICY "Clients can view own notifications" 
ON public.notificacoes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orcamentos 
    WHERE orcamentos.id_orcamento = notificacoes.id_orcamento 
    AND orcamentos.id_cliente = auth.uid()
  )
);

CREATE POLICY "Admins can view all notifications" 
ON public.notificacoes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "System can create notifications" 
ON public.notificacoes 
FOR INSERT 
WITH CHECK (true);

-- Create enum types for form fields
CREATE TYPE evento_tipo AS ENUM (
  'aniversario', 
  'cha_de_bebe', 
  'mini_wedding', 
  'batizado', 
  'festa_tematica', 
  'evento_corporativo', 
  'arvore_de_natal'
);

CREATE TYPE arvore_tamanho AS ENUM (
  'ate_1m', 
  'ate_1_5m', 
  'ate_2m', 
  'acima_2m'
);
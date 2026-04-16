-- Adicionar colunas para integração Autentique na tabela contratos
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS negociacao_id UUID REFERENCES public.negociacoes(id) ON DELETE SET NULL;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'contrato';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS autentique_document_id TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS autentique_link TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS autentique_status TEXT DEFAULT 'pendente';

-- Flexibilizar NOT NULL para inserção via edge function
ALTER TABLE public.contratos ALTER COLUMN numero SET DEFAULT 'AUTO';
ALTER TABLE public.contratos ALTER COLUMN associado_id DROP NOT NULL;
ALTER TABLE public.contratos ALTER COLUMN valor_mensal SET DEFAULT 0;

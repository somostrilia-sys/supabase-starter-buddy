-- supabase/migrations/20260330000001_negociacoes.sql
-- Tabela principal de negociações do pipeline GIA

CREATE TABLE IF NOT EXISTS public.negociacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT,
  lead_nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  telefone TEXT,
  email TEXT,
  veiculo_modelo TEXT,
  veiculo_placa TEXT,
  plano TEXT,
  valor_plano DECIMAL(10,2),
  stage TEXT DEFAULT 'novo_lead',
  consultor_id UUID,
  consultor TEXT,
  cooperativa TEXT,
  regional TEXT,
  gerente TEXT,
  origem TEXT DEFAULT 'Manual',
  observacoes TEXT,
  enviado_sga BOOLEAN DEFAULT FALSE,
  company_id UUID,
  visualizacoes_proposta INTEGER DEFAULT 0,
  status_icons JSONB DEFAULT '{"aceita":false,"pendente":true,"aprovada":false,"sga":false,"rastreador":false,"inadimplencia":false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.negociacoes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'negociacoes' AND policyname = 'allow_authenticated') THEN
    CREATE POLICY allow_authenticated ON public.negociacoes
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_negociacoes_stage ON public.negociacoes(stage);
CREATE INDEX IF NOT EXISTS idx_negociacoes_company_id ON public.negociacoes(company_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_created_at ON public.negociacoes(created_at DESC);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_negociacoes_updated_at ON public.negociacoes;
CREATE TRIGGER set_negociacoes_updated_at
  BEFORE UPDATE ON public.negociacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Permite múltiplos agregados por negociação (fluxo CRM de Pesados)
-- Fix: Errata 3 — cadastro de agregados com Valor Protegido + tabela de preços + plano próprio

CREATE TABLE IF NOT EXISTS public.negociacao_agregados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negociacao_id UUID NOT NULL REFERENCES public.negociacoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  placa TEXT,
  chassi TEXT,
  renavam TEXT,
  valor_protegido NUMERIC NOT NULL,
  tabela_precos_id UUID,
  plano TEXT,
  cota NUMERIC,
  cota_pct NUMERIC,
  mensalidade NUMERIC,
  adesao NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_neg_agregados_neg ON public.negociacao_agregados(negociacao_id);

ALTER TABLE public.negociacao_agregados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_auth_neg_agregados" ON public.negociacao_agregados;
CREATE POLICY "read_auth_neg_agregados" ON public.negociacao_agregados FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_auth_neg_agregados" ON public.negociacao_agregados;
CREATE POLICY "write_auth_neg_agregados" ON public.negociacao_agregados FOR ALL TO authenticated USING (true) WITH CHECK (true);

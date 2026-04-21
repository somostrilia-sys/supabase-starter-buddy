-- Tabelas de apoio para "Tabela Mestre" — liberação de modelos FIPE por marca
-- Fix: Errata 2 — Tabela Mestre deve listar modelos exatos da FIPE por marca

-- 1) Marcas (cache FIPE + flag de ativação)
CREATE TABLE IF NOT EXISTS public.marcas_veiculo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  codigo_fipe TEXT,
  tipo_veiculo TEXT,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marcas_veiculo_tipo ON public.marcas_veiculo(tipo_veiculo);

-- 2) Modelos (sincronizados da FIPE — um registro por modelo)
CREATE TABLE IF NOT EXISTS public.modelos_veiculo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id UUID NOT NULL REFERENCES public.marcas_veiculo(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cod_fipe TEXT,
  tipo_veiculo TEXT,
  planos TEXT,
  aceito BOOLEAN NOT NULL DEFAULT TRUE,
  motivo_rejeicao TEXT,
  ano_min INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (marca_id, cod_fipe)
);

CREATE INDEX IF NOT EXISTS idx_modelos_veiculo_marca ON public.modelos_veiculo(marca_id);
CREATE INDEX IF NOT EXISTS idx_modelos_veiculo_aceito ON public.modelos_veiculo(aceito);
CREATE INDEX IF NOT EXISTS idx_modelos_veiculo_cod_fipe ON public.modelos_veiculo(cod_fipe);

-- 3) Tabela Mestre: liberações por tabela + modelo (com ano mínimo por marca)
CREATE TABLE IF NOT EXISTS public.tabela_mestre_modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela_id TEXT NOT NULL,
  marca_id UUID REFERENCES public.marcas_veiculo(id) ON DELETE CASCADE,
  modelo_id UUID REFERENCES public.modelos_veiculo(id) ON DELETE CASCADE,
  ano_minimo INTEGER,
  liberado BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tabela_id, modelo_id)
);

CREATE INDEX IF NOT EXISTS idx_tm_modelos_tabela ON public.tabela_mestre_modelos(tabela_id);
CREATE INDEX IF NOT EXISTS idx_tm_modelos_marca ON public.tabela_mestre_modelos(marca_id);

-- RLS
ALTER TABLE public.marcas_veiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_veiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabela_mestre_modelos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_marcas" ON public.marcas_veiculo;
CREATE POLICY "read_all_marcas" ON public.marcas_veiculo FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "write_auth_marcas" ON public.marcas_veiculo;
CREATE POLICY "write_auth_marcas" ON public.marcas_veiculo FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "read_all_modelos" ON public.modelos_veiculo;
CREATE POLICY "read_all_modelos" ON public.modelos_veiculo FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "write_auth_modelos" ON public.modelos_veiculo;
CREATE POLICY "write_auth_modelos" ON public.modelos_veiculo FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "read_all_tm_modelos" ON public.tabela_mestre_modelos;
CREATE POLICY "read_all_tm_modelos" ON public.tabela_mestre_modelos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "write_auth_tm_modelos" ON public.tabela_mestre_modelos;
CREATE POLICY "write_auth_tm_modelos" ON public.tabela_mestre_modelos FOR ALL TO authenticated USING (true) WITH CHECK (true);

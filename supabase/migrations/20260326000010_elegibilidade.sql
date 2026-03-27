-- supabase/migrations/20260326000010_elegibilidade.sql
CREATE TABLE IF NOT EXISTS public.categorias_veiculo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL -- "automovel", "motocicleta", "pesado"
);

CREATE TABLE IF NOT EXISTS public.regionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  estado TEXT,
  cidade TEXT,
  cooperativa_id UUID
);

CREATE TABLE IF NOT EXISTS public.fornecedores_gia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  api_url TEXT,
  ativo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.produtos_gia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  fornecedor_id UUID REFERENCES public.fornecedores_gia(id),
  valor_base NUMERIC(10,2) DEFAULT 0,
  tipo TEXT DEFAULT 'principal', -- 'principal' | 'opcional'
  ativo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.planos_gia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.plano_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID REFERENCES public.planos_gia(id),
  produto_id UUID REFERENCES public.produtos_gia(id)
);

CREATE TABLE IF NOT EXISTS public.produto_regras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES public.produtos_gia(id),
  categoria_id UUID REFERENCES public.categorias_veiculo(id),
  regional_id UUID REFERENCES public.regionais(id),
  ativo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.veiculo_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID REFERENCES public.veiculos(id),
  produto_id UUID REFERENCES public.produtos_gia(id),
  tipo TEXT DEFAULT 'principal'
);

-- Habilitar RLS em todas
ALTER TABLE public.categorias_veiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores_gia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_gia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_gia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculo_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON public.categorias_veiculo FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.regionais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.fornecedores_gia FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.produtos_gia FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.planos_gia FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.plano_produtos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.produto_regras FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.veiculo_produtos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed categorias
INSERT INTO public.categorias_veiculo (nome) VALUES ('automovel'), ('motocicleta'), ('pesado') ON CONFLICT DO NOTHING;

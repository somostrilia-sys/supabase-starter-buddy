-- supabase/migrations/20260326000011_pipeline_v2.sql
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS codigo_negociacao TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS unidade_id UUID,
  ADD COLUMN IF NOT EXISTS usuario_id UUID;

-- Função para gerar código único
CREATE OR REPLACE FUNCTION public.gerar_codigo_negociacao()
RETURNS TEXT AS $$
DECLARE
  seq INT;
  codigo TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(codigo_negociacao, '-', 3) AS INT)), 0) + 1
  INTO seq
  FROM public.leads
  WHERE codigo_negociacao LIKE 'NEG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';

  codigo := 'NEG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- Trigger: gerar código ao inserir lead
CREATE OR REPLACE FUNCTION public.trigger_codigo_negociacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo_negociacao IS NULL THEN
    NEW.codigo_negociacao := public.gerar_codigo_negociacao();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_codigo_negociacao ON public.leads;
CREATE TRIGGER set_codigo_negociacao
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.trigger_codigo_negociacao();

-- Templates de vistoria
CREATE TABLE IF NOT EXISTS public.vistoria_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES public.categorias_veiculo(id),
  nome_template TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.vistoria_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.vistoria_templates(id),
  nome_item TEXT NOT NULL,
  obrigatorio BOOLEAN DEFAULT true
);

ALTER TABLE public.vistoria_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vistoria_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.vistoria_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.vistoria_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed templates padrão
INSERT INTO public.vistoria_templates (categoria_id, nome_template)
SELECT id, 'Vistoria Motocicleta' FROM public.categorias_veiculo WHERE nome='motocicleta' ON CONFLICT DO NOTHING;

INSERT INTO public.vistoria_templates (categoria_id, nome_template)
SELECT id, 'Vistoria Pesado' FROM public.categorias_veiculo WHERE nome='pesado' ON CONFLICT DO NOTHING;

INSERT INTO public.vistoria_templates (categoria_id, nome_template)
SELECT id, 'Vistoria Automóvel' FROM public.categorias_veiculo WHERE nome='automovel' ON CONFLICT DO NOTHING;

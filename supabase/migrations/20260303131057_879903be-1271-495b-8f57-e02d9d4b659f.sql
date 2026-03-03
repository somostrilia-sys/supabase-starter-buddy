
-- Pipeline stages enum
CREATE TYPE public.deal_stage AS ENUM ('prospeccao', 'qualificacao', 'proposta', 'negociacao', 'fechamento');
CREATE TYPE public.deal_status AS ENUM ('aberto', 'ganho', 'perdido');

-- Deals / Negócios
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  stage deal_stage NOT NULL DEFAULT 'prospeccao',
  status deal_status NOT NULL DEFAULT 'aberto',
  contato_nome TEXT,
  contato_telefone TEXT,
  contato_email TEXT,
  origem TEXT,
  responsavel_id UUID REFERENCES auth.users(id),
  data_previsao DATE,
  observacoes TEXT,
  posicao INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read deals" ON public.deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can manage deals" ON public.deals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Deal activities / histórico
CREATE TABLE public.deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'nota',
  descricao TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read deal_activities" ON public.deal_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can manage deal_activities" ON public.deal_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

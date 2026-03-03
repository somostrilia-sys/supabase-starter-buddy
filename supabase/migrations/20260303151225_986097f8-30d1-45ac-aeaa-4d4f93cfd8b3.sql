
-- Tags system
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cor text NOT NULL DEFAULT '#3b82f6',
  grupo text DEFAULT 'geral',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage tags" ON public.tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read tags" ON public.tags FOR SELECT TO authenticated USING (true);

-- Deal-Tags junction
CREATE TABLE public.deal_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(deal_id, tag_id)
);
ALTER TABLE public.deal_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage deal_tags" ON public.deal_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read deal_tags" ON public.deal_tags FOR SELECT TO authenticated USING (true);

-- Contatos (centralized contacts)
CREATE TABLE public.contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf_cnpj text,
  email text,
  telefone text,
  telefone2 text,
  cidade text,
  estado text,
  endereco text,
  cep text,
  data_nascimento date,
  sexo text,
  origem text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage contatos" ON public.contatos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read contatos" ON public.contatos FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_contatos_updated_at BEFORE UPDATE ON public.contatos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add contato_id to deals
ALTER TABLE public.deals ADD COLUMN contato_id uuid REFERENCES public.contatos(id);

-- Propostas comerciais
CREATE TABLE public.propostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  itens jsonb DEFAULT '[]'::jsonb,
  valor_total numeric NOT NULL DEFAULT 0,
  validade date,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage propostas" ON public.propostas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read propostas" ON public.propostas FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_propostas_updated_at BEFORE UPDATE ON public.propostas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Metas de vendedor
CREATE TABLE public.metas_vendedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  periodo text NOT NULL,
  meta_valor numeric NOT NULL DEFAULT 0,
  meta_quantidade integer NOT NULL DEFAULT 0,
  realizado_valor numeric NOT NULL DEFAULT 0,
  realizado_quantidade integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.metas_vendedor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage metas" ON public.metas_vendedor FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read metas" ON public.metas_vendedor FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_metas_updated_at BEFORE UPDATE ON public.metas_vendedor
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lead forms
CREATE TABLE public.lead_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  campos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage lead_forms" ON public.lead_forms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read lead_forms" ON public.lead_forms FOR SELECT TO authenticated USING (true);

-- Lead form submissions
CREATE TABLE public.lead_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.lead_forms(id) ON DELETE CASCADE,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  contato_id uuid REFERENCES public.contatos(id),
  deal_id uuid REFERENCES public.deals(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage submissions" ON public.lead_form_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read submissions" ON public.lead_form_submissions FOR SELECT TO authenticated USING (true);

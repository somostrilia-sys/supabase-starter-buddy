-- Add role to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'consultor';

-- Add category/classification fields to veiculos
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS categoria_uso TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS classificacao_uso TEXT;

-- Contratos table
CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  associado_id UUID REFERENCES public.associados(id) ON DELETE CASCADE NOT NULL,
  plano_id UUID REFERENCES public.planos(id),
  veiculo_id UUID REFERENCES public.veiculos(id),
  valor_mensal NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_contratos" ON public.contratos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Leads pipeline table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  cpf TEXT,
  veiculo_interesse TEXT,
  plano_interesse TEXT,
  status TEXT NOT NULL DEFAULT 'novo_lead',
  consultor_nome TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_leads" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lead atividades
CREATE TABLE IF NOT EXISTS public.lead_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'nota',
  descricao TEXT NOT NULL,
  usuario_nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_lead_atividades" ON public.lead_atividades FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vistorias
CREATE TABLE IF NOT EXISTS public.vistorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associado_id UUID REFERENCES public.associados(id) ON DELETE CASCADE,
  veiculo_id UUID REFERENCES public.veiculos(id),
  contrato_id UUID,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vistorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_vistorias" ON public.vistorias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_vistorias_updated_at BEFORE UPDATE ON public.vistorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID,
  acao TEXT NOT NULL,
  tabela TEXT NOT NULL,
  registro_id TEXT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_audit_log" ON public.audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

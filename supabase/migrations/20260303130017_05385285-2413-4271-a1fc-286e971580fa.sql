
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Planos de proteção
CREATE TABLE public.planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_mensal NUMERIC(10,2) NOT NULL DEFAULT 0,
  cobertura JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read planos" ON public.planos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage planos" ON public.planos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_planos_updated_at BEFORE UPDATE ON public.planos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Associados
CREATE TYPE public.associado_status AS ENUM ('ativo', 'inativo', 'suspenso', 'cancelado');

CREATE TABLE public.associados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  rg TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  data_nascimento DATE,
  data_adesao DATE NOT NULL DEFAULT CURRENT_DATE,
  status associado_status NOT NULL DEFAULT 'ativo',
  plano_id UUID REFERENCES public.planos(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.associados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read associados" ON public.associados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage associados" ON public.associados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_associados_updated_at BEFORE UPDATE ON public.associados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Veículos
CREATE TABLE public.veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associado_id UUID REFERENCES public.associados(id) ON DELETE CASCADE NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER,
  cor TEXT,
  placa TEXT NOT NULL,
  chassi TEXT,
  renavam TEXT,
  valor_fipe NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read veiculos" ON public.veiculos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage veiculos" ON public.veiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_veiculos_updated_at BEFORE UPDATE ON public.veiculos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mensalidades
CREATE TYPE public.mensalidade_status AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');

CREATE TABLE public.mensalidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associado_id UUID REFERENCES public.associados(id) ON DELETE CASCADE NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status mensalidade_status NOT NULL DEFAULT 'pendente',
  referencia TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mensalidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read mensalidades" ON public.mensalidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage mensalidades" ON public.mensalidades FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_mensalidades_updated_at BEFORE UPDATE ON public.mensalidades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sinistros
CREATE TYPE public.sinistro_tipo AS ENUM ('roubo', 'furto', 'colisao', 'incendio', 'alagamento', 'outros');
CREATE TYPE public.sinistro_status AS ENUM ('aberto', 'em_analise', 'aprovado', 'negado', 'finalizado');

CREATE TABLE public.sinistros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associado_id UUID REFERENCES public.associados(id) ON DELETE CASCADE NOT NULL,
  veiculo_id UUID REFERENCES public.veiculos(id),
  tipo sinistro_tipo NOT NULL,
  status sinistro_status NOT NULL DEFAULT 'aberto',
  data_ocorrencia DATE NOT NULL,
  descricao TEXT NOT NULL,
  local_ocorrencia TEXT,
  boletim_ocorrencia TEXT,
  valor_estimado NUMERIC(12,2),
  valor_aprovado NUMERIC(12,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sinistros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read sinistros" ON public.sinistros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage sinistros" ON public.sinistros FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_sinistros_updated_at BEFORE UPDATE ON public.sinistros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

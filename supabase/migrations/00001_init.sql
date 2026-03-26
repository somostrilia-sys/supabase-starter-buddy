-- Migration 00001: Schema inicial GIA (Gestão Integrada de Associações)
-- Projeto: gia-objetivo | Supabase

-- Associados
CREATE TABLE IF NOT EXISTS associados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE,
  email TEXT,
  telefone TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Veículos
CREATE TABLE IF NOT EXISTS veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associado_id UUID REFERENCES associados(id),
  placa TEXT UNIQUE NOT NULL,
  marca TEXT,
  modelo TEXT,
  ano INTEGER,
  valor_fipe NUMERIC,
  tipo_utilizacao TEXT DEFAULT 'passeio',
  valor_adicional_agregados NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline Comercial
CREATE TABLE IF NOT EXISTS pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associado_id UUID REFERENCES associados(id),
  etapa TEXT NOT NULL,
  responsavel_id UUID,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cotações
CREATE TABLE IF NOT EXISTS cotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associado_id UUID REFERENCES associados(id),
  veiculo_id UUID REFERENCES veiculos(id),
  placa TEXT,
  valor_fipe NUMERIC,
  produtos JSONB,
  valor_total NUMERIC,
  status TEXT DEFAULT 'rascunho',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vistorias
CREATE TABLE IF NOT EXISTS vistorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID REFERENCES veiculos(id),
  associado_id UUID REFERENCES associados(id),
  status TEXT DEFAULT 'pendente',
  observacoes TEXT,
  fotos JSONB DEFAULT '[]',
  vistoriador_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários da empresa
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  grupo_permissao TEXT DEFAULT 'operacional',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos e Benefícios
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC,
  tipo TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boletos
CREATE TABLE IF NOT EXISTS boletos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associado_id UUID REFERENCES associados(id),
  valor NUMERIC NOT NULL,
  vencimento DATE,
  status TEXT DEFAULT 'pendente',
  nosso_numero TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atividades
CREATE TABLE IF NOT EXISTS atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  descricao TEXT,
  associado_id UUID REFERENCES associados(id),
  usuario_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Config do sistema
CREATE TABLE IF NOT EXISTS system_configs (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de templates de cotas
CREATE TABLE IF NOT EXISTS cotacoes_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  plano TEXT NOT NULL,
  faixa_fipe_min DECIMAL(12,2) DEFAULT 0,
  faixa_fipe_max DECIMAL(12,2) DEFAULT 0,
  valor_basico DECIMAL(10,2) DEFAULT 0,
  valor_intermediario DECIMAL(10,2) DEFAULT 0,
  valor_premium DECIMAL(10,2) DEFAULT 0,
  taxa_adesao DECIMAL(10,2) DEFAULT 0,
  regiao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Configuração de rateio
CREATE TABLE IF NOT EXISTS rateio_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  regiao TEXT,
  tipo_veiculo TEXT,
  multiplicador DECIMAL(4,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fechamentos mensais
CREATE TABLE IF NOT EXISTS fechamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  total_associados INTEGER DEFAULT 0,
  novos_associados INTEGER DEFAULT 0,
  cancelamentos INTEGER DEFAULT 0,
  receita_total DECIMAL(12,2) DEFAULT 0,
  inadimplencia_total DECIMAL(12,2) DEFAULT 0,
  custo_sinistros DECIMAL(12,2) DEFAULT 0,
  resultado_liquido DECIMAL(12,2) DEFAULT 0,
  fechado_por UUID,
  fechado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de boletos
CREATE TABLE IF NOT EXISTS boletos_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  cod_associado TEXT,
  valor DECIMAL(10,2),
  vencimento DATE,
  status TEXT DEFAULT 'pendente',
  sga_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

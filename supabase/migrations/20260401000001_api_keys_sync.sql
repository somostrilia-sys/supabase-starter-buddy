-- ============================================
-- API Keys para sincronismo entre sistemas
-- ============================================

-- Tabela de API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT UNIQUE NOT NULL,
  key_value TEXT UNIQUE NOT NULL,
  system_origin TEXT NOT NULL,
  system_target TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Log de sincronismo
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  source_system TEXT NOT NULL,
  target_system TEXT NOT NULL,
  records_sent INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  payload JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Status de cobrança (atualizado pelo CollectPRO)
CREATE TABLE IF NOT EXISTS cobranca_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associado_id UUID,
  boleto_id UUID,
  status TEXT NOT NULL DEFAULT 'pendente',
  canal TEXT,
  tentativas INTEGER DEFAULT 0,
  ultimo_contato TIMESTAMPTZ,
  acordo_valor NUMERIC,
  acordo_parcelas INTEGER,
  negativado BOOLEAN DEFAULT false,
  negativado_em TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leads recebidos do LuxSales
CREATE TABLE IF NOT EXISTS leads_externos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system TEXT NOT NULL DEFAULT 'luxsales',
  source_lead_id TEXT,
  nome TEXT NOT NULL,
  telefone TEXT,
  cpf_cnpj TEXT,
  email TEXT,
  veiculo_interesse TEXT,
  plano_interesse TEXT,
  qualificacao TEXT,
  score NUMERIC,
  transcript TEXT,
  dados_extras JSONB,
  importado BOOLEAN DEFAULT false,
  importado_em TIMESTAMPTZ,
  lead_id_gia UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_api_keys_name ON api_keys(key_name);
CREATE INDEX IF NOT EXISTS idx_api_keys_value ON api_keys(key_value);
CREATE INDEX IF NOT EXISTS idx_sync_log_type ON sync_log(sync_type, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cobranca_status_assoc ON cobranca_status(associado_id);
CREATE INDEX IF NOT EXISTS idx_leads_externos_source ON leads_externos(source_system, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_externos_importado ON leads_externos(importado) WHERE importado = false;

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobranca_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_externos ENABLE ROW LEVEL SECURITY;

-- Policies (service role bypass RLS, authenticated pode ler)
CREATE POLICY "authenticated_read_sync_log" ON sync_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_cobranca" ON cobranca_status FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_leads_ext" ON leads_externos FOR SELECT TO authenticated USING (true);

-- Inserir API Keys iniciais
INSERT INTO api_keys (key_name, key_value, system_origin, system_target, permissions) VALUES
  ('GIA_TO_FINANCE', 'gia2fin_' || encode(gen_random_bytes(24), 'hex'), 'gia', 'walk_finance', ARRAY['write:finance_data','read:associados','read:boletos']),
  ('GIA_TO_TRACK', 'gia2trk_' || encode(gen_random_bytes(24), 'hex'), 'gia', 'track_system', ARRAY['write:vehicles','read:installations']),
  ('GIA_TO_ASSIST', 'gia2ast_' || encode(gen_random_bytes(24), 'hex'), 'gia', 'assist_ai', ARRAY['read:associados','read:veiculos','read:eventos']),
  ('COLLECT_FROM_GIA', 'col2gia_' || encode(gen_random_bytes(24), 'hex'), 'collect_pro', 'gia', ARRAY['read:associados','read:boletos','read:inadimplentes']),
  ('COLLECT_TO_GIA', 'col2gia_w_' || encode(gen_random_bytes(24), 'hex'), 'collect_pro', 'gia', ARRAY['write:cobranca_status','write:acordos']),
  ('COLLECT_NEGATIVACAO', 'colneg_' || encode(gen_random_bytes(24), 'hex'), 'collect_pro', 'bureau', ARRAY['read_write:negativacao']),
  ('COLLECT_BOLETOS', 'colbol_' || encode(gen_random_bytes(24), 'hex'), 'collect_pro', 'gia', ARRAY['read:boletos','write:disparos']),
  ('LUXSALES_TO_GIA', 'lux2gia_' || encode(gen_random_bytes(24), 'hex'), 'luxsales', 'gia', ARRAY['write:leads','read:associados'])
ON CONFLICT (key_name) DO NOTHING;

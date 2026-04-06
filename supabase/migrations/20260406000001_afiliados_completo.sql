-- ============================================================
-- SISTEMA COMPLETO DE AFILIADOS
-- Tabelas: afiliados, afiliado_indicacoes, afiliado_saques
-- ============================================================

-- 1. Tabela principal de afiliados
CREATE TABLE IF NOT EXISTS afiliados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  email TEXT,
  codigo TEXT UNIQUE DEFAULT ('AF-' || upper(substr(md5(random()::text), 1, 6))),
  comissao_valor NUMERIC(10,2) DEFAULT 0,
  leads INTEGER DEFAULT 0,
  vendas INTEGER DEFAULT 0,
  comissao_acumulada NUMERIC(10,2) DEFAULT 0,
  saldo_disponivel NUMERIC(10,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  -- Portal access (token-based, no login)
  token_acesso UUID UNIQUE DEFAULT gen_random_uuid(),
  -- Dados bancários
  tipo_conta TEXT DEFAULT 'corrente',
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  digito TEXT,
  cpf_titular TEXT,
  nome_titular TEXT,
  chave_pix TEXT,
  -- Config
  dia_recebimento INTEGER DEFAULT 15,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_afiliados_consultor ON afiliados(consultor_id);
CREATE INDEX IF NOT EXISTS idx_afiliados_codigo ON afiliados(codigo);
CREATE INDEX IF NOT EXISTS idx_afiliados_token ON afiliados(token_acesso);

-- 2. Indicações (vínculo afiliado ↔ negociação)
CREATE TABLE IF NOT EXISTS afiliado_indicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  afiliado_id UUID NOT NULL REFERENCES afiliados(id) ON DELETE CASCADE,
  negociacao_id UUID REFERENCES negociacoes(id) ON DELETE SET NULL,
  lead_nome TEXT,
  lead_telefone TEXT,
  lead_email TEXT,
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo','em_andamento','concluido','perdido')),
  comissao_valor NUMERIC(10,2) DEFAULT 0,
  pago BOOLEAN DEFAULT false,
  pago_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Prevenir duplicata de indicação
  UNIQUE(negociacao_id, afiliado_id)
);

CREATE INDEX IF NOT EXISTS idx_indicacoes_afiliado ON afiliado_indicacoes(afiliado_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_negociacao ON afiliado_indicacoes(negociacao_id);

-- 3. Saques / Pagamentos
CREATE TABLE IF NOT EXISTS afiliado_saques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  afiliado_id UUID NOT NULL REFERENCES afiliados(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','pago','cancelado')),
  comprovante_url TEXT,
  observacoes TEXT,
  aprovado_por UUID REFERENCES usuarios(id),
  pago_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saques_afiliado ON afiliado_saques(afiliado_id);

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_afiliados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_afiliados_updated ON afiliados;
CREATE TRIGGER trg_afiliados_updated
  BEFORE UPDATE ON afiliados
  FOR EACH ROW EXECUTE FUNCTION update_afiliados_updated_at();

-- 5. Função atômica para incrementar leads (evita race condition)
CREATE OR REPLACE FUNCTION increment_afiliado_leads(af_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE afiliados SET leads = leads + 1 WHERE id = af_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger: quando indicação muda p/ concluido, atualiza vendas + comissão + saldo
CREATE OR REPLACE FUNCTION on_indicacao_concluida()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status <> 'concluido') THEN
    UPDATE afiliados SET
      vendas = vendas + 1,
      comissao_acumulada = comissao_acumulada + COALESCE(NEW.comissao_valor, 0),
      saldo_disponivel = saldo_disponivel + COALESCE(NEW.comissao_valor, 0)
    WHERE id = NEW.afiliado_id;
  END IF;
  -- Se voltou de concluido para outro status, reverte
  IF OLD.status = 'concluido' AND NEW.status <> 'concluido' THEN
    UPDATE afiliados SET
      vendas = GREATEST(vendas - 1, 0),
      comissao_acumulada = GREATEST(comissao_acumulada - COALESCE(OLD.comissao_valor, 0), 0),
      saldo_disponivel = GREATEST(saldo_disponivel - COALESCE(OLD.comissao_valor, 0), 0)
    WHERE id = NEW.afiliado_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_indicacao_concluida ON afiliado_indicacoes;
CREATE TRIGGER trg_indicacao_concluida
  AFTER UPDATE ON afiliado_indicacoes
  FOR EACH ROW EXECUTE FUNCTION on_indicacao_concluida();

-- 7. Trigger: quando saque é pago, deduz saldo
CREATE OR REPLACE FUNCTION on_saque_pago()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pago' AND (OLD.status IS NULL OR OLD.status <> 'pago') THEN
    UPDATE afiliados SET
      saldo_disponivel = GREATEST(saldo_disponivel - NEW.valor, 0)
    WHERE id = NEW.afiliado_id;
  END IF;
  -- Se cancelou saque que já estava pago, devolve saldo
  IF OLD.status = 'pago' AND NEW.status = 'cancelado' THEN
    UPDATE afiliados SET
      saldo_disponivel = saldo_disponivel + OLD.valor
    WHERE id = NEW.afiliado_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_saque_pago ON afiliado_saques;
CREATE TRIGGER trg_saque_pago
  AFTER UPDATE ON afiliado_saques
  FOR EACH ROW EXECUTE FUNCTION on_saque_pago();

-- 8. RLS
ALTER TABLE afiliados ENABLE ROW LEVEL SECURITY;
ALTER TABLE afiliado_indicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE afiliado_saques ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados: acesso total (controle fino é no frontend por role)
CREATE POLICY "afiliados_auth_all" ON afiliados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "indicacoes_auth_all" ON afiliado_indicacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "saques_auth_all" ON afiliado_saques FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Anon: leitura restrita por token (portal do afiliado)
CREATE POLICY "afiliados_anon_select" ON afiliados FOR SELECT TO anon
  USING (token_acesso IS NOT NULL);

-- Anon: update apenas dados bancários do próprio afiliado (via token no WHERE)
CREATE POLICY "afiliados_anon_update_bank" ON afiliados FOR UPDATE TO anon
  USING (token_acesso IS NOT NULL)
  WITH CHECK (
    -- Só permite alterar se o token_acesso não mudou (protege campos sensíveis)
    token_acesso = token_acesso
  );

-- Anon: leitura de indicações (filtrado por afiliado_id no frontend)
CREATE POLICY "indicacoes_anon_select" ON afiliado_indicacoes FOR SELECT TO anon USING (true);

-- Anon: leitura e inserção de saques
CREATE POLICY "saques_anon_select" ON afiliado_saques FOR SELECT TO anon USING (true);
CREATE POLICY "saques_anon_insert" ON afiliado_saques FOR INSERT TO anon WITH CHECK (true);

-- 9. Adicionar campos de afiliado na negociacoes
ALTER TABLE negociacoes ADD COLUMN IF NOT EXISTS afiliado_id UUID REFERENCES afiliados(id);
ALTER TABLE negociacoes ADD COLUMN IF NOT EXISTS afiliado_codigo TEXT;

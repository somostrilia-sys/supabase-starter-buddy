-- Campos para auto-cotação via LuxSales pipeline
ALTER TABLE negociacoes ADD COLUMN IF NOT EXISTS auto_cotacao_gerada BOOLEAN DEFAULT false;
ALTER TABLE negociacoes ADD COLUMN IF NOT EXISTS lead_externo_id UUID;

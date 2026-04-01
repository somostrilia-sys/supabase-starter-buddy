-- Criar bucket para fotos de vistoria (público para upload anon)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vistoria-fotos', 'vistoria-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: qualquer um pode fazer upload (INSERT) no bucket vistoria-fotos
CREATE POLICY "anon_upload_vistoria_fotos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'vistoria-fotos');

-- Policy: qualquer um pode ler (SELECT) fotos do bucket
CREATE POLICY "public_read_vistoria_fotos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'vistoria-fotos');

-- Policy: permitir leitura pública de vistorias pelo token (anon SELECT já funciona)
-- Se precisar, descomente:
-- CREATE POLICY "anon_read_vistoria_by_token" ON vistorias
--   FOR SELECT TO anon
--   USING (token_publico IS NOT NULL);

-- Garantir colunas necessárias na tabela vistorias
DO $$ BEGIN
  ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS token_publico TEXT UNIQUE;
  ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS fotos_solicitadas JSONB DEFAULT '[]';
  ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS fotos_enviadas JSONB DEFAULT '[]';
  ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS tentativa INTEGER DEFAULT 1;
  ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS placa TEXT;
  ALTER TABLE vistorias ADD COLUMN IF NOT EXISTS modelo TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

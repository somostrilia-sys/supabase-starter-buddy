-- Cria tabela vistoria_fotos (referenciada pelo código mas sem migration anterior)
-- Fix: Errata 1a — imagens de vistorias realizadas não apareciam

CREATE TABLE IF NOT EXISTS public.vistoria_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vistoria_id UUID NOT NULL REFERENCES public.vistorias(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  captured_at TIMESTAMPTZ,
  ai_aprovada BOOLEAN,
  ai_motivo TEXT,
  ai_score INTEGER,
  ai_analise JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vistoria_fotos_vistoria_id ON public.vistoria_fotos(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_vistoria_fotos_created_at ON public.vistoria_fotos(created_at);

ALTER TABLE public.vistoria_fotos ENABLE ROW LEVEL SECURITY;

-- Upload anônimo (vistoria pública) e leitura para qualquer usuário
DROP POLICY IF EXISTS "anon_insert_vistoria_fotos" ON public.vistoria_fotos;
CREATE POLICY "anon_insert_vistoria_fotos" ON public.vistoria_fotos
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_read_vistoria_fotos" ON public.vistoria_fotos;
CREATE POLICY "auth_read_vistoria_fotos" ON public.vistoria_fotos
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_update_vistoria_fotos" ON public.vistoria_fotos;
CREATE POLICY "auth_update_vistoria_fotos" ON public.vistoria_fotos
  FOR UPDATE TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_delete_vistoria_fotos" ON public.vistoria_fotos;
CREATE POLICY "auth_delete_vistoria_fotos" ON public.vistoria_fotos
  FOR DELETE TO authenticated
  USING (true);

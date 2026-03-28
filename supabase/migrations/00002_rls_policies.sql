-- Migration 00002: RLS Policies
ALTER TABLE associados ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vistorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all_associados' AND tablename = 'associados') THEN
    CREATE POLICY "authenticated_all_associados" ON associados FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all_veiculos' AND tablename = 'veiculos') THEN
    CREATE POLICY "authenticated_all_veiculos" ON veiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all_pipeline' AND tablename = 'pipeline') THEN
    CREATE POLICY "authenticated_all_pipeline" ON pipeline FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all_cotacoes' AND tablename = 'cotacoes') THEN
    CREATE POLICY "authenticated_all_cotacoes" ON cotacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all_vistorias' AND tablename = 'vistorias') THEN
    CREATE POLICY "authenticated_all_vistorias" ON vistorias FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all_usuarios' AND tablename = 'usuarios') THEN
    CREATE POLICY "authenticated_all_usuarios" ON usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all_produtos' AND tablename = 'produtos') THEN
    CREATE POLICY "authenticated_all_produtos" ON produtos FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all_boletos' AND tablename = 'boletos') THEN
    CREATE POLICY "authenticated_all_boletos" ON boletos FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all_atividades' AND tablename = 'atividades') THEN
    CREATE POLICY "authenticated_all_atividades" ON atividades FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all_system_configs' AND tablename = 'system_configs') THEN
    CREATE POLICY "authenticated_all_system_configs" ON system_configs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

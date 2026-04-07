-- Migration: permitir leitura anônima das tabelas usadas na página pública /planos/:id
-- Necessário para PlanoComparativo.tsx funcionar sem login

-- cotacoes: SELECT para anon (página pública de comparativo de planos)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cotacoes' AND policyname = 'anon_select_cotacoes') THEN
    CREATE POLICY "anon_select_cotacoes" ON public.cotacoes FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- negociacoes: SELECT para anon (PlanoComparativo busca dados do lead/veículo)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'negociacoes' AND policyname = 'anon_select_negociacoes') THEN
    CREATE POLICY "anon_select_negociacoes" ON public.negociacoes FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- usuarios: SELECT para anon (PlanoComparativo busca dados do consultor)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usuarios' AND policyname = 'anon_select_usuarios') THEN
    CREATE POLICY "anon_select_usuarios" ON public.usuarios FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- coberturas_plano: SELECT para anon (fallback de coberturas no comparativo)
-- Tabela pode não existir ainda, então verifica antes
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coberturas_plano') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coberturas_plano' AND policyname = 'anon_select_coberturas_plano') THEN
      CREATE POLICY "anon_select_coberturas_plano" ON public.coberturas_plano FOR SELECT TO anon USING (true);
    END IF;
  END IF;
END $$;

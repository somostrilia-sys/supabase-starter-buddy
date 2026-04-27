-- Importados Leves — corrige cota de participação e marca a tabela como tal
--
-- Contexto:
--   No PowerCRM existe uma "Tabela Importados Leves" por regional, com plano
--   "Completo (Leves)" reaproveitado mas valor_franquia (cota de participação) = 12%.
--   No banco do GIA isso foi importado em tabela_id=45366, mas o valor_franquia
--   ficou gravado como 5% (igual aos planos regulares), tornando a tabela
--   indistinguível das Completo (Leves) regulares.
--
-- Escopo desta migration:
--   - Corrige valor_franquia=12 para todas as 216 linhas de tabela_id=45366
--     (11 regionais × 21 faixas FIPE).
--   - NÃO altera mensalidade, adesão, rastreador, instalacao — esses já estão
--     corretos conforme cruzamento com prints do PowerCRM.
--   - NÃO altera nenhuma outra tabela_id — a cota 12% é exclusiva de Importados.
--
-- Regionais cobertas (11 das presentes em PowerCRM):
--   Alagoas, Bahia, CEARÁ, Espírito Santo, MATO GROSSO SUL, MINAS (INTERIOR),
--   Natal, Norte-Minas-Sul, PALMAS, Paraná, RIO GRANDE DO SUL.
--
-- Regionais ausentes no DB (existem no PowerCRM mas sem registro em tabela 45366):
--   Interior São Paulo, Regional Sao Paulo, Regional Espírito Santo,
--   Regional Norte e Centro-Oeste, Regional Palmas, Regional Interior São Paulo,
--   REGIONAL BAHIA, REGIONAL CEARÁ, REGIONAL MATO GROSSO SUL,
--   REGIONAL MINAS (INTERIOR), REGIONAL PARANÁ.
--   → exigirão importação separada quando os dados forem extraídos do PowerCRM.

UPDATE tabela_precos
SET valor_franquia = 12, tipo_franquia = '%'
WHERE tabela_id = '45366';

-- Sanidade
DO $$
DECLARE total INTEGER;
BEGIN
  SELECT COUNT(*) INTO total FROM tabela_precos WHERE tabela_id = '45366' AND valor_franquia = 12;
  IF total <> 216 THEN
    RAISE WARNING 'Importados Leves: esperava 216 rows com valor_franquia=12, encontrei %', total;
  END IF;
END $$;

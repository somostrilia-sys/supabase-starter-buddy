-- Importados Leves — corrige cota de participação e adiciona Interior São Paulo
--
-- Contexto:
--   No PowerCRM existe uma "Tabela Importados Leves" por regional, com plano
--   "Completo (Leves)" reaproveitado mas valor_franquia (cota de participação) = 12%.
--   No banco do GIA isso foi importado em tabela_id=45366, mas:
--     1) valor_franquia ficou gravado como 5% nas 11 regionais existentes (deveria ser 12%)
--     2) Interior São Paulo está faltando — confirmado via print do PowerCRM
--
-- Escopo desta migration:
--   PARTE 1: corrige valor_franquia=12 nas 216 linhas das 11 regionais existentes.
--   PARTE 2: insere 21 faixas para Interior São Paulo (valores próprios extraídos do
--            PowerCRM via print do usuário). Adesão e rastreador seguem o mesmo padrão
--            de Alagoas (replique pedido por usuário).
--   NÃO altera nenhuma outra tabela_id — cota 12% é exclusiva de Importados Leves.
--   NÃO insere para outras regionais ainda faltantes (Regional SP, REGIONAL_*, etc).

-- ──────── PARTE 1: ajusta franquia das 11 regionais existentes ────────
UPDATE tabela_precos
SET valor_franquia = 12, tipo_franquia = '%'
WHERE tabela_id = '45366';

-- ──────── PARTE 2: insere Interior São Paulo (21 faixas) ────────
INSERT INTO tabela_precos (
  tabela_id, plano, plano_normalizado,
  regional, regional_normalizado, regional_id,
  tipo_veiculo, grupo_produto_id,
  valor_menor, valor_maior, mensalidade, cota,
  adesao, taxa_administrativa, instalacao,
  rastreador, rastreador_obrigatorio, rastreador_valor,
  tipo_franquia, valor_franquia
) VALUES
-- (faixas SEM rastreador obrigatório, valor < 60K)
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',      0,  10000, 155, 155, 400, 0,   0, 'Não', false,   0, '%', 12),
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  10000.01,  15000, 175, 175, 400, 0,   0, 'Não', false,   0, '%', 12),
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  15000.01,  20000, 185, 185, 400, 0,   0, 'Não', false,   0, '%', 12),
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  20000.01,  35000, 195, 195, 400, 0,   0, 'Não', false,   0, '%', 12),
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  35000.01,  40000, 210, 210, 400, 0,   0, 'Não', false,   0, '%', 12),
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  40000.01,  50000, 220, 220, 400, 0,   0, 'Não', false,   0, '%', 12),
-- (faixa de transição — instalação 100 mas rastreador ainda não obrigatório, padrão de Alagoas)
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  50000.01,  60000, 240, 240, 400, 0, 100, 'Não', false,   0, '%', 12),
-- (rastreador obrigatório a partir de 60K)
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  60000.01,  70000, 252, 252, 400, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  70000.01,  80000, 281, 281, 400, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  80000.01,  90000, 311, 311, 400, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  90000.01, 100000, 326, 326, 400, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 100000.01, 110000, 360, 360, 400, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 110000.01, 120000, 415, 415, 400, 0, 100, 'Sim', true,  100, '%', 12),
-- (adesão sobe para 600 a partir de 120K — padrão Alagoas)
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 120000.01, 135000, 440, 440, 600, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 135000.01, 150000, 485, 485, 600, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 150000.01, 170000, 540, 540, 600, 0, 100, 'Sim', true,  100, '%', 12),
-- (adesão 750 a partir de 170K)
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 170000.01, 200000, 590, 590, 750, 0, 100, 'Sim', true,  100, '%', 12),
-- (adesão 850 a partir de 200K)
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 200000.01, 220000, 655, 655, 850, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 220000.01, 230000, 692, 692, 850, 0, 100, 'Sim', true,  100, '%', 12),
-- (adesão 950 a partir de 250K)
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 250000.01, 300000, 720, 720, 950, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 300000.01, 350000, 840, 840, 950, 0, 100, 'Sim', true,  100, '%', 12);

-- Sanidade
DO $$
DECLARE total_franquia INTEGER; total_intsp INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_franquia FROM tabela_precos WHERE tabela_id = '45366' AND valor_franquia = 12;
  SELECT COUNT(*) INTO total_intsp FROM tabela_precos WHERE tabela_id = '45366' AND regional = 'Interior São Paulo';
  RAISE NOTICE 'Importados Leves franquia=12: % rows (esperado 237 = 216 antigas + 21 novas)', total_franquia;
  RAISE NOTICE 'Importados Leves Interior SP: % rows (esperado 21)', total_intsp;
END $$;

-- Importados Leves — corrige franquia, completa RGS e adiciona Interior SP + Sao Paulo
--
-- Contexto:
--   No PowerCRM cada regional tem uma "Tabela Importados Leves" com plano
--   "Completo (Leves)" reaproveitado mas valor_franquia (cota de participação) = 12%.
--   No banco do GIA isso foi importado em tabela_id=45366, com 3 problemas:
--     1) valor_franquia gravado como 5% (deveria ser 12%) nas 11 regionais existentes
--     2) RIO GRANDE DO SUL tem só 6 das 21 faixas FIPE (parcial)
--     3) Regional Interior São Paulo + Regional Sao Paulo faltando 100%
--
-- Convenção:
--   Regionais "novas" usam o nome canônico do regionais table (com prefixo "Regional").
--   As 11 já existentes ficam com o nome legado (sem prefixo) — não tocar para não
--   quebrar filtros/queries que dependem desses nomes.

-- ──────── PARTE 1: franquia 12% para tabela 45366 (todas as regionais) ────────
UPDATE tabela_precos
SET valor_franquia = 12, tipo_franquia = '%'
WHERE tabela_id = '45366';

-- ──────── PARTE 2: completa RIO GRANDE DO SUL (15 faixas faltantes) ────────
-- Copia de Alagoas as faixas que ainda não existem em RGS
INSERT INTO tabela_precos (
  tabela_id, plano, plano_normalizado,
  regional, regional_normalizado, regional_id,
  tipo_veiculo, grupo_produto_id,
  valor_menor, valor_maior, mensalidade, cota,
  adesao, taxa_administrativa, instalacao,
  rastreador, rastreador_obrigatorio, rastreador_valor,
  tipo_franquia, valor_franquia
)
SELECT
  tabela_id, plano, plano_normalizado,
  'RIO GRANDE DO SUL', regional_normalizado, regional_id,
  tipo_veiculo, grupo_produto_id,
  valor_menor, valor_maior, mensalidade, cota,
  adesao, taxa_administrativa, instalacao,
  rastreador, rastreador_obrigatorio, rastreador_valor,
  tipo_franquia, 12
FROM tabela_precos a
WHERE tabela_id = '45366' AND regional = 'Alagoas'
  AND NOT EXISTS (
    SELECT 1 FROM tabela_precos b
    WHERE b.tabela_id = '45366' AND b.regional = 'RIO GRANDE DO SUL'
      AND b.valor_menor = a.valor_menor AND b.valor_maior = a.valor_maior
  );

-- ──────── PARTE 3: Regional Interior São Paulo (21 faixas, preços próprios) ────────
INSERT INTO tabela_precos (
  tabela_id, plano, plano_normalizado,
  regional, regional_normalizado, regional_id,
  tipo_veiculo, grupo_produto_id,
  valor_menor, valor_maior, mensalidade, cota,
  adesao, taxa_administrativa, instalacao,
  rastreador, rastreador_obrigatorio, rastreador_valor,
  tipo_franquia, valor_franquia
) VALUES
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',         0,  10000, 155, 155, 400, 0,   0, 'Não', false,   0, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  10000.01,  15000, 175, 175, 400, 0,   0, 'Não', false,   0, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  15000.01,  20000, 185, 185, 400, 0,   0, 'Não', false,   0, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  20000.01,  35000, 195, 195, 400, 0,   0, 'Não', false,   0, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  35000.01,  40000, 210, 210, 400, 0,   0, 'Não', false,   0, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  40000.01,  50000, 220, 220, 400, 0,   0, 'Não', false,   0, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  50000.01,  60000, 240, 240, 400, 0, 100, 'Não', false,   0, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  60000.01,  70000, 252, 252, 400, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  70000.01,  80000, 281, 281, 400, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  80000.01,  90000, 311, 311, 400, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98',  90000.01, 100000, 326, 326, 400, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 100000.01, 110000, 360, 360, 400, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 110000.01, 120000, 415, 415, 400, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 120000.01, 135000, 440, 440, 600, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 135000.01, 150000, 485, 485, 600, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 150000.01, 170000, 540, 540, 600, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 170000.01, 200000, 590, 590, 750, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 200000.01, 220000, 655, 655, 850, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 220000.01, 230000, 692, 692, 900, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 250000.01, 300000, 720, 720, 900, 0, 100, 'Sim', true,  100, '%', 12),
('45366','Completo (Leves)','completo leves','Regional Interior São Paulo','regional interior sao paulo','dec7916e-2f6f-4db8-9b13-29914a321013','Carros e Utilitários Pequenos','5a6202e6-36dc-4037-a1a5-baa0b5334a98', 300000.01, 350000, 840, 840, 900, 0, 100, 'Sim', true,  100, '%', 12);

-- ──────── PARTE 4: Regional Sao Paulo (21 faixas, mesmos preços de Interior SP) ────────
INSERT INTO tabela_precos (
  tabela_id, plano, plano_normalizado,
  regional, regional_normalizado, regional_id,
  tipo_veiculo, grupo_produto_id,
  valor_menor, valor_maior, mensalidade, cota,
  adesao, taxa_administrativa, instalacao,
  rastreador, rastreador_obrigatorio, rastreador_valor,
  tipo_franquia, valor_franquia
)
SELECT
  tabela_id, plano, plano_normalizado,
  'Regional Sao Paulo', 'regional sao paulo', '968e8163-daa7-4e3a-ac69-ab3cd6d2578a',
  tipo_veiculo, grupo_produto_id,
  valor_menor, valor_maior, mensalidade, cota,
  adesao, taxa_administrativa, instalacao,
  rastreador, rastreador_obrigatorio, rastreador_valor,
  tipo_franquia, valor_franquia
FROM tabela_precos
WHERE tabela_id = '45366' AND regional = 'Regional Interior São Paulo';

-- Sanidade
DO $$
DECLARE total INTEGER; rgs INTEGER; intsp INTEGER; sp INTEGER;
BEGIN
  SELECT COUNT(*) INTO total FROM tabela_precos WHERE tabela_id = '45366' AND valor_franquia = 12;
  SELECT COUNT(*) INTO rgs   FROM tabela_precos WHERE tabela_id = '45366' AND regional = 'RIO GRANDE DO SUL';
  SELECT COUNT(*) INTO intsp FROM tabela_precos WHERE tabela_id = '45366' AND regional = 'Regional Interior São Paulo';
  SELECT COUNT(*) INTO sp    FROM tabela_precos WHERE tabela_id = '45366' AND regional = 'Regional Sao Paulo';
  RAISE NOTICE 'Importados Leves total franquia=12: % rows (esperado 273 = 216 + 15 RGS + 21 IntSP + 21 SP)', total;
  RAISE NOTICE 'Por regional → RGS: % (esperado 21) | Interior SP: % (esperado 21) | SP: % (esperado 21)', rgs, intsp, sp;
END $$;

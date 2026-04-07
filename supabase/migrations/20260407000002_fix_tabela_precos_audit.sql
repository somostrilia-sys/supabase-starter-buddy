-- ============================================================
-- Migration: Fix tabela_precos audit issues (2026-04-07)
-- Problema 1: Remover duplicatas exatas
-- Problema 2: Normalizar nomes de planos
-- Problema 3: Corrigir tipo_veiculo baseado no plano
-- ============================================================

-- =====================
-- PROBLEMA 2: Normalizar planos ANTES de dedup (para que duplicatas
-- causadas por nomes inconsistentes sejam pegas no passo 1)
-- =====================
UPDATE public.tabela_precos SET plano = 'Objetivo (Leves)' WHERE plano = 'Objetivo leves';
UPDATE public.tabela_precos SET plano = 'Moto' WHERE plano = 'moto';

-- Atualizar plano_normalizado correspondente
UPDATE public.tabela_precos SET plano_normalizado = 'Objetivo (Leves)' WHERE plano = 'Objetivo (Leves)' AND plano_normalizado = 'Objetivo leves';
UPDATE public.tabela_precos SET plano_normalizado = 'Moto' WHERE plano = 'Moto' AND plano_normalizado = 'moto';

-- =====================
-- PROBLEMA 1: Remover duplicatas exatas
-- Mantém apenas o registro com menor ctid (primeiro inserido) por combinação única
-- =====================
DELETE FROM public.tabela_precos
WHERE id NOT IN (
  SELECT DISTINCT ON (plano, regional_id, valor_menor, valor_maior, cota, adesao)
    id
  FROM public.tabela_precos
  ORDER BY plano, regional_id, valor_menor, valor_maior, cota, adesao, id
);

-- =====================
-- PROBLEMA 3: Corrigir tipo_veiculo baseado no plano
-- =====================
UPDATE public.tabela_precos
SET tipo_veiculo = 'Motos'
WHERE plano ILIKE '%Motos%' OR plano = 'Moto';

UPDATE public.tabela_precos
SET tipo_veiculo = 'Pesados e Vans'
WHERE plano ILIKE '%PESADOS%' OR plano ILIKE '%Vans%';

-- Os demais já estão como "Carros e Utilitários Pequenos" — nenhuma ação necessária.

-- View: public.veiculos_revistoria_pendente
-- Veículos inadimplentes com alerta de revistoria (> 5 dias de atraso do primeiro boleto)
-- sem anexo de revistoria ativo (URL não expirada).
-- Consumida pelo useAlertas do frontend GIA e cruzada com CollectPRO.

CREATE OR REPLACE VIEW public.veiculos_revistoria_pendente AS
SELECT
  v.id AS veiculo_id,
  v.placa,
  v.marca,
  v.modelo,
  v.ano,
  v.situacao_sga,
  v.codigo_sga AS codigo_veiculo,
  a.id AS associado_id,
  a.codigo_sga AS codigo_associado,
  a.nome,
  a.cpf,
  a.whatsapp,
  a.telefone,
  a.regional_id,
  a.cooperativa_id,
  (
    SELECT min(b.vencimento)
    FROM public.boletos b
    WHERE b.associado_id = a.id
      AND b.status IN ('aberto','vencido')
      AND b.vencimento < current_date
  ) AS primeiro_vencimento,
  (
    SELECT coalesce(sum(b.valor),0)
    FROM public.boletos b
    WHERE b.associado_id = a.id
      AND b.status IN ('aberto','vencido')
      AND b.vencimento < current_date
  ) AS valor_devido,
  GREATEST(0, (current_date - (
    SELECT min(b.vencimento)
    FROM public.boletos b
    WHERE b.associado_id = a.id
      AND b.status IN ('aberto','vencido')
      AND b.vencimento < current_date
  )))::int AS dias_atraso,
  EXISTS (
    SELECT 1 FROM public.associado_anexos_revistoria ar
    WHERE ar.associado_id = a.id
      AND (ar.veiculo_id = v.id OR ar.veiculo_id IS NULL)
      AND ar.expira_em > now()
  ) AS tem_revistoria_ativa
FROM public.veiculos v
JOIN public.associados a ON a.id = v.associado_id
WHERE v.situacao_sga = 'inadimplente';

GRANT SELECT ON public.veiculos_revistoria_pendente TO anon, authenticated, service_role;

COMMENT ON VIEW public.veiculos_revistoria_pendente IS
  'Veículos inadimplentes com flag tem_revistoria_ativa. Frontend filtra dias_atraso>5 AND NOT tem_revistoria_ativa pra alerta de revistoria pendente.';

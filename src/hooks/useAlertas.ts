import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAlertas() {
  const hoje = new Date().toISOString().slice(0, 10);
  const em3dias = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
  const ha5dias = new Date(Date.now() - 5 * 86_400_000).toISOString().slice(0, 10);
  const ha7dias = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

  // Boletos vencendo nos próximos 3 dias
  const { data: alertasVencimento = [] } = useQuery({
    queryKey: ["alertas_vencimento", hoje, em3dias],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("mensalidades")
        .select("id, valor, data_vencimento, referencia, associados(nome, cpf)")
        .gte("data_vencimento", hoje)
        .lte("data_vencimento", em3dias)
        .not("status", "in", '("pago","cancelado")')
        .order("data_vencimento") as any);
      if (error) throw error;
      return data || [];
    },
  });

  // Boletos vencidos há mais de 5 dias (inadimplência)
  const { data: alertasInadimplencia = [] } = useQuery({
    queryKey: ["alertas_inadimplencia", ha5dias],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("mensalidades")
        .select("id, valor, data_vencimento, referencia, associados(nome, cpf)")
        .lt("data_vencimento", ha5dias)
        .in("status", ["pendente", "atrasado"])
        .order("data_vencimento") as any);
      if (error) throw error;
      return data || [];
    },
  });

  // Sinistros abertos há mais de 7 dias (proxy para vistorias pendentes)
  const { data: alertasVistoria = [] } = useQuery({
    queryKey: ["alertas_vistoria", ha7dias],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("sinistros")
        .select("id, tipo, data_ocorrencia, created_at, associados(nome, cpf)")
        .in("status", ["aberto", "em_analise"])
        .lt("created_at", ha7dias + "T00:00:00.000Z")
        .order("created_at") as any);
      if (error) throw error;
      return data || [];
    },
  });

  // Revistoria pendente: veículos inadimplentes há mais de 5 dias sem vídeo ativo
  // (fonte: view public.veiculos_revistoria_pendente)
  const { data: alertasRevistoria = [] } = useQuery({
    queryKey: ["alertas_revistoria"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("veiculos_revistoria_pendente" as any)
        .select("veiculo_id, placa, marca, modelo, ano, associado_id, nome, cpf, whatsapp, telefone, primeiro_vencimento, valor_devido, dias_atraso, tem_revistoria_ativa")
        .gt("dias_atraso", 5)
        .eq("tem_revistoria_ativa", false)
        .order("dias_atraso", { ascending: false })
        .limit(500) as any);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  return { alertasVencimento, alertasInadimplencia, alertasVistoria, alertasRevistoria };
}

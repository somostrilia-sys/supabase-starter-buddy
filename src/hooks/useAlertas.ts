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

  return { alertasVencimento, alertasInadimplencia, alertasVistoria };
}
